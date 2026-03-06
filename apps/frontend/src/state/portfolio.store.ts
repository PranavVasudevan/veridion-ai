import { create } from 'zustand';
import type { Holding, PortfolioSnapshot, PortfolioStateInfo } from '../types';
import {
    portfolioService,
    AddHoldingPayload,
    AllocationItem,
    WalletInfo,
    BuyPayload,
    SellPayload
} from '../services/portfolio.service';

interface PortfolioState {

    totalValue: number | null;
    totalReturn: number | null;
    holdings: Holding[];
    snapshots: PortfolioSnapshot[];
    allocation: AllocationItem[];
    state: PortfolioStateInfo | null;

    wallet: WalletInfo | null;

    isLoading: boolean;
    isMutating: boolean;
    error: string | null;

    fetchPortfolio: () => Promise<void>;
    fetchSnapshots: () => Promise<void>;
    fetchState: () => Promise<void>;
    fetchAllocation: () => Promise<void>;
    fetchWallet: () => Promise<void>;

    refreshAll: () => Promise<void>;

    addHolding: (payload: AddHoldingPayload) => Promise<void>;
    updateHolding: (holdingId: number, payload: { quantity?: number; avgCost?: number }) => Promise<void>;
    removeHolding: (holdingId: number) => Promise<void>;

    executeBuy: (payload: BuyPayload) => Promise<void>;
    executeSell: (payload: SellPayload) => Promise<void>;

    deposit: (amount: number) => Promise<void>;
    withdraw: (amount: number) => Promise<void>;

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

    wallet: null,

    isLoading: false,
    isMutating: false,
    error: null,

    // ─── Fetchers ─────────────────────────────

    fetchPortfolio: async () => {
        try {
            const data = await portfolioService.getPortfolio();
            set({
                totalValue: data.totalValue,
                totalReturn: data.totalReturn,
                holdings: data.holdings
            });
        } catch (err: any) {
            const message = err?.response?.data?.error?.message ?? 'Failed to fetch portfolio';
            set({ error: message });
        }
    },

    fetchSnapshots: async () => {
        try {
            const data = await portfolioService.getSnapshots();
            set({ snapshots: data });
        } catch {}
    },

    fetchState: async () => {
        try {
            const data = await portfolioService.getState();
            set({ state: data });
        } catch {}
    },

    fetchAllocation: async () => {
        try {
            const data = await portfolioService.getAllocation();
            set({ allocation: data });
        } catch {}
    },

    fetchWallet: async () => {
        try {
            const wallet = await portfolioService.getWallet();
            set({ wallet });
        } catch {}
    },

    // ─── Refresh Everything ───────────────────

    refreshAll: async () => {

        set({ isLoading: true, error: null });

        await Promise.allSettled([
            get().fetchPortfolio(),
            get().fetchSnapshots(),
            get().fetchState(),
            get().fetchAllocation(),
            get().fetchWallet()
        ]);

        set({ isLoading: false });
    },

    // ─── Holdings (legacy) ────────────────────

    addHolding: async (payload) => {

        set({ isMutating: true });

        try {
            await portfolioService.addHolding(payload);
            await get().refreshAll();
        } finally {
            set({ isMutating: false });
        }
    },

    updateHolding: async (holdingId, payload) => {

        set({ isMutating: true });

        try {
            await portfolioService.updateHolding(holdingId, payload);
            await get().refreshAll();
        } finally {
            set({ isMutating: false });
        }
    },

    removeHolding: async (holdingId) => {

        set({ isMutating: true });

        try {
            await portfolioService.removeHolding(holdingId);
            await get().refreshAll();
        } finally {
            set({ isMutating: false });
        }
    },

    // ─── Trades ───────────────────────────────

    executeBuy: async (payload) => {

        set({ isMutating: true });

        try {
            await portfolioService.buy(payload);
            await get().refreshAll();
        } finally {
            set({ isMutating: false });
        }
    },

    executeSell: async (payload) => {

        set({ isMutating: true });

        try {
            await portfolioService.sell(payload);
            await get().refreshAll();
        } finally {
            set({ isMutating: false });
        }
    },

    // ─── Wallet ───────────────────────────────

    deposit: async (amount) => {

        set({ isMutating: true });

        try {
            const wallet = await portfolioService.deposit(amount);
            set({ wallet });
        } finally {
            set({ isMutating: false });
        }
    },

    withdraw: async (amount) => {

        set({ isMutating: true });

        try {
            const wallet = await portfolioService.withdraw(amount);
            set({ wallet });
        } finally {
            set({ isMutating: false });
        }
    },

    seedIfEmpty: async () => {
        try {
            await portfolioService.seed();
        } catch {}
    },

    clearError: () => set({ error: null }),
}));