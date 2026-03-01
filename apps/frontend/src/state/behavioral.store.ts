import { create } from 'zustand';
import { useAuthStore } from './auth.store';
import {
    behavioralService,
    BiasScores, SpendingAnalysis, AdaptiveRiskData, ScoreHistoryItem
} from '../services/behavioral.service';

interface BehavioralState {
    scores: BiasScores | null;
    spending: SpendingAnalysis | null;
    adaptiveRisk: AdaptiveRiskData | null;
    history: ScoreHistoryItem[];
    isLoading: boolean;
    isRefreshing: boolean;
    error: string | null;

    fetchScores: () => Promise<void>;
    fetchSpending: (months?: number) => Promise<void>;
    fetchAdaptiveRisk: () => Promise<void>;
    fetchHistory: () => Promise<void>;
    fetchAll: () => Promise<void>;
    refreshScores: () => Promise<void>;
    addTransaction: (input: Parameters<typeof behavioralService.addTransaction>[0]) => Promise<void>;
}

export const useBehavioralStore = create<BehavioralState>((set, get) => ({
    scores: null,
    spending: null,
    adaptiveRisk: null,
    history: [],
    isLoading: false,
    isRefreshing: false,
    error: null,

    fetchScores: async () => {
        try {
            const scores = await behavioralService.getScores();
            set({ scores });
        } catch (e: any) {
            set({ error: e?.message ?? 'Failed to load scores' });
        }
    },

    fetchSpending: async (months = 6) => {
        try {
            const spending = await behavioralService.getSpending(months);
            set({ spending });
        } catch {
            // Non-critical — keep existing data
        }
    },

    fetchAdaptiveRisk: async () => {
        try {
            const adaptiveRisk = await behavioralService.getAdaptiveRisk();
            set({ adaptiveRisk });
        } catch {
            // Non-critical
        }
    },

    fetchHistory: async () => {
        try {
            const history = await behavioralService.getHistory(20);
            set({ history });
        } catch {
            set({ history: [] });
        }
    },

    fetchAll: async () => {
        set({ isLoading: true, error: null });
        await Promise.allSettled([
            get().fetchScores(),
            get().fetchSpending(),
            get().fetchAdaptiveRisk(),
            get().fetchHistory(),
        ]);
        set({ isLoading: false });
    },

    refreshScores: async () => {
        set({ isRefreshing: true, error: null });
        try {
            const scores = await behavioralService.refreshScores();
            set({ scores });
            // Also refresh adaptive risk and history after recalculation
            await Promise.allSettled([
                get().fetchAdaptiveRisk(),
                get().fetchHistory(),
            ]);
        } catch (e: any) {
            set({ error: e?.message ?? 'Failed to refresh scores' });
        } finally {
            set({ isRefreshing: false });
        }
    },

    addTransaction: async (input) => {
        await behavioralService.addTransaction(input);
    },
}));
