// ============================================
// VERIDION AI — CONSTANTS
// ============================================

export const ROUTES = {
    LANDING: '/',
    LOGIN: '/login',
    REGISTER: '/register',
    ONBOARDING: '/onboarding',
    DASHBOARD: '/dashboard',
    PORTFOLIO: '/portfolio',
    RISK: '/risk',
    GOALS: '/goals',
    BEHAVIORAL: '/behavioral',
    EVENTS: '/events',
    SIMULATION: '/simulation',
    ALERTS: '/alerts',
    AUDIT: '/audit',
    PROFILE: '/profile',
    SETTINGS: '/settings',
} as const;

export const NAV_ITEMS = [
    { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', path: ROUTES.DASHBOARD },
    { id: 'portfolio', label: 'Portfolio', icon: 'Briefcase', path: ROUTES.PORTFOLIO },
    { id: 'risk', label: 'Risk Analysis', icon: 'Shield', path: ROUTES.RISK },
    { id: 'goals', label: 'Goals', icon: 'Target', path: ROUTES.GOALS },
    { id: 'events', label: 'Event Intel', icon: 'Newspaper', path: ROUTES.EVENTS },
    { id: 'behavioral', label: 'Behavioral', icon: 'Brain', path: ROUTES.BEHAVIORAL },
    { id: 'simulation', label: 'Sim Lab', icon: 'FlaskConical', path: ROUTES.SIMULATION },
    { id: 'alerts', label: 'Alerts', icon: 'Bell', path: ROUTES.ALERTS },
    { id: 'audit', label: 'Audit Log', icon: 'FileText', path: ROUTES.AUDIT },
] as const;

export const NAV_BOTTOM_ITEMS = [
    { id: 'settings', label: 'Settings', icon: 'Settings', path: ROUTES.SETTINGS },
    { id: 'profile', label: 'Profile', icon: 'UserCircle', path: ROUTES.PROFILE },
] as const;

export const MOBILE_NAV_ITEMS = [
    { id: 'dashboard', label: 'Home', icon: 'LayoutDashboard', path: ROUTES.DASHBOARD },
    { id: 'portfolio', label: 'Portfolio', icon: 'Briefcase', path: ROUTES.PORTFOLIO },
    { id: 'goals', label: 'Goals', icon: 'Target', path: ROUTES.GOALS },
    { id: 'events', label: 'Events', icon: 'Newspaper', path: ROUTES.EVENTS },
    { id: 'more', label: 'More', icon: 'Menu', path: '' },
] as const;

export const ACCENT_PRESETS = [
    { name: 'Teal', value: '#00D4AA' },
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Purple', value: '#8B5CF6' },
    { name: 'Gold', value: '#F5A623' },
] as const;

export const TIME_HORIZONS = ['1M', '3M', '6M', '1Y', 'All'] as const;

export const ALERT_CATEGORIES = [
    { id: 'all', label: 'All' },
    { id: 'risk_threshold', label: 'Risk Alerts' },
    { id: 'exposure_warning', label: 'Event Alerts' },
    { id: 'rebalance_suggestion', label: 'Rebalancing' },
    { id: 'behavioral_flag', label: 'Behavioral' },
    { id: 'projection_change', label: 'Projections' },
] as const;

export const GLOSSARY: Record<string, string> = {
    'Sharpe Ratio': 'Risk-adjusted return metric. Higher values indicate better returns per unit of risk taken.',
    'Sortino Ratio': 'Like Sharpe but only penalizes downside volatility, which better matches investor concerns.',
    'VaR (95%)': 'Value at Risk — the maximum loss expected in 95% of scenarios over a given period.',
    'CVaR': 'Conditional VaR — the average loss in the worst 5% of scenarios. Captures tail risk.',
    'Max Drawdown': 'The largest peak-to-trough decline in portfolio value, measuring worst-case loss.',
    'Volatility': 'Annualized standard deviation of returns, measuring how much portfolio value fluctuates.',
    'Beta': 'Sensitivity to market movements. A beta of 1.0 means the portfolio moves with the market.',
    'Tracking Error': 'How closely the portfolio follows its benchmark, measured as standard deviation of excess returns.',
    'Health Index': 'A 0–100 composite score reflecting overall portfolio health across risk, goals, and behavioral factors.',
    'Adaptive Risk Score': 'Your effective risk tolerance adjusted for behavioral biases and market conditions (0–100).',
    'Monte Carlo Simulation': 'Running thousands of random scenarios to estimate the probability of reaching financial goals.',
    'Efficient Frontier': 'The set of portfolios offering the highest return for each level of risk.',
    'Covariance Matrix': 'Shows how different assets move together, used to optimize diversification.',
    'Panic Selling Index': 'Measures tendency to sell during market drops (0=calm, 1=panic-prone).',
    'Recency Bias': 'Tendency to overweight recent events in decision-making (0=rational, 1=highly biased).',
    'Risk Chasing': 'Tendency to increase risk during bull markets (0=disciplined, 1=chasing returns).',
    'Liquidity Stress': 'Measures whether spending patterns threaten investment stability (0=comfortable, 1=stressed).',
    'Rebalancing': 'Adjusting portfolio weights back toward target allocation to maintain risk profile.',
    'Burn Rate': 'Monthly spending rate showing how quickly savings are being depleted.',
    'Savings Rate': 'Percentage of income saved each month, indicating financial discipline.',
    'Expense Volatility': 'How much monthly spending fluctuates, with lower being more predictable.',
};

export const GOAL_ICONS: Record<string, string> = {
    retirement: '🏖️',
    house: '🏠',
    education: '🎓',
    custom: '🎯',
};

export const SIMULATION_DEFAULTS = {
    volatilityMultiplier: 1,
    crashDepth: -30,
    inflationRate: 3,
    interestRateShock: 0,
    numPaths: 5000,
};
