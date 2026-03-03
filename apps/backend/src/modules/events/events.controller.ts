import { Router, Request, Response } from 'express';
import { prisma } from '../../infrastructure/prisma/client';
import { authMiddleware, AuthRequest } from '../../core/middleware/auth.middleware';
import { asyncHandler, sendSuccess, sendCreated } from '../../core/utils';
import { BadRequestError } from '../../core/errors';

import { NewsIngestionService } from './news-ingestion.service';
import { SentimentService } from './sentiment.service';
import { EventClassifier } from './event-classifier';
import { SeverityScorer } from './severity-scorer';
import { ExposureMapper } from './exposure-mapper';
import { ShockSimulator } from './shock-simulator';
import { logger } from '../../infrastructure/logger/logger';
import { runProcessingPipeline } from './event.processing';

export const eventsController = Router();

// ─────────────────────────────────────────────────────────
// Services (singletons)
// ─────────────────────────────────────────────────────────

const ingestion = new NewsIngestionService(prisma);
const sentiment = new SentimentService();
const classifier = new EventClassifier();
const severityScorer = new SeverityScorer();
const exposureMapper = new ExposureMapper(prisma);
const shockSimulator = new ShockSimulator(prisma);

// All routes require authentication
eventsController.use(authMiddleware as any);

// ═══════════════════════════════════════════════════════
// GET /events — list processed events
// ═══════════════════════════════════════════════════════

eventsController.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const {
      severity,
      eventType,
      since,
      limit = '30',
      offset = '0',
    } = req.query as Record<string, string>;

    const where: Record<string, any> = { processed: true };

    if (severity) {
      const severities = Array.isArray(severity) ? severity : [severity];
      where.severity = { in: severities };
    }

    if (eventType) {
      const types = Array.isArray(eventType) ? eventType : [eventType];
      where.eventType = { in: types };
    }

    if (since) {
      where.publishedAt = { gte: new Date(since) };
    }

    const [events, total] = await Promise.all([
      prisma.newsEvent.findMany({
        where,
        orderBy: [
          { severity: 'asc' },
          { sentiment: 'desc' },
          { publishedAt: 'desc' }
        ],
        take: Math.min(Number(limit), 100),
        skip: Number(offset),
      }),
      prisma.newsEvent.count({ where }),
    ]);

    return sendSuccess(res, {
      events: events.map((e) => ({
        id: e.id,
        headline: e.headline,
        summary: e.summary,
        source: e.source,
        url: e.url,
        publishedAt: e.publishedAt.toISOString(),
        severity: e.severity,
        eventType: e.eventType,
        sentiment: e.sentiment ? Number(e.sentiment) : 0,
        sentimentLabel: e.sentimentLabel,
        affectedSectors: e.affectedSectors,
        affectedTickers: e.affectedTickers,
        processed: e.processed,
        createdAt: e.createdAt.toISOString(),
        updatedAt: e.updatedAt.toISOString(),
      })),
      total,
      limit: Number(limit),
      offset: Number(offset),
    });
  })
);

// ═══════════════════════════════════════════════════════
// GET /events/exposure — portfolio exposure
// ═══════════════════════════════════════════════════════

eventsController.get(
  '/exposure',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as AuthRequest).user.userId;
    const exposure = await exposureMapper.computeExposure(userId);
    return sendSuccess(res, { exposure });
  })
);

// ═══════════════════════════════════════════════════════
// POST /events/simulate — shock simulation
// ═══════════════════════════════════════════════════════

eventsController.post(
  '/simulate',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as AuthRequest).user.userId;
    const { eventId } = req.body;

    if (!eventId) {
      throw new BadRequestError('eventId is required');
    }

    const result = await shockSimulator.simulate(Number(eventId), userId);
    return sendSuccess(res, result);
  })
);

// ═══════════════════════════════════════════════════════
// POST /events/process — manual processing trigger
// ═══════════════════════════════════════════════════════

eventsController.post(
  '/process',
  asyncHandler(async (_req: Request, res: Response) => {
    const processed = await runProcessingPipeline();
    return sendSuccess(res, { processed });
  })
);

// ═══════════════════════════════════════════════════════
// POST /events/ingest — trigger ingestion
// ═══════════════════════════════════════════════════════

eventsController.post(
  '/ingest',
  asyncHandler(async (req: Request, res: Response) => {
    const { tickers, limit } = req.body ?? {};

    const fresh = await ingestion.ingestLatest({ tickers, limit });
    const processed = await runProcessingPipeline();

    return sendCreated(res, {
      ingested: fresh.length,
      processed,
    });
  })
);