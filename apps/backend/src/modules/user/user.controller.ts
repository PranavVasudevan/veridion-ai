import { Router, Request, Response } from 'express';
import { authMiddleware, AuthRequest } from '../../core/middleware/auth.middleware';
import { userService } from './user.service';
import { AppError, NotFoundError } from '../../core/errors/AppError';
import { asyncHandler, sendSuccess } from '../../core/utils/index';

export const userController = Router();

userController.use(authMiddleware as any);

userController.get('/user/profile', asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as AuthRequest).user.userId;
    const profile = await userService.getProfile(userId);
    if (!profile) throw new NotFoundError('User not found');
    return sendSuccess(res, profile);
}));

userController.put('/user/profile', asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as AuthRequest).user.userId;
    const updated = await userService.updateProfile(userId, req.body);
    return sendSuccess(res, updated);
}));
