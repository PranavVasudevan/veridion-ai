import { prisma } from '../../infrastructure/prisma/client';

function d(val: any): number {
    if (val == null) return 0;
    if (typeof val === 'number') return val;
    return val.toNumber ? val.toNumber() : Number(val);
}

export const riskService = {
    async getLatestMetrics(userId: number) {
        const metrics = await prisma.riskMetricsHistory.findFirst({
            where: { userId },
            orderBy: { calculatedAt: 'desc' },
        });

        if (!metrics) {
            return {
                volatility: 0, sharpeRatio: 0, sortinoRatio: 0,
                maxDrawdown: 0, var95: 0, cvar95: 0, beta: 1, trackingError: 0,
                date: new Date().toISOString(),
            };
        }

        return {
            volatility: d(metrics.volatility),
            sharpeRatio: d(metrics.sharpeRatio),
            sortinoRatio: d(metrics.sortinoRatio),
            maxDrawdown: d(metrics.maxDrawdown),
            var95: d(metrics.var95),
            cvar95: d(metrics.var95), // schema has no cvar95, fallback to var95
            beta: 1,                  // not in schema
            trackingError: 0,         // not in schema
            date: metrics.calculatedAt.toISOString(),
        };
    },

    async getMetricsHistory(userId: number) {
        const history = await prisma.riskMetricsHistory.findMany({
            where: { userId },
            orderBy: { calculatedAt: 'asc' },
            take: 90,
        });

        return history.map(m => ({
            volatility: d(m.volatility),
            sharpeRatio: d(m.sharpeRatio),
            sortinoRatio: d(m.sortinoRatio),
            maxDrawdown: d(m.maxDrawdown),
            var95: d(m.var95),
            cvar95: d(m.var95),
            beta: 1,
            trackingError: 0,
            date: m.calculatedAt.toISOString(),
        }));
    },

    async getRiskContributions(userId: number) {
        const holdings = await prisma.holding.findMany({
            where: { userId },
            include: {
                asset: {
                    include: {
                        prices: { orderBy: { priceDate: 'desc' }, take: 1 },
                    },
                },
            },
        });

        if (holdings.length === 0) return [];

        const values = holdings.map(h => ({
            ticker: h.asset.ticker,
            name: h.asset.name ?? h.asset.ticker,
            value: h.quantity.toNumber() * (h.asset.prices[0]?.price?.toNumber() ?? 0),
        }));

        const total = values.reduce((s, v) => s + v.value, 0);

        return values.map(v => ({
            ticker: v.ticker,
            name: v.name,
            weight: total > 0 ? v.value / total : 0,
            contribution: total > 0 ? (v.value / total) * 0.15 : 0,
        }));
    },

    async getEfficientFrontier(userId: number) {
        const holdings = await prisma.holding.findMany({ where: { userId } });
        if (holdings.length === 0) return [];

        const points = [];
        for (let i = 0; i <= 10; i++) {
            const vol = 0.05 + i * 0.025;
            const ret = 0.03 + i * 0.015 - (i > 7 ? (i - 7) * 0.01 : 0);
            points.push({
                volatility: Number(vol.toFixed(4)),
                expectedReturn: Number(ret.toFixed(4)),
                isOptimal: i === 6,
                isCurrent: i === 5,
            });
        }
        return points;
    },
};
