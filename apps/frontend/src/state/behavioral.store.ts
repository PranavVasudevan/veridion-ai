import { create } from 'zustand';
import {
    behavioralService,
    BiasScores,
    AdaptiveRiskData,
    ScoreHistoryItem,
    WalletData,
    TradeItem
} from '../services/behavioral.service';

interface BehavioralState {

    scores: BiasScores | null;
    adaptiveRisk: AdaptiveRiskData | null;
    wallet: WalletData | null;
    trades: TradeItem[];
    history: ScoreHistoryItem[];

    isLoading: boolean;
    isRefreshing: boolean;
    error: string | null;

    fetchScores: () => Promise<void>;
    fetchAdaptiveRisk: () => Promise<void>;
    fetchHistory: () => Promise<void>;
    fetchWallet: () => Promise<void>;
    fetchTrades: () => Promise<void>;
    fetchAll: () => Promise<void>;
    refreshScores: () => Promise<void>;
}

export const useBehavioralStore = create<BehavioralState>((set, get) => ({

    scores: null,
    adaptiveRisk: null,
    wallet: null,
    trades: [],
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

    fetchAdaptiveRisk: async () => {
        try {
            const adaptiveRisk = await behavioralService.getAdaptiveRisk();
            set({ adaptiveRisk });
        } catch {}
    },

    fetchHistory: async () => {
        try {
            const history = await behavioralService.getHistory();
            set({ history });
        } catch {
            set({ history: [] });
        }
    },

    fetchWallet: async () => {
        try {
            const wallet = await behavioralService.getWallet();
            set({ wallet });
        } catch {}
    },

    fetchTrades: async () => {
        try {
            const trades = await behavioralService.getTrades();
            set({ trades });
        } catch {
            set({ trades: [] });
        }
    },

    fetchAll: async () => {

        set({ isLoading: true, error: null });

        await Promise.allSettled([
            get().fetchScores(),
            get().fetchAdaptiveRisk(),
            get().fetchHistory(),
            get().fetchWallet(),
            get().fetchTrades(),
        ]);

        set({ isLoading: false });
    },

    refreshScores: async () => {

        set({ isRefreshing: true, error: null });

        try {

            const scores = await behavioralService.refreshScores();
            set({ scores });

            await Promise.allSettled([
                get().fetchAdaptiveRisk(),
                get().fetchHistory(),
            ]);

        } catch (e: any) {

            set({ error: e?.message ?? 'Failed to refresh scores' });

        } finally {

            set({ isRefreshing: false });

        }
    }
}));