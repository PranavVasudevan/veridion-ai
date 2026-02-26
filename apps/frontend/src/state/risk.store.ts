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
        try {
            const [metrics, history, contributions, frontier, covariance] = await Promise.all([
                riskService.getMetrics(),
                riskService.getHistory(),
                riskService.getContributions(),
                riskService.getFrontier(),
                riskService.getCovariance(),
            ]);
            set({ metrics, history, contributions, frontier, covariance });
        } finally {
            set({ isLoading: false });
        }
    },
}));
