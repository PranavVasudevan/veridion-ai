import { create } from 'zustand';
import { MarketEvent, ExposureReport, ShockSimulationResult } from '../../../shared/types/event.types';
import { eventsService } from '../services/events.service';

// ─── State shape ──────────────────────────────────────────────────────────────

interface EventsState {
  events: MarketEvent[];
  exposure: ExposureReport | null;
  simulation: ShockSimulationResult | null;
  isLoading: boolean;
  isSimulating: boolean;
  error: string | null;

  fetchEvents: () => Promise<void>;
  fetchExposure: () => Promise<void>;
  simulateShock: (eventId: number) => Promise<void>;
  clearSimulation: () => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useEventsStore = create<EventsState>((set) => ({
  events: [],
  exposure: null,
  simulation: null,
  isLoading: false,
  isSimulating: false,
  error: null,

  fetchEvents: async () => {
    set({ isLoading: true, error: null });
    try {
      const resp = await eventsService.getEvents({ limit: 40 });
      set({ events: resp.events });
    } catch (err: any) {
      set({ error: err?.message ?? 'Failed to load events' });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchExposure: async () => {
    try {
      const exposure = await eventsService.getExposure();
      set({ exposure });
    } catch (err: any) {
      set({ error: err?.message ?? 'Failed to load exposure' });
    }
  },

  simulateShock: async (eventId) => {
    set({ isSimulating: true, error: null });
    try {
      const simulation = await eventsService.simulateShock(eventId);
      set({ simulation });
    } catch (err: any) {
      set({ error: err?.message ?? 'Simulation failed' });
    } finally {
      set({ isSimulating: false });
    }
  },

  clearSimulation: () => set({ simulation: null }),
}));