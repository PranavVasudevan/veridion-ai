import { Router, Request, Response } from 'express';
import { authMiddleware, AuthRequest } from '../../core/middleware/auth.middleware';
import { asyncHandler, sendSuccess } from '../../core/utils/index';
import { riskService } from './risk.service';

export const riskController = Router();

riskController.use(authMiddleware as any);

// GET /risk/metrics
riskController.get('/metrics', asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as AuthRequest).user.userId;
    const metrics = await riskService.getLatestMetrics(userId);
    return sendSuccess(res, metrics);
}));

// GET /risk/history
riskController.get('/history', asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as AuthRequest).user.userId;
    const history = await riskService.getMetricsHistory(userId);
    return sendSuccess(res, history);
}));

// GET /risk/contributions
riskController.get('/contributions', asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as AuthRequest).user.userId;
    const contributions = await riskService.getRiskContributions(userId);
    return sendSuccess(res, contributions);
}));

// GET /risk/frontier
riskController.get('/frontier', asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as AuthRequest).user.userId;
    const frontier = await riskService.getEfficientFrontier(userId);
    return sendSuccess(res, frontier);
}));

// GET /risk/covariance — returns a simple covariance matrix for the user's holdings
riskController.get('/covariance', asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as AuthRequest).user.userId;
    // Return a placeholder covariance structure based on holdings
    const holdings = await (await import('../../infrastructure/prisma/client')).prisma.holding.findMany({
        where: { userId },
        include: { asset: true },
    });
    const tickers = holdings.map(h => h.asset.ticker);
    // Build a simple identity-like covariance matrix
    const matrix: number[][] = tickers.map((_, i) =>
        tickers.map((_, j) => i === j ? 0.04 : 0.01)
    );
    return sendSuccess(res, { tickers, matrix });
}));
