import { FastifyInstance } from 'fastify';
import { authController } from './modules/auth/auth.controller';
import { portfolioController } from './modules/portfolio/portfolio.controller';
import { holdingsController } from './modules/portfolio/holdings.controller';
import { portfolioSeedController } from './modules/portfolio/portfolio-seed.controller';
import { riskController } from './modules/risk/risk.controller';
import { alertsController } from './modules/alerts/alerts.controller';
import { behavioralController } from './modules/behavioral/behavioral.controller';
import { optimizationController } from './modules/optimization/optimization.controller';
import { userController } from './modules/user/user.controller';
import { goalsController } from './modules/goals/goals.controller';
import { eventsController } from './modules/events/events.controller';

/**
 * Central route registration — all modules active.
 */
export async function registerRoutes(app: FastifyInstance) {
    // Auth
    await app.register(authController);

    // Portfolio + Holdings CRUD + Seed
    await app.register(portfolioController);
    await app.register(holdingsController);
    await app.register(portfolioSeedController);

    // Risk / Alerts / Behavioral
    await app.register(riskController);
    await app.register(alertsController);
    await app.register(behavioralController);

    // Optimization
    await app.register(optimizationController);

    // User Profile
    await app.register(userController);

    // Goals
    await app.register(goalsController);

    // Events
    await app.register(eventsController);
}
