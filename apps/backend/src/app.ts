import Fastify, { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import cors from '@fastify/cors';
import { logger } from './infrastructure/logger/logger';
import { APP_CONSTANTS } from './config/constants';
import { AppError } from './core/errors/AppError';
import { registerRoutes } from './routes';

export async function buildApp() {
    const app = Fastify({
        logger: false, // we use our own pino instance
    });

    // ── CORS ──
    await app.register(cors, {
        origin: APP_CONSTANTS.CORS_ORIGIN,
        credentials: true,
    });

    // ── Global error handler ──
    app.setErrorHandler((error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
        const statusCode = (error as any).statusCode ?? 500;
        const message = error.message ?? 'Internal server error';

        if (statusCode >= 500) {
            logger.error({ err: error, url: request.url }, 'Server error');
        } else {
            logger.warn({ statusCode, message, url: request.url }, 'Client error');
        }

        reply.status(statusCode).send({
            statusCode,
            error: statusCode >= 500 ? 'Internal Server Error' : error.name ?? 'Error',
            message,
        });
    });

    // ── Health check ──
    app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

    // ── Register all routes ──
    await registerRoutes(app);

    return app;
}
