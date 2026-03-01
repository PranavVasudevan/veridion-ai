import api from './api';

export interface DashboardHolding {
    ticker: string;
    name: string;
    assetType: string;
    sector: string;
    quantity: number;
    avgCost: number;
    price: number;
    value: number;
    weight: number;
    unrealizedPnL: number;
    unrealizedPnLPercent: number;
    change24h: number;
}

export interface DashboardSummary {
    // User
    userName: string | null;
    joinedAt: string | null;

    // Portfolio
    totalValue: number;
    totalReturn: number;
    cashBalance: number;
    holdingsCount: number;
    holdings: DashboardHolding[];
    performanceData: { date: string; value: number }[];
    lastSnapshotDate: string | null;
    sectorAllocation: { sector: string; value: number; weight: number }[];

    // Portfolio state
    portfolioState: { state: string; healthIndex: number };

    // Risk profile from questionnaire
    riskProfile: 'Conservative' | 'Moderate' | 'Aggressive';
    riskToleranceScore: number;
    investmentHorizon: string | null;
    investmentGoal: string | null;

    // Risk metrics
    riskMetrics: {
        volatility: number;
        sharpeRatio: number;
        sortinoRatio: number;
        maxDrawdown: number;
        var95: number;
    };
    hasRiskData: boolean;

    // Behavioral
    behavioral: {
        adaptiveRiskScore: number;
        panicSellScore: number;
        recencyBiasScore: number;
        riskChasingScore: number;
        liquidityStressScore: number;
        hasRealData: boolean;
    };

    // Goals
    goals: {
        id: number;
        name: string;
        targetAmount: number;
        targetDate: string | null;
        probability: number | null;
        medianProjection: number | null;
    }[];

    // Alerts
    alerts: {
        id: number;
        type: string;
        severity: string;
        message: string;
        isRead: boolean;
        createdAt: string;
    }[];
    unreadAlertsCount: number;

    // Events
    events: {
        id: number;
        headline: string;
        source: string;
        sentiment: number;
        severity: number;
        publishedAt: string;
        sectors: string[];
    }[];
}

export const dashboardService = {
    getSummary: async (): Promise<DashboardSummary> => {
        const { data } = await api.get<DashboardSummary>('/dashboard/summary');
        return data;
    },
};
