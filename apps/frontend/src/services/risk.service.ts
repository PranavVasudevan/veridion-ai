import api from './api';
import { isDemoMode, sleep } from '../utils';
import { demoRiskMetrics, demoRiskHistory, demoRiskContributions, demoFrontier, demoCovariance } from '../utils/demoData';
import type { RiskMetrics, RiskContribution, FrontierPoint, CovarianceData } from '../types';

export const riskService = {
    getMetrics: async (): Promise<RiskMetrics> => {
        if (isDemoMode()) { await sleep(300); return demoRiskMetrics; }
        const { data } = await api.get<RiskMetrics>('/risk/metrics');
        return data;
    },
    getHistory: async (): Promise<RiskMetrics[]> => {
        if (isDemoMode()) { await sleep(200); return demoRiskHistory; }
        const { data } = await api.get<RiskMetrics[]>('/risk/metrics/history');
        return data;
    },
    getContributions: async (): Promise<RiskContribution[]> => {
        if (isDemoMode()) { await sleep(200); return demoRiskContributions; }
        const { data } = await api.get<RiskContribution[]>('/risk/contribution');
        return data;
    },
    getFrontier: async (): Promise<FrontierPoint[]> => {
        if (isDemoMode()) { await sleep(300); return demoFrontier; }
        const { data } = await api.get<FrontierPoint[]>('/optimization/frontier');
        return data;
    },
    getCovariance: async (): Promise<CovarianceData> => {
        if (isDemoMode()) { await sleep(250); return demoCovariance; }
        const { data } = await api.get<CovarianceData>('/risk/covariance');
        return data;
    },
};
