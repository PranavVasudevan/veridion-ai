import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "../../infrastructure/prisma/client";
import { NotFoundError } from "../../core/errors";
import { cacheGet, cacheSet } from "../../infrastructure/cache/redis";
import { PORTFOLIO_STATES } from "../../config/constants";
import { logger } from "../../infrastructure/logger/logger";

// ── Portfolio Summary ────────────────────────────────

export interface PortfolioSummary {
  totalValue: number;
  cashValue: number;
  holdingsCount: number;
  holdings: HoldingSummary[];
  allocationByAssetType: Record<string, number>;
  allocationBySector: Record<string, number>;
  currentState: string;
  healthIndex: number | null;
}

interface HoldingSummary {
  ticker: string;
  name: string | null;
  assetType: string | null;
  sector: string | null;
  quantity: number;
  avgCost: number | null;
  latestPrice: number | null;
  marketValue: number | null;
  weightPercent: number | null;
  unrealizedPnl: number | null;
}

export async function getPortfolioSummary(userId: number): Promise<PortfolioSummary> {
  const cacheKey = `portfolio:${userId}:summary`;
  const cached = await cacheGet<PortfolioSummary>(cacheKey);
  if (cached) return cached;

  // Get all holdings with latest price
  const holdings = await prisma.holding.findMany({
    where: { userId },
    include: {
      asset: {
        include: {
          prices: {
            orderBy: { priceDate: "desc" },
            take: 1,
          },
        },
      },
    },
  });

  // Get latest portfolio state
  const latestState = await prisma.portfolioState.findFirst({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });

  // Get latest snapshot for cash
  const latestSnapshot = await prisma.portfolioSnapshot.findFirst({
    where: { userId },
    orderBy: { snapshotDate: "desc" },
  });

  // Build per-holding summaries
  let totalValue = 0;
  const holdingSummaries: HoldingSummary[] = holdings.map((h) => {
    const qty = Number(h.quantity);
    const avgCost = h.avgCost ? Number(h.avgCost) : null;
    const latestPrice = h.asset.prices[0] ? Number(h.asset.prices[0].price) : null;
    const marketValue = latestPrice !== null ? qty * latestPrice : null;
    const unrealizedPnl = marketValue !== null && avgCost !== null ? marketValue - qty * avgCost : null;

    if (marketValue !== null) totalValue += marketValue;

    return {
      ticker: h.asset.ticker,
      name: h.asset.name,
      assetType: h.asset.assetType,
      sector: h.asset.sector,
      quantity: qty,
      avgCost,
      latestPrice,
      marketValue,
      weightPercent: null, // computed below
      unrealizedPnl,
    };
  });

  const cashValue = latestSnapshot?.cashValue ? Number(latestSnapshot.cashValue) : 0;
  totalValue += cashValue;

  // Compute weight percentages
  if (totalValue > 0) {
    for (const h of holdingSummaries) {
      if (h.marketValue !== null) {
        h.weightPercent = parseFloat(((h.marketValue / totalValue) * 100).toFixed(2));
      }
    }
  }

  // Allocation breakdowns
  const allocationByAssetType: Record<string, number> = {};
  const allocationBySector: Record<string, number> = {};

  for (const h of holdingSummaries) {
    if (h.marketValue !== null && totalValue > 0) {
      const typeKey = h.assetType || "Unknown";
      const sectorKey = h.sector || "Unknown";
      const weight = h.marketValue / totalValue;

      allocationByAssetType[typeKey] = (allocationByAssetType[typeKey] || 0) + weight;
      allocationBySector[sectorKey] = (allocationBySector[sectorKey] || 0) + weight;
    }
  }

  const summary: PortfolioSummary = {
    totalValue: parseFloat(totalValue.toFixed(2)),
    cashValue: parseFloat(cashValue.toFixed(2)),
    holdingsCount: holdings.length,
    holdings: holdingSummaries,
    allocationByAssetType,
    allocationBySector,
    currentState: latestState?.state || PORTFOLIO_STATES.HEALTHY,
    healthIndex: latestState?.healthIndex ? Number(latestState.healthIndex) : null,
  };

  await cacheSet(cacheKey, summary, 60); // 1 min cache
  return summary;
}

// ── Portfolio Snapshots (history) ────────────────────

export async function getPortfolioHistory(userId: number, days: number = 90) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const snapshots = await prisma.portfolioSnapshot.findMany({
    where: {
      userId,
      snapshotDate: { gte: since },
    },
    orderBy: { snapshotDate: "asc" },
  });

  return snapshots.map((s) => ({
    date: s.snapshotDate,
    totalValue: s.totalValue ? Number(s.totalValue) : null,
    cashValue: s.cashValue ? Number(s.cashValue) : null,
  }));
}

// ── Portfolio Returns ────────────────────────────────

export async function getPortfolioReturns(userId: number, days: number = 90) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const returns = await prisma.portfolioReturn.findMany({
    where: {
      userId,
      returnDate: { gte: since },
    },
    orderBy: { returnDate: "asc" },
  });

  return returns.map((r) => ({
    date: r.returnDate,
    dailyReturn: Number(r.dailyReturn),
  }));
}

// ── Create Portfolio Snapshot ────────────────────────

export async function createSnapshot(
  userId: number,
  data: { totalValue: number; cashValue?: number }
) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const snapshot = await prisma.portfolioSnapshot.create({
    data: {
      userId,
      snapshotDate: today,
      totalValue: new Decimal(data.totalValue),
      cashValue: data.cashValue ? new Decimal(data.cashValue) : null,
    },
  });

  return snapshot;
}
