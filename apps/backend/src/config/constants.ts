// ── Auth ──────────────────────────────────────────────
export const BCRYPT_SALT_ROUNDS = 12;

// ── Pagination ───────────────────────────────────────
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// ── Portfolio ────────────────────────────────────────
export const PORTFOLIO_STATES = {
  HEALTHY: "HEALTHY",
  DRIFT_WARNING: "DRIFT_WARNING",
  REBALANCE_NEEDED: "REBALANCE_NEEDED",
  RISK_ALERT: "RISK_ALERT",
  CRITICAL: "CRITICAL",
} as const;

export const ASSET_TYPES = {
  STOCK: "STOCK",
  ETF: "ETF",
  BOND: "BOND",
  CRYPTO: "CRYPTO",
  CASH: "CASH",
  COMMODITY: "COMMODITY",
} as const;

// ── Risk ─────────────────────────────────────────────
export const RISK_DEFAULTS = {
  VAR_CONFIDENCE: 0.95,
  LOOKBACK_DAYS: 252,
  RISK_FREE_RATE: 0.04, // 4% annual
} as const;

// ── Alerts ───────────────────────────────────────────
export const ALERT_SEVERITY = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  CRITICAL: "CRITICAL",
} as const;

export const ALERT_TYPES = {
  DRIFT: "DRIFT",
  DRAWDOWN: "DRAWDOWN",
  VOLATILITY_SPIKE: "VOLATILITY_SPIKE",
  EVENT_IMPACT: "EVENT_IMPACT",
  GOAL_AT_RISK: "GOAL_AT_RISK",
  LIQUIDITY_WARNING: "LIQUIDITY_WARNING",
} as const;

// ── Roles ────────────────────────────────────────────
export const ROLES = {
  USER: "USER",
  ADMIN: "ADMIN",
} as const;
