import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../../core/middleware/auth.middleware';
import { seedUserPortfolio } from './portfolio-seed.service';

export async function portfolioSeedController(app: FastifyInstance) {
    app.addHook('preHandler', authMiddleware);

    /**
     * POST /portfolio/seed
     * Initializes sample portfolio data for the authenticated user.
     * Called after onboarding. Idempotent — skips if user already has holdings.
     */
    app.post('/portfolio/seed', async (request) => {
        const userId = request.currentUser!.userId;
        return seedUserPortfolio(userId);
    });
}
