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
        try {
            const [events, exposure] = await Promise.all([
                eventsService.getEvents(),
                eventsService.getPortfolioExposure(),
            ]);
            set({ events, exposure });
        } finally {
            set({ isLoading: false });
        }
    },
}));
