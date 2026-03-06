import { prisma } from '../../infrastructure/prisma/client';

function n(v: any): number {
    if (v == null) return 0;
    return typeof v === 'number' ? v : v.toNumber ? v.toNumber() : Number(v);
}

function clamp(val: number, min = 1, max = 10): number {
    return Math.min(max, Math.max(min, val));
}

function norm(score: number) {
    return clamp(score, 0, 100) / 100;
}

/**
 * Smooth penalty curve (more natural than linear thresholds)
 */
function smoothPenalty(score: number, threshold: number, maxImpact: number) {
    if (score <= threshold) return 0;

    const x = (score - threshold) / (100 - threshold);
    return maxImpact * (1 - Math.exp(-3 * x));
}

export interface AdaptiveRiskResult {
    currentRiskTolerance: number;
    suggestedRiskTolerance: number;
    adjustmentDelta: number;
    confidence: number;
    marketRegime: 'LOW_VOLATILITY' | 'NORMAL' | 'HIGH_VOLATILITY';
    adjustmentReasons: string[];
    behavioralScores: {
        adaptiveRiskScore: number;
        panicSellScore: number;
        recencyBiasScore: number;
        riskChasingScore: number;
        liquidityStressScore: number;
    };
}

export async function computeAdaptiveRisk(userId: number): Promise<AdaptiveRiskResult> {

    const [
        lastOptRun,
        lastBehavioral,
        recentReturns,
        ltReturns,
        tradeCount
    ] = await Promise.all([

        prisma.optimizationRun.findFirst({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        }),

        prisma.behavioralScore.findFirst({
            where: { userId },
            orderBy: { updatedAt: 'desc' }
        }),

        prisma.portfolioReturn.findMany({
            where: { userId },
            orderBy: { returnDate: 'desc' },
            take: 21
        }),

        prisma.portfolioReturn.findMany({
            where: { userId },
            orderBy: { returnDate: 'desc' },
            take: 252
        }),

        prisma.rebalancingAction.count({
            where: { userId }
        })

    ]);

    /* ───────── CURRENT RISK TOLERANCE ───────── */

    const rawTolerance = lastOptRun?.riskTolerance ? n(lastOptRun.riskTolerance) : 0.5;

    const currentRiskTolerance =
        rawTolerance <= 1
            ? parseFloat((rawTolerance * 10).toFixed(1))
            : parseFloat(rawTolerance.toFixed(1));

    /* ───────── BEHAVIORAL SCORES ───────── */

    const bScores = {
        adaptiveRiskScore: lastBehavioral ? n(lastBehavioral.adaptiveRiskScore) : 50,
        panicSellScore: lastBehavioral ? n(lastBehavioral.panicSellScore) : 50,
        recencyBiasScore: lastBehavioral ? n(lastBehavioral.recencyBiasScore) : 50,
        riskChasingScore: lastBehavioral ? n(lastBehavioral.riskChasingScore) : 50,
        liquidityStressScore: lastBehavioral ? n(lastBehavioral.liquidityStressScore) : 50,
    };

    /* ───────── MARKET REGIME DETECTION ───────── */

    let marketRegime: 'LOW_VOLATILITY' | 'NORMAL' | 'HIGH_VOLATILITY' = 'NORMAL';

    let recentVolatility = 0;
    let ltVolatility = 0;

    if (recentReturns.length >= 5) {

        const rets = recentReturns.map(r => n(r.dailyReturn));
        const mean = rets.reduce((a, b) => a + b, 0) / rets.length;

        const variance =
            rets.reduce((s, r) => s + (r - mean) ** 2, 0) / (rets.length - 1);

        recentVolatility = Math.sqrt(variance * 252);
    }

    if (ltReturns.length >= 20) {

        const rets = ltReturns.map(r => n(r.dailyReturn));
        const mean = rets.reduce((a, b) => a + b, 0) / rets.length;

        const variance =
            rets.reduce((s, r) => s + (r - mean) ** 2, 0) / rets.length;

        ltVolatility = Math.sqrt(variance * 252);
    }

    const volRatio =
        ltVolatility > 0 ? recentVolatility / ltVolatility : 1;

    if (volRatio > 1.5) marketRegime = 'HIGH_VOLATILITY';
    else if (volRatio < 0.6) marketRegime = 'LOW_VOLATILITY';

    /* ───────── BEHAVIOR PRESSURE MODEL ───────── */

    const behaviorPressure =
        norm(bScores.panicSellScore) * 0.35 +
        norm(bScores.recencyBiasScore) * 0.2 +
        norm(bScores.riskChasingScore) * 0.25 -
        norm(bScores.adaptiveRiskScore) * 0.3 -
        norm(100 - bScores.liquidityStressScore) * 0.1;

    let suggestedTolerance = currentRiskTolerance;

    const adjustmentReasons: string[] = [];

    /* ───────── BEHAVIORAL ADJUSTMENT ───────── */

    const panicPenalty = smoothPenalty(bScores.panicSellScore, 60, 2);
    const recencyPenalty = smoothPenalty(bScores.recencyBiasScore, 55, 1);
    const chasingPenalty = smoothPenalty(bScores.riskChasingScore, 60, 1.5);

    const stabilityBoost = smoothPenalty(bScores.adaptiveRiskScore, 70, 1);
    const liquidityBoost =
        bScores.liquidityStressScore < 40
            ? ((40 - bScores.liquidityStressScore) / 40) * 0.8
            : 0;

    suggestedTolerance -= panicPenalty;
    suggestedTolerance -= recencyPenalty;
    suggestedTolerance -= chasingPenalty;

    suggestedTolerance += stabilityBoost;
    suggestedTolerance += liquidityBoost;

    if (panicPenalty > 0)
        adjustmentReasons.push(`Panic-selling tendency detected`);

    if (recencyPenalty > 0)
        adjustmentReasons.push(`Recency bias affecting decisions`);

    if (chasingPenalty > 0)
        adjustmentReasons.push(`Volatility chasing behavior`);

    if (stabilityBoost > 0)
        adjustmentReasons.push(`Behavioral stability allows slightly higher risk`);

    if (liquidityBoost > 0)
        adjustmentReasons.push(`Strong liquidity buffer supports risk capacity`);

    /* ───────── INTERACTION EFFECTS ───────── */

    if (
        bScores.panicSellScore > 65 &&
        bScores.recencyBiasScore > 65
    ) {
        suggestedTolerance -= 0.5;

        adjustmentReasons.push(
            'Combined panic selling and recency bias increase risk sensitivity'
        );
    }

    /* ───────── VOLATILITY ADJUSTMENT ───────── */

    if (volRatio > 1) {

        const volPenalty = Math.min(1.2, (volRatio - 1) * 1.2);

        suggestedTolerance -= volPenalty;

        adjustmentReasons.push(
            `Elevated market volatility (ratio ${volRatio.toFixed(2)})`
        );
    }

    /* ───────── INERTIA (RISK SHOULD DRIFT) ───────── */

    const inertia = 0.65;

    suggestedTolerance =
        currentRiskTolerance +
        (suggestedTolerance - currentRiskTolerance) * (1 - inertia);

    suggestedTolerance = parseFloat(
        clamp(suggestedTolerance, 1, 10).toFixed(1)
    );

    const adjustmentDelta = parseFloat(
        (suggestedTolerance - currentRiskTolerance).toFixed(1)
    );

    if (adjustmentReasons.length === 0) {
        adjustmentReasons.push(
            'Behavioral profile consistent with current risk level'
        );
    }

    /* ───────── CONFIDENCE MODEL ───────── */

    let confidence =
        0.35 +
        Math.min(0.2, ltReturns.length / 300) +
        Math.min(0.2, tradeCount / 50) +
        (lastBehavioral ? 0.15 : 0);

    confidence = parseFloat(Math.min(0.95, confidence).toFixed(2));

    return {
        currentRiskTolerance,
        suggestedRiskTolerance: suggestedTolerance,
        adjustmentDelta,
        confidence,
        marketRegime,
        adjustmentReasons,
        behavioralScores: bScores,
    };
}