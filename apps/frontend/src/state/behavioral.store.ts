import { create } from 'zustand';
import type { BehavioralScore, SpendingMetrics } from '../types';
import { behavioralService } from '../services/behavioral.service';

interface BehavioralState {
    score: BehavioralScore | null;
    spending: SpendingMetrics | null;
    history: BehavioralScore[];
    isLoading: boolean;
    fetchAll: () => Promise<void>;
}

export const useBehavioralStore = create<BehavioralState>((set) => ({
    score: null,
    spending: null,
    history: [],
    isLoading: false,
    fetchAll: async () => {
        set({ isLoading: true });
        const [scoreRes, spendingRes, historyRes] = await Promise.allSettled([
            behavioralService.getScore(),
            behavioralService.getSpending(),
            behavioralService.getHistory(),
        ]);
        set({
            score: scoreRes.status === 'fulfilled' ? scoreRes.value : null,
            spending: spendingRes.status === 'fulfilled' ? spendingRes.value : null,
            history: historyRes.status === 'fulfilled' ? historyRes.value : [],
            isLoading: false,
        });
    },
}));
