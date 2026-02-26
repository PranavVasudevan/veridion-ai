import { FastifyInstance } from 'fastify';
import { authController } from './modules/auth/auth.controller';

/**
 * Central route registration.
 * New module controllers are added here as they are built in later phases.
 */
export async function registerRoutes(app: FastifyInstance) {
    // Phase 1: Auth
    await app.register(authController);

    // Phase 2: Portfolio  (uncomment when built)
    // await app.register(portfolioController);

    // Phase 3: Risk / Alerts / Behavioral  (uncomment when built)
    // await app.register(riskController);
    // await app.register(alertsController);
    // await app.register(behavioralController);

    // Phase 4: Optimization  (uncomment when built)
    // await app.register(optimizationController);
}
