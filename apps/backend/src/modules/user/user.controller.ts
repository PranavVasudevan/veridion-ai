import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../../core/middleware/auth.middleware';
import { userService } from './user.service';
import { AppError } from '../../core/errors/AppError';

export async function userController(app: FastifyInstance) {
    app.addHook('preHandler', authMiddleware);

    /**
     * GET /user/profile
     * Returns full user info including financial profile.
     */
    app.get('/user/profile', async (request) => {
        const userId = request.currentUser!.userId;
        const profile = await userService.getProfile(userId);
        if (!profile) throw AppError.notFound('User not found');
        return profile;
    });

    /**
     * PUT /user/profile
     * Updates user name and/or financial profile fields.
     * Only sends fields that are being changed.
     */
    app.put<{
        Body: {
            name?: string;
            annualIncome?: number;
            totalSavings?: number;
            totalDebt?: number;
            monthlyExpenses?: number;
            riskTolerance?: number;
            investmentGoal?: string;
            investmentHorizon?: number;
            occupation?: string;
            country?: string;
            dateOfBirth?: string;
        };
    }>('/user/profile', async (request) => {
        const userId = request.currentUser!.userId;
        const updated = await userService.updateProfile(userId, request.body);
        return updated;
    });
}
