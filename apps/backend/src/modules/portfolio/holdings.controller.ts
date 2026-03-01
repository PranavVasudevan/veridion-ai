import { Router, Request, Response } from 'express';
import { authMiddleware, AuthRequest } from '../../core/middleware/auth.middleware';
import { prisma } from '../../infrastructure/prisma/client';
import { AppError, NotFoundError, BadRequestError } from '../../core/errors/AppError';
import { Prisma } from '@prisma/client';
import { asyncHandler, sendSuccess, sendCreated } from '../../core/utils/index';

export const holdingsController = Router();

holdingsController.use(authMiddleware as any);

holdingsController.post('/portfolio/holdings', asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as AuthRequest).user.userId;
    const { ticker, name, assetType, sector, country, quantity, avgCost } = req.body;

    if (!ticker || ticker.trim() === '') {
        throw new BadRequestError('Ticker is required');
    }
    if (quantity == null || quantity <= 0) {
        throw new BadRequestError('Quantity must be greater than 0');
    }

    let asset = await prisma.asset.findUnique({ where: { ticker: ticker.toUpperCase() } });
    if (!asset) {
        asset = await prisma.asset.create({
            data: {
                ticker: ticker.toUpperCase(),
                name: name ?? null,
                assetType: assetType ?? null,
                sector: sector ?? null,
                country: country ?? null,
            },
        });
    }

    const existing = await prisma.holding.findUnique({
        where: { userId_assetId: { userId, assetId: asset.id } },
    });

    if (existing) {
        const oldQty = existing.quantity.toNumber();
        const oldCost = existing.avgCost?.toNumber() ?? 0;
        const newQty = oldQty + quantity;
        const newAvgCost =
            avgCost != null
                ? (oldCost * oldQty + avgCost * quantity) / newQty
                : oldCost;

        const updated = await prisma.holding.update({
            where: { id: existing.id },
            data: {
                quantity: new Prisma.Decimal(newQty),
                avgCost: new Prisma.Decimal(Math.round(newAvgCost * 100) / 100),
                lastUpdated: new Date(),
            },
            include: { asset: true },
        });

        return sendSuccess(res, {
            id: updated.id,
            assetId: updated.assetId,
            ticker: updated.asset.ticker,
            name: updated.asset.name,
            quantity: updated.quantity.toNumber(),
            avgCost: updated.avgCost?.toNumber() ?? null,
            merged: true,
        });
    }

    const holding = await prisma.holding.create({
        data: {
            userId,
            assetId: asset.id,
            quantity: new Prisma.Decimal(quantity),
            avgCost: avgCost != null ? new Prisma.Decimal(avgCost) : null,
        },
        include: { asset: true },
    });

    return sendCreated(res, {
        id: holding.id,
        assetId: holding.assetId,
        ticker: holding.asset.ticker,
        name: holding.asset.name,
        quantity: holding.quantity.toNumber(),
        avgCost: holding.avgCost?.toNumber() ?? null,
        merged: false,
    });
}));

holdingsController.put('/portfolio/holdings/:id', asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as AuthRequest).user.userId;
    const holdingId = parseInt(req.params.id as string, 10);

    if (isNaN(holdingId)) throw new BadRequestError('Invalid holding ID');

    const holding = await prisma.holding.findFirst({
        where: { id: holdingId, userId },
    });
    if (!holding) throw new NotFoundError('Holding not found');

    const { quantity, avgCost } = req.body;
    if (quantity != null && quantity <= 0) {
        throw new BadRequestError('Quantity must be greater than 0');
    }

    const updated = await prisma.holding.update({
        where: { id: holdingId },
        data: {
            ...(quantity != null && { quantity: new Prisma.Decimal(quantity) }),
            ...(avgCost != null && { avgCost: new Prisma.Decimal(avgCost) }),
            lastUpdated: new Date(),
        },
        include: { asset: true },
    });

    return sendSuccess(res, {
        id: updated.id,
        assetId: updated.assetId,
        ticker: updated.asset.ticker,
        name: updated.asset.name,
        quantity: updated.quantity.toNumber(),
        avgCost: updated.avgCost?.toNumber() ?? null,
    });
}));

holdingsController.delete('/portfolio/holdings/:id', asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as AuthRequest).user.userId;
    const holdingId = parseInt(req.params.id as string, 10);

    if (isNaN(holdingId)) throw new BadRequestError('Invalid holding ID');

    const holding = await prisma.holding.findFirst({
        where: { id: holdingId, userId },
    });
    if (!holding) throw new NotFoundError('Holding not found');

    await prisma.holding.delete({ where: { id: holdingId } });

    return sendSuccess(res, { deleted: true, id: holdingId });
}));
