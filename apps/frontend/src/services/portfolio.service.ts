import api from './api';
import { isDemoMode, sleep } from '../utils';
import { demoPortfolio, demoSnapshots, demoPortfolioState } from '../utils/demoData';
import type { Portfolio, PortfolioSnapshot, PortfolioStateInfo } from '../types';

export const portfolioService = {
    getPortfolio: async (): Promise<Portfolio> => {
        if (isDemoMode()) { await sleep(400); return demoPortfolio; }
        const { data } = await api.get<Portfolio>('/portfolio');
        return data;
    },

    getSnapshots: async (): Promise<PortfolioSnapshot[]> => {
        if (isDemoMode()) { await sleep(300); return demoSnapshots; }
        const { data } = await api.get<PortfolioSnapshot[]>('/portfolio/snapshot');
        return data;
    },

    getState: async (): Promise<PortfolioStateInfo> => {
        if (isDemoMode()) { await sleep(200); return demoPortfolioState; }
        const { data } = await api.get<PortfolioStateInfo>('/portfolio/state');
        return data;
    },
};
