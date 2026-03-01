import { create } from 'zustand';
import type { Holding, PortfolioSnapshot, PortfolioStateInfo } from '../types';
import { portfolioService, AddHoldingPayload, AllocationItem } from '../services/portfolio.service';

interface PortfolioState {
    totalValue: number | null;
    totalReturn: number | null;
    holdings: Holding[];
    snapshots: PortfolioSnapshot[];
    allocation: AllocationItem[];
    state: PortfolioStateInfo | null;
    isLoading: boolean;
    isMutating: boolean;
    error: string | null;

    fetchPortfolio: () => Promise<void>;
    fetchSnapshots: () => Promise<void>;
    fetchState: () => Promise<void>;
    fetchAllocation: () => Promise<void>;
    refreshAll: () => Promise<void>;
    addHolding: (payload: AddHoldingPayload) => Promise<void>;
    updateHolding: (holdingId: number, payload: { quantity?: number; avgCost?: number }) => Promise<void>;
    removeHolding: (holdingId: number) => Promise<void>;
    seedIfEmpty: () => Promise<void>;
    clearError: () => void;
}

export const usePortfolioStore = create<PortfolioState>((set, get) => ({
    totalValue: null,
    totalReturn: null,
    holdings: [],
    snapshots: [],
    allocation: [],
    state: null,
    isLoading: false,
    isMutating: false,
    error: null,

    fetchPortfolio: async () => {
        set({ isLoading: true, error: null });
        try {
            const data = await portfolioService.getPortfolio();
            set({ totalValue: data.totalValue, totalReturn: data.totalReturn, holdings: data.holdings });
        } catch (err: any) {
            const message = err?.response?.data?.error?.message ?? err?.response?.data?.message ?? 'Failed to fetch portfolio';
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
            // Snapshots may not exist yet — silently ignore
        }
    },

    fetchState: async () => {
        try {
            const data = await portfolioService.getState();
            set({ state: data });
        } catch {
            // Portfolio state may not exist yet — leave as null
        }
    },

    fetchAllocation: async () => {
        try {
            const data = await portfolioService.getAllocation();
            set({ allocation: data });
        } catch {
            // Allocation may not exist yet
        }
    },

    refreshAll: async () => {
        set({ isLoading: true, error: null });
        await Promise.allSettled([
            get().fetchPortfolio(),
            get().fetchSnapshots(),
            get().fetchState(),
            get().fetchAllocation(),
        ]);
        set({ isLoading: false });
    },

    addHolding: async (payload) => {
        set({ isMutating: true, error: null });
        try {
            await portfolioService.addHolding(payload);
            await get().refreshAll();
        } catch (err: any) {
            const message = err?.response?.data?.error?.message ?? err?.response?.data?.message ?? 'Failed to add holding';
            set({ error: message });
            throw err; // re-throw for form-level error handling
        } finally {
            set({ isMutating: false });
        }
    },

    updateHolding: async (holdingId, payload) => {
        set({ isMutating: true, error: null });
        try {
            await portfolioService.updateHolding(holdingId, payload);
            await get().refreshAll();
        } catch (err: any) {
            const message = err?.response?.data?.error?.message ?? err?.response?.data?.message ?? 'Failed to update holding';
            set({ error: message });
            throw err;
        } finally {
            set({ isMutating: false });
        }
    },

    removeHolding: async (holdingId) => {
        set({ isMutating: true, error: null });
        try {
            await portfolioService.removeHolding(holdingId);
            await get().refreshAll();
        } catch (err: any) {
            const message = err?.response?.data?.error?.message ?? err?.response?.data?.message ?? 'Failed to remove holding';
            set({ error: message });
            throw err;
        } finally {
            set({ isMutating: false });
        }
    },

    seedIfEmpty: async () => {
        try {
            await portfolioService.seed();
        } catch {
            // Seed may fail silently for existing users
        }
    },

    clearError: () => set({ error: null }),
}));
