import api from './api';
import { isDemoMode, sleep } from '../utils';
import { demoMonteCarloResults } from '../utils/demoData';
import type { MonteCarloResult } from '../types';

export const montecarloService = {
    simulate: async (goalId: number, params?: { drift?: number; volatility?: number }): Promise<MonteCarloResult> => {
        if (isDemoMode()) {
            await sleep(800);
            const result = demoMonteCarloResults.find(r => r.goalId === goalId);
            return result || demoMonteCarloResults[0];
        }
        const { data } = await api.post<MonteCarloResult>('/montecarlo/simulate', { goalId, ...params });
        return data;
    },
    getResults: async (goalId: number): Promise<MonteCarloResult> => {
        if (isDemoMode()) {
            await sleep(300);
            const result = demoMonteCarloResults.find(r => r.goalId === goalId);
            return result || demoMonteCarloResults[0];
        }
        const { data } = await api.get<MonteCarloResult>(`/montecarlo/results/${goalId}`);
        return data;
    },
};
