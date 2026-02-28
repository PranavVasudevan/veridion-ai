import api from './api';
import { isDemoMode, sleep } from '../utils';
import { demoBehavioralScore, demoSpendingMetrics, demoBehavioralHistory } from '../utils/demoData';
import type { BehavioralScore, SpendingMetrics } from '../types';

export const behavioralService = {
    getScore: async (): Promise<BehavioralScore> => {
        if (isDemoMode()) { await sleep(300); return demoBehavioralScore; }
        const { data } = await api.get<any>('/behavioral/score');
        // Map backend field names to frontend BehavioralScore type
        return {
            adaptiveRiskScore: data.adaptiveRiskScore ?? 0,
            panicSellingIndex: data.panicSellScore ?? data.panicSellingIndex ?? 0,
            recencyBias: data.recencyBiasScore ?? data.recencyBias ?? 0,
            riskChasing: data.riskChasingScore ?? data.riskChasing ?? 0,
            liquidityStress: data.liquidityStressScore ?? data.liquidityStress ?? 0,
            date: data.updatedAt ?? data.date ?? new Date().toISOString(),
        };
    },
    getSpending: async (): Promise<SpendingMetrics> => {
        if (isDemoMode()) { await sleep(250); return demoSpendingMetrics; }
        const { data } = await api.get<SpendingMetrics>('/behavioral/spending');
        return data;
    },
    getHistory: async (): Promise<BehavioralScore[]> => {
        if (isDemoMode()) { await sleep(200); return demoBehavioralHistory; }
        const { data } = await api.get<any[]>('/behavioral/score/history');
        return (data ?? []).map((d: any) => ({
            adaptiveRiskScore: d.adaptiveRiskScore ?? 0,
            panicSellingIndex: d.panicSellScore ?? d.panicSellingIndex ?? 0,
            recencyBias: d.recencyBiasScore ?? d.recencyBias ?? 0,
            riskChasing: d.riskChasingScore ?? d.riskChasing ?? 0,
            liquidityStress: d.liquidityStressScore ?? d.liquidityStress ?? 0,
            date: d.updatedAt ?? d.date ?? '',
        }));
    },
};
