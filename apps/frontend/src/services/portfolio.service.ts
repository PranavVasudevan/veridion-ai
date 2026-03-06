import api from './api';
import type { Portfolio, PortfolioSnapshot, PortfolioStateInfo } from '../types';

export interface AddHoldingPayload {
    ticker: string;
    name?: string;
    assetType?: string;
    sector?: string;
    country?: string;
    quantity: number;
    avgCost?: number;
}

export interface AllocationItem {
    assetId: number;
    ticker: string;
    name: string | null;
    currentWeight: number;
    targetWeight: number | null;
    deviation: number | null;
}

export interface WalletInfo {
    balance: number;
}

export interface BuyPayload {
    ticker: string;
    quantity: number;
    price: number;
}

export interface SellPayload {
    holdingId: number;
    quantity: number;
    price: number;
}

export const portfolioService = {

    // ─── Portfolio Core ─────────────────────────────

    getPortfolio: async (): Promise<Portfolio> => {
        const { data } = await api.get<Portfolio>('/portfolio');
        return data;
    },

    getSnapshots: async (): Promise<PortfolioSnapshot[]> => {
        const { data } = await api.get<{ snapshots: PortfolioSnapshot[] }>('/portfolio/snapshot');
        return data.snapshots;
    },

    getState: async (): Promise<PortfolioStateInfo> => {
        const { data } = await api.get<any>('/portfolio/state');

        return {
            state: data.state ?? 'Stable',
            healthIndex: data.healthIndex ?? 0,
            message: data.message ?? `Portfolio is ${(data.state ?? 'stable').toLowerCase()}`,
        };
    },

    getAllocation: async (): Promise<AllocationItem[]> => {
        const { data } = await api.get<AllocationItem[]>('/portfolio/allocation');
        return data;
    },

    // ─── Holdings CRUD (existing system) ────────────

    addHolding: async (payload: AddHoldingPayload): Promise<any> => {
        const { data } = await api.post('/portfolio/holdings', payload);
        return data;
    },

    removeHolding: async (holdingId: number): Promise<void> => {
        await api.delete(`/portfolio/holdings/${holdingId}`);
    },

    updateHolding: async (
        holdingId: number,
        payload: { quantity?: number; avgCost?: number }
    ): Promise<any> => {
        const { data } = await api.put(`/portfolio/holdings/${holdingId}`, payload);
        return data;
    },

    seed: async (): Promise<{ seeded: boolean }> => {
        const { data } = await api.post<{ seeded: boolean }>('/portfolio/seed');
        return data;
    },

    // ─── Wallet ─────────────────────────────────────

    getWallet: async (): Promise<WalletInfo> => {
        const { data } = await api.get<WalletInfo>('/portfolio/wallet');
        return data;
    },

    deposit: async (amount: number): Promise<WalletInfo> => {
        const { data } = await api.post<WalletInfo>('/portfolio/wallet/deposit', { amount });
        return data;
    },

    withdraw: async (amount: number): Promise<WalletInfo> => {
        const { data } = await api.post<WalletInfo>('/portfolio/wallet/withdraw', { amount });
        return data;
    },

    // ─── Trades ─────────────────────────────────────

    buy: async (payload: BuyPayload): Promise<void> => {
        await api.post('/portfolio/trades/buy', payload);
    },

    sell: async (payload: SellPayload): Promise<void> => {
        await api.post('/portfolio/trades/sell', payload);
    },
};