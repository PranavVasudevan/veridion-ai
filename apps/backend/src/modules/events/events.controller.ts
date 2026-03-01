import { Router, Request, Response } from 'express';
import { authMiddleware, AuthRequest } from '../../core/middleware/auth.middleware';
import { asyncHandler, sendSuccess } from '../../core/utils/index';
import { prisma } from '../../infrastructure/prisma/client';

export const eventsController = Router();

eventsController.use(authMiddleware as any);

// GET /events
eventsController.get('/', asyncHandler(async (req: Request, res: Response) => {
    let events: any[] = [];
    try {
        events = await prisma.newsEvent.findMany({
            orderBy: { publishedAt: 'desc' },
            take: 20,
        });
    } catch {
        return sendSuccess(res, []);
    }

    return sendSuccess(res, events.map(e => ({
        id: e.id,
        headline: e.headline,
        summary: (e.metadata as any)?.summary ?? '',
        source: e.source ?? 'Unknown',
        publishedAt: e.publishedAt?.toISOString() ?? new Date().toISOString(),
        eventType: e.eventType ?? 'macro_event',
        severity: e.severityScore ? (Number(e.severityScore) > 0.7 ? 'HIGH' : Number(e.severityScore) > 0.4 ? 'MEDIUM' : 'LOW') : 'MEDIUM',
        sentiment: e.sentimentScore ? Number(e.sentimentScore) : 0,
        affectedSectors: (e.metadata as any)?.sectors ?? [],
    })));
}));

// GET /events/impact — events with portfolio exposure calculation
eventsController.get('/impact', asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as AuthRequest).user.userId;

    const holdings = await prisma.holding.findMany({
        where: { userId },
        include: { asset: true },
    });

    let events: any[] = [];
    try {
        events = await prisma.newsEvent.findMany({
            orderBy: { publishedAt: 'desc' },
            take: 5,
        });
    } catch {
        return sendSuccess(res, []);
    }

    const impactData = events.map(event => {
        const sentiment = event.sentimentScore ? Number(event.sentimentScore) : 0;
        const severity = event.severityScore ? Number(event.severityScore) : 0.3;
        const sectors: string[] = (event.metadata as any)?.sectors ?? [];

        const exposedHoldings = holdings
            .filter(h => sectors.includes(h.asset.sector ?? ''))
            .map(h => ({
                ticker: h.asset.ticker,
                exposure: 1,
                estimatedImpact: sentiment * -0.05 * h.quantity.toNumber(),
            }));

        return {
            eventId: event.id,
            headline: event.headline,
            severity: severity > 0.7 ? 'HIGH' : severity > 0.4 ? 'MEDIUM' : 'LOW',
            sentiment,
            estimatedDrawdown: Math.abs(sentiment) * 0.05,
            volatilityProjection: 0.15 + Math.abs(sentiment) * 0.1,
            exposedHoldings,
        };
    });

    return sendSuccess(res, impactData);
}));
