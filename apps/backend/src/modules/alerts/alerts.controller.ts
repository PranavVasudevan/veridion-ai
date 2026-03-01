import { Router, Request, Response } from 'express';
import { authMiddleware, AuthRequest } from '../../core/middleware/auth.middleware';
import { asyncHandler, sendSuccess } from '../../core/utils/index';
import { alertsService } from './alerts.service';

export const alertsController = Router();

alertsController.use(authMiddleware as any);

// GET /alerts
alertsController.get('/', asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as AuthRequest).user.userId;
    const alerts = await alertsService.getAlerts(userId);
    return sendSuccess(res, alerts);
}));

// GET /alerts/unread-count
alertsController.get('/unread-count', asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as AuthRequest).user.userId;
    const count = await alertsService.getUnreadCount(userId);
    return sendSuccess(res, { count });
}));

// PATCH /alerts/:id/read
alertsController.patch('/:id/read', asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as AuthRequest).user.userId;
    const alertId = parseInt(req.params.id as string);
    const result = await alertsService.markRead(userId, alertId);
    return sendSuccess(res, result);
}));

// PATCH /alerts/read-all
alertsController.patch('/read-all', asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as AuthRequest).user.userId;
    const result = await alertsService.markAllRead(userId);
    return sendSuccess(res, result);
}));
