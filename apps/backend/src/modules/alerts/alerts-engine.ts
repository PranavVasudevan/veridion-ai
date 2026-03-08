import { prisma } from '../../infrastructure/prisma/client';
import { logger } from '../../infrastructure/logger/logger';

function n(v: any): number {
    if (v == null) return 0;
    return typeof v === 'number' ? v : v.toNumber ? v.toNumber() : Number(v);
}

interface GeneratedAlert {
    alertType: string;
    severity: string;
    title: string;
    message: string;
    explanation: string;
    actionSuggestion: string;
}

export async function generateAndPersistAlerts(userId: number): Promise<void> {
    console.log('generateAndPersistAlerts called for userId:', userId);

    const alerts: GeneratedAlert[] = [];

    const [
        holdings,
        latestSnapshot,
        portfolioReturns,
        behavioralScore,
        userProfile,
        riskMetrics,
        portfolioEventImpacts,
    ] = await Promise.all([
        prisma.holding.findMany({
            where: { userId },
            include: {
                asset: {
                    include: {
                        prices: { orderBy: { priceDate: 'desc' }, take: 90 },
                    },
                },
            },
        }),
        prisma.portfolioSnapshot.findFirst({
            where: { userId },
            orderBy: { snapshotDate: 'desc' },
        }),
        prisma.portfolioReturn.findMany({
            where: { userId },
            orderBy: { returnDate: 'desc' },
            take: 30,
        }),
        prisma.behavioralScore.findFirst({
            where: { userId },
            orderBy: { updatedAt: 'desc' },
        }),
        prisma.userProfile.findFirst({ where: { userId } }),
        prisma.riskMetricsHistory.findFirst({
            where: { userId },
            orderBy: { calculatedAt: 'desc' },
        }),
        prisma.portfolioEventImpact.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 5,
            include: { event: true },
        }),
    ]);

    console.log("holdings count:", holdings.length);
    console.log("behavioralScore id:", behavioralScore?.id ?? "null");
    console.log("riskMetrics vol:", riskMetrics ? String(riskMetrics.volatility) : "null");
    if (holdings.length === 0) return;

    /* ─── PORTFOLIO VALUE ─── */
    // Always calculate from actual holdings, not snapshot
// Snapshot includes cash which dilutes weights incorrectly
const portfolioValue = holdings.reduce((s, h) => {
    const price = h.asset.prices[0] ? n(h.asset.prices[0].price) : n(h.avgCost);
    return s + n(h.quantity) * price;
}, 0);

console.log('portfolioValue from holdings:', portfolioValue);

if (portfolioValue === 0) return;

    const holdingValues = holdings.map(h => {
        const price = h.asset.prices[0] ? n(h.asset.prices[0].price) : n(h.avgCost);
        const value = n(h.quantity) * price;
        const weight = value / portfolioValue;
        const avgCost = n(h.avgCost);
        const pnl = avgCost > 0 ? (price - avgCost) / avgCost : 0;
        const ticker = h.asset.ticker?.toUpperCase() ?? '';
        const isCrypto = h.asset.assetType?.toLowerCase() === 'crypto' ||
            ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'AVAX', 'DOT', 'MATIC'].includes(ticker);
        return { h, ticker, value, weight, pnl, price, avgCost, isCrypto };
    });

    console.log('holdingValues:', holdingValues.map(h => ({ 
    ticker: h.ticker, weight: h.weight, pnl: h.pnl 
})));
console.log('behavioral scores:', {
    panic: n(behavioralScore?.panicSellScore),
    recency: n(behavioralScore?.recencyBiasScore),
    riskChase: n(behavioralScore?.riskChasingScore),
    liquidity: n(behavioralScore?.liquidityStressScore),
});

    /* ══════════════════════════════════════════════════════
       1. CONCENTRATION RISK
    ══════════════════════════════════════════════════════ */
    for (const { ticker, weight, isCrypto } of holdingValues) {
        if (weight >= 0.70) {
            alerts.push({
                alertType: 'risk_threshold',
                severity: 'CRITICAL',
                title: `${ticker} is ${(weight * 100).toFixed(0)}% of your portfolio`,
                message: `Extreme concentration — ${ticker} makes up ${(weight * 100).toFixed(0)}% of your total portfolio value.`,
                explanation: `If ${ticker} drops 30%, your portfolio loses ~${(weight * 30).toFixed(0)}% overall. Diversification is the most reliable way to reduce this risk.`,
                actionSuggestion: `Reduce ${ticker} to below 50% by trimming ~${((weight - 0.50) * portfolioValue).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })} and reinvesting into uncorrelated assets.`,
            });
        } else if (weight >= 0.50) {
            alerts.push({
                alertType: 'risk_threshold',
                severity: 'HIGH',
                title: `${ticker} dominates your portfolio at ${(weight * 100).toFixed(0)}%`,
                message: `${ticker} makes up over half your portfolio, amplifying both gains and losses significantly.`,
                explanation: `A 50%+ single-asset allocation means your overall performance is almost entirely driven by ${ticker}. ${isCrypto ? 'Crypto assets regularly see 20-40% drawdowns.' : 'Even blue-chip stocks can fall 30-50% in bear markets.'}`,
                actionSuggestion: `Trim ${ticker} by ~${((weight - 0.40) * portfolioValue).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })} to reach a healthier 40% target weight.`,
            });
        } else if (weight >= 0.35) {
            alerts.push({
                alertType: 'exposure_warning',
                severity: 'MEDIUM',
                title: `${ticker} is a large position at ${(weight * 100).toFixed(0)}%`,
                message: `${ticker} represents a significant portion of your portfolio. Single-asset events will have outsized impact.`,
                explanation: `At ${(weight * 100).toFixed(0)}%, a 20% move in ${ticker} shifts your whole portfolio by ${(weight * 20).toFixed(0)}%.`,
                actionSuggestion: `Review if ${ticker}'s weight aligns with your target allocation. 20-30% per position is recommended for balanced portfolios.`,
            });
        }
    }

    /* ══════════════════════════════════════════════════════
       2. VOLATILITY vs RISK TOLERANCE
       riskTolerance is Decimal 0-1 in schema
    ══════════════════════════════════════════════════════ */
    const riskTol = userProfile ? n(userProfile.riskTolerance) : 0.5;
    const volThreshold = 0.10 + riskTol * 0.30; // 0→10%, 0.5→25%, 1→40%
    const actualVol = riskMetrics ? n(riskMetrics.volatility) : null;

    if (actualVol !== null && actualVol > 0 && actualVol > volThreshold * 1.3) {
        const volPct = (actualVol * 100).toFixed(1);
        const threshPct = (volThreshold * 100).toFixed(0);
        alerts.push({
            alertType: 'risk_threshold',
            severity: actualVol > volThreshold * 1.6 ? 'CRITICAL' : 'HIGH',
            title: `Portfolio volatility (${volPct}%) exceeds your risk tolerance`,
            message: `Annualized volatility of ${volPct}% is above the ~${threshPct}% expected for your risk profile.`,
            explanation: `At ${volPct}% volatility, your portfolio could swing ±${(actualVol * 50).toFixed(0)}% in a given year. The S&P 500 averages ~15% annual volatility for reference.`,
            actionSuggestion: `Shift some allocation from high-volatility assets to bonds, dividend stocks, or stablecoins to bring volatility closer to ${threshPct}%.`,
        });
    }

    /* ══════════════════════════════════════════════════════
       3. MAX DRAWDOWN (from RiskMetricsHistory)
    ══════════════════════════════════════════════════════ */
    if (riskMetrics && n(riskMetrics.maxDrawdown) < -0.15) {
        const mdd = Math.abs(n(riskMetrics.maxDrawdown)) * 100;
        alerts.push({
            alertType: 'risk_threshold',
            severity: mdd > 30 ? 'HIGH' : 'MEDIUM',
            title: `Maximum drawdown of ${mdd.toFixed(1)}% detected`,
            message: `Your portfolio has experienced a peak-to-trough decline of ${mdd.toFixed(1)}%.`,
            explanation: `A ${mdd.toFixed(0)}% drawdown means at its worst, your portfolio was down ${mdd.toFixed(0)}% from its peak. Large drawdowns test discipline and often trigger panic selling.`,
            actionSuggestion: `Review your most volatile positions. If this drawdown was uncomfortable, reduce position sizes to limit future peak-to-trough declines.`,
        });
    }

    /* ══════════════════════════════════════════════════════
       4. RECENT DRAWDOWN (from PortfolioReturns)
    ══════════════════════════════════════════════════════ */
    if (portfolioReturns.length >= 5) {
        const recent5 = portfolioReturns.slice(0, 5).map(r => n(r.dailyReturn));
        const cum5 = recent5.reduce((acc, r) => acc * (1 + r), 1) - 1;

        if (cum5 <= -0.08) {
            alerts.push({
                alertType: 'risk_threshold',
                severity: cum5 <= -0.15 ? 'CRITICAL' : 'HIGH',
                title: `Portfolio down ${(Math.abs(cum5) * 100).toFixed(1)}% in the last 5 days`,
                message: `Your portfolio has fallen ${(Math.abs(cum5) * 100).toFixed(1)}% over the past 5 trading days.`,
                explanation: `Reactive selling during drawdowns typically locks in losses — most diversified portfolios recover given time if the underlying holdings are sound.`,
                actionSuggestion: `Before selling, determine whether the decline is market-wide or isolated to specific holdings. If your investment thesis is intact, holding through is often the better long-term decision.`,
            });
        }
    }

    /* ══════════════════════════════════════════════════════
       5. BEHAVIORAL FLAGS
    ══════════════════════════════════════════════════════ */
    if (behavioralScore) {
        const panic = n(behavioralScore.panicSellScore);
        const recency = n(behavioralScore.recencyBiasScore);
        const riskChase = n(behavioralScore.riskChasingScore);
        const liquidity = n(behavioralScore.liquidityStressScore);

        if (panic >= 60) {
            alerts.push({
                alertType: 'behavioral_flag',
                severity: panic >= 80 ? 'HIGH' : 'MEDIUM',
                title: `Panic selling pattern detected in your trades`,
                message: `Your trades show a tendency to sell during market downturns. Panic sell score: ${panic.toFixed(0)}/100.`,
                explanation: `Investors who sell during downturns typically miss the recovery, effectively buying high and selling low. This is one of the most costly behavioural mistakes in investing.`,
                actionSuggestion: `Implement a 48-hour rule: wait 2 days before executing any sell during a market decline to reduce reactive, emotion-driven decisions.`,
            });
        }

        if (recency >= 60) {
            alerts.push({
                alertType: 'behavioral_flag',
                severity: recency >= 80 ? 'HIGH' : 'MEDIUM',
                title: `Recency bias detected in recent trades`,
                message: `Your portfolio is tilting toward recently outperforming assets. Recency bias score: ${recency.toFixed(0)}/100.`,
                explanation: `Recency bias causes investors to extrapolate recent performance. Assets that recently outperformed are often already overvalued, while recent underperformers may represent opportunity.`,
                actionSuggestion: `Compare your current weights to your target allocation. Rebalance any position that has grown due to recent price appreciation rather than deliberate strategy.`,
            });
        }

        if (riskChase >= 65) {
            alerts.push({
                alertType: 'behavioral_flag',
                severity: riskChase >= 85 ? 'HIGH' : 'MEDIUM',
                title: `Risk chasing — portfolio volatility is elevated`,
                message: `Portfolio volatility significantly exceeds benchmarks for your asset mix. Risk chasing score: ${riskChase.toFixed(0)}/100.`,
                explanation: `Risk chasing occurs when investors gravitate toward high-volatility assets after strong returns. Higher volatility means larger drawdowns and greater emotional pressure to sell at the wrong time.`,
                actionSuggestion: `Review your highest-volatility holdings. Consider whether the extra risk is compensated by expected returns, or if better diversification could achieve similar returns with less volatility.`,
            });
        }

        if (liquidity >= 60) {
            alerts.push({
                alertType: 'behavioral_flag',
                severity: liquidity >= 80 ? 'HIGH' : 'MEDIUM',
                title: `Low liquidity — portfolio may be overexposed`,
                message: `Your portfolio has limited cash or liquid assets. Liquidity stress score: ${liquidity.toFixed(0)}/100.`,
                explanation: `Without liquid reserves, you may be forced to sell core holdings at inopportune times. A cash buffer reduces emotional stress and lets you buy dips opportunistically.`,
                actionSuggestion: `Aim to keep 5-15% of your portfolio in cash or stablecoins. This improves flexibility without significantly reducing expected returns.`,
            });
        }
    }

    /* ══════════════════════════════════════════════════════
       6. UNREALISED LOSSES
    ══════════════════════════════════════════════════════ */
    for (const { ticker, pnl, value, weight } of holdingValues) {
        if (pnl <= -0.20 && weight >= 0.04) {
            const lossAmt = (Math.abs(pnl) * value).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
            alerts.push({
                alertType: 'rebalance_suggestion',
                severity: pnl <= -0.35 ? 'HIGH' : 'MEDIUM',
                title: `${ticker} is down ${(Math.abs(pnl) * 100).toFixed(0)}% from your average cost`,
                message: `${ticker} has an unrealised loss of ${lossAmt}. Review whether this position still fits your strategy.`,
                explanation: `Loss aversion bias can cause investors to hold losing positions too long hoping for recovery. Ask: if you didn't own ${ticker} already, would you buy it today at this price?`,
                actionSuggestion: `If your investment thesis has changed, consider exiting and redeploying capital. If intact, ensure the position size is appropriate for this level of unrealised loss.`,
            });
        }
    }

    /* ══════════════════════════════════════════════════════
       7. LARGE UNREALISED GAINS — trim suggestion
    ══════════════════════════════════════════════════════ */
    for (const { ticker, pnl, weight } of holdingValues) {
        if (pnl >= 0.75 && weight >= 0.08) {
            alerts.push({
                alertType: 'rebalance_suggestion',
                severity: 'LOW',
                title: `${ticker} up ${(pnl * 100).toFixed(0)}% — consider trimming to lock in gains`,
                message: `${ticker} has gained ${(pnl * 100).toFixed(0)}% from your average cost. Large unrealised gains increase concentration risk.`,
                explanation: `When a position appreciates significantly it can dominate your portfolio unintentionally. Trimming winners locks in gains and rebalances risk — this is disciplined portfolio management, not panic selling.`,
                actionSuggestion: `Consider trimming ${ticker} by 10-20% to realise gains and rebalance. Reinvest proceeds into underweighted areas of your target allocation.`,
            });
        }
    }

    /* ══════════════════════════════════════════════════════
       8. CRYPTO CONCENTRATION
    ══════════════════════════════════════════════════════ */
    const cryptoWeight = holdingValues.filter(h => h.isCrypto).reduce((s, h) => s + h.weight, 0);
    const stockWeight = holdingValues.filter(h => !h.isCrypto).reduce((s, h) => s + h.weight, 0);

    if (cryptoWeight >= 0.65 && stockWeight > 0) {
        alerts.push({
            alertType: 'rebalance_suggestion',
            severity: 'MEDIUM',
            title: `Portfolio is ${(cryptoWeight * 100).toFixed(0)}% crypto — high correlation risk`,
            message: `Crypto assets dominate your portfolio. During crypto market stress, all assets tend to fall simultaneously.`,
            explanation: `Crypto assets are highly correlated — when BTC drops sharply, most altcoins drop further and faster. 65%+ crypto lacks cross-asset-class diversification, which is the most effective long-term risk reducer.`,
            actionSuggestion: `Consider shifting 15-25% into uncorrelated assets like equities, bonds, or REITs to reduce the impact of crypto market cycles on your overall wealth.`,
        });
    }

    /* ══════════════════════════════════════════════════════
       9. EVENT IMPACT ALERTS (from PortfolioEventImpact)
    ══════════════════════════════════════════════════════ */
    for (const impact of portfolioEventImpacts) {
        const impactScore = n(impact.impactScore);
        const drawdown = n(impact.estimatedDrawdown);

        if (impactScore >= 0.6 || drawdown <= -0.05) {
            const event = impact.event;
            alerts.push({
                alertType: 'exposure_warning',
                severity: impactScore >= 0.8 ? 'HIGH' : 'MEDIUM',
                title: `Portfolio exposed to: ${event.headline.substring(0, 55)}`,
                message: `A recent market event may impact your holdings. Estimated portfolio effect: ${(Math.abs(drawdown) * 100).toFixed(1)}% drawdown.`,
                explanation: event.summary ?? `This event has been flagged as having significant impact on assets in your portfolio based on sector and ticker exposure analysis.`,
                actionSuggestion: `Review the affected holdings and assess whether your position sizes are appropriate. Consider hedging or reducing exposure if the impact is expected to persist.`,
            });
            break; // One event alert max to avoid noise
        }
    }

    /* ══════════════════════════════════════════════════════
       10. SHARPE RATIO
    ══════════════════════════════════════════════════════ */
    if (riskMetrics) {
        const sharpe = n(riskMetrics.sharpeRatio);
        if (sharpe !== 0 && sharpe < 0.5) {
            alerts.push({
                alertType: 'risk_threshold',
                severity: 'MEDIUM',
                title: `Low risk-adjusted returns — Sharpe ratio is ${sharpe.toFixed(2)}`,
                message: `A Sharpe ratio of ${sharpe.toFixed(2)} suggests you may not be adequately compensated for the risk you're taking.`,
                explanation: `The Sharpe ratio measures return per unit of risk. Below 0.5 means high volatility without proportional returns. Above 1.0 is good; above 2.0 is excellent. Yours is currently ${sharpe.toFixed(2)}.`,
                actionSuggestion: `Review your highest-volatility, lowest-return positions. Replacing them with better-diversified or higher-quality assets could meaningfully improve your risk-adjusted returns.`,
            });
        }
    }

    /* ══════════════════════════════════════════════════════
       PERSIST — wipe stale alerts, write fresh ones
    ══════════════════════════════════════════════════════ */
    try {
        console.log("alerts generated:", alerts.length, alerts.map(a => a.alertType));
        await prisma.alert.deleteMany({ where: { userId } });

        if (alerts.length > 0) {
            await prisma.alert.createMany({
                data: alerts.map(a => ({
                    userId,
                    alertType: a.alertType,
                    severity: a.severity,
                    // Pack all fields as JSON into message — no schema change needed
                    message: JSON.stringify({
                        title: a.title,
                        message: a.message,
                        explanation: a.explanation,
                        actionSuggestion: a.actionSuggestion,
                    }),
                    isRead: false,
                })),
            });
        }
    } catch (err) {
        logger.warn(`Failed to persist alerts for user ${userId}: ${err}`);
    }
}