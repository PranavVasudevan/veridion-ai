// ============================================
// VERIDION AI — TYPE DEFINITIONS
// ============================================

// Auth
export interface User {
    id: number;
    email: string;
    name: string;
    role: string;
}

export interface AuthResponse {
    token: string;
    user: User;
}

// Portfolio
export interface Holding {
    ticker: string;
    name: string;
    assetClass: string;
    sector: string;
    weight: number;
    value: number;
    shares: number;
    price: number;
    change24h: number;
}

export interface PortfolioSnapshot {
    date: string;
    totalValue: number;
    dailyReturn: number;
}

export interface PortfolioStateInfo {
    state: 'Stable' | 'Elevated Event Risk' | 'Underfunded' | 'Over-risked' | 'Rebalancing';
    healthIndex: number;
    message: string;
}

export interface Portfolio {
    totalValue: number;
    totalReturn: number;
    holdings: Holding[];
}

// Risk
export interface RiskMetrics {
    volatility: number;
    sharpeRatio: number;
    sortinoRatio: number;
    maxDrawdown: number;
    var95: number;
    cvar95: number;
    beta: number;
    trackingError: number;
    date: string;
}

export interface RiskContribution {
    ticker: string;
    name: string;
    contribution: number;
    weight: number;
}

export interface FrontierPoint {
    volatility: number;
    expectedReturn: number;
    isOptimal: boolean;
    isCurrent: boolean;
    weights?: Record<string, number>;
}

export interface CovarianceData {
    tickers: string[];
    matrix: number[][];
}

// Optimization
export interface OptimizationRun {
    id: number;
    timestamp: string;
    status: 'completed' | 'running' | 'failed';
    objectiveFunction: string;
    result?: {
        expectedReturn: number;
        volatility: number;
        sharpeRatio: number;
        weights: Record<string, number>;
    };
}

// Monte Carlo
export interface MonteCarloResult {
    goalId: number;
    probability: number;
    percentiles: {
        p10: number[];
        p25: number[];
        p50: number[];
        p75: number[];
        p90: number[];
    };
    terminalValues: number[];
    statistics: {
        mean: number;
        median: number;
        std: number;
        probabilityOfLoss: number;
    };
}

// Goals
export interface FinancialGoal {
    id: number;
    name: string;
    type: 'retirement' | 'house' | 'education' | 'custom';
    targetAmount: number;
    currentAmount: number;
    timeHorizonYears: number;
    monthlyContribution: number;
    probability: number;
    priority: 'high' | 'medium' | 'low';
    createdAt: string;
}

// Behavioral
export interface BehavioralScore {
    adaptiveRiskScore: number;
    panicSellingIndex: number;
    recencyBias: number;
    riskChasing: number;
    liquidityStress: number;
    date: string;
}

export interface SpendingMetrics {
    monthlyBurnRate: number;
    savingsRate: number;
    expenseVolatility: number;
    categories: { name: string; amount: number; percentage: number }[];
}

// Events
export interface NewsEvent {
    id: number;
    headline: string;
    summary: string;
    source: string;
    publishedAt: string;
    eventType: 'regulatory_shock' | 'earnings_surprise' | 'macro_event' | 'operational_disruption';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    sentiment: number; // -1 to +1
    affectedSectors: string[];
}

export interface EventImpact {
    eventId: number;
    estimatedDrawdown: number;
    volatilityProjection: number;
    exposedHoldings: { ticker: string; exposure: number; estimatedImpact: number }[];
}

export interface PortfolioExposure {
    overallExposure: number;
    sectorExposure: { sector: string; exposure: number; weight: number }[];
}

// Alerts
export interface Alert {
    id: number;
    type: 'risk_threshold' | 'exposure_warning' | 'rebalance_suggestion' | 'behavioral_flag' | 'projection_change';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    title: string;
    message: string;
    explanation: string;
    actionSuggestion: string;
    isRead: boolean;
    createdAt: string;
}

// Explainability
export interface DecisionLogEntry {
    id: number;
    type: 'rebalance_trigger' | 'risk_change' | 'event_impact' | 'user_override';
    timestamp: string;
    title: string;
    explanation: string;
    details: Record<string, unknown>;
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface ExplainabilityData {
    summary: string;
    factors: { name: string; contribution: number; description: string }[];
    assumptions: string[];
    historicalAnalog?: string;
}

// Navigation
export interface NavItem {
    id: string;
    label: string;
    icon: string;
    path: string;
    badge?: number;
}

// Onboarding
export interface OnboardingData {
    name: string;
    dateOfBirth: string;
    country: string;
    annualIncome: number;
    totalSavings: number;
    totalDebt: number;
    spendingCategories: { category: string; monthlyAmount: number }[];
    riskAnswers: number[];
    goals: string[];
    emergencyFundMonths: number;
}

// Toast
export interface Toast {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
}

// Command Palette
export interface CommandItem {
    id: string;
    label: string;
    icon: string;
    action: () => void;
    category: 'navigation' | 'action';
    keywords: string[];
}
