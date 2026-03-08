import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '../../infrastructure/prisma/client';
import { logger } from '../../infrastructure/logger/logger';

function n(v: any): number {
    if (v == null) return 0;
    return typeof v === 'number' ? v : v.toNumber ? v.toNumber() : Number(v);
}

function clamp(val: number, min = 0, max = 100): number {
    return Math.min(max, Math.max(min, val));
}

// Smooth sigmoid-like normalizer: maps any positive value to 0-100
// midpoint = value that maps to 50, steepness controls curve
function sigmoidScore(val: number, midpoint: number, steepness = 5): number {
    return clamp(Math.round(100 / (1 + Math.exp(-steepness * (val - midpoint)))));
}

export interface BiasDetectionResult {
    adaptiveRiskScore: number;
    panicSellScore: number;
    recencyBiasScore: number;
    riskChasingScore: number;
    liquidityStressScore: number;
    concentrationScore: number;
    lossAversionRatio: number | null;
    featureSnapshot: Record<string, number>;
    insights: string[];
    alerts: string[];
    calculatedAt: string;
}

export async function detectBiases(userId: number): Promise<BiasDetectionResult> {

    /* ───────────────── LOAD DATA ───────────────── */

    const [
        holdings,
        rebalancingActions,
        portfolioReturns,
        latestPortfolioSnapshot,
    ] = await Promise.all([
        prisma.holding.findMany({
            where: { userId },
            include: {
                asset: {
                    include: {
                        prices: {
                            orderBy: { priceDate: 'desc' },
                            take: 90
                        }
                    }
                }
            }
        }),

        prisma.rebalancingAction.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 50
        }),

        prisma.portfolioReturn.findMany({
            where: { userId },
            orderBy: { returnDate: 'desc' },
            take: 252
        }),

        prisma.portfolioSnapshot.findFirst({
            where: { userId },
            orderBy: { snapshotDate: 'desc' }
        }),
    ]);

    const hasData =
        holdings.length > 0 ||
        portfolioReturns.length >= 5 ||
        rebalancingActions.length > 0 ||
        latestPortfolioSnapshot !== null;

    if (!hasData) {
        return {
            adaptiveRiskScore: 0,
            panicSellScore: 0,
            recencyBiasScore: 0,
            riskChasingScore: 0,
            liquidityStressScore: 0,
            concentrationScore: 0,
            lossAversionRatio: null,
            featureSnapshot: {},
            insights: ['Not enough portfolio data to analyze trading behavior.'],
            alerts: [],
            calculatedAt: new Date().toISOString()
        };
    }

    /* ───────────────── PORTFOLIO VALUE ───────────────── */

    const portfolioValue = latestPortfolioSnapshot
        ? n(latestPortfolioSnapshot.totalValue)
        : holdings.reduce((s, h) => {
            const price = h.asset.prices[0] ? n(h.asset.prices[0].price) : n(h.avgCost);
            return s + n(h.quantity) * price;
          }, 0);

    /* ───────────────── PANIC SELL SCORE ───────────────── */
    // Measures: how often you sell during/after portfolio drawdowns
    // Low score = calm, high score = reactive panic seller

    let panicSellScore = 25; // Default: benefit of the doubt with no data

    const sellActions = rebalancingActions.filter(a =>
        (a.triggerType ?? '').toLowerCase().includes('sell') ||
        (a.reason ?? '').toLowerCase().includes('sell') ||
        (a.triggerType ?? '').toLowerCase().includes('rebalance')
    );

    if (portfolioReturns.length >= 5 && sellActions.length > 0) {

        const negReturnDates = portfolioReturns
            .filter(r => n(r.dailyReturn) < -0.015) // Only meaningful drops (>1.5%)
            .map(r => r.returnDate.getTime());

        if (negReturnDates.length > 0) {
            const panicSells = sellActions.filter(a => {
                const actionTime = a.createdAt.getTime();
                return negReturnDates.some(
                    dt => actionTime > dt && actionTime - dt <= 5 * 86400 * 1000 // Sold within 5 days of drop
                );
            });

            const panicRatio = panicSells.length / Math.max(sellActions.length, 1);

            // Scale: 0% panic sells = 10, 50% = 50, 100% = 90
            panicSellScore = clamp(Math.round(10 + panicRatio * 80));
        } else {
            // Has sells but no big drops — neutral
            panicSellScore = 30;
        }

    } else if (portfolioReturns.length >= 20 && sellActions.length === 0) {
        // Long history, never sells even in downturns — very calm
        panicSellScore = 10;
    }

    /* ───────────────── RECENCY BIAS ───────────────── */
    // Measures: are your heaviest positions also your recent winners?
    // High score = portfolio tilted toward whatever just went up

    let recencyBiasScore = 30; // Default: slight lean toward recency is normal

    if (holdings.length >= 2) {

        const holdingPerformance = holdings.map(h => {
            const prices = h.asset.prices.map(p => n(p.price));
            const currentValue = prices[0]
                ? n(h.quantity) * prices[0]
                : n(h.quantity) * n(h.avgCost);

            if (prices.length < 20) {
                return { weight: currentValue, recentMomentum: 0, hasData: false };
            }

            // Recent 20-day return
            const recent20Ret = (prices[0] - prices[19]) / (prices[19] || 1);
            // Longer 60-day return (if available)
            const longer60Ret = prices.length >= 60
                ? (prices[0] - prices[59]) / (prices[59] || 1)
                : recent20Ret;

            // Recency bias signal: recent return much better than longer-term
            const recentMomentum = recent20Ret - (longer60Ret / 3); // normalized

            return { weight: currentValue, recentMomentum, hasData: true };
        });

        const validHoldings = holdingPerformance.filter(h => h.hasData);

        if (validHoldings.length >= 2) {
            const totalWeight = validHoldings.reduce((s, h) => s + h.weight, 0) || 1;

            // Correlation between portfolio weight and recent momentum
            const weightedMomentumBias = validHoldings.reduce(
                (s, h) => s + (h.weight / totalWeight) * Math.max(0, h.recentMomentum),
                0
            );

            // 0% momentum bias = 20, 10% = 50, 20%+ = 80
            recencyBiasScore = clamp(Math.round(20 + weightedMomentumBias * 300));
        }
    }

    /* ───────────────── RISK CHASING SCORE ───────────────── */
    // Measures: portfolio volatility vs a blended benchmark
    // Accounts for asset type — crypto is expected to be volatile

    let riskChasingScore = 30; // Default: conservative assumption

    if (holdings.length >= 1) {

        const holdingVols = holdings.map(h => {
            const prices = h.asset.prices.map(p => n(p.price));
            const ticker = h.asset.ticker?.toUpperCase() ?? '';
            const isCrypto = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'USDT', 'USDC', 'ADA', 'AVAX', 'DOT'].includes(ticker);

            // Use asset-type-appropriate baseline volatility
            // Crypto baseline: ~60% annualized, Stock baseline: ~20%
            const assetBaseline = isCrypto ? 0.60 : 0.20;

            const currentValue = prices[0]
                ? n(h.quantity) * prices[0]
                : n(h.quantity) * n(h.avgCost);

            if (prices.length < 15) {
                return { vol: assetBaseline, value: currentValue, baseline: assetBaseline };
            }

            const dailyRets = [];
            for (let i = 0; i < Math.min(prices.length - 1, 60); i++) {
                dailyRets.push((prices[i] - prices[i + 1]) / (prices[i + 1] || 1));
            }

            const mean = dailyRets.reduce((a, b) => a + b, 0) / dailyRets.length;
            const variance = dailyRets.reduce((s, r) => s + (r - mean) ** 2, 0) / (dailyRets.length - 1 || 1);
            const annualizedVol = Math.sqrt(variance * 252);

            return { vol: annualizedVol, value: currentValue, baseline: assetBaseline };
        });

        const totalValue = holdingVols.reduce((s, h) => s + h.value, 0) || 1;

        // Weighted excess volatility vs asset-type-appropriate baseline
        const weightedExcessVol = holdingVols.reduce((s, h) => {
            const excess = Math.max(0, h.vol - h.baseline * 1.3); // 30% above baseline triggers score
            return s + (h.value / totalValue) * excess;
        }, 0);

        // Also factor in overall portfolio vol vs a blended benchmark
        const weightedVol = holdingVols.reduce((s, h) => s + (h.value / totalValue) * h.vol, 0);
        const blendedBaseline = holdingVols.reduce((s, h) => s + (h.value / totalValue) * h.baseline, 0);
        const portfolioExcess = Math.max(0, weightedVol - blendedBaseline);

        // Scale: 0 excess = 20, moderate excess = 50, large excess = 80
        riskChasingScore = clamp(Math.round(20 + portfolioExcess * 120 + weightedExcessVol * 80));
    }

    /* ───────────────── CONCENTRATION SCORE ───────────────── */
    // Measures: how concentrated the portfolio is in single positions
    // Uses Herfindahl-Hirschman Index (HHI) — standard concentration metric

    let concentrationScore = 30;

    if (holdings.length >= 1 && portfolioValue > 0) {

        const weights = holdings.map(h => {
            const price = h.asset.prices[0] ? n(h.asset.prices[0].price) : n(h.avgCost);
            const value = n(h.quantity) * price;
            return value / portfolioValue;
        });

        // HHI = sum of squared weights. Range: 1/n (perfectly diversified) to 1 (all in one)
        const hhi = weights.reduce((s, w) => s + w * w, 0);
        const minHHI = 1 / holdings.length; // Perfect diversification
        const normalizedHHI = (hhi - minHHI) / (1 - minHHI + 0.001); // 0 = perfectly spread, 1 = all in one

        // Scale: perfectly diversified = 10, moderate concentration = 50, all-in-one = 90
        concentrationScore = clamp(Math.round(10 + normalizedHHI * 80));
    }

    /* ───────────────── LIQUIDITY STRESS SCORE ───────────────── */
    // Measures: ability to meet liquidity needs without selling core positions
    // Stocks are liquid too — only penalise illiquid/locked assets heavily

    let liquidityStressScore = 30;

    const LIQUID_TICKERS = ['CASH', 'USD', 'USDT', 'USDC', 'DAI', 'BUSD'];
    const SEMI_LIQUID_TICKERS = ['BTC', 'ETH', 'SOL']; // Crypto: liquid but volatile

    const cashValue = holdings
        .filter(h => LIQUID_TICKERS.includes(h.asset.ticker?.toUpperCase() ?? ''))
        .reduce((s, h) => {
            const price = h.asset.prices[0] ? n(h.asset.prices[0].price) : 1;
            return s + n(h.quantity) * price;
        }, 0);

    const semiLiquidValue = holdings
        .filter(h => SEMI_LIQUID_TICKERS.includes(h.asset.ticker?.toUpperCase() ?? ''))
        .reduce((s, h) => {
            const price = h.asset.prices[0] ? n(h.asset.prices[0].price) : n(h.avgCost);
            return s + n(h.quantity) * price;
        }, 0);

    // Stocks are liquid — count them at 80% liquidity value
    const stockValue = holdings
        .filter(h => {
            const ticker = h.asset.ticker?.toUpperCase() ?? '';
            return !LIQUID_TICKERS.includes(ticker) && !SEMI_LIQUID_TICKERS.includes(ticker);
        })
        .reduce((s, h) => {
            const price = h.asset.prices[0] ? n(h.asset.prices[0].price) : n(h.avgCost);
            return s + n(h.quantity) * price * 0.8; // 80% — accounts for sell friction
        }, 0);

    if (portfolioValue > 0) {
        const effectiveLiquidityRatio = (cashValue + semiLiquidValue * 0.7 + stockValue * 0.5) / portfolioValue;

        // >50% effective liquidity = very low stress
        // 20-50% = moderate
        // <10% = high stress
        if (effectiveLiquidityRatio >= 0.50) liquidityStressScore = 15;
        else if (effectiveLiquidityRatio >= 0.30) liquidityStressScore = 30;
        else if (effectiveLiquidityRatio >= 0.20) liquidityStressScore = 45;
        else if (effectiveLiquidityRatio >= 0.10) liquidityStressScore = 60;
        else liquidityStressScore = 75;
    }

    /* ───────────────── LOSS AVERSION RATIO ───────────────── */

    let lossAversionRatio: number | null = null;

    if (holdings.length >= 2) {

        const latestPrice = (h: typeof holdings[0]) => {
            const p = h.asset.prices[0];
            return p ? n(p.price) : n(h.avgCost);
        };

        const winners = holdings.filter(h => latestPrice(h) >= n(h.avgCost));
        const losers = holdings.filter(h => latestPrice(h) < n(h.avgCost));

        if (winners.length > 0 && losers.length > 0) {

            const avgWinnerAge = winners.reduce((s, h) => {
                const days = (Date.now() - h.lastUpdated.getTime()) / 86400000;
                return s + days;
            }, 0) / winners.length;

            const avgLoserAge = losers.reduce((s, h) => {
                const days = (Date.now() - h.lastUpdated.getTime()) / 86400000;
                return s + days;
            }, 0) / losers.length;

            lossAversionRatio = avgWinnerAge > 0
                ? Number((avgLoserAge / avgWinnerAge).toFixed(2))
                : null;
        }
    }

    /* ───────────────── ADAPTIVE RISK SCORE ───────────────── */
    // Higher = better risk management. Penalises all bias scores proportionally.

    const adaptiveRiskScore = clamp(Math.round(
        100 - (
            0.25 * panicSellScore +
            0.20 * recencyBiasScore +
            0.20 * riskChasingScore +
            0.20 * liquidityStressScore +
            0.15 * concentrationScore
        )
    ));

    /* ───────────────── INSIGHTS ───────────────── */

    const insights: string[] = [];
    const alerts: string[] = [];

    // Panic sell insight
    if (panicSellScore < 25)
        insights.push('You handle market downturns calmly and avoid reactive selling.');
    else if (panicSellScore < 50)
        insights.push('You show mild panic selling tendencies during market drops.');
    else if (panicSellScore < 70)
        insights.push('You frequently sell during downturns — consider holding through volatility.');
    else {
        insights.push('Strong panic selling pattern detected. Reactive trades often lock in losses.');
        alerts.push('High panic selling risk — you tend to sell during market downturns.');
    }

    // Recency bias insight
    if (recencyBiasScore < 30)
        insights.push('Your portfolio allocation reflects long-term thinking over short-term trends.');
    else if (recencyBiasScore < 55)
        insights.push('Mild recency bias detected — your portfolio slightly favors recent winners.');
    else if (recencyBiasScore < 75)
        insights.push('Moderate recency bias — you may be overweighting recently outperforming assets.');
    else {
        insights.push('Your portfolio is heavily tilted toward recent winners, which increases drawdown risk.');
        alerts.push('Recency bias detected — portfolio concentration in recent outperformers.');
    }

    // Concentration insight
    if (concentrationScore < 30)
        insights.push('Your portfolio is well diversified across positions.');
    else if (concentrationScore < 55)
        insights.push('Moderate concentration — a few positions dominate your portfolio.');
    else if (concentrationScore < 75)
        insights.push(`High concentration risk — consider spreading across more assets.`);
    else {
        insights.push('Extreme concentration detected. A single position dominates your portfolio.');
        alerts.push('Concentration risk — portfolio is highly dependent on one asset.');
    }

    // Liquidity insight
    if (liquidityStressScore < 25)
        insights.push('Your portfolio has strong liquidity — you can react to opportunities quickly.');
    else if (liquidityStressScore < 50)
        insights.push('Liquidity is adequate but could be improved with a small cash buffer.');
    else if (liquidityStressScore < 65)
        insights.push('Limited liquidity — you may need to sell positions to access cash.');
    else {
        insights.push('Low liquidity detected. Consider maintaining a cash reserve for flexibility.');
        alerts.push('Liquidity stress — portfolio has minimal cash or liquid assets.');
    }

    // Risk chasing insight
    if (riskChasingScore < 30)
        insights.push('Your portfolio volatility is well within expected ranges.');
    else if (riskChasingScore < 55)
        insights.push('Portfolio volatility is moderate — appropriate for your asset mix.');
    else if (riskChasingScore < 75)
        insights.push('Above-average volatility detected — portfolio carries meaningful risk.');
    else {
        insights.push('High volatility portfolio. Risk chasing behavior may be amplifying drawdowns.');
        alerts.push('Risk chasing detected — portfolio volatility significantly exceeds benchmarks.');
    }

    // Loss aversion insight
    if (lossAversionRatio !== null) {
        if (lossAversionRatio > 2.0)
            insights.push(`You hold losing positions ${lossAversionRatio}x longer than winners — classic loss aversion.`);
        else if (lossAversionRatio > 1.3)
            insights.push('Mild loss aversion detected — you hold losers slightly longer than winners.');
        else
            insights.push('Balanced approach to winners and losers — no significant loss aversion detected.');
    }

    /* ───────────────── SNAPSHOT ───────────────── */

    const featureSnapshot: Record<string, number> = {
        panicSellScore,
        recencyBiasScore,
        riskChasingScore,
        liquidityStressScore,
        concentrationScore,
        adaptiveRiskScore,
        holdingsCount: holdings.length,
        portfolioValue
    };

    if (lossAversionRatio !== null)
        featureSnapshot.lossAversionRatio = lossAversionRatio;

    const modelWeights = {
        w_panic: 0.25,
        w_recency: 0.20,
        w_riskChasing: 0.20,
        w_liquidity: 0.20,
        w_concentration: 0.15,
        insights,
        alerts
    };

    /* ───────────────── SAVE SCORE ───────────────── */

    try {
        await prisma.behavioralScore.create({
            data: {
                userId,
                adaptiveRiskScore: new Decimal(adaptiveRiskScore),
                panicSellScore: new Decimal(panicSellScore),
                recencyBiasScore: new Decimal(recencyBiasScore),
                riskChasingScore: new Decimal(riskChasingScore),
                liquidityStressScore: new Decimal(liquidityStressScore),
                featureSnapshot,
                modelWeights
            }
        });
    } catch (err) {
        logger.warn(`Failed to persist BehavioralScore for user ${userId}: ${err}`);
    }

    return {
        adaptiveRiskScore,
        panicSellScore,
        recencyBiasScore,
        riskChasingScore,
        liquidityStressScore,
        concentrationScore,
        lossAversionRatio,
        featureSnapshot,
        insights,
        alerts,
        calculatedAt: new Date().toISOString()
    };
}