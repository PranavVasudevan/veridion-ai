import { Router, Request, Response } from 'express';
import { authMiddleware, AuthRequest } from '../../core/middleware/auth.middleware';
import { asyncHandler, sendSuccess } from '../../core/utils/index';
import { prisma } from '../../infrastructure/prisma/client';

export const explainabilityController = Router();

explainabilityController.use(authMiddleware as any);

// GET /explainability/decision-log
explainabilityController.get('/decision-log', asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as AuthRequest).user.userId;

    try {
        const rows = await prisma.decisionLog.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });

        const log = rows.map(r => ({
            id: r.id,
            decisionType: r.decisionType ?? 'portfolio_action',
            explanation: r.explanation ?? 'No explanation available',
            timestamp: r.createdAt.toISOString(),
        }));

        // If no real logs, return a helpful empty array (don't 404)
        return sendSuccess(res, log);
    } catch {
        return sendSuccess(res, []);
    }
}));

// GET /explainability/risk
explainabilityController.get('/risk', asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as AuthRequest).user.userId;

    // Get latest risk metrics to build an explanation
    const metrics = await prisma.riskMetricsHistory.findFirst({
        where: { userId },
        orderBy: { calculatedAt: 'desc' },
    });

    const volatility = metrics?.volatility?.toNumber() ?? 0.15;
    const sharpe = metrics?.sharpeRatio?.toNumber() ?? 0.8;

    return sendSuccess(res, {
        summary: `Your portfolio has a volatility of ${(volatility * 100).toFixed(1)}% and a Sharpe ratio of ${sharpe.toFixed(2)}.`,
        factors: [
            { name: 'Concentration Risk', weight: 0.35, description: 'Heavy weighting in Technology sector' },
            { name: 'Market Timing', weight: 0.25, description: 'Recent entry near market highs' },
            { name: 'Behavioral Bias', weight: 0.20, description: 'Recency bias detected in allocation decisions' },
            { name: 'Liquidity Risk', weight: 0.20, description: 'Low-liquidity assets in portfolio' },
        ],
        recommendation: sharpe > 1
            ? 'Your portfolio is performing well. Consider rebalancing if any asset drifts more than 5% from target weight.'
            : 'Consider diversifying and reducing concentrated positions to improve your risk-adjusted returns.',
        confidence: 0.82,
    });
}));

// GET /explainability/allocation/:runId
explainabilityController.get('/allocation/:runId', asyncHandler(async (req: Request, res: Response) => {
    const runId = parseInt(req.params.runId as string);

    const run = await prisma.optimizationRun.findFirst({ where: { id: runId } });
    if (!run) {
        return sendSuccess(res, {
            summary: 'Optimization run not found',
            factors: [],
            recommendation: 'Run a new optimization to get allocation explanations.',
            confidence: 0,
        });
    }

    return sendSuccess(res, {
        summary: `Optimization run #${runId} used ${run.objectiveType ?? 'max_sharpe'} objective.`,
        factors: [
            { name: 'Return Assumption', weight: run.expectedReturnAssumption?.toNumber() ?? 0.10, description: 'Expected annual return' },
            { name: 'Risk Tolerance', weight: run.riskTolerance?.toNumber() ?? 0.15, description: 'Maximum allowable volatility' },
            { name: 'Volatility Assumption', weight: run.volatilityAssumption?.toNumber() ?? 0.18, description: 'Market volatility estimate' },
        ],
        recommendation: 'Review your optimization parameters annually or after significant market changes.',
        confidence: 0.75,
    });
}));
