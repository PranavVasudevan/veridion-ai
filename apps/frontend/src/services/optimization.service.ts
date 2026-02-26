import api from './api';
import { isDemoMode, sleep } from '../utils';
import { demoOptimizationRuns, demoFrontier } from '../utils/demoData';
import type { OptimizationRun, FrontierPoint } from '../types';

export const optimizationService = {
    getRuns: async (): Promise<OptimizationRun[]> => {
        if (isDemoMode()) { await sleep(300); return demoOptimizationRuns; }
        const { data } = await api.get<OptimizationRun[]>('/optimization/runs');
        return data;
    },
    runOptimization: async (objective: string): Promise<OptimizationRun> => {
        if (isDemoMode()) { await sleep(1500); return { ...demoOptimizationRuns[0], id: Date.now(), timestamp: new Date().toISOString(), objectiveFunction: objective }; }
        const { data } = await api.post<OptimizationRun>('/optimization/run', { objective });
        return data;
    },
    getFrontier: async (): Promise<FrontierPoint[]> => {
        if (isDemoMode()) { await sleep(300); return demoFrontier; }
        const { data } = await api.get<FrontierPoint[]>('/optimization/frontier');
        return data;
    },
};
