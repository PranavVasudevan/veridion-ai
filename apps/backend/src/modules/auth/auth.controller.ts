import { Router, Request, Response } from 'express';
import { authService } from './auth.service';
import { asyncHandler, sendCreated, sendSuccess } from '../../core/utils/index';
import { AppError, BadRequestError } from '../../core/errors/AppError';

export const authController = Router();

authController.post('/auth/register', asyncHandler(async (req: Request, res: Response) => {
    const { email, password, name } = req.body;

    if (!email || !password) {
        throw new BadRequestError('Email and password are required');
    }
    if (password.length < 6) {
        throw new BadRequestError('Password must be at least 6 characters');
    }

    const result = await authService.register({ email, password, name });
    return sendCreated(res, result);
}));

authController.post('/auth/login', asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new BadRequestError('Email and password are required');
    }

    const result = await authService.login({ email, password });
    return sendSuccess(res, result);
}));

authController.post('/auth/google', asyncHandler(async (req: Request, res: Response) => {
    const { code, idToken } = req.body;

    if (!code && !idToken) {
        throw new BadRequestError('Google authorization code or ID token is required');
    }

    if (code) {
        const result = await authService.googleLogin(code, true);
        return sendSuccess(res, result);
    } else {
        const result = await authService.googleLogin(idToken!, false);
        return sendSuccess(res, result);
    }
}));
