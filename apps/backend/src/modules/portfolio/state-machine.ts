import { prisma } from "../../infrastructure/prisma/client";
import { PORTFOLIO_STATES } from "../../config/constants";
import { BadRequestError } from "../../core/errors";
import { Decimal } from "@prisma/client/runtime/library";
import { logger } from "../../infrastructure/logger/logger";

type PortfolioStateValue = (typeof PORTFOLIO_STATES)[keyof typeof PORTFOLIO_STATES];

/**
 * Allowed state transitions:
 *   HEALTHY → DRIFT_WARNING → REBALANCE_NEEDED → HEALTHY
 *   Any state → RISK_ALERT → CRITICAL
 *   RISK_ALERT → HEALTHY
 *   CRITICAL → RISK_ALERT → HEALTHY
 */
const VALID_TRANSITIONS: Record<string, string[]> = {
  [PORTFOLIO_STATES.HEALTHY]: [PORTFOLIO_STATES.DRIFT_WARNING, PORTFOLIO_STATES.RISK_ALERT],
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
  [PORTFOLIO_STATES.CRITICAL]: [PORTFOLIO_STATES.RISK_ALERT],
};

export async function getCurrentState(userId: number) {
  const state = await prisma.portfolioState.findFirst({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });

  return state
    ? { state: state.state as PortfolioStateValue, healthIndex: state.healthIndex ? Number(state.healthIndex) : null }
    : { state: PORTFOLIO_STATES.HEALTHY as PortfolioStateValue, healthIndex: null };
}

export async function transitionState(
  userId: number,
  newState: PortfolioStateValue,
  healthIndex?: number
) {
  const current = await getCurrentState(userId);

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
      healthIndex: healthIndex !== undefined ? new Decimal(healthIndex) : null,
    },
  });

  logger.info(`Portfolio state change [user=${userId}]: ${current.state} → ${newState}`);

  return {
    state: record.state,
    healthIndex: record.healthIndex ? Number(record.healthIndex) : null,
    updatedAt: record.updatedAt,
  };
}
