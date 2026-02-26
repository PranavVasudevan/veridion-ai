import { prisma } from "../../infrastructure/prisma/client";
import { NotFoundError } from "../../core/errors";

export interface AllocationView {
  assetId: number;
  ticker: string;
  name: string | null;
  currentWeight: number;
  targetWeight: number | null;
  deviation: number | null;
}

/**
 * Computes current allocation weights based on holdings + latest prices,
 * and compares with latest optimization run (if any).
 */
export async function getAllocation(userId: number): Promise<AllocationView[]> {
  // Get holdings with latest prices
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

  if (holdings.length === 0) return [];

  // Compute market values
  const marketValues = holdings.map((h) => {
    const price = h.asset.prices[0] ? Number(h.asset.prices[0].price) : 0;
    return {
      assetId: h.assetId,
      ticker: h.asset.ticker,
      name: h.asset.name,
      marketValue: Number(h.quantity) * price,
    };
  });

  const totalValue = marketValues.reduce((sum, mv) => sum + mv.marketValue, 0);

  // Get latest optimization run target weights
  const latestOptRun = await prisma.optimizationRun.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { allocations: true },
  });

  const targetMap = new Map<number, number>();
  if (latestOptRun) {
    for (const alloc of latestOptRun.allocations) {
      targetMap.set(alloc.assetId, Number(alloc.weight));
    }
  }

  // Build allocation view
  return marketValues.map((mv) => {
    const currentWeight = totalValue > 0 ? mv.marketValue / totalValue : 0;
    const targetWeight = targetMap.get(mv.assetId) ?? null;
    const deviation = targetWeight !== null ? currentWeight - targetWeight : null;

    return {
      assetId: mv.assetId,
      ticker: mv.ticker,
      name: mv.name,
      currentWeight: parseFloat(currentWeight.toFixed(6)),
      targetWeight: targetWeight !== null ? parseFloat(targetWeight.toFixed(6)) : null,
      deviation: deviation !== null ? parseFloat(deviation.toFixed(6)) : null,
    };
  });
}
