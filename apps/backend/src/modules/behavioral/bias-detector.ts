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

export interface BiasDetectionResult {
    adaptiveRiskScore: number;
    panicSellScore: number;
    recencyBiasScore: number;
    riskChasingScore: number;
    liquidityStressScore: number;
    lossAversionRatio: number | null;
    featureSnapshot: Record<string, number>;
    insights: string[];
    calculatedAt: string;
}

export async function detectBiases(userId: number): Promise<BiasDetectionResult> {

    /* ───────────────── LOAD DATA ───────────────── */

    const [
        holdings,
        rebalancingActions,
        portfolioReturns,
        latestPortfolioSnapshot,
        portfolioSnapshots
    ] = await Promise.all([
        prisma.holding.findMany({
            where: { userId },
            include: {
                asset: {
                    include: {
                        prices: {
                            orderBy: { priceDate: 'desc' },
                            take: 60
                        }
                    }
                }
            }
        }),

        prisma.rebalancingAction.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 30
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

        prisma.portfolioSnapshot.findMany({
            where: { userId },
            orderBy: { snapshotDate: 'desc' },
            take: 10
        })
    ]);

    /* ───────────────── PANIC SELL SCORE ───────────────── */

    let panicSellScore = 50;

    if (portfolioReturns.length >= 5) {

        const negReturnDates = portfolioReturns
            .filter(r => n(r.dailyReturn) < -0.01)
            .map(r => r.returnDate.getTime());

        const sellActions = rebalancingActions.filter(a =>
            (a.triggerType ?? '').toLowerCase().includes('sell') ||
            (a.reason ?? '').toLowerCase().includes('sell') ||
            (a.triggerType ?? '').toLowerCase().includes('rebalance')
        );

        if (sellActions.length > 0 && negReturnDates.length > 0) {

            const panicSells = sellActions.filter(a => {

                const actionTime = a.createdAt.getTime();

                return negReturnDates.some(
                    dt => Math.abs(actionTime - dt) <= 3 * 86400 * 1000
                );
            });

            const panicRatio = panicSells.length / Math.max(sellActions.length, 1);

            panicSellScore = clamp(Math.round(panicRatio * 100));

        } else if (portfolioReturns.length >= 20) {

            panicSellScore = 20 + sellActions.length * 2;

        }
    }

    /* ───────────────── RECENCY BIAS ───────────────── */

    let recencyBiasScore = 50;

    if (holdings.length >= 2) {

        const holdingPerformance = holdings.map(h => {

            const prices = h.asset.prices.map(p => n(p.price));

            if (prices.length < 30)
                return { weight: n(h.quantity), recent: 0, longterm: 0 };

            const recent30 = prices.slice(0, 30);
            const longTerm = prices;

            const recentRet =
                (recent30[0] - recent30[recent30.length - 1]) /
                (recent30[recent30.length - 1] || 1);

            const ltRet =
                (longTerm[0] - longTerm[longTerm.length - 1]) /
                (longTerm[longTerm.length - 1] || 1);

            return {
                weight: n(h.quantity) * (h.avgCost ? n(h.avgCost) : 1),
                recent: recentRet,
                longterm: ltRet
            };

        });

        const totalWeight = holdingPerformance.reduce((s, h) => s + h.weight, 0) || 1;

        const weightedRecent = holdingPerformance.reduce(
            (s, h) => s + (h.weight / totalWeight) * h.recent,
            0
        );

        const weightedLongTerm = holdingPerformance.reduce(
            (s, h) => s + (h.weight / totalWeight) * h.longterm,
            0
        );

        const bias = weightedRecent > weightedLongTerm
            ? weightedRecent - weightedLongTerm
            : 0;

        recencyBiasScore = clamp(50 + bias * 200);
    }

    /* ───────────────── RISK CHASING ───────────────── */

    let riskChasingScore = 50;

    if (holdings.length >= 1) {

        const marketBaselineVol = 0.15;

        const holdingVols = holdings.map(h => {

            const prices = h.asset.prices.map(p => n(p.price));

            if (prices.length < 10)
                return { vol: 0, value: 0 };

            const dailyRets = [];

            for (let i = 0; i < prices.length - 1; i++) {

                dailyRets.push(
                    (prices[i] - prices[i + 1]) / (prices[i + 1] || 1)
                );
            }

            const mean = dailyRets.reduce((a, b) => a + b, 0) / dailyRets.length;

            const variance = dailyRets.reduce(
                (s, r) => s + (r - mean) ** 2,
                0
            ) / (dailyRets.length - 1 || 1);

            const annualizedVol = Math.sqrt(variance * 252);

            const posValue = n(h.quantity) * (h.avgCost ? n(h.avgCost) : 1);

            return { vol: annualizedVol, value: posValue };
        });

        const totalValue = holdingVols.reduce((s, h) => s + h.value, 0) || 1;

        const weightedVol = holdingVols.reduce(
            (s, h) => s + (h.value / totalValue) * h.vol,
            0
        );

        const excessVol = Math.max(0, weightedVol - marketBaselineVol);

        riskChasingScore = clamp(Math.round(excessVol * 400 + 30));
    }

    /* ───────────────── LIQUIDITY STRESS ───────────────── */

    let liquidityStressScore = 50;

    const portfolioValue = latestPortfolioSnapshot
        ? n(latestPortfolioSnapshot.totalValue)
        : 0;

    const cashPosition = holdings
        .filter(h => h.asset.ticker === 'CASH')
        .reduce((s, h) => s + n(h.quantity), 0);

    if (portfolioValue > 0) {

        const cashRatio = cashPosition / portfolioValue;

        if (cashRatio >= 0.20)
            liquidityStressScore = 20;

        else if (cashRatio >= 0.10)
            liquidityStressScore = 40;

        else if (cashRatio >= 0.05)
            liquidityStressScore = 65;

        else
            liquidityStressScore = 85;
    }

    /* ───────────────── LOSS AVERSION ───────────────── */

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

    const adaptiveRiskScore = clamp(Math.round(

        100 - (
            0.30 * panicSellScore +
            0.25 * recencyBiasScore +
            0.25 * riskChasingScore +
            0.20 * liquidityStressScore
        )

    ));

    /* ───────────────── INSIGHTS ───────────────── */

    const insights: string[] = [];

    if (panicSellScore < 30)
        insights.push('You handle downturns calmly and avoid panic selling.');

    else if (panicSellScore < 60)
        insights.push('You show moderate panic selling tendencies.');

    else
        insights.push('High panic selling behavior detected during drawdowns.');

    if (recencyBiasScore < 35)
        insights.push('Your portfolio decisions reflect long-term thinking.');

    else if (recencyBiasScore < 65)
        insights.push('You show moderate recency bias toward recent winners.');

    else
        insights.push('Your portfolio heavily favors recently performing assets.');

    if (liquidityStressScore < 30)
        insights.push('Your portfolio maintains a healthy liquidity buffer.');

    else if (liquidityStressScore < 60)
        insights.push('Your liquidity allocation is moderate.');

    else
        insights.push('Low liquidity detected — portfolio may be overexposed to risk.');

    if (riskChasingScore > 60)
        insights.push('You gravitate toward higher volatility assets.');

    /* ───────────────── SNAPSHOT ───────────────── */

    const featureSnapshot: Record<string, number> = {
        panicSellScore,
        recencyBiasScore,
        riskChasingScore,
        liquidityStressScore,
        adaptiveRiskScore,
        holdingsCount: holdings.length,
        portfolioValue
    };

    if (lossAversionRatio !== null)
        featureSnapshot.lossAversionRatio = lossAversionRatio;

    const modelWeights = {
        w_panic: 0.30,
        w_recency: 0.25,
        w_riskChasing: 0.25,
        w_liquidity: 0.20
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
        lossAversionRatio,
        featureSnapshot,
        insights,
        calculatedAt: new Date().toISOString()
    };
}