import { PrismaClient } from '@prisma/client';
import { logger } from '../../infrastructure/logger/logger';
import { NewsIngestionService } from '../../modules/events/news-ingestion.service';
import { runProcessingPipeline } from '../../modules/events/event.processing';

export async function runNewsFetchJob(prisma: PrismaClient): Promise<void> {
  logger.info('[NewsFetchJob] Starting');

  try {
    // 1. Pull tickers from holdings via Asset relation
    const holdings = await prisma.holding.findMany({
      select: {
        asset: {
          select: { ticker: true },
        },
      },
    });

    const tickers = [
      ...new Set(holdings.map((h) => h.asset.ticker)),
    ];

    if (!tickers.length) {
      logger.warn('[NewsFetchJob] No holdings found — skipping');
      return;
    }

    const ingestionService = new NewsIngestionService(prisma);
    const fresh = await ingestionService.ingestLatest({
      tickers,
      limit: 50,
    });

    logger.info({ count: fresh.length }, '[NewsFetchJob] Articles ingested');

    const processed = await runProcessingPipeline(prisma);

    logger.info({ processed }, '[NewsFetchJob] Pipeline complete');
  } catch (err) {
    logger.error({ err }, '[NewsFetchJob] Job failed');
  }
}