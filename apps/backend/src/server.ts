import { env } from './config/env';
import { logger } from './infrastructure/logger/logger';
import { buildApp } from './app';

async function start() {
    try {
        const app = await buildApp();

        await app.listen({ port: env.PORT, host: '0.0.0.0' });

        logger.info(`🚀 Veridion AI backend running on http://localhost:${env.PORT}`);
        logger.info(`   Environment: ${env.NODE_ENV}`);
        logger.info(`   Health check: http://localhost:${env.PORT}/health`);
    } catch (err) {
        logger.error(err, 'Failed to start server');
        process.exit(1);
    }
}

start();
