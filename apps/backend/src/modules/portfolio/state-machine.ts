import { prisma } from "../../infrastructure/prisma/client";
import { PORTFOLIO_STATES } from "../../config/constants";
import { BadRequestError } from "../../core/errors";
import { Decimal } from "@prisma/client/runtime/library";
import { logger } from "../../infrastructure/logger/logger";

type PortfolioStateValue =
  (typeof PORTFOLIO_STATES)[keyof typeof PORTFOLIO_STATES];

/* ──────────────────────────────────────────
   Allowed State Transitions
────────────────────────────────────────── */

const VALID_TRANSITIONS: Record<string, string[]> = {
  [PORTFOLIO_STATES.HEALTHY]: [
    PORTFOLIO_STATES.DRIFT_WARNING,
    PORTFOLIO_STATES.RISK_ALERT,
  ],

  [PORTFOLIO_STATES.DRIFT_WARNING]: [
    PORTFOLIO_STATES.HEALTHY,
    PORTFOLIO_STATES.REBALANCE_NEEDED,
    PORTFOLIO_STATES.RISK_ALERT,
  ],

  [PORTFOLIO_STATES.REBALANCE_NEEDED]: [
    PORTFOLIO_STATES.HEALTHY,
    PORTFOLIO_STATES.RISK_ALERT,
  ],

  [PORTFOLIO_STATES.RISK_ALERT]: [
    PORTFOLIO_STATES.HEALTHY,
    PORTFOLIO_STATES.CRITICAL,
  ],

  [PORTFOLIO_STATES.CRITICAL]: [
    PORTFOLIO_STATES.RISK_ALERT,
  ],
};

/* ──────────────────────────────────────────
   Helpers
────────────────────────────────────────── */

function toNum(v: any, fallback = 0): number {
  if (v == null) return fallback;
  if (typeof v === "number") return v;
  if (typeof v === "object" && "toNumber" in v) return v.toNumber();
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/* ──────────────────────────────────────────
   Current State
────────────────────────────────────────── */

export async function getCurrentState(userId: number) {
  const state = await prisma.portfolioState.findFirst({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });

  if (!state) {
    return {
      state: PORTFOLIO_STATES.HEALTHY as PortfolioStateValue,
      healthIndex: null,
    };
  }

  return {
    state: state.state as PortfolioStateValue,
    healthIndex: state.healthIndex ? toNum(state.healthIndex) : null,
  };
}

/* ──────────────────────────────────────────
   Health Index Calculation
────────────────────────────────────────── */

export async function computeHealthIndex(userId: number): Promise<number> {

  const [
    drift,
    behavioral,
    riskMetrics,
    eventImpact,
    holdings,
    wallet
  ] = await Promise.all([

    prisma.portfolioDrift.findFirst({
      where: { userId },
      orderBy: { calculatedAt: "desc" },
    }),

    prisma.behavioralScore.findFirst({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    }),

    prisma.riskMetricsHistory.findFirst({
      where: { userId },
      orderBy: { calculatedAt: "desc" },
    }),

    prisma.portfolioEventImpact.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),

    prisma.holding.findMany({
      where: { userId },
    }),

    prisma.wallet.findUnique({
      where: { userId },
    }),
  ]);

  /* ───── Drift Risk ───── */

  const driftScore = toNum(drift?.driftScore);

  const driftRisk = Math.min(100, driftScore * 1.2);

  /* ───── Behavioral Risk ───── */

  const behavioralRisk =
    behavioral?.adaptiveRiskScore != null
      ? 100 - toNum(behavioral.adaptiveRiskScore)
      : 30;

  /* ───── Market Risk ───── */

  const volatility = toNum(riskMetrics?.volatility, 0.2);

  const drawdown = Math.abs(
    toNum(riskMetrics?.maxDrawdown, 0.05)
  );

  const marketRisk =
    Math.min(100, volatility * 120 + drawdown * 80);

  /* ───── Liquidity Risk ───── */

  const walletBalance = toNum(wallet?.balance);

  let liquidityRisk = 50;

  if (walletBalance > 0) {
    liquidityRisk = Math.max(
      10,
      40 - walletBalance * 0.0005
    );
  }

  /* ───── Concentration Risk ───── */

  const holdingCount = holdings?.length ?? 0;

  let concentrationRisk = 20;

  if (holdingCount <= 2) concentrationRisk = 70;
  else if (holdingCount <= 5) concentrationRisk = 40;

  /* ───── Event Risk ───── */

  let eventRisk = 0;

  if (eventImpact.length > 0) {

    const avgImpact =
      eventImpact.reduce(
        (s, e) => s + toNum(e.impactScore),
        0
      ) / eventImpact.length;

    eventRisk = Math.min(80, avgImpact);
  }

  /* ───── Weighted Risk Score ───── */

  const totalRisk =
      0.25 * driftRisk +
      0.20 * behavioralRisk +
      0.20 * marketRisk +
      0.15 * liquidityRisk +
      0.10 * concentrationRisk +
      0.10 * eventRisk;

  const health =
    Math.max(0, Math.min(100, 100 - totalRisk));

  return Math.round(health);
}

/* ──────────────────────────────────────────
   State Mapping
────────────────────────────────────────── */

export async function stateFromHealth(
  health: number
): PortfolioStateValue {

  if (health >= 80) return PORTFOLIO_STATES.HEALTHY;
  if (health >= 60) return PORTFOLIO_STATES.DRIFT_WARNING;
  if (health >= 40) return PORTFOLIO_STATES.REBALANCE_NEEDED;
  if (health >= 25) return PORTFOLIO_STATES.RISK_ALERT;

  return PORTFOLIO_STATES.CRITICAL;
}

/* ──────────────────────────────────────────
   State Transition
────────────────────────────────────────── */

export async function transitionState(
  userId: number,
  newState: PortfolioStateValue
) {

  const current = await getCurrentState(userId);

  const healthIndex =
    await computeHealthIndex(userId);

  const allowed = VALID_TRANSITIONS[current.state];

  if (!allowed?.includes(newState)) {
    throw new BadRequestError(
      `Invalid state transition: ${current.state} → ${newState}`
    );
  }

  const record = await prisma.portfolioState.create({
    data: {
      userId,
      state: newState,
      healthIndex: new Decimal(healthIndex),
    },
  });

  logger.info(
    `Portfolio state change [user=${userId}]: ${current.state} → ${newState}`
  );

  return {
    state: record.state,
    healthIndex: toNum(record.healthIndex),
    updatedAt: record.updatedAt,
  };
}