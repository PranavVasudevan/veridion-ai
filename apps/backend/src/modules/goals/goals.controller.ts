import { Router, Request, Response } from 'express';
import { authMiddleware, AuthRequest } from '../../core/middleware/auth.middleware';
import { asyncHandler, sendSuccess, sendCreated } from '../../core/utils/index';
import { BadRequestError } from '../../core/errors';
import { goalsService } from './goals.service';
import { monteCarloService } from '../montecarlo/montecarlo.service';
import { prisma } from '../../infrastructure/prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export const goalsController = Router();

goalsController.use(authMiddleware as any);

// GET /goals
goalsController.get('/', asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as AuthRequest).user.userId;
    const goals = await goalsService.getGoals(userId);
    return sendSuccess(res, goals);
}));

// POST /goals
goalsController.post('/', asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as AuthRequest).user.userId;
    const { name, type, targetAmount, currentAmount, targetDate, monthlyContribution, priority } = req.body;

    if (!name || !targetAmount || !targetDate) {
        throw new BadRequestError('name, targetAmount, and targetDate are required');
    }

    const goal = await goalsService.createGoal(userId, {
        name,
        type: type || 'custom',
        targetAmount: Number(targetAmount),
        currentAmount: currentAmount ? Number(currentAmount) : 0,
        targetDate,
        monthlyContribution: monthlyContribution ? Number(monthlyContribution) : 0,
        priority: priority || 'medium',
    });

    return sendCreated(res, goal);
}));

// PUT /goals/:id
goalsController.put('/:id', asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as AuthRequest).user.userId;
    const goalId = parseInt(req.params.id as string);
    const updated = await goalsService.updateGoal(userId, goalId, req.body);
    return sendSuccess(res, updated);
}));

// DELETE /goals/:id
goalsController.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as AuthRequest).user.userId;
    const goalId = parseInt(req.params.id as string);
    const result = await goalsService.deleteGoal(userId, goalId);
    return sendSuccess(res, result);
}));

// POST /goals/:id/simulate
goalsController.post('/:id/simulate', asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as AuthRequest).user.userId;
    const goalId = parseInt(req.params.id as string);

    const goal = await prisma.financialGoal.findFirst({ where: { id: goalId, userId } });
    if (!goal) throw new BadRequestError('Goal not found or not accessible');

    // Ensure portfolio snapshot exists
    const snapshot = await prisma.portfolioSnapshot.findFirst({
        where: { userId },
        orderBy: { snapshotDate: 'desc' },
    });

    if (!snapshot) {
        const holdings = await prisma.holding.findMany({
            where: { userId },
            include: { asset: { include: { prices: { orderBy: { priceDate: 'desc' }, take: 1 } } } },
        });
        const totalValue = holdings.reduce((sum, h) => {
            const price = h.asset.prices[0]?.price?.toNumber() ?? 100;
            return sum + h.quantity.toNumber() * price;
        }, 0);

        if (totalValue > 0) {
            await prisma.portfolioSnapshot.create({
                data: {
                    userId,
                    snapshotDate: new Date(),
                    totalValue: new Decimal(totalValue),
                },
            });
        }
    }

    // Ensure risk metrics exist
    const riskMetrics = await prisma.riskMetricsHistory.findFirst({
        where: { userId },
        orderBy: { calculatedAt: 'desc' },
    });

    if (!riskMetrics) {
        await prisma.riskMetricsHistory.create({
            data: {
                userId,
                volatility: new Decimal(0.15),
                sharpeRatio: new Decimal(0.8),
                sortinoRatio: new Decimal(1.0),
                maxDrawdown: new Decimal(0.20),
                var95: new Decimal(0.05),
                calculatedAt: new Date(),
            },
        });
    }

    try {
        const result = await monteCarloService.runSimulation(userId, goalId);
        return sendSuccess(res, {
            goalId,
            probability: result.goalProbability ? Math.round(result.goalProbability.toNumber() * 100) : 50,
            medianProjection: result.medianProjection ? result.medianProjection.toNumber() : 0,
            worstCaseProjection: result.worstCaseProjection ? result.worstCaseProjection.toNumber() : 0,
            numberOfSimulations: result.numberOfSimulations,
        });
    } catch (err: any) {
        return sendSuccess(res, {
            goalId,
            probability: 50,
            medianProjection: goal.targetAmount.toNumber(),
            worstCaseProjection: goal.targetAmount.toNumber() * 0.6,
            numberOfSimulations: 0,
            error: err.message,
        });
    }
}));
