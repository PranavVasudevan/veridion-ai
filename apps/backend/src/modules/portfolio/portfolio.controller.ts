import { Router, Request, Response } from "express";
import { authenticate } from "../auth/auth.middleware";
import { asyncHandler, sendSuccess, sendCreated } from "../../core/utils";
import { BadRequestError } from "../../core/errors";
import { AuthenticatedRequest } from "../../core/interfaces";

import * as portfolioService from "./portfolio.service";
import * as holdingsService from "./holdings.service";
import * as allocationService from "./allocation.service";
import * as stateMachine from "./state-machine";

const router = Router();

// All portfolio routes require authentication
router.use(authenticate);

// ═══════════════════════════════════════════════════════
// PORTFOLIO SUMMARY
// ═══════════════════════════════════════════════════════

// GET /portfolio/summary
router.get(
  "/summary",
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = (req as AuthenticatedRequest).user;
    const summary = await portfolioService.getPortfolioSummary(userId);
    return sendSuccess(res, summary);
  })
);

// GET /portfolio/history?days=90
router.get(
  "/history",
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = (req as AuthenticatedRequest).user;
    const days = parseInt(req.query.days as string) || 90;
    const history = await portfolioService.getPortfolioHistory(userId, days);
    return sendSuccess(res, history);
  })
);

// GET /portfolio/returns?days=90
router.get(
  "/returns",
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = (req as AuthenticatedRequest).user;
    const days = parseInt(req.query.days as string) || 90;
    const returns = await portfolioService.getPortfolioReturns(userId, days);
    return sendSuccess(res, returns);
  })
);

// ═══════════════════════════════════════════════════════
// HOLDINGS CRUD
// ═══════════════════════════════════════════════════════

// GET /portfolio/holdings
router.get(
  "/holdings",
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = (req as AuthenticatedRequest).user;
    const holdings = await holdingsService.getUserHoldings(userId);
    return sendSuccess(res, holdings);
  })
);

// POST /portfolio/holdings
router.post(
  "/holdings",
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = (req as AuthenticatedRequest).user;
    const { ticker, quantity, avgCost } = req.body;

    if (!ticker || quantity === undefined) {
      throw new BadRequestError("ticker and quantity are required");
    }

    const holding = await holdingsService.addHolding(userId, {
      ticker,
      quantity: Number(quantity),
      avgCost: avgCost !== undefined ? Number(avgCost) : undefined,
    });

    return sendCreated(res, holding);
  })
);

// PATCH /portfolio/holdings/:id
router.patch(
  "/holdings/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = (req as AuthenticatedRequest).user;
    const holdingId = parseInt(req.params.id as string);
    const { quantity, avgCost } = req.body;

    const updated = await holdingsService.updateHolding(userId, holdingId, {
      quantity: quantity !== undefined ? Number(quantity) : undefined,
      avgCost: avgCost !== undefined ? Number(avgCost) : undefined,
    });

    return sendSuccess(res, updated);
  })
);

// DELETE /portfolio/holdings/:id
router.delete(
  "/holdings/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = (req as AuthenticatedRequest).user;
    const holdingId = parseInt(req.params.id as string);
    const result = await holdingsService.removeHolding(userId, holdingId);
    return sendSuccess(res, result);
  })
);

// ═══════════════════════════════════════════════════════
// ALLOCATION
// ═══════════════════════════════════════════════════════

// GET /portfolio/allocation
router.get(
  "/allocation",
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = (req as AuthenticatedRequest).user;
    const allocation = await allocationService.getAllocation(userId);
    return sendSuccess(res, allocation);
  })
);

// ═══════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════

// GET /portfolio/state
router.get(
  "/state",
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = (req as AuthenticatedRequest).user;
    const state = await stateMachine.getCurrentState(userId);
    return sendSuccess(res, state);
  })
);

export const portfolioController = router;
