import { Router, Request, Response } from 'express';
import { authMiddleware, AuthRequest } from '../../core/middleware/auth.middleware';
import { asyncHandler, sendSuccess } from '../../core/utils/index';
import { prisma } from '../../infrastructure/prisma/client';

export const dashboardController = Router();
dashboardController.use(authMiddleware as any);

function num(val: any): number {
    if (val == null) return 0;
    return typeof val === 'number' ? val : val.toNumber ? val.toNumber() : Number(val);
}

/**
 * GET /dashboard/summary
 * Single consolidated endpoint for the Dashboard page.
 * Returns everything the dashboard needs in one request.
 */
dashboardController.get('/summary', asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as AuthRequest).user.userId;

    const [
        user, holdings, latestRisk, behavioralScore,
        portfolioState, snapshots, alerts, goals, monteCarloResults, events,
    ] = await Promise.all([
        prisma.user.findUnique({ where: { id: userId }, include: { profile: true } }),
        prisma.holding.findMany({
            where: { userId },
            include: { asset: { include: { prices: { orderBy: { priceDate: 'desc' }, take: 2 } } } },
        }),
        prisma.riskMetricsHistory.findFirst({ where: { userId }, orderBy: { calculatedAt: 'desc' } }),
        prisma.behavioralScore.findFirst({ where: { userId }, orderBy: { updatedAt: 'desc' } }),
        prisma.portfolioState.findFirst({ where: { userId }, orderBy: { updatedAt: 'desc' } }),
        prisma.portfolioSnapshot.findMany({ where: { userId }, orderBy: { snapshotDate: 'asc' }, take: 90 }),
        prisma.alert.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 5 }),
        prisma.financialGoal.findMany({ where: { userId }, orderBy: { priority: 'asc' }, take: 3 }),
        prisma.monteCarloResult.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 3 }),
        prisma.newsEvent.findMany({ orderBy: { id: 'desc' }, take: 5 }),
    ]);

    // Portfolio value calculation — now includes P&L, change24h, avgCost
    let totalValue = 0;
    let totalCost = 0;
    let cashBalance = 0;

    const holdingsSummary = holdings.map(h => {
        const prices = h.asset.prices;
        const latestPrice = prices[0]?.price ? num(prices[0].price) : (h.avgCost ? num(h.avgCost) : 0);
        const prevPrice = prices[1]?.price ? num(prices[1].price) : latestPrice;
        const qty = num(h.quantity);
        const avg = h.avgCost ? num(h.avgCost) : latestPrice;
        const marketValue = qty * latestPrice;

        totalValue += marketValue;
        totalCost += qty * avg;

        // Track cash-type holdings
        const assetType = (h.asset.assetType ?? '').toUpperCase();
        if (assetType === 'CASH') cashBalance += marketValue;

        const unrealizedPnL = avg > 0 ? (latestPrice - avg) * qty : 0;
        const unrealizedPnLPercent = avg > 0 ? ((latestPrice - avg) / avg) * 100 : 0;
        const change24h = prevPrice > 0 ? ((latestPrice - prevPrice) / prevPrice) * 100 : 0;

        return {
            ticker: h.asset.ticker,
            name: h.asset.name ?? h.asset.ticker,
            assetType: h.asset.assetType ?? 'stock',
            sector: h.asset.sector ?? 'Other',
            quantity: qty,
            avgCost: Math.round(avg * 100) / 100,
            price: Math.round(latestPrice * 100) / 100,
            value: Math.round(marketValue * 100) / 100,
            weight: 0,
            unrealizedPnL: Math.round(unrealizedPnL * 100) / 100,
            unrealizedPnLPercent: Math.round(unrealizedPnLPercent * 100) / 100,
            change24h: Math.round(change24h * 100) / 100,
        };
    });

    const totalReturn = totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0;
    holdingsSummary.forEach(h => { h.weight = totalValue > 0 ? Math.round((h.value / totalValue) * 10000) / 10000 : 0; });

    // Sort by value desc, take top 6
    holdingsSummary.sort((a, b) => b.value - a.value);

    const performanceData = snapshots.map(s => ({ date: s.snapshotDate.toISOString().split('T')[0], value: num(s.totalValue) }));
    const lastSnapshotDate = snapshots.length > 0 ? snapshots[snapshots.length - 1].snapshotDate.toISOString() : null;

    // Risk profile from questionnaire
    const profile = user?.profile;
    const riskToleranceRaw = profile?.riskTolerance ? num(profile.riskTolerance) : 50;
    const riskProfile: 'Conservative' | 'Moderate' | 'Aggressive' =
        riskToleranceRaw <= 33 ? 'Conservative' : riskToleranceRaw <= 66 ? 'Moderate' : 'Aggressive';

    const riskMetrics = {
        volatility: num(latestRisk?.volatility) * 100,
        sharpeRatio: num(latestRisk?.sharpeRatio),
        sortinoRatio: num(latestRisk?.sortinoRatio),
        maxDrawdown: num(latestRisk?.maxDrawdown) * 100,
        var95: num(latestRisk?.var95) * 100,
    };

    const behavioral = {
        adaptiveRiskScore: behavioralScore ? Math.min(100, Math.round(num(behavioralScore.adaptiveRiskScore))) : 50,
        panicSellScore: behavioralScore ? Math.min(100, Math.round(num(behavioralScore.panicSellScore))) : 0,
        recencyBiasScore: behavioralScore ? Math.min(100, Math.round(num(behavioralScore.recencyBiasScore))) : 0,
        riskChasingScore: behavioralScore ? Math.min(100, Math.round(num(behavioralScore.riskChasingScore))) : 0,
        liquidityStressScore: behavioralScore ? Math.min(100, Math.round(num(behavioralScore.liquidityStressScore))) : 0,
        hasRealData: !!behavioralScore,
    };

    const stateInfo = { state: portfolioState?.state ?? 'Stable', healthIndex: portfolioState?.healthIndex ? num(portfolioState.healthIndex) : 75 };

    const goalsWithProb = goals.map(g => {
        const mc = monteCarloResults.find(r => r.goalId === g.id);
        return {
            id: g.id, name: g.goalName, targetAmount: num(g.targetAmount),
            targetDate: g.targetDate ? g.targetDate.toISOString() : null,
            probability: mc ? Math.round(num(mc.goalProbability) * 100) : null,
            medianProjection: mc ? num(mc.medianProjection) : null,
        };
    });

    const alertsSummary = alerts.map(a => ({ id: a.id, type: a.alertType, severity: a.severity, message: a.message, isRead: a.isRead, createdAt: a.createdAt.toISOString() }));
    const unreadCount = alerts.filter(a => !a.isRead).length;

    const eventsSummary = (events).map((e: any) => {
        const meta = (e.metadata) ?? {};
        const pa = e.publishedAt;
        return {
            id: e.id, headline: e.headline, source: e.source ?? 'Unknown',
            sentiment: num(e.sentimentScore), severity: num(e.severityScore ?? 0),
            publishedAt: pa ? (pa instanceof Date ? pa.toISOString() : String(pa)) : e.createdAt.toISOString(),
            sectors: Array.isArray(meta.sectors) ? meta.sectors : [],
        };
    });

    const sectorMap: Record<string, number> = {};
    holdingsSummary.forEach(h => { sectorMap[h.sector] = (sectorMap[h.sector] ?? 0) + h.value; });
    const sectorAllocation = Object.entries(sectorMap)
        .map(([sector, value]) => ({ sector, value: Math.round(value * 100) / 100, weight: totalValue > 0 ? Math.round((value / totalValue) * 10000) / 100 : 0 }))
        .sort((a, b) => b.value - a.value);

    return sendSuccess(res, {
        userName: user?.name ?? null,
        joinedAt: user?.createdAt.toISOString() ?? null,
        totalValue: Math.round(totalValue * 100) / 100,
        totalReturn: Math.round(totalReturn * 100) / 100,
        cashBalance: Math.round(cashBalance * 100) / 100,
        holdingsCount: holdings.length,
        holdings: holdingsSummary.slice(0, 6),
        performanceData,
        lastSnapshotDate,
        sectorAllocation,
        portfolioState: stateInfo,
        riskProfile,
        riskToleranceScore: riskToleranceRaw,
        investmentHorizon: profile?.investmentHorizon ?? null,
        investmentGoal: profile?.investmentGoal ?? null,
        riskMetrics,
        hasRiskData: !!latestRisk,
        behavioral,
        goals: goalsWithProb,
        alerts: alertsSummary,
        unreadAlertsCount: unreadCount,
        events: eventsSummary,
    });
}));
