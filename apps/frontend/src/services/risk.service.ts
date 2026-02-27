import api from './api';
import { isDemoMode, sleep } from '../utils';
import { demoRiskMetrics, demoRiskHistory, demoRiskContributions, demoFrontier, demoCovariance } from '../utils/demoData';
import type { RiskMetrics, RiskContribution, FrontierPoint, CovarianceData } from '../types';

export const riskService = {
    getMetrics: async (): Promise<RiskMetrics> => {
        if (isDemoMode()) { await sleep(300); return demoRiskMetrics; }
        const { data } = await api.get<any>('/risk/metrics');
        // Map backend fields to frontend RiskMetrics type
        return {
            volatility: data.volatility ?? 0,
            sharpeRatio: data.sharpeRatio ?? 0,
            sortinoRatio: data.sortinoRatio ?? 0,
            maxDrawdown: data.maxDrawdown ?? 0,
            var95: data.var95 ?? 0,
            cvar95: data.cvar95 ?? 0,
            beta: data.beta ?? 1,
            trackingError: data.trackingError ?? 0,
            date: data.calculatedAt ?? data.date ?? new Date().toISOString(),
        };
    },
    getHistory: async (): Promise<RiskMetrics[]> => {
        if (isDemoMode()) { await sleep(200); return demoRiskHistory; }
        const { data } = await api.get<any[]>('/risk/metrics/history');
        return (data ?? []).map((d: any) => ({
            volatility: d.volatility ?? 0,
            sharpeRatio: d.sharpeRatio ?? 0,
            sortinoRatio: d.sortinoRatio ?? 0,
            maxDrawdown: d.maxDrawdown ?? 0,
            var95: d.var95 ?? 0,
            cvar95: d.cvar95 ?? 0,
            beta: d.beta ?? 1,
            trackingError: d.trackingError ?? 0,
            date: d.calculatedAt ?? d.date ?? '',
        }));
    },
    getContributions: async (): Promise<RiskContribution[]> => {
        if (isDemoMode()) { await sleep(200); return demoRiskContributions; }
        const { data } = await api.get<RiskContribution[]>('/risk/contributions');
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
