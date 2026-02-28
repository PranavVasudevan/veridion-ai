import { prisma } from '../../infrastructure/prisma/client';
import { AppError } from '../../core/errors/AppError';
import { Decimal } from '@prisma/client/runtime/library';

// ── Helper: convert Prisma Decimal to plain number ──
function d(val: Decimal | null | undefined): number | null {
    if (val == null) return null;
    return val.toNumber();
}

// ══════════════════════════════════════════════════
// GET /portfolio  —  full holdings with valuations
// ══════════════════════════════════════════════════

export interface HoldingResponse {
    id: number;
    ticker: string;
    name: string;
    assetClass: string;
    sector: string;
    shares: number;
    avgCost: number | null;
    price: number;
    value: number;
    weight: number;
    change24h: number;
    unrealizedPnL: number;
    unrealizedPnLPercent: number;
}

export interface PortfolioResponse {
    totalValue: number;
    totalReturn: number;
    holdings: HoldingResponse[];
}

async function getPortfolio(userId: number): Promise<PortfolioResponse> {
    // 1. Get all holdings for user, include the asset
    const holdings = await prisma.holding.findMany({
        where: { userId },
        include: { asset: true },
    });

    if (holdings.length === 0) {
        return { totalValue: 0, totalReturn: 0, holdings: [] };
    }

    // 2. For each holding, fetch the latest 2 prices (for change24h calc)
    const enriched: {
        holding: typeof holdings[0];
        latestPrice: number;
        prevPrice: number;
        marketValue: number;
    }[] = [];

    for (const h of holdings) {
        const latestPrices = await prisma.assetPrice.findMany({
            where: { assetId: h.assetId },
            orderBy: { priceDate: 'desc' },
            take: 2,
        });

        const latestPrice = latestPrices[0]?.price.toNumber() ?? 0;
        const prevPrice = latestPrices[1]?.price.toNumber() ?? latestPrice;
        const quantity = h.quantity.toNumber();
        const marketValue = quantity * latestPrice;

        enriched.push({ holding: h, latestPrice, prevPrice, marketValue });
    }

    // 3. Total portfolio value + return
    const totalValue = enriched.reduce((sum, e) => sum + e.marketValue, 0);
    const totalCost = enriched.reduce((sum, e) => {
        const avgCost = d(e.holding.avgCost);
        return sum + (avgCost != null ? avgCost * e.holding.quantity.toNumber() : e.marketValue);
    }, 0);
    const totalReturn = totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0;

    // 4. Build response — matches frontend Holding interface exactly
    const holdingsResponse: HoldingResponse[] = enriched.map((e) => {
        const quantity = e.holding.quantity.toNumber();
        const avgCost = d(e.holding.avgCost);
        const weight = totalValue > 0 ? e.marketValue / totalValue : 0;
        const change24h = e.prevPrice > 0 ? ((e.latestPrice - e.prevPrice) / e.prevPrice) * 100 : 0;

        let unrealizedPnL = 0;
        let unrealizedPnLPercent = 0;

        if (avgCost !== null && avgCost > 0) {
            unrealizedPnL = (e.latestPrice - avgCost) * quantity;
            unrealizedPnLPercent = ((e.latestPrice - avgCost) / avgCost) * 100;
        }

        return {
            id: e.holding.id,
            ticker: e.holding.asset.ticker,
            name: e.holding.asset.name ?? e.holding.asset.ticker,
            assetClass: e.holding.asset.assetType ?? 'stock',
            sector: e.holding.asset.sector ?? 'Other',
            shares: quantity,
            avgCost,
            price: e.latestPrice,
            value: Math.round(e.marketValue * 100) / 100,
            weight: Math.round(weight * 10000) / 10000,
            change24h: Math.round(change24h * 100) / 100,
            unrealizedPnL: Math.round(unrealizedPnL * 100) / 100,
            unrealizedPnLPercent: Math.round(unrealizedPnLPercent * 100) / 100,
        };
    });

    return {
        totalValue: Math.round(totalValue * 100) / 100,
        totalReturn: Math.round(totalReturn * 100) / 100,
        holdings: holdingsResponse,
    };
}

// ══════════════════════════════════════════════════
// GET /portfolio/snapshot  —  historical value chart
// ══════════════════════════════════════════════════

export interface SnapshotResponse {
    date: string;              // "YYYY-MM-DD"
    totalValue: number;
    dailyReturn: number;
}

async function getSnapshots(userId: number): Promise<{ snapshots: SnapshotResponse[] }> {
    const rows = await prisma.portfolioSnapshot.findMany({
        where: { userId },
        orderBy: { snapshotDate: 'asc' },
    });

    const snapshots: SnapshotResponse[] = rows.map((r, i) => {
        const val = d(r.totalValue) ?? 0;
        const prevVal = i > 0 ? (d(rows[i - 1].totalValue) ?? val) : val;
        const dailyReturn = prevVal > 0 ? ((val - prevVal) / prevVal) * 100 : 0;

        return {
            date: r.snapshotDate.toISOString().split('T')[0],
            totalValue: val,
            dailyReturn: Math.round(dailyReturn * 100) / 100,
        };
    });

    return { snapshots };
}

// ══════════════════════════════════════════════════
// GET /portfolio/state  —  state machine + health
// ══════════════════════════════════════════════════

export interface PortfolioStateResponse {
    state: string;
    healthIndex: number;
    updatedAt: string;
}

async function getState(userId: number): Promise<PortfolioStateResponse> {
    const latest = await prisma.portfolioState.findFirst({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
    });

    if (!latest) {
        // Return default state for new users — NOT a 404
        return {
            state: 'New',
            healthIndex: 0,
            updatedAt: new Date().toISOString(),
        };
    }

    return {
        state: latest.state,
        healthIndex: latest.healthIndex?.toNumber() ?? 0,
        updatedAt: latest.updatedAt.toISOString(),
    };
}

// ── Public API ──
export const portfolioService = {
    getPortfolio,
    getSnapshots,
    getState,
};
