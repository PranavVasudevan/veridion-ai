import api from './api';
import { isDemoMode, sleep } from '../utils';
import { demoEvents, demoEventImpact, demoPortfolioExposure } from '../utils/demoData';
import type { NewsEvent, EventImpact, PortfolioExposure } from '../types';

export const eventsService = {
    getEvents: async (): Promise<NewsEvent[]> => {
        if (isDemoMode()) { await sleep(300); return demoEvents; }
        const { data } = await api.get<NewsEvent[]>('/events');
        return data;
    },
    getEventImpact: async (eventId: number): Promise<EventImpact> => {
        if (isDemoMode()) { await sleep(400); return { ...demoEventImpact, eventId }; }
        const { data } = await api.get<EventImpact>(`/events/${eventId}/impact`);
        return data;
    },
    getPortfolioExposure: async (): Promise<PortfolioExposure> => {
        if (isDemoMode()) { await sleep(250); return demoPortfolioExposure; }
        const { data } = await api.get<PortfolioExposure>('/events/portfolio-exposure');
        return data;
    },
};
