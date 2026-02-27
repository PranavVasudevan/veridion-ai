import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../../core/middleware/auth.middleware';
import { portfolioService } from './portfolio.service';

export async function portfolioController(app: FastifyInstance) {
    // ── All portfolio routes require auth ──
    app.addHook('preHandler', authMiddleware);

    /**
     * GET /portfolio
     * Returns total portfolio value and full holdings breakdown.
     */
    app.get('/portfolio', async (request) => {
        const userId = request.currentUser!.userId;
        return portfolioService.getPortfolio(userId);
    });

    /**
     * GET /portfolio/snapshot
     * Returns historical portfolio value snapshots for charting.
     */
    app.get('/portfolio/snapshot', async (request) => {
        const userId = request.currentUser!.userId;
        return portfolioService.getSnapshots(userId);
    });

    /**
     * GET /portfolio/state
     * Returns current portfolio state label and health index.
     * 404 if no state has been calculated yet (new user).
     */
    app.get('/portfolio/state', async (request) => {
        const userId = request.currentUser!.userId;
        return portfolioService.getState(userId);
    });
}
