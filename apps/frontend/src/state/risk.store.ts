import { create } from 'zustand';
import type { RiskMetrics, RiskContribution, FrontierPoint, CovarianceData } from '../types';
import { riskService } from '../services/risk.service';

interface RiskState {
    metrics: RiskMetrics | null;
    history: RiskMetrics[];
    contributions: RiskContribution[];
    frontier: FrontierPoint[];
    covariance: CovarianceData | null;
    isLoading: boolean;
    fetchAll: () => Promise<void>;
}

export const useRiskStore = create<RiskState>((set) => ({
    metrics: null,
    history: [],
    contributions: [],
    frontier: [],
    covariance: null,
    isLoading: false,
    fetchAll: async () => {
        set({ isLoading: true });
        // Fetch each independently so one failure doesn't kill the rest
        const [metricsRes, historyRes, contribRes, frontierRes, covRes] = await Promise.allSettled([
            riskService.getMetrics(),
            riskService.getHistory(),
            riskService.getContributions(),
            riskService.getFrontier(),
            riskService.getCovariance(),
        ]);
        set({
            metrics: metricsRes.status === 'fulfilled' ? metricsRes.value : null,
            history: historyRes.status === 'fulfilled' ? historyRes.value : [],
            contributions: contribRes.status === 'fulfilled' ? contribRes.value : [],
            frontier: frontierRes.status === 'fulfilled' ? frontierRes.value : [],
            covariance: covRes.status === 'fulfilled' ? covRes.value : null,
            isLoading: false,
        });
    },
}));
