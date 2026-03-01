import api from './api';
import { isDemoMode, sleep } from '../utils';
import { demoRiskMetrics, demoRiskHistory, demoRiskContributions, demoFrontier, demoCovariance } from '../utils/demoData';
import type { RiskMetrics, RiskContribution, FrontierPoint, CovarianceData } from '../types';

export const riskService = {
    getMetrics: async (): Promise<RiskMetrics> => {
        if (isDemoMode()) { await sleep(300); return demoRiskMetrics; }
        try {
            const { data } = await api.get<any>('/risk/metrics');
            return {
                volatility: data.volatility ?? 0,
                sharpeRatio: data.sharpeRatio ?? 0,
                sortinoRatio: data.sortinoRatio ?? 0,
                maxDrawdown: data.maxDrawdown ?? 0,
                var95: data.var95 ?? 0,
                cvar95: data.cvar95 ?? 0,
                beta: data.beta ?? 1,
                trackingError: data.trackingError ?? 0,
                date: data.date ?? new Date().toISOString(),
            };
        } catch { return demoRiskMetrics; }
    },

    getHistory: async (): Promise<RiskMetrics[]> => {
        if (isDemoMode()) { await sleep(200); return demoRiskHistory; }
        try {
            const { data } = await api.get<any[]>('/risk/history');
            return (data ?? []).map((d: any) => ({
                volatility: d.volatility ?? 0,
                sharpeRatio: d.sharpeRatio ?? 0,
                sortinoRatio: d.sortinoRatio ?? 0,
                maxDrawdown: d.maxDrawdown ?? 0,
                var95: d.var95 ?? 0,
                cvar95: d.cvar95 ?? 0,
                beta: d.beta ?? 1,
                trackingError: d.trackingError ?? 0,
                date: d.date ?? '',
            }));
        } catch { return demoRiskHistory; }
    },

    getContributions: async (): Promise<RiskContribution[]> => {
        if (isDemoMode()) { await sleep(200); return demoRiskContributions; }
        try {
            const { data } = await api.get<RiskContribution[]>('/risk/contributions');
            return data;
        } catch { return demoRiskContributions; }
    },

    getFrontier: async (): Promise<FrontierPoint[]> => {
        if (isDemoMode()) { await sleep(300); return demoFrontier; }
        try {
            const { data } = await api.get<FrontierPoint[]>('/risk/frontier');
            return data;
        } catch { return demoFrontier; }
    },

    getCovariance: async (): Promise<CovarianceData> => {
        if (isDemoMode()) { await sleep(250); return demoCovariance; }
        try {
            const { data } = await api.get<CovarianceData>('/risk/covariance');
            return data;
        } catch { return demoCovariance; }
    },
};
