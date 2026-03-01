import api from './api';
import { isDemoMode, sleep } from '../utils';
import { demoEvents, demoEventImpact, demoPortfolioExposure } from '../utils/demoData';
import type { NewsEvent, EventImpact, PortfolioExposure } from '../types';

export const eventsService = {
    getEvents: async (): Promise<NewsEvent[]> => {
        if (isDemoMode()) { await sleep(300); return demoEvents; }
        try {
            const { data } = await api.get<any>('/events');
            const arr = Array.isArray(data) ? data : [];
            return arr.map((e: any) => ({
                id: e.id,
                headline: e.headline,
                summary: e.summary ?? '',
                source: e.source ?? 'Unknown',
                publishedAt: e.publishedAt,
                eventType: e.eventType ?? 'macro_event',
                severity: e.severity ?? 'MEDIUM',
                sentiment: e.sentiment ?? 0,
                affectedSectors: e.affectedSectors ?? [],
            }));
        } catch { return demoEvents; }
    },
    getEventImpact: async (eventId: number): Promise<EventImpact> => {
        if (isDemoMode()) { await sleep(400); return { ...demoEventImpact, eventId }; }
        try {
            const { data } = await api.get<any[]>('/events/impact');
            const found = (data ?? []).find((e: any) => e.eventId === eventId);
            return found ?? { ...demoEventImpact, eventId };
        } catch { return { ...demoEventImpact, eventId }; }
    },
    getPortfolioExposure: async (): Promise<PortfolioExposure> => {
        if (isDemoMode()) { await sleep(250); return demoPortfolioExposure; }
        try {
            const { data } = await api.get<any[]>('/events/impact');
            return demoPortfolioExposure;
        } catch { return demoPortfolioExposure; }
    },
};
