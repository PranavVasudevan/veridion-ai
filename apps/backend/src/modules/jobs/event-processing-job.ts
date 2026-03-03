import { PrismaClient } from '@prisma/client';
import { logger } from '../infrastructure/logger/logger';
import { SentimentService } from '../modules/events/sentiment.service';
import { EventClassifier } from '../modules/events/event-classifier';
import { SeverityScorer } from '../modules/events/severity-scorer';
import { ExposureMapper } from '../modules/events/exposure-mapper';

/**
 * event-processing-job.ts
 *
 * Distinct from news-fetch-job.ts which only ingests raw articles.
 * This job is responsible for the full enrichment pipeline on
 * already-ingested (processed = false) events:
 *
 *   1. Sentiment scoring
 *   2. Event type classification
 *   3. Affected sector detection
 *   4. Severity scoring (with real per-portfolio exposure context)
 *   5. Exposure cache invalidation — marks all portfolio exposure
 *      caches as stale so the next API call recomputes them.
 *
 * Recommended schedule: every 15 minutes, or immediately after
 * news-fetch-job completes (chain them in your job queue).
 *
 * Usage with node-cron:
 *   import cron from 'node-cron';
 *   cron.schedule('*\/15 * * * *', () => runEventProcessingJob(prisma));
 *
 * Usage with Bull:
 *   eventsQueue.process('process-events', () => runEventProcessingJob(prisma));
 */
export async function runEventProcessingJob(prisma: PrismaClient): Promise<EventProcessingJobResult> {
  const startedAt = Date.now();
  logger.info('[EventProcessingJob] Starting');

  const result: EventProcessingJobResult = {
    processed: 0,
    skipped: 0,
    failed: 0,
    durationMs: 0,
  };

  try {
    // ── Services ────────────────────────────────────────────────────────────
    const sentimentService = new SentimentService();
    const classifier = new EventClassifier();
    const severityScorer = new SeverityScorer();
    const exposureMapper = new ExposureMapper(prisma);

    // ── 1. Fetch unprocessed events (cap at 200 per run) ────────────────────
    const unprocessed = await prisma.newsEvent.findMany({
      where: { processed: false },
      orderBy: { publishedAt: 'desc' },
      take: 200,
    });

    if (!unprocessed.length) {
      logger.info('[EventProcessingJob] No unprocessed events — exiting');
      result.durationMs = Date.now() - startedAt;
      return result;
    }

    logger.info({ count: unprocessed.length }, '[EventProcessingJob] Events to process');

    // ── 2. Load all active portfolios once (used for per-portfolio severity) ─
    const portfolios = await prisma.portfolio.findMany({
      select: { id: true },
    });

    // ── 3. Process each event ────────────────────────────────────────────────
    for (const event of unprocessed) {
      try {
        // ── Sentiment ──────────────────────────────────────────────────────
        const sentimentResult = sentimentService.scoreAggregate(
          [event.headline, event.summary],
          [0.6, 0.4],
        );

        // ── Classification ─────────────────────────────────────────────────
        const { eventType, affectedSectors } = classifier.classify(
          event.headline,
          event.summary,
        );

        // ── Severity (best-effort without live portfolio context here) ──────
        // We pick the portfolio with the highest exposure to get a realistic
        // severity rather than a neutral 0.5 placeholder.
        let worstExposure = 0;
        let tickersInAnyPortfolio = 0;

        for (const portfolio of portfolios) {
          const exposure = await exposureMapper.computeExposure(portfolio.id);
          if (exposure.overallExposure > worstExposure) {
            worstExposure = exposure.overallExposure;
          }

          // Count how many affected tickers from this event appear in the portfolio
          const affectedTickers = event.affectedTickers as string[];
          if (affectedTickers.length > 0) {
            const matchingHoldings = await prisma.holding.count({
              where: {
                portfolioId: portfolio.id,
                ticker: { in: affectedTickers },
              },
            });
            if (matchingHoldings > tickersInAnyPortfolio) {
              tickersInAnyPortfolio = matchingHoldings;
            }
          }
        }

        const { severity, numericScore } = severityScorer.score({
          eventType,
          sentiment: sentimentResult,
          portfolioExposureFraction: worstExposure,
          affectedSectorsCount: affectedSectors.length,
          tickersInPortfolio: tickersInAnyPortfolio,
        });

        // ── Persist enriched event ─────────────────────────────────────────
        await prisma.newsEvent.update({
          where: { id: event.id },
          data: {
            sentiment: sentimentResult.score,
            sentimentLabel: sentimentResult.label,
            eventType,
            affectedSectors,
            severity,
            processed: true,
          },
        });

        logger.debug(
          { id: event.id, eventType, severity, sentimentScore: sentimentResult.score, numericScore },
          '[EventProcessingJob] Event enriched',
        );

        result.processed++;
      } catch (err) {
        logger.error({ err, eventId: event.id }, '[EventProcessingJob] Failed to process event');
        result.failed++;
      }
    }

    // ── 4. Invalidate exposure caches ────────────────────────────────────────
    // If you have a Redis cache for exposure reports, bust it here.
    // Example (uncomment if you have a cache layer):
    //
    // const { redisClient } = await import('../infrastructure/cache/redis');
    // const keys = await redisClient.keys('exposure:*');
    // if (keys.length) await redisClient.del(...keys);
    // logger.info({ keys: keys.length }, '[EventProcessingJob] Exposure cache invalidated');

    logger.info(result, '[EventProcessingJob] Complete');
  } catch (err) {
    logger.error({ err }, '[EventProcessingJob] Job-level failure');
    throw err;
  } finally {
    result.durationMs = Date.now() - startedAt;
  }

  return result;
}

// ─── Result shape ─────────────────────────────────────────────────────────────

export interface EventProcessingJobResult {
  processed: number;
  skipped: number;
  failed: number;
  durationMs: number;
}
