// ============================================
// VERIDION AI — DEMO DATA
// ============================================
import type {
    Holding, PortfolioSnapshot, PortfolioStateInfo, Portfolio,
    RiskMetrics, RiskContribution, FrontierPoint, CovarianceData,
    OptimizationRun, MonteCarloResult, FinancialGoal, BehavioralScore,
    SpendingMetrics, NewsEvent, EventImpact, PortfolioExposure,
    Alert, DecisionLogEntry, ExplainabilityData, User,
} from '../types';

// ── Helpers ──
function daysAgo(n: number): string {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString();
}

function hoursAgo(n: number): string {
    const d = new Date();
    d.setHours(d.getHours() - n);
    return d.toISOString();
}

// ── User ──
export const demoUser: User = {
    id: 1,
    email: 'demo@veridion.ai',
    name: 'Alex Thompson',
    role: 'investor',
};

// ── Holdings ──
export const demoHoldings: Holding[] = [
    { ticker: 'VTI', name: 'Vanguard Total Stock', assetClass: 'Equity', sector: 'Broad Market', weight: 0.35, value: 87500, shares: 342, price: 255.85, change24h: 0.42 },
    { ticker: 'VXUS', name: 'Vanguard Intl Stock', assetClass: 'Equity', sector: 'International', weight: 0.20, value: 50000, shares: 833, price: 60.02, change24h: -0.18 },
    { ticker: 'BND', name: 'Vanguard Total Bond', assetClass: 'Fixed Income', sector: 'Bonds', weight: 0.20, value: 50000, shares: 680, price: 73.53, change24h: 0.05 },
    { ticker: 'VNQ', name: 'Vanguard Real Estate', assetClass: 'Real Estate', sector: 'REIT', weight: 0.10, value: 25000, shares: 269, price: 92.94, change24h: -0.32 },
    { ticker: 'GLD', name: 'SPDR Gold Shares', assetClass: 'Commodity', sector: 'Precious Metals', weight: 0.08, value: 20000, shares: 95, price: 210.53, change24h: 0.88 },
    { ticker: 'TIP', name: 'iShares TIPS Bond', assetClass: 'Fixed Income', sector: 'Inflation-Protected', weight: 0.07, value: 17500, shares: 155, price: 112.90, change24h: 0.02 },
];

// ── Portfolio ──
export const demoPortfolio: Portfolio = {
    totalValue: 250000,
    totalReturn: 0.1247,
    holdings: demoHoldings,
};

export const demoPortfolioState: PortfolioStateInfo = {
    state: 'Stable',
    healthIndex: 82,
    message: 'Portfolio is well-balanced and tracking toward goals.',
};

// ── Snapshots (90 days) ──
export const demoSnapshots: PortfolioSnapshot[] = Array.from({ length: 90 }, (_, i) => {
    const base = 225000;
    const trend = (i / 90) * 25000;
    const noise = (Math.sin(i * 0.3) * 3000) + (Math.cos(i * 0.7) * 2000);
    const val = base + trend + noise;
    return {
        date: daysAgo(89 - i),
        totalValue: Math.round(val * 100) / 100,
        dailyReturn: ((Math.sin(i * 0.5) * 0.015) + 0.001),
    };
});

// ── Risk Metrics ──
export const demoRiskMetrics: RiskMetrics = {
    volatility: 0.142,
    sharpeRatio: 1.28,
    sortinoRatio: 1.65,
    maxDrawdown: -0.087,
    var95: -0.023,
    cvar95: -0.034,
    beta: 0.85,
    trackingError: 0.032,
    date: daysAgo(0),
};

export const demoRiskHistory: RiskMetrics[] = Array.from({ length: 30 }, (_, i) => ({
    volatility: 0.12 + Math.sin(i * 0.2) * 0.03,
    sharpeRatio: 1.1 + Math.cos(i * 0.15) * 0.3,
    sortinoRatio: 1.4 + Math.sin(i * 0.18) * 0.4,
    maxDrawdown: -0.06 - Math.abs(Math.sin(i * 0.25)) * 0.04,
    var95: -0.018 - Math.abs(Math.cos(i * 0.3)) * 0.01,
    cvar95: -0.028 - Math.abs(Math.sin(i * 0.22)) * 0.012,
    beta: 0.8 + Math.sin(i * 0.12) * 0.1,
    trackingError: 0.025 + Math.cos(i * 0.2) * 0.01,
    date: daysAgo(29 - i),
}));

export const demoRiskContributions: RiskContribution[] = [
    { ticker: 'VTI', name: 'Vanguard Total Stock', contribution: 0.42, weight: 0.35 },
    { ticker: 'VXUS', name: 'Vanguard Intl Stock', contribution: 0.28, weight: 0.20 },
    { ticker: 'VNQ', name: 'Vanguard Real Estate', contribution: 0.14, weight: 0.10 },
    { ticker: 'GLD', name: 'SPDR Gold Shares', contribution: 0.09, weight: 0.08 },
    { ticker: 'BND', name: 'Vanguard Total Bond', contribution: 0.04, weight: 0.20 },
    { ticker: 'TIP', name: 'iShares TIPS Bond', contribution: 0.03, weight: 0.07 },
];

export const demoFrontier: FrontierPoint[] = Array.from({ length: 20 }, (_, i) => ({
    volatility: 0.05 + i * 0.015,
    expectedReturn: 0.03 + i * 0.008 - (i > 12 ? (i - 12) * 0.002 : 0),
    isOptimal: i === 10,
    isCurrent: i === 8,
}));

export const demoCovariance: CovarianceData = {
    tickers: ['VTI', 'VXUS', 'BND', 'VNQ', 'GLD', 'TIP'],
    matrix: [
        [1.00, 0.82, -0.15, 0.65, 0.05, -0.10],
        [0.82, 1.00, -0.10, 0.55, 0.10, -0.08],
        [-0.15, -0.10, 1.00, 0.15, 0.25, 0.85],
        [0.65, 0.55, 0.15, 1.00, 0.12, 0.10],
        [0.05, 0.10, 0.25, 0.12, 1.00, 0.30],
        [-0.10, -0.08, 0.85, 0.10, 0.30, 1.00],
    ],
};

// ── Optimization ──
export const demoOptimizationRuns: OptimizationRun[] = [
    {
        id: 1,
        timestamp: daysAgo(2),
        status: 'completed',
        objectiveFunction: 'maximize_sharpe',
        result: { expectedReturn: 0.092, volatility: 0.118, sharpeRatio: 1.42, weights: { VTI: 0.38, VXUS: 0.18, BND: 0.22, VNQ: 0.08, GLD: 0.07, TIP: 0.07 } },
    },
    {
        id: 2,
        timestamp: daysAgo(15),
        status: 'completed',
        objectiveFunction: 'minimize_volatility',
        result: { expectedReturn: 0.065, volatility: 0.082, sharpeRatio: 1.15, weights: { VTI: 0.25, VXUS: 0.12, BND: 0.35, VNQ: 0.05, GLD: 0.10, TIP: 0.13 } },
    },
];

// ── Monte Carlo ──
const generatePercentiles = (years: number, target: number) => {
    const pts = years * 4;
    const make = (base: number, growth: number) =>
        Array.from({ length: pts }, (_, i) => Math.round(base + (growth * (i / pts)) + Math.sin(i * 0.3) * base * 0.05));
    return {
        p10: make(target * 0.3, target * 0.3),
        p25: make(target * 0.4, target * 0.4),
        p50: make(target * 0.5, target * 0.55),
        p75: make(target * 0.55, target * 0.7),
        p90: make(target * 0.6, target * 0.9),
    };
};

export const demoMonteCarloResults: MonteCarloResult[] = [
    {
        goalId: 1,
        probability: 78,
        percentiles: generatePercentiles(25, 1500000),
        terminalValues: Array.from({ length: 100 }, () => 800000 + Math.random() * 1200000),
        statistics: { mean: 1350000, median: 1280000, std: 320000, probabilityOfLoss: 0.04 },
    },
    {
        goalId: 2,
        probability: 92,
        percentiles: generatePercentiles(5, 120000),
        terminalValues: Array.from({ length: 100 }, () => 80000 + Math.random() * 80000),
        statistics: { mean: 118000, median: 115000, std: 25000, probabilityOfLoss: 0.02 },
    },
    {
        goalId: 3,
        probability: 65,
        percentiles: generatePercentiles(10, 200000),
        terminalValues: Array.from({ length: 100 }, () => 100000 + Math.random() * 200000),
        statistics: { mean: 185000, median: 175000, std: 55000, probabilityOfLoss: 0.08 },
    },
];

// ── Goals ──
export const demoGoals: FinancialGoal[] = [
    { id: 1, name: 'Retirement Fund', type: 'retirement', targetAmount: 1500000, currentAmount: 250000, timeHorizonYears: 25, monthlyContribution: 2500, probability: 78, priority: 'high', createdAt: daysAgo(180) },
    { id: 2, name: 'Down Payment', type: 'house', targetAmount: 120000, currentAmount: 45000, timeHorizonYears: 5, monthlyContribution: 1200, probability: 92, priority: 'high', createdAt: daysAgo(90) },
    { id: 3, name: 'Education Fund', type: 'education', targetAmount: 200000, currentAmount: 35000, timeHorizonYears: 10, monthlyContribution: 800, probability: 65, priority: 'medium', createdAt: daysAgo(60) },
];

// ── Behavioral ──
export const demoBehavioralScore: BehavioralScore = {
    adaptiveRiskScore: 72,
    panicSellingIndex: 0.18,
    recencyBias: 0.32,
    riskChasing: 0.22,
    liquidityStress: 0.15,
    date: daysAgo(0),
};

export const demoBehavioralHistory: BehavioralScore[] = Array.from({ length: 30 }, (_, i) => ({
    adaptiveRiskScore: 65 + Math.sin(i * 0.2) * 10,
    panicSellingIndex: 0.15 + Math.sin(i * 0.3) * 0.1,
    recencyBias: 0.28 + Math.cos(i * 0.25) * 0.12,
    riskChasing: 0.2 + Math.sin(i * 0.18) * 0.08,
    liquidityStress: 0.12 + Math.cos(i * 0.22) * 0.06,
    date: daysAgo(29 - i),
}));

export const demoSpendingMetrics: SpendingMetrics = {
    monthlyBurnRate: 6200,
    savingsRate: 0.38,
    expenseVolatility: 0.12,
    categories: [
        { name: 'Housing', amount: 2200, percentage: 0.355 },
        { name: 'Transportation', amount: 650, percentage: 0.105 },
        { name: 'Food & Dining', amount: 850, percentage: 0.137 },
        { name: 'Utilities', amount: 380, percentage: 0.061 },
        { name: 'Health', amount: 420, percentage: 0.068 },
        { name: 'Entertainment', amount: 350, percentage: 0.056 },
        { name: 'Other', amount: 1350, percentage: 0.218 },
    ],
};

// ── Events ──
export const demoEvents: NewsEvent[] = [
    { id: 1, headline: 'Fed Signals Rate Pause Amid Cooling Inflation', summary: 'The Federal Reserve indicated a potential pause in rate hikes as inflation data shows consistent cooling trends across core CPI metrics.', source: 'Reuters', publishedAt: hoursAgo(2), eventType: 'macro_event', severity: 'HIGH', sentiment: 0.35, affectedSectors: ['Bonds', 'Broad Market', 'REIT'] },
    { id: 2, headline: 'EU Proposes New ESG Reporting Requirements', summary: 'European Commission drafts stricter ESG disclosure rules that could affect international fund compositions and compliance costs.', source: 'Financial Times', publishedAt: hoursAgo(5), eventType: 'regulatory_shock', severity: 'MEDIUM', sentiment: -0.15, affectedSectors: ['International'] },
    { id: 3, headline: 'Gold Prices Surge on Geopolitical Tensions', summary: 'Safe-haven demand pushes gold to 3-month highs as Middle East tensions escalate and central banks increase reserves.', source: 'Bloomberg', publishedAt: hoursAgo(8), eventType: 'macro_event', severity: 'MEDIUM', sentiment: 0.45, affectedSectors: ['Precious Metals'] },
    { id: 4, headline: 'Major Tech Earnings Beat Expectations', summary: 'Big tech companies report stronger-than-expected Q4 earnings, driving broad market sentiment higher.', source: 'CNBC', publishedAt: hoursAgo(14), eventType: 'earnings_surprise', severity: 'LOW', sentiment: 0.62, affectedSectors: ['Broad Market'] },
    { id: 5, headline: 'Commercial Real Estate Sees Increased Vacancy Rates', summary: 'Office vacancy rates reach new highs in major metro areas, pressuring REIT valuations and rental income projections.', source: 'WSJ', publishedAt: hoursAgo(20), eventType: 'operational_disruption', severity: 'HIGH', sentiment: -0.48, affectedSectors: ['REIT'] },
    { id: 6, headline: 'Emerging Market Currencies Under Pressure', summary: 'Dollar strength drives capital outflows from emerging markets, affecting international equity valuations.', source: 'Reuters', publishedAt: daysAgo(1), eventType: 'macro_event', severity: 'MEDIUM', sentiment: -0.28, affectedSectors: ['International'] },
    { id: 7, headline: 'Infrastructure Bill Passes Senate Committee', summary: 'Bipartisan infrastructure legislation advances with $1.2T in spending that could boost real estate and materials sectors.', source: 'AP', publishedAt: daysAgo(1), eventType: 'regulatory_shock', severity: 'LOW', sentiment: 0.52, affectedSectors: ['REIT', 'Broad Market'] },
    { id: 8, headline: 'Supply Chain Disruptions Re-Emerge', summary: 'New shipping route disruptions threaten to reignite supply chain issues and inflationary pressures globally.', source: 'Bloomberg', publishedAt: daysAgo(2), eventType: 'operational_disruption', severity: 'CRITICAL', sentiment: -0.65, affectedSectors: ['Broad Market', 'International', 'Inflation-Protected'] },
    { id: 9, headline: 'Treasury Yields Hit 6-Month Low', summary: 'Flight to safety pushes treasury yields down, benefiting fixed income portfolios and TIPS.', source: 'CNBC', publishedAt: daysAgo(2), eventType: 'macro_event', severity: 'MEDIUM', sentiment: 0.2, affectedSectors: ['Bonds', 'Inflation-Protected'] },
    { id: 10, headline: 'AI Sector Valuation Concerns Mount', summary: 'Analysts warn of potential overvaluation in AI-related stocks as revenue growth fails to justify current multiples.', source: 'Financial Times', publishedAt: daysAgo(3), eventType: 'earnings_surprise', severity: 'HIGH', sentiment: -0.42, affectedSectors: ['Broad Market'] },
];

export const demoEventImpact: EventImpact = {
    eventId: 1,
    estimatedDrawdown: -0.018,
    volatilityProjection: 0.16,
    exposedHoldings: [
        { ticker: 'BND', exposure: 0.85, estimatedImpact: 0.012 },
        { ticker: 'VTI', exposure: 0.45, estimatedImpact: -0.008 },
        { ticker: 'VNQ', exposure: 0.62, estimatedImpact: 0.015 },
    ],
};

export const demoPortfolioExposure: PortfolioExposure = {
    overallExposure: 0.42,
    sectorExposure: [
        { sector: 'Broad Market', exposure: 0.65, weight: 0.35 },
        { sector: 'International', exposure: 0.38, weight: 0.20 },
        { sector: 'Bonds', exposure: 0.15, weight: 0.20 },
        { sector: 'REIT', exposure: 0.72, weight: 0.10 },
        { sector: 'Precious Metals', exposure: 0.28, weight: 0.08 },
        { sector: 'Inflation-Protected', exposure: 0.20, weight: 0.07 },
    ],
};

// ── Alerts ──
export const demoAlerts: Alert[] = [
    { id: 1, type: 'risk_threshold', severity: 'HIGH', title: 'VaR Threshold Exceeded', message: 'Portfolio Value-at-Risk has exceeded your 2.5% daily threshold.', explanation: 'Increased market volatility from recent Fed commentary has pushed your VaR from 2.1% to 2.8%.', actionSuggestion: 'Consider reviewing your equity allocation or adding hedging positions.', isRead: false, createdAt: hoursAgo(1) },
    { id: 2, type: 'exposure_warning', severity: 'CRITICAL', title: 'Supply Chain Event Exposure', message: 'Your portfolio has significant exposure to the supply chain disruption event.', explanation: 'Holdings in VTI and VXUS represent 55% of your portfolio and are affected by global supply chain concerns.', actionSuggestion: 'Monitor the situation. Your diversification helps limit maximum drawdown to ~3.2%.', isRead: false, createdAt: hoursAgo(3) },
    { id: 3, type: 'rebalance_suggestion', severity: 'MEDIUM', title: 'Allocation Drift Detected', message: 'VTI has drifted 2.3% above target weight due to recent gains.', explanation: 'Equity outperformance has pushed VTI from 35% target to 37.3%.', actionSuggestion: 'A rebalance would bring your risk profile back in line with your target allocation.', isRead: false, createdAt: hoursAgo(6) },
    { id: 4, type: 'behavioral_flag', severity: 'LOW', title: 'Recency Bias Detected', message: 'Your recent activity suggests increased recency bias in decision-making.', explanation: 'Analysis of your portfolio check frequency and reaction patterns shows a correlation with recent market news.', actionSuggestion: 'Focus on long-term strategy. Your 25-year retirement goal is still on track at 78% probability.', isRead: true, createdAt: hoursAgo(12) },
    { id: 5, type: 'projection_change', severity: 'MEDIUM', title: 'Retirement Goal Probability Changed', message: 'Your retirement fund probability decreased from 81% to 78%.', explanation: 'Updated market assumptions and recent volatility have slightly reduced your projected path.', actionSuggestion: 'A $200/month increase in contributions would restore probability to 82%.', isRead: true, createdAt: daysAgo(1) },
    { id: 6, type: 'risk_threshold', severity: 'LOW', title: 'Beta Below Target Range', message: 'Portfolio beta has dropped to 0.78, below your 0.80 floor.', explanation: 'Recent gold and bond appreciation have reduced market sensitivity.', actionSuggestion: 'This is within acceptable tolerance. Monitor for continued decline.', isRead: true, createdAt: daysAgo(1) },
    { id: 7, type: 'exposure_warning', severity: 'HIGH', title: 'REIT Sector Concentration', message: 'Real estate sector showing elevated risk due to vacancy rate concerns.', explanation: 'VNQ exposure of 10% combined with high sector volatility increases concentration risk.', actionSuggestion: 'Review REIT allocation in next rebalancing cycle.', isRead: true, createdAt: daysAgo(2) },
    { id: 8, type: 'rebalance_suggestion', severity: 'LOW', title: 'TIP Underweight Opportunity', message: 'Inflation-protected bonds are underweight by 1.2% from target.', explanation: 'With inflation expectations stabilizing, TIPS may offer favorable risk-adjusted returns.', actionSuggestion: 'Consider increasing TIP allocation during next rebalance.', isRead: true, createdAt: daysAgo(2) },
    { id: 9, type: 'behavioral_flag', severity: 'MEDIUM', title: 'Portfolio Check Frequency Spike', message: 'You have checked your portfolio 12 times today, above your 3x daily average.', explanation: 'Frequent monitoring during volatile periods is associated with suboptimal decision-making.', actionSuggestion: 'Consider setting specific check-in times rather than reactive monitoring.', isRead: true, createdAt: daysAgo(3) },
    { id: 10, type: 'projection_change', severity: 'HIGH', title: 'Education Fund At Risk', message: 'Education fund probability dropped below 70% threshold to 65%.', explanation: 'Increased tuition cost projections and lower expected returns have impacted this goal.', actionSuggestion: 'Extending time horizon by 2 years or increasing monthly contribution by $300 would help.', isRead: true, createdAt: daysAgo(3) },
    { id: 11, type: 'risk_threshold', severity: 'MEDIUM', title: 'Volatility Spike Detected', message: 'Portfolio volatility jumped 18% in the last 5 trading days.', explanation: 'Fed commentary and geopolitical tensions have increased broad market volatility.', actionSuggestion: 'Your bonds and gold positions are providing some buffer. No immediate action needed.', isRead: true, createdAt: daysAgo(4) },
    { id: 12, type: 'exposure_warning', severity: 'LOW', title: 'International Exposure Below Target', message: 'VXUS allocation has drifted 1.5% below target due to underperformance.', explanation: 'Dollar strength has weighed on international equity returns.', actionSuggestion: 'This will be addressed in the next scheduled rebalance.', isRead: true, createdAt: daysAgo(5) },
    { id: 13, type: 'rebalance_suggestion', severity: 'HIGH', title: 'Quarterly Rebalance Due', message: 'Your scheduled quarterly rebalance is due in 3 days.', explanation: 'Regular rebalancing helps maintain your target risk profile and capture rebalancing premium.', actionSuggestion: 'Review proposed rebalance trades in the Portfolio section.', isRead: true, createdAt: daysAgo(5) },
    { id: 14, type: 'behavioral_flag', severity: 'LOW', title: 'Savings Rate Improvement', message: 'Your savings rate has improved from 35% to 38% this month.', explanation: 'Reduced discretionary spending has boosted your savings capacity.', actionSuggestion: 'Consider directing extra savings toward your education fund goal.', isRead: true, createdAt: daysAgo(6) },
    { id: 15, type: 'projection_change', severity: 'LOW', title: 'Down Payment Goal On Track', message: 'Down payment goal probability stable at 92%.', explanation: 'Consistent contributions and moderate returns keep this goal well-funded.', actionSuggestion: 'No changes needed. Continue current contribution level.', isRead: true, createdAt: daysAgo(7) },
];

// ── Decision Log ──
export const demoDecisionLog: DecisionLogEntry[] = [
    { id: 1, type: 'rebalance_trigger', timestamp: hoursAgo(6), title: 'Allocation Drift Rebalance Triggered', explanation: 'VTI weight exceeded 37% threshold. System triggered rebalance analysis to bring allocation back to 35% target.', details: { trigger: 'drift', asset: 'VTI', actual: 0.373, target: 0.35 }, severity: 'MEDIUM' },
    { id: 2, type: 'risk_change', timestamp: daysAgo(1), title: 'Risk Score Updated After Fed Commentary', explanation: 'Fed rate pause signal reduced implied volatility. Portfolio risk metrics recalculated with updated market data.', details: { previousVol: 0.158, newVol: 0.142, trigger: 'market_data' }, severity: 'HIGH' },
    { id: 3, type: 'event_impact', timestamp: daysAgo(2), title: 'Supply Chain Disruption Impact Assessed', explanation: 'New shipping route disruptions detected. Impact analysis run across all holdings. Maximum estimated drawdown: 3.2%.', details: { eventId: 8, drawdown: -0.032, exposedAssets: 3 }, severity: 'HIGH' },
    { id: 4, type: 'user_override', timestamp: daysAgo(3), title: 'User Maintained Current Allocation', explanation: 'System suggested reducing VNQ by 2%. User reviewed and chose to maintain current REIT allocation.', details: { suggestion: 'reduce_vnq', action: 'override' }, severity: 'LOW' },
    { id: 5, type: 'rebalance_trigger', timestamp: daysAgo(5), title: 'Quarterly Rebalance Executed', explanation: 'Scheduled quarterly rebalance completed. 6 trades executed to restore target allocation. Total turnover: 4.2%.', details: { trades: 6, turnover: 0.042, cost: 12.50 }, severity: 'MEDIUM' },
    { id: 6, type: 'risk_change', timestamp: daysAgo(7), title: 'Behavioral Risk Score Adjusted', explanation: 'Adaptive risk algorithm detected lower panic selling tendency. Risk tolerance adjusted upward by 3 points.', details: { previous: 69, new: 72, factor: 'panic_selling_improvement' }, severity: 'LOW' },
    { id: 7, type: 'event_impact', timestamp: daysAgo(10), title: 'Gold Price Surge Impact', explanation: 'Geopolitical tensions drove gold up 2.3%. GLD position valued higher, improving portfolio diversification metrics.', details: { eventId: 3, gldChange: 0.023, diversificationImprovement: 0.015 }, severity: 'LOW' },
    { id: 8, type: 'rebalance_trigger', timestamp: daysAgo(14), title: 'Tax-Loss Harvesting Opportunity', explanation: 'VXUS showing short-term losses suitable for tax-loss harvesting. Estimated tax benefit: $340.', details: { asset: 'VXUS', loss: -1200, taxBenefit: 340 }, severity: 'MEDIUM' },
];

// ── Explainability ──
export const demoRiskExplanation: ExplainabilityData = {
    summary: 'Your portfolio risk is currently at a moderate level, driven primarily by equity exposure in VTI and VXUS. Bond and gold positions provide meaningful diversification.',
    factors: [
        { name: 'Equity Concentration', contribution: 0.42, description: 'VTI and VXUS combined represent 55% of your portfolio, driving most of the portfolio variance.' },
        { name: 'Market Regime', contribution: 0.25, description: 'Current moderate-volatility environment with elevated uncertainty contributes to above-average risk readings.' },
        { name: 'Diversification Benefit', contribution: -0.18, description: 'Low correlation between bonds, gold, and equities reduces overall portfolio risk by 18%.' },
        { name: 'REIT Sector Risk', contribution: 0.12, description: 'Commercial real estate headwinds are adding incremental risk through VNQ exposure.' },
    ],
    assumptions: [
        'Risk calculations use 252 trading day rolling window',
        'Covariance estimates use exponentially weighted method (lambda = 0.94)',
        'VaR computed using parametric method assuming normal distribution',
        'Monte Carlo simulations use 10,000 paths with geometric Brownian motion',
    ],
    historicalAnalog: 'Current market conditions most closely resemble Q2 2019 — moderate vol, Fed pivot expectations, mixed global growth signals.',
};
