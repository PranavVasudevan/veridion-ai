import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "../../infrastructure/prisma/client";
import { NotFoundError, BadRequestError, ConflictError } from "../../core/errors";
import { cacheDel } from "../../infrastructure/cache/redis";
import { logger } from "../../infrastructure/logger/logger";

// ── Types ────────────────────────────────────────────

export interface CreateHoldingInput {
  ticker: string;
  quantity: number;
  avgCost?: number;
}

export interface UpdateHoldingInput {
  quantity?: number;
  avgCost?: number;
}

// ── Service ──────────────────────────────────────────

export async function getUserHoldings(userId: number) {
  const holdings = await prisma.holding.findMany({
    where: { userId },
    include: {
      asset: {
        select: {
          id: true,
          ticker: true,
          name: true,
          assetType: true,
          sector: true,
          country: true,
        },
      },
    },
    orderBy: { lastUpdated: "desc" },
  });

  return holdings.map((h) => ({
    id: h.id,
    asset: h.asset,
    quantity: Number(h.quantity),
    avgCost: h.avgCost ? Number(h.avgCost) : null,
    lastUpdated: h.lastUpdated,
  }));
}

export async function addHolding(userId: number, input: CreateHoldingInput) {
  // Find or create the asset by ticker
  let asset = await prisma.asset.findUnique({
    where: { ticker: input.ticker.toUpperCase().trim() },
  });

  if (!asset) {
    asset = await prisma.asset.create({
      data: { ticker: input.ticker.toUpperCase().trim() },
    });
    logger.info(`Auto-created asset: ${asset.ticker}`);
  }

  // Check for duplicate holding
  const existing = await prisma.holding.findUnique({
    where: {
      userId_assetId: { userId, assetId: asset.id },
    },
  });

  if (existing) {
    throw new ConflictError(`You already have a holding for ${asset.ticker}. Use PATCH to update.`);
  }

  if (input.quantity <= 0) {
    throw new BadRequestError("Quantity must be greater than 0");
  }

  const holding = await prisma.holding.create({
    data: {
      userId,
      assetId: asset.id,
      quantity: new Decimal(input.quantity),
      avgCost: input.avgCost ? new Decimal(input.avgCost) : null,
    },
    include: {
      asset: {
        select: { id: true, ticker: true, name: true, assetType: true, sector: true, country: true },
      },
    },
  });

  await cacheDel(`portfolio:${userId}:*`);

  return {
    id: holding.id,
    asset: holding.asset,
    quantity: Number(holding.quantity),
    avgCost: holding.avgCost ? Number(holding.avgCost) : null,
    lastUpdated: holding.lastUpdated,
  };
}

export async function updateHolding(userId: number, holdingId: number, input: UpdateHoldingInput) {
  const holding = await prisma.holding.findFirst({
    where: { id: holdingId, userId },
  });

  if (!holding) {
    throw new NotFoundError("Holding", holdingId);
  }

  if (input.quantity !== undefined && input.quantity <= 0) {
    throw new BadRequestError("Quantity must be greater than 0");
  }

  const updated = await prisma.holding.update({
    where: { id: holdingId },
    data: {
      quantity: input.quantity !== undefined ? new Decimal(input.quantity) : undefined,
      avgCost: input.avgCost !== undefined ? new Decimal(input.avgCost) : undefined,
      lastUpdated: new Date(),
    },
    include: {
      asset: {
        select: { id: true, ticker: true, name: true, assetType: true, sector: true, country: true },
      },
    },
  });

  await cacheDel(`portfolio:${userId}:*`);

  return {
    id: updated.id,
    asset: updated.asset,
    quantity: Number(updated.quantity),
    avgCost: updated.avgCost ? Number(updated.avgCost) : null,
    lastUpdated: updated.lastUpdated,
  };
}

export async function removeHolding(userId: number, holdingId: number) {
  const holding = await prisma.holding.findFirst({
    where: { id: holdingId, userId },
  });

  if (!holding) {
    throw new NotFoundError("Holding", holdingId);
  }

  await prisma.holding.delete({ where: { id: holdingId } });
  await cacheDel(`portfolio:${userId}:*`);

  return { deleted: true };
}
