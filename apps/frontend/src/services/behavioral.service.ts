import api from './api';
import { isDemoMode, sleep } from '../utils';
import { demoBehavioralScore, demoSpendingMetrics, demoBehavioralHistory } from '../utils/demoData';
import type { BehavioralScore, SpendingMetrics } from '../types';

// ── Raw response types from backend ─────────────────────────────────────────
export interface BiasScores {
    adaptiveRiskScore: number;
    panicSellScore: number;
    recencyBiasScore: number;
    riskChasingScore: number;
    liquidityStressScore: number;
    lossAversionRatio: number | null;
    featureSnapshot: Record<string, number>;
    insights: string[];
    updatedAt: string;
    fromCache?: boolean;
}

export interface SpendingAnalysis {
    monthlyBurnRate: number;
    savingsRate: number;
    expenseVolatility: number;
    categoryBreakdown: { category: string; amount: number; percentage: number }[];
    monthlyTrend: { month: string; income: number; expenses: number; savings: number }[];
    anomalies: { month: string; amount: number; deviation: number }[];
    calculatedAt: string;
}

export interface AdaptiveRiskData {
    currentRiskTolerance: number;
    suggestedRiskTolerance: number;
    adjustmentDelta: number;
    confidence: number;
    marketRegime: 'LOW_VOLATILITY' | 'NORMAL' | 'HIGH_VOLATILITY';
    adjustmentReasons: string[];
    behavioralScores: {
        adaptiveRiskScore: number;
        panicSellScore: number;
        recencyBiasScore: number;
        riskChasingScore: number;
        liquidityStressScore: number;
    };
}

export interface ScoreHistoryItem {
    adaptiveRiskScore: number;
    panicSellScore: number;
    recencyBiasScore: number;
    riskChasingScore: number;
    liquidityStressScore: number;
    updatedAt: string;
}

export interface TransactionInput {
    amount: number;
    category?: string;
    transactionType: 'income' | 'expense' | 'investment' | 'withdrawal';
    description?: string;
    transactionDate: string; // YYYY-MM-DD
}

export const behavioralService = {
    // ── New endpoints ────────────────────────────────────────────────────────
    getScores: async (): Promise<BiasScores> => {
        if (isDemoMode()) {
            await sleep(300);
            return {
                adaptiveRiskScore: 68, panicSellScore: 32, recencyBiasScore: 45,
                riskChasingScore: 28, liquidityStressScore: 20, lossAversionRatio: 1.4,
                featureSnapshot: {}, updatedAt: new Date().toISOString(),
                insights: [
                    'Your panic sell score is low — you handle downturns with composure.',
                    'You show moderate recency bias, tending to overweight recent winners.',
                    'Your liquidity buffer looks healthy.',
                ],
            };
        }
        const { data } = await api.get<BiasScores>('/behavioral/scores');
        return data;
    },

    getSpending: async (months = 6): Promise<SpendingAnalysis> => {
        if (isDemoMode()) {
            await sleep(250);
            return {
                monthlyBurnRate: 3200, savingsRate: 0.22, expenseVolatility: 0.18,
                categoryBreakdown: [
                    { category: 'Housing', amount: 1200, percentage: 37.5 },
                    { category: 'Food', amount: 600, percentage: 18.75 },
                    { category: 'Transport', amount: 400, percentage: 12.5 },
                    { category: 'Entertainment', amount: 300, percentage: 9.38 },
                    { category: 'Other', amount: 700, percentage: 21.87 },
                ],
                monthlyTrend: Array.from({ length: 6 }, (_, i) => {
                    const d = new Date(); d.setMonth(d.getMonth() - (5 - i));
                    return { month: d.toISOString().substring(0, 7), income: 4100 + Math.random() * 500, expenses: 3100 + Math.random() * 400, savings: 900 + Math.random() * 300 };
                }),
                anomalies: [],
                calculatedAt: new Date().toISOString(),
            };
        }
        const { data } = await api.get<SpendingAnalysis>(`/behavioral/spending?months=${months}`);
        return data;
    },

    refreshScores: async (): Promise<BiasScores> => {
        if (isDemoMode()) { await sleep(500); return behavioralService.getScores(); }
        const { data } = await api.post<BiasScores>('/behavioral/scores/refresh');
        return data;
    },

    getAdaptiveRisk: async (): Promise<AdaptiveRiskData> => {
        if (isDemoMode()) {
            await sleep(200);
            return {
                currentRiskTolerance: 5.5, suggestedRiskTolerance: 4.8, adjustmentDelta: -0.7,
                confidence: 0.72, marketRegime: 'NORMAL',
                adjustmentReasons: ['Reduced by 0.7 due to moderate panic sell tendency.'],
                behavioralScores: { adaptiveRiskScore: 68, panicSellScore: 32, recencyBiasScore: 45, riskChasingScore: 28, liquidityStressScore: 20 },
            };
        }
        const { data } = await api.get<AdaptiveRiskData>('/behavioral/adaptive-risk');
        return data;
    },

    getHistory: async (limit = 10): Promise<ScoreHistoryItem[]> => {
        if (isDemoMode()) {
            await sleep(200);
            return Array.from({ length: 8 }, (_, i) => {
                const d = new Date(); d.setDate(d.getDate() - (7 - i) * 7);
                return { adaptiveRiskScore: 55 + i * 2, panicSellScore: 55 - i * 3, recencyBiasScore: 50 - i, riskChasingScore: 40 + i, liquidityStressScore: 35 - i, updatedAt: d.toISOString() };
            });
        }
        const { data } = await api.get<ScoreHistoryItem[]>(`/behavioral/history?limit=${limit}`);
        return data;
    },

    addTransaction: async (input: TransactionInput) => {
        const { data } = await api.post('/behavioral/transactions', input);
        return data;
    },

    bulkAddTransactions: async (transactions: TransactionInput[]) => {
        const { data } = await api.post('/behavioral/transactions/bulk', { transactions });
        return data;
    },

    // ── Legacy (kept for backward compat) ────────────────────────────────────
    getScore: async (): Promise<BehavioralScore> => {
        if (isDemoMode()) { await sleep(300); return demoBehavioralScore; }
        const { data } = await api.get<any>('/behavioral/score');
        return {
            adaptiveRiskScore: data.adaptiveRiskScore ?? 50,
            panicSellingIndex: (data.panicSellScore ?? 50) / 100,
            recencyBias: (data.recencyBiasScore ?? 50) / 100,
            riskChasing: (data.riskChasingScore ?? 50) / 100,
            liquidityStress: (data.liquidityStressScore ?? 50) / 100,
            date: data.updatedAt ?? new Date().toISOString(),
        };
    },
};
