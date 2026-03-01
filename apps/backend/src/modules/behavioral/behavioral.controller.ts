import { Router, Request, Response } from 'express';
import { authMiddleware, AuthRequest } from '../../core/middleware/auth.middleware';
import { asyncHandler, sendSuccess, sendCreated } from '../../core/utils/index';
import { BadRequestError } from '../../core/errors';
import { prisma } from '../../infrastructure/prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { analyzeSpending } from './spending-analyzer';
import { detectBiases } from './bias-detector';
import { computeAdaptiveRisk } from './adaptive-risk-engine';

export const behavioralController = Router();
behavioralController.use(authMiddleware as any);

// ─── GET /behavioral/scores ──────────────────────────────────────────────────
// Returns latest behavioral scores. Runs detectBiases() to get/create scores.
behavioralController.get('/scores', asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as AuthRequest).user.userId;

    // Return cached latest score if it's recent (< 1 hour old)
    const cached = await prisma.behavioralScore.findFirst({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
    });

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    if (cached && cached.updatedAt > oneHourAgo) {
        const snap = cached.featureSnapshot as Record<string, any> ?? {};
        return sendSuccess(res, {
            adaptiveRiskScore: cached.adaptiveRiskScore?.toNumber() ?? 50,
            panicSellScore: cached.panicSellScore?.toNumber() ?? 50,
            recencyBiasScore: cached.recencyBiasScore?.toNumber() ?? 50,
            riskChasingScore: cached.riskChasingScore?.toNumber() ?? 50,
            liquidityStressScore: cached.liquidityStressScore?.toNumber() ?? 50,
            lossAversionRatio: snap.lossAversionRatio != null ? Number(snap.lossAversionRatio) : null,
            featureSnapshot: snap,
            insights: (cached.modelWeights as any)?.insights ?? [],
            updatedAt: cached.updatedAt.toISOString(),
            fromCache: true,
        });
    }

    // Compute fresh scores
    const result = await detectBiases(userId);
    return sendSuccess(res, result);
}));

// ─── GET /behavioral/spending ─────────────────────────────────────────────────
// Returns full spending analysis. Optional ?months=6
behavioralController.get('/spending', asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as AuthRequest).user.userId;
    const months = req.query.months ? parseInt(String(req.query.months), 10) : 6;
    if (isNaN(months) || months < 1 || months > 24) throw new BadRequestError('months must be 1-24');

    const result = await analyzeSpending(userId, months);
    return sendSuccess(res, result);
}));

// ─── POST /behavioral/scores/refresh ─────────────────────────────────────────
// Forces fresh recalculation of all behavioral scores
behavioralController.post('/scores/refresh', asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as AuthRequest).user.userId;
    const result = await detectBiases(userId);
    return sendSuccess(res, result);
}));

// ─── GET /behavioral/adaptive-risk ───────────────────────────────────────────
// Returns adaptive risk tolerance recommendations
behavioralController.get('/adaptive-risk', asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as AuthRequest).user.userId;
    const result = await computeAdaptiveRisk(userId);
    return sendSuccess(res, result);
}));

// ─── GET /behavioral/history?limit=10 ────────────────────────────────────────
// Returns historical behavioral score records for trend analysis
behavioralController.get('/history', asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as AuthRequest).user.userId;
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 10;

    const rows = await prisma.behavioralScore.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        take: Math.min(limit, 50),
    });

    return sendSuccess(res, rows.map(r => ({
        adaptiveRiskScore: r.adaptiveRiskScore?.toNumber() ?? 50,
        panicSellScore: r.panicSellScore?.toNumber() ?? 50,
        recencyBiasScore: r.recencyBiasScore?.toNumber() ?? 50,
        riskChasingScore: r.riskChasingScore?.toNumber() ?? 50,
        liquidityStressScore: r.liquidityStressScore?.toNumber() ?? 50,
        updatedAt: r.updatedAt.toISOString(),
    })).reverse()); // chronological order for charts
}));

// ─── POST /behavioral/transactions ───────────────────────────────────────────
// Add a single transaction for behavioral analysis
behavioralController.post('/transactions', asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as AuthRequest).user.userId;
    const { amount, category, transactionType, description, transactionDate } = req.body;

    if (amount == null) throw new BadRequestError('amount is required');
    if (!transactionType) throw new BadRequestError('transactionType is required (income | expense | investment | withdrawal)');
    if (!transactionDate) throw new BadRequestError('transactionDate is required (YYYY-MM-DD)');

    const date = new Date(transactionDate);
    if (isNaN(date.getTime())) throw new BadRequestError('transactionDate must be a valid date');

    const txn = await prisma.transaction.create({
        data: {
            userId,
            amount: new Decimal(amount),
            category: category ?? null,
            transactionType,
            description: description ?? null,
            transactionDate: date,
        },
    });

    return sendCreated(res, {
        id: txn.id,
        amount: txn.amount.toNumber(),
        category: txn.category,
        transactionType: txn.transactionType,
        description: txn.description,
        transactionDate: txn.transactionDate.toISOString().split('T')[0],
    });
}));

// ─── POST /behavioral/transactions/bulk ──────────────────────────────────────
// Bulk-add transactions. Body: { transactions: [...] }
behavioralController.post('/transactions/bulk', asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as AuthRequest).user.userId;
    const { transactions } = req.body;

    if (!Array.isArray(transactions) || transactions.length === 0) {
        throw new BadRequestError('transactions must be a non-empty array');
    }

    const data = transactions.map((t: any, i: number) => {
        if (t.amount == null) throw new BadRequestError(`transactions[${i}].amount is required`);
        if (!t.transactionType) throw new BadRequestError(`transactions[${i}].transactionType is required`);
        if (!t.transactionDate) throw new BadRequestError(`transactions[${i}].transactionDate is required`);
        const date = new Date(t.transactionDate);
        if (isNaN(date.getTime())) throw new BadRequestError(`transactions[${i}].transactionDate is invalid`);
        return {
            userId,
            amount: new Decimal(t.amount),
            category: t.category ?? null,
            transactionType: t.transactionType,
            description: t.description ?? null,
            transactionDate: date,
        };
    });

    const result = await prisma.transaction.createMany({ data });

    return sendCreated(res, { created: result.count });
}));

// ─── Legacy endpoints (kept for backward compat with existing service) ────────
// GET /behavioral/score  →  redirect to /behavioral/scores logic
behavioralController.get('/score', asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as AuthRequest).user.userId;
    const latest = await prisma.behavioralScore.findFirst({ where: { userId }, orderBy: { updatedAt: 'desc' } });
    return sendSuccess(res, {
        adaptiveRiskScore: latest?.adaptiveRiskScore?.toNumber() ?? 50,
        panicSellScore: latest?.panicSellScore?.toNumber() ?? 50,
        recencyBiasScore: latest?.recencyBiasScore?.toNumber() ?? 50,
        riskChasingScore: latest?.riskChasingScore?.toNumber() ?? 50,
        liquidityStressScore: latest?.liquidityStressScore?.toNumber() ?? 50,
        updatedAt: latest?.updatedAt.toISOString() ?? new Date().toISOString(),
    });
}));

// GET /behavioral/score/history  →  same as /history but legacy path
behavioralController.get('/score/history', asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as AuthRequest).user.userId;
    const rows = await prisma.behavioralScore.findMany({ where: { userId }, orderBy: { updatedAt: 'asc' } });
    return sendSuccess(res, rows.map(r => ({
        adaptiveRiskScore: r.adaptiveRiskScore?.toNumber() ?? 50,
        panicSellScore: r.panicSellScore?.toNumber() ?? 50,
        recencyBiasScore: r.recencyBiasScore?.toNumber() ?? 50,
        riskChasingScore: r.riskChasingScore?.toNumber() ?? 50,
        liquidityStressScore: r.liquidityStressScore?.toNumber() ?? 50,
        updatedAt: r.updatedAt.toISOString(),
        date: r.updatedAt.toISOString(),
    })));
}));
