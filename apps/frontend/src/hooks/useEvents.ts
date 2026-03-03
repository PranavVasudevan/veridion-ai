import { useEffect } from 'react';
import { useEventsStore } from '../state/events.store';

/**
 * useEvents
 *
 * Wraps the events Zustand store and handles initial fetching.
 * Drop-in replacement for any demo/mock usage in EventInsights.tsx.
 *
 * Usage:
 *   const { events, exposure, simulation, isLoading, simulateShock } = useEvents();
 */
export function useEvents() {
  const {
    events,
    exposure,
    simulation,
    isLoading,
    isSimulating,
    error,
    fetchEvents,
    fetchExposure,
    simulateShock: _simulate,
    clearSimulation,
  } = useEventsStore();

  useEffect(() => {
    fetchEvents();
    fetchExposure();
  }, []);

  const simulateShock = (eventId: number) => {
    _simulate(eventId);
  };

  return {
    events,
    exposure,
    simulation,
    isLoading,
    isSimulating,
    error,
    simulateShock,
    clearSimulation,
  };
}