import { create } from 'zustand';
import type { NewsEvent, PortfolioExposure } from '../types';
import { eventsService } from '../services/events.service';

interface EventsState {
    events: NewsEvent[];
    exposure: PortfolioExposure | null;
    isLoading: boolean;
    fetchAll: () => Promise<void>;
}

export const useEventsStore = create<EventsState>((set) => ({
    events: [],
    exposure: null,
    isLoading: false,
    fetchAll: async () => {
        set({ isLoading: true });
        const [eventsRes, exposureRes] = await Promise.allSettled([
            eventsService.getEvents(),
            eventsService.getPortfolioExposure(),
        ]);
        set({
            events: eventsRes.status === 'fulfilled' ? eventsRes.value : [],
            exposure: exposureRes.status === 'fulfilled' ? exposureRes.value : null,
            isLoading: false,
        });
    },
}));
