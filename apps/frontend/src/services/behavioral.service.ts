import api from './api';
import { isDemoMode, sleep } from '../utils';
import { demoBehavioralScore, demoSpendingMetrics, demoBehavioralHistory } from '../utils/demoData';
import type { BehavioralScore, SpendingMetrics } from '../types';

export const behavioralService = {
    getScore: async (): Promise<BehavioralScore> => {
        if (isDemoMode()) { await sleep(300); return demoBehavioralScore; }
        const { data } = await api.get<BehavioralScore>('/behavioral/score');
        return data;
    },
    getSpending: async (): Promise<SpendingMetrics> => {
        if (isDemoMode()) { await sleep(250); return demoSpendingMetrics; }
        const { data } = await api.get<SpendingMetrics>('/behavioral/spending');
        return data;
    },
    getHistory: async (): Promise<BehavioralScore[]> => {
        if (isDemoMode()) { await sleep(200); return demoBehavioralHistory; }
        const { data } = await api.get<BehavioralScore[]>('/behavioral/score/history');
        return data;
    },
};
