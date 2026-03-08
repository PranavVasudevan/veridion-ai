import api from './api';

/* ───────────────── TYPES ───────────────── */

export interface BiasScores {
    adaptiveRiskScore: number;
    panicSellScore: number;
    recencyBiasScore: number;
    riskChasingScore: number;
    liquidityStressScore: number;
    lossAversionRatio: number | null;
    featureSnapshot: Record<string, number>;
    insights: string[];
    alerts: string[];
    calculatedAt?: string;
    updatedAt?: string;
    fromCache?: boolean;
}

export interface AdaptiveRiskData {
    currentRiskTolerance: number;
    suggestedRiskTolerance: number;
    adjustmentDelta: number;
    confidence: number;
    marketRegime: 'LOW_VOLATILITY' | 'NORMAL' | 'HIGH_VOLATILITY';
    adjustmentReasons: string[];
}

export interface ScoreHistoryItem {
    adaptiveRiskScore: number;
    panicSellScore: number;
    recencyBiasScore: number;
    riskChasingScore: number;
    liquidityStressScore: number;
    updatedAt: string;
}

export interface WalletData {
    balance: number;
}

export interface TradeItem {
    id: number;
    assetTicker: string;
    side: 'BUY' | 'SELL';
    quantity: number;
    price: number;
    total: number;
    createdAt: string;
}

/* ───────────────── SERVICE ───────────────── */

export const behavioralService = {

    getScores: async (): Promise<BiasScores> => {
        const { data } = await api.get('/behavioral/scores');
        console.log('raw scores response:', data);
        return data.data ?? data;
    },

    refreshScores: async (): Promise<BiasScores> => {
        const { data } = await api.post('/behavioral/scores/refresh');
        return data.data ?? data;
    },

    getAdaptiveRisk: async (): Promise<AdaptiveRiskData> => {
        const { data } = await api.get('/behavioral/adaptive-risk');
        return data.data ?? data;
    },

    getHistory: async (limit = 20): Promise<ScoreHistoryItem[]> => {
        const { data } = await api.get(`/behavioral/history?limit=${limit}`);
        return data.data ?? data;
    },

    getWallet: async (): Promise<WalletData> => {
        const { data } = await api.get('/portfolio/wallet');
        return data.data ?? data;
    },

    getTrades: async (limit = 10): Promise<TradeItem[]> => {
        const { data } = await api.get(`/portfolio/trades?limit=${limit}`);
        return data.data ?? data;
    },
};