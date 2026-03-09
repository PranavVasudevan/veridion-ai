import { Router, Request, Response } from 'express';
import { authMiddleware, AuthRequest } from '../../core/middleware/auth.middleware';
import { asyncHandler, sendSuccess, sendCreated } from '../../core/utils/index';
import { BadRequestError } from '../../core/errors';
import { ensureAssetExists } from '../market-data/asset-discovery.service';
import { ingestAssetPrices } from '../market-data/price-ingestion.service';
import { portfolioService } from './portfolio.service';
import * as holdingsService from './holdings.service';
import * as allocationService from './allocation.service';
import * as stateMachine from './state-machine';
import { seedUserPortfolio } from './portfolio-seed.service';
import { prisma } from '../../infrastructure/prisma/client';

export const portfolioController = Router();

// All portfolio routes require authentication
portfolioController.use(authMiddleware as any);

// ═══════════════════════════════════════════════════════
// PORTFOLIO SUMMARY & HISTORY
// ═══════════════════════════════════════════════════════

// GET /portfolio — full holdings with valuations
portfolioController.get('/', asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as AuthRequest).user.userId;
    const result = await portfolioService.getPortfolio(userId);
    return sendSuccess(res, result);
}));

// GET /portfolio/snapshot — historical chart data
portfolioController.get('/snapshot', asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as AuthRequest).user.userId;
    const result = await portfolioService.getSnapshots(userId);
    return sendSuccess(res, result);
}));

// GET /portfolio/state — portfolio state + health
portfolioController.get('/state', asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as AuthRequest).user.userId;
    const state = await stateMachine.getCurrentState(userId);
    return sendSuccess(res, state);
}));

// GET /portfolio/allocation
portfolioController.get('/allocation', asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as AuthRequest).user.userId;
    const allocation = await allocationService.getAllocation(userId);
    return sendSuccess(res, allocation);
}));

// ═══════════════════════════════════════════════════════
// HOLDINGS CRUD (all user-scoped)
// ═══════════════════════════════════════════════════════

// GET /portfolio/holdings
portfolioController.get('/holdings', asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as AuthRequest).user.userId;
    const holdings = await holdingsService.getUserHoldings(userId);
    return sendSuccess(res, holdings);
}));

// POST /portfolio/holdings
portfolioController.post('/holdings', asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as AuthRequest).user.userId;
    const { ticker, quantity, avgCost, name, assetType, sector } = req.body;

    if (!ticker || quantity === undefined) {
        throw new BadRequestError('ticker and quantity are required');
    }

    // Find or create asset (shared, but holdings are user-scoped)
    let asset = await prisma.asset.findUnique({ where: { ticker: ticker.toUpperCase() } });
    if (!asset) {
        asset = await prisma.asset.create({
            data: {
                ticker: ticker.toUpperCase(),
                name: name ?? null,
                assetType: assetType ?? 'stock',
                sector: sector ?? null,
            },
        });
    }

    const holding = await holdingsService.addHolding(userId, {
        ticker: ticker.toUpperCase(),
        quantity: Number(quantity),
        avgCost: avgCost !== undefined ? Number(avgCost) : undefined,
    });

    return sendCreated(res, holding);
}));

// PATCH /portfolio/holdings/:id
portfolioController.patch('/holdings/:id', asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as AuthRequest).user.userId;
    const holdingId = parseInt(req.params.id as string);
    const { quantity, avgCost } = req.body;

    const updated = await holdingsService.updateHolding(userId, holdingId, {
        quantity: quantity !== undefined ? Number(quantity) : undefined,
        avgCost: avgCost !== undefined ? Number(avgCost) : undefined,
    });

    return sendSuccess(res, updated);
}));

// PUT /portfolio/holdings/:id (alias for PATCH)
portfolioController.put('/holdings/:id', asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as AuthRequest).user.userId;
    const holdingId = parseInt(req.params.id as string);
    const { quantity, avgCost } = req.body;

    const updated = await holdingsService.updateHolding(userId, holdingId, {
        quantity: quantity !== undefined ? Number(quantity) : undefined,
        avgCost: avgCost !== undefined ? Number(avgCost) : undefined,
    });

    return sendSuccess(res, updated);
}));

// DELETE /portfolio/holdings/:id
portfolioController.delete('/holdings/:id', asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as AuthRequest).user.userId;
    const holdingId = parseInt(req.params.id as string);
    const result = await holdingsService.removeHolding(userId, holdingId);
    return sendSuccess(res, result);
}));

// GET /portfolio/wallet
portfolioController.get('/wallet', asyncHandler(async (req, res) => {
  const userId = (req as AuthRequest).user.userId;
  const result = await portfolioService.getWallet(userId);
  sendSuccess(res, result);
}));

// GET /portfolio/trades
portfolioController.get('/trades', asyncHandler(async (req, res) => {
  const userId = (req as AuthRequest).user.userId;
  const limit = Number(req.query.limit ?? 10);
  const result = await portfolioService.getTrades(userId, limit);
  sendSuccess(res, result);
}));

// ═══════════════════════════════════════════════════════
// WALLET ACTIONS
// ═══════════════════════════════════════════════════════

// POST /portfolio/wallet/deposit
portfolioController.post('/wallet/deposit', asyncHandler(async (req, res) => {

  const userId = (req as AuthRequest).user.userId;
  const { amount } = req.body;

  if (!amount || amount <= 0) {
    throw new BadRequestError("Deposit amount must be > 0");
  }

  const wallet = await portfolioService.deposit(userId, Number(amount));

  sendSuccess(res, wallet);

}));

// POST /portfolio/wallet/withdraw
portfolioController.post('/wallet/withdraw', asyncHandler(async (req, res) => {

  const userId = (req as AuthRequest).user.userId;
  const { amount } = req.body;

  if (!amount || amount <= 0) {
    throw new BadRequestError("Withdraw amount must be > 0");
  }

  const wallet = await portfolioService.withdraw(userId, Number(amount));

  sendSuccess(res, wallet);

}));

// ═══════════════════════════════════════════════════════
// TRADE EXECUTION
// ═══════════════════════════════════════════════════════

portfolioController.post('/trades/buy', asyncHandler(async (req, res) => {

  const userId = (req as AuthRequest).user.userId;

  const { ticker, quantity, price } = req.body;

  if (!ticker || quantity == null || price == null) {
    throw new BadRequestError("ticker, quantity and price are required");
  }

  // Ensure asset exists using metadata pipeline
  const asset = await ensureAssetExists(ticker);

  // fetch historical prices if new asset
  await ingestAssetPrices(asset.id, asset.ticker);

  const result = await portfolioService.executeBuy(userId, {
    ticker: asset.ticker,
    quantity: Number(quantity),
    price: Number(price)
  });

  sendSuccess(res, result);

}));

// POST /portfolio/trades/sell
portfolioController.post('/trades/sell', asyncHandler(async (req, res) => {

  const userId = (req as AuthRequest).user.userId;

  const { holdingId, quantity, price } = req.body;

  if (!holdingId || !quantity || !price) {
    throw new BadRequestError("holdingId, quantity and price are required");
  }

  const result = await portfolioService.executeSell(userId, {
    holdingId: Number(holdingId),
    quantity: Number(quantity),
    price: Number(price)
  });

  sendSuccess(res, result);

}));

// ═══════════════════════════════════════════════════════
// SEED (for onboarding — creates demo holdings per user)
// ═══════════════════════════════════════════════════════

portfolioController.post('/seed', asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as AuthRequest).user.userId;
    const result = await seedUserPortfolio(userId);
    return sendSuccess(res, result);
}));
