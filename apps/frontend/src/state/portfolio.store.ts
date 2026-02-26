import { create } from 'zustand';
import type { Holding, PortfolioSnapshot, PortfolioStateInfo } from '../types';
import { portfolioService } from '../services/portfolio.service';

interface PortfolioState {
    totalValue: number | null;
    totalReturn: number | null;
    holdings: Holding[];
    snapshots: PortfolioSnapshot[];
    state: PortfolioStateInfo | null;
    isLoading: boolean;
    fetchPortfolio: () => Promise<void>;
    fetchSnapshots: () => Promise<void>;
    fetchState: () => Promise<void>;
}

export const usePortfolioStore = create<PortfolioState>((set) => ({
    totalValue: null,
    totalReturn: null,
    holdings: [],
    snapshots: [],
    state: null,
    isLoading: false,
    fetchPortfolio: async () => {
        set({ isLoading: true });
        try {
            const data = await portfolioService.getPortfolio();
            set({ totalValue: data.totalValue, totalReturn: data.totalReturn, holdings: data.holdings });
        } finally {
            set({ isLoading: false });
        }
    },
    fetchSnapshots: async () => {
        try {
            const data = await portfolioService.getSnapshots();
            set({ snapshots: data });
        } catch { /* handled by service */ }
    },
    fetchState: async () => {
        try {
            const data = await portfolioService.getState();
            set({ state: data });
        } catch { /* handled by service */ }
    },
}));
