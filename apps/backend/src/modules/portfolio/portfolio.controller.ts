import { Router, Request, Response } from 'express';
import { authMiddleware, AuthRequest } from '../../core/middleware/auth.middleware';
import { asyncHandler, sendSuccess, sendCreated } from '../../core/utils/index';
import { BadRequestError } from '../../core/errors';
import { portfolioService } from './portfolio.service';
import * as holdingsService from './holdings.service';
import * as allocationService from './allocation.service';
import * as stateMachine from './state-machine';
import { seedUserPortfolio } from './portfolio-seed.service';
import { Prisma } from '@prisma/client';
import { prisma } from '../../infrastructure/prisma/client';

export const portfolioController = Router();

// All portfolio routes require authentication
portfolioController.use(authMiddleware as any);

// ═══════════════════════════════════════════════════════
// PORTFOLIO SUMMARY & HISTORY
// ═══════════════════════════════════════════════════════

// GET /portfolio — full holdings with valuations
portfolioController.get('/', asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as AuthRequest).user.userId;
    const result = await portfolioService.getPortfolio(userId);
    return sendSuccess(res, result);
}));

// GET /portfolio/snapshot — historical chart data
portfolioController.get('/snapshot', asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as AuthRequest).user.userId;
    const result = await portfolioService.getSnapshots(userId);
    return sendSuccess(res, result);
}));

// GET /portfolio/state — portfolio state + health
portfolioController.get('/state', asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as AuthRequest).user.userId;
    const state = await stateMachine.getCurrentState(userId);
    return sendSuccess(res, state);
}));

// GET /portfolio/allocation
portfolioController.get('/allocation', asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as AuthRequest).user.userId;
    const allocation = await allocationService.getAllocation(userId);
    return sendSuccess(res, allocation);
}));

// ═══════════════════════════════════════════════════════
// HOLDINGS CRUD (all user-scoped)
// ═══════════════════════════════════════════════════════

// GET /portfolio/holdings
portfolioController.get('/holdings', asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as AuthRequest).user.userId;
    const holdings = await holdingsService.getUserHoldings(userId);
    return sendSuccess(res, holdings);
}));

// POST /portfolio/holdings
portfolioController.post('/holdings', asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as AuthRequest).user.userId;
    const { ticker, quantity, avgCost, name, assetType, sector } = req.body;

    if (!ticker || quantity === undefined) {
        throw new BadRequestError('ticker and quantity are required');
    }

    // Find or create asset (shared, but holdings are user-scoped)
    let asset = await prisma.asset.findUnique({ where: { ticker: ticker.toUpperCase() } });
    if (!asset) {
        asset = await prisma.asset.create({
            data: {
                ticker: ticker.toUpperCase(),
                name: name ?? null,
                assetType: assetType ?? 'stock',
                sector: sector ?? null,
            },
        });
    }

    const holding = await holdingsService.addHolding(userId, {
        ticker: ticker.toUpperCase(),
        quantity: Number(quantity),
        avgCost: avgCost !== undefined ? Number(avgCost) : undefined,
    });

    return sendCreated(res, holding);
}));

// PATCH /portfolio/holdings/:id
portfolioController.patch('/holdings/:id', asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as AuthRequest).user.userId;
    const holdingId = parseInt(req.params.id as string);
    const { quantity, avgCost } = req.body;

    const updated = await holdingsService.updateHolding(userId, holdingId, {
        quantity: quantity !== undefined ? Number(quantity) : undefined,
        avgCost: avgCost !== undefined ? Number(avgCost) : undefined,
    });

    return sendSuccess(res, updated);
}));

// PUT /portfolio/holdings/:id (alias for PATCH)
portfolioController.put('/holdings/:id', asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as AuthRequest).user.userId;
    const holdingId = parseInt(req.params.id as string);
    const { quantity, avgCost } = req.body;

    const updated = await holdingsService.updateHolding(userId, holdingId, {
        quantity: quantity !== undefined ? Number(quantity) : undefined,
        avgCost: avgCost !== undefined ? Number(avgCost) : undefined,
    });

    return sendSuccess(res, updated);
}));

// DELETE /portfolio/holdings/:id
portfolioController.delete('/holdings/:id', asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as AuthRequest).user.userId;
    const holdingId = parseInt(req.params.id as string);
    const result = await holdingsService.removeHolding(userId, holdingId);
    return sendSuccess(res, result);
}));

// ═══════════════════════════════════════════════════════
// SEED (for onboarding — creates demo holdings per user)
// ═══════════════════════════════════════════════════════

portfolioController.post('/seed', asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as AuthRequest).user.userId;
    const result = await seedUserPortfolio(userId);
    return sendSuccess(res, result);
}));
