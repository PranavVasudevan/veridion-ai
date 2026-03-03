import { PrismaClient } from '@prisma/client';
import { SentimentService } from './sentiment.service';
import { EventClassifier } from './event-classifier';
import { SeverityScorer } from './severity-scorer';
import { logger } from '../../infrastructure/logger/logger';

export async function runProcessingPipeline(
  prisma: PrismaClient
): Promise<number> {
  const sentiment = new SentimentService();
  const classifier = new EventClassifier();
  const severityScorer = new SeverityScorer();

  const unprocessed = await prisma.newsEvent.findMany({
    where: { processed: false },
    take: 100,
  });

  if (!unprocessed.length) return 0;

  let count = 0;

  for (const event of unprocessed) {
    try {
      const sentimentResult = sentiment.scoreAggregate(
        [event.headline, event.summary],
        [0.6, 0.4]
      );

      const { eventType, affectedSectors } =
        classifier.classify(event.headline, event.summary);

      const { severity } = severityScorer.score({
        eventType,
        sentiment: sentimentResult,
        portfolioExposureFraction: 0.5,
        affectedSectorsCount: affectedSectors.length,
        tickersInPortfolio: (event.affectedTickers as string[]).length,
      });

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

      count++;
    } catch (err) {
      logger.error(
        { err, eventId: event.id },
        '[EventPipeline] Failed to process event'
      );
    }
  }

  logger.info({ count }, '[EventPipeline] Processing complete');
  return count;
}