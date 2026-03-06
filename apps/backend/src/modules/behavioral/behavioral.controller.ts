import { Router, Request, Response } from 'express';
import { authMiddleware, AuthRequest } from '../../core/middleware/auth.middleware';
import { asyncHandler, sendSuccess } from '../../core/utils/index';
import { prisma } from '../../infrastructure/prisma/client';

import { detectBiases } from './bias-detector';
import { computeAdaptiveRisk } from './adaptive-risk-engine';

export const behavioralController = Router();
behavioralController.use(authMiddleware as any);

/* ───────────────── GET SCORES ───────────────── */

behavioralController.get('/scores', asyncHandler(async (req: Request, res: Response) => {

    const userId = (req as AuthRequest).user.userId;

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
            lossAversionRatio: snap.lossAversionRatio ?? null,
            featureSnapshot: snap,
            insights: (cached.modelWeights as any)?.insights ?? [],
            updatedAt: cached.updatedAt.toISOString(),
            fromCache: true,
        });
    }

    const result = await detectBiases(userId);
    return sendSuccess(res, result);

}));

/* ───────────────── REFRESH SCORES ───────────────── */

behavioralController.post('/scores/refresh', asyncHandler(async (req: Request, res: Response) => {

    const userId = (req as AuthRequest).user.userId;

    const result = await detectBiases(userId);

    return sendSuccess(res, result);

}));

/* ───────────────── ADAPTIVE RISK ───────────────── */

behavioralController.get('/adaptive-risk', asyncHandler(async (req: Request, res: Response) => {

    const userId = (req as AuthRequest).user.userId;

    const result = await computeAdaptiveRisk(userId);

    return sendSuccess(res, result);

}));

/* ───────────────── SCORE HISTORY ───────────────── */

behavioralController.get('/history', asyncHandler(async (req: Request, res: Response) => {

    const userId = (req as AuthRequest).user.userId;

    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 10;

    const rows = await prisma.behavioralScore.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        take: Math.min(limit, 50),
    });

    return sendSuccess(res,
        rows.map(r => ({
            adaptiveRiskScore: r.adaptiveRiskScore?.toNumber() ?? 50,
            panicSellScore: r.panicSellScore?.toNumber() ?? 50,
            recencyBiasScore: r.recencyBiasScore?.toNumber() ?? 50,
            riskChasingScore: r.riskChasingScore?.toNumber() ?? 50,
            liquidityStressScore: r.liquidityStressScore?.toNumber() ?? 50,
            updatedAt: r.updatedAt.toISOString(),
        })).reverse()
    );

}));