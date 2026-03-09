import { prisma } from '../../infrastructure/prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { BadRequestError } from '../../core/errors';

export async function executeBuy(userId: number, input: {
  ticker: string;
  quantity: number;
  price: number;
}) {

  return prisma.$transaction(async (tx) => {

    const cost = input.quantity * input.price;

    const wallet = await tx.wallet.findUnique({
      where: { userId }
    });

    if (!wallet || wallet.balance.toNumber() < cost) {
      throw new BadRequestError("Insufficient wallet balance");
    }

    // Deduct cash
    await tx.wallet.update({
      where: { userId },
      data: {
        balance: wallet.balance.minus(cost)
      }
    });

    let asset = await tx.asset.findUnique({
      where: { ticker: input.ticker.toUpperCase() }
    });

    if (!asset) {
      asset = await tx.asset.create({
        data: {
          ticker: input.ticker.toUpperCase(),
          name: input.ticker,
          assetType: "stock"
        }
      });
    }

    const existing = await tx.holding.findUnique({
      where: {
        userId_assetId: {
          userId,
          assetId: asset.id
        }
      }
    });

    if (existing) {

      const oldQty = existing.quantity.toNumber();
      const oldAvg = existing.avgCost?.toNumber() ?? 0;

      const newQty = oldQty + input.quantity;

      const newAvgCost =
        ((oldQty * oldAvg) + (input.quantity * input.price)) / newQty;

      await tx.holding.update({
        where: { id: existing.id },
        data: {
          quantity: new Decimal(newQty),
          avgCost: new Decimal(newAvgCost),
          lastUpdated: new Date()
        }
      });

    } else {

      await tx.holding.create({
        data: {
          userId,
          assetId: asset.id,
          quantity: new Decimal(input.quantity),
          avgCost: new Decimal(input.price)
        }
      });

    }

    const total = input.quantity * input.price;

    await tx.trade.create({
      data: {
        userId,
        assetId: asset.id,
        side: "BUY",
        quantity: new Decimal(input.quantity),
        price: new Decimal(input.price),
        total: new Decimal(total)
      }
    });

    return { success: true };

  });

}

export async function executeSell(userId: number, input: {
  holdingId: number;
  quantity: number;
  price: number;
}) {

  return prisma.$transaction(async (tx) => {

    const holding = await tx.holding.findFirst({
      where: {
        id: input.holdingId,
        userId
      }
    });

    if (!holding) {
      throw new BadRequestError("Holding not found");
    }

    if (holding.quantity.toNumber() < input.quantity) {
      throw new BadRequestError("Not enough shares to sell");
    }

    const proceeds = input.quantity * input.price;

    // Update holding
    const remaining = holding.quantity.toNumber() - input.quantity;

    if (remaining === 0) {

      await tx.holding.delete({
        where: { id: holding.id }
      });

    } else {

      await tx.holding.update({
        where: { id: holding.id },
        data: {
          quantity: new Decimal(remaining)
        }
      });

    }

    // Add cash
    await tx.wallet.update({
      where: { userId },
      data: {
        balance: {
          increment: proceeds
        }
      }
    });

    const total = input.quantity * input.price;
    // Record trade
    await tx.trade.create({
      data: {
        userId,
        assetId: holding.assetId,
        side: "SELL",
        quantity: new Decimal(input.quantity),
        price: new Decimal(input.price),
        total: new Decimal(total)
      }
    });

    return { success: true };

  });

}