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
        try {
            const [score, spending, history] = await Promise.all([
                behavioralService.getScore(),
                behavioralService.getSpending(),
                behavioralService.getHistory(),
            ]);
            set({ score, spending, history });
        } finally {
            set({ isLoading: false });
        }
    },
}));
