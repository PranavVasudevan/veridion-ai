import { create } from 'zustand';
import type { Holding, PortfolioSnapshot, PortfolioStateInfo } from '../types';
import { portfolioService, AddHoldingPayload } from '../services/portfolio.service';

interface PortfolioState {
    totalValue: number | null;
    totalReturn: number | null;
    holdings: Holding[];
    snapshots: PortfolioSnapshot[];
    state: PortfolioStateInfo | null;
    isLoading: boolean;
    error: string | null;
    fetchPortfolio: () => Promise<void>;
    fetchSnapshots: () => Promise<void>;
    fetchState: () => Promise<void>;
    addHolding: (payload: AddHoldingPayload) => Promise<void>;
    updateHolding: (holdingId: number, payload: { quantity?: number; avgCost?: number }) => Promise<void>;
    removeHolding: (holdingId: number) => Promise<void>;
}

export const usePortfolioStore = create<PortfolioState>((set, get) => ({
    totalValue: null,
    totalReturn: null,
    holdings: [],
    snapshots: [],
    state: null,
    isLoading: false,
    error: null,
    fetchPortfolio: async () => {
        set({ isLoading: true, error: null });
        try {
            const data = await portfolioService.getPortfolio();
            set({ totalValue: data.totalValue, totalReturn: data.totalReturn, holdings: data.holdings });
        } catch (err: any) {
            const message = err?.response?.data?.message || 'Failed to fetch portfolio';
            set({ error: message });
        } finally {
            set({ isLoading: false });
        }
    },
    fetchSnapshots: async () => {
        try {
            const data = await portfolioService.getSnapshots();
            set({ snapshots: data });
        } catch {
            // Snapshots may not exist yet for a new user — silently ignore
        }
    },
    fetchState: async () => {
        try {
            const data = await portfolioService.getState();
            set({ state: data });
        } catch {
            // Portfolio state may not be calculated yet (404) — leave as null
        }
    },
    addHolding: async (payload) => {
        await portfolioService.addHolding(payload);
        await get().fetchPortfolio();
    },
    updateHolding: async (holdingId, payload) => {
        await portfolioService.updateHolding(holdingId, payload);
        await get().fetchPortfolio();
    },
    removeHolding: async (holdingId) => {
        await portfolioService.removeHolding(holdingId);
        await get().fetchPortfolio();
    },
}));
