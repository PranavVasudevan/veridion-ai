import cron from 'node-cron';
import { prisma } from '../../infrastructure/prisma/client';
import { runNewsFetchJob } from './news-fetch-job';
import { logger } from '../../infrastructure/logger/logger';


export function startNewsScheduler() {
  // Run once immediately
  runNewsFetchJob(prisma).catch((err) =>
    logger.error({ err }, '[Scheduler] Initial run failed')
  );

  // Then schedule hourly
  cron.schedule('0 * * * *', async () => {
    logger.info('[Scheduler] Triggering News Fetch Job');
    await runNewsFetchJob(prisma);
  });

  logger.info('[Scheduler] News scheduler started');
}