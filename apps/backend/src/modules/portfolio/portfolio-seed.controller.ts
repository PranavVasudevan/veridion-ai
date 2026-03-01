import { Router, Request, Response } from 'express';
import { authMiddleware, AuthRequest } from '../../core/middleware/auth.middleware';
import { seedUserPortfolio } from './portfolio-seed.service';
import { asyncHandler, sendSuccess } from '../../core/utils/index';

export const portfolioSeedController = Router();

portfolioSeedController.use(authMiddleware as any);

portfolioSeedController.post('/portfolio/seed', asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as AuthRequest).user.userId;
    const result = await seedUserPortfolio(userId);
    return sendSuccess(res, result);
}));
