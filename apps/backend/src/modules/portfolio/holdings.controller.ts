import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../../core/middleware/auth.middleware';
import { prisma } from '../../infrastructure/prisma/client';
import { AppError } from '../../core/errors/AppError';
import { Prisma } from '@prisma/client';

export async function holdingsController(app: FastifyInstance) {
    app.addHook('preHandler', authMiddleware);

    /**
     * POST /portfolio/holdings
     * Add a new holding. Creates the Asset record if the ticker doesn't exist yet.
     */
    app.post<{
        Body: {
            ticker: string;
            name?: string;
            assetType?: string;
            sector?: string;
            country?: string;
            quantity: number;
            avgCost?: number;
        };
    }>('/portfolio/holdings', async (request, reply) => {
        const userId = request.currentUser!.userId;
        const { ticker, name, assetType, sector, country, quantity, avgCost } = request.body;

        if (!ticker || ticker.trim() === '') {
            throw AppError.badRequest('Ticker is required');
        }
        if (quantity == null || quantity <= 0) {
            throw AppError.badRequest('Quantity must be greater than 0');
        }

        // Upsert the asset (find by ticker or create)
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

        // Check if user already holds this asset
        const existing = await prisma.holding.findUnique({
            where: { userId_assetId: { userId, assetId: asset.id } },
        });

        if (existing) {
            // Merge: add quantity, recalculate weighted avg cost
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

            return reply.status(200).send({
                id: updated.id,
                assetId: updated.assetId,
                ticker: updated.asset.ticker,
                name: updated.asset.name,
                quantity: updated.quantity.toNumber(),
                avgCost: updated.avgCost?.toNumber() ?? null,
                merged: true,
            });
        }

        // Create new holding
        const holding = await prisma.holding.create({
            data: {
                userId,
                assetId: asset.id,
                quantity: new Prisma.Decimal(quantity),
                avgCost: avgCost != null ? new Prisma.Decimal(avgCost) : null,
            },
            include: { asset: true },
        });

        return reply.status(201).send({
            id: holding.id,
            assetId: holding.assetId,
            ticker: holding.asset.ticker,
            name: holding.asset.name,
            quantity: holding.quantity.toNumber(),
            avgCost: holding.avgCost?.toNumber() ?? null,
            merged: false,
        });
    });

    /**
     * PUT /portfolio/holdings/:id
     * Update quantity and/or avgCost of an existing holding.
     */
    app.put<{
        Params: { id: string };
        Body: { quantity?: number; avgCost?: number };
    }>('/portfolio/holdings/:id', async (request, reply) => {
        const userId = request.currentUser!.userId;
        const holdingId = parseInt(request.params.id, 10);

        if (isNaN(holdingId)) throw AppError.badRequest('Invalid holding ID');

        const holding = await prisma.holding.findFirst({
            where: { id: holdingId, userId },
        });
        if (!holding) throw AppError.notFound('Holding not found');

        const { quantity, avgCost } = request.body;
        if (quantity != null && quantity <= 0) {
            throw AppError.badRequest('Quantity must be greater than 0');
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

        return {
            id: updated.id,
            assetId: updated.assetId,
            ticker: updated.asset.ticker,
            name: updated.asset.name,
            quantity: updated.quantity.toNumber(),
            avgCost: updated.avgCost?.toNumber() ?? null,
        };
    });

    /**
     * DELETE /portfolio/holdings/:id
     * Remove a holding entirely.
     */
    app.delete<{ Params: { id: string } }>(
        '/portfolio/holdings/:id',
        async (request, reply) => {
            const userId = request.currentUser!.userId;
            const holdingId = parseInt(request.params.id, 10);

            if (isNaN(holdingId)) throw AppError.badRequest('Invalid holding ID');

            const holding = await prisma.holding.findFirst({
                where: { id: holdingId, userId },
            });
            if (!holding) throw AppError.notFound('Holding not found');

            await prisma.holding.delete({ where: { id: holdingId } });

            return reply.status(200).send({ deleted: true, id: holdingId });
        },
    );
}
