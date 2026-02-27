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

export const portfolioService = {
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

    addHolding: async (payload: AddHoldingPayload): Promise<any> => {
        const { data } = await api.post('/portfolio/holdings', payload);
        return data;
    },

    removeHolding: async (holdingId: number): Promise<void> => {
        await api.delete(`/portfolio/holdings/${holdingId}`);
    },

    updateHolding: async (holdingId: number, payload: { quantity?: number; avgCost?: number }): Promise<any> => {
        const { data } = await api.put(`/portfolio/holdings/${holdingId}`, payload);
        return data;
    },
};
