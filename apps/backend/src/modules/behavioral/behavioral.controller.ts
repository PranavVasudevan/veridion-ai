import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../../core/middleware/auth.middleware';
import { prisma } from '../../infrastructure/prisma/client';

export async function behavioralController(app: FastifyInstance) {
    app.addHook('preHandler', authMiddleware);

    /**
     * GET /behavioral/score
     * Returns the latest behavioral bias scores.
     * Returns defaults for new users.
     */
    app.get('/behavioral/score', async (request) => {
        const userId = request.currentUser!.userId;

        const latest = await prisma.behavioralScore.findFirst({
            where: { userId },
            orderBy: { updatedAt: 'desc' },
        });

        if (!latest) {
            return {
                adaptiveRiskScore: 50,
                panicSellScore: 0,
                recencyBiasScore: 0,
                riskChasingScore: 0,
                liquidityStressScore: 0,
                updatedAt: new Date().toISOString(),
            };
        }

        return {
            adaptiveRiskScore: latest.adaptiveRiskScore?.toNumber() ?? 50,
            panicSellScore: latest.panicSellScore?.toNumber() ?? 0,
            recencyBiasScore: latest.recencyBiasScore?.toNumber() ?? 0,
            riskChasingScore: latest.riskChasingScore?.toNumber() ?? 0,
            liquidityStressScore: latest.liquidityStressScore?.toNumber() ?? 0,
            updatedAt: latest.updatedAt.toISOString(),
        };
    });

    /**
     * GET /behavioral/spending
     * Returns spending metrics for the user.
     * Returns defaults for new users.
     */
    app.get('/behavioral/spending', async (request) => {
        const userId = request.currentUser!.userId;

        // Safely check if user has profile with financial data
        let profile: any = null;
        try {
            profile = await prisma.userProfile.findUnique({
                where: { userId },
            });
        } catch {
            // Table may not exist yet — return defaults
        }

        return {
            monthlyIncome: profile?.annualIncome ? (profile.annualIncome as any).toNumber() / 12 : 0,
            monthlyExpenses: profile?.monthlyExpenses ? (profile.monthlyExpenses as any).toNumber() : 0,
            savingsRate: profile?.annualIncome && profile?.monthlyExpenses
                ? Math.round((1 - ((profile.monthlyExpenses as any).toNumber() * 12 / (profile.annualIncome as any).toNumber())) * 100)
                : 0,
            discretionary: 0,
            recurring: profile?.monthlyExpenses ? (profile.monthlyExpenses as any).toNumber() : 0,
            date: new Date().toISOString(),
        };
    });

    /**
     * GET /behavioral/score/history
     * Returns historical behavioral scores.
     * Returns empty array for new users.
     */
    app.get('/behavioral/score/history', async (request) => {
        const userId = request.currentUser!.userId;

        const rows = await prisma.behavioralScore.findMany({
            where: { userId },
            orderBy: { updatedAt: 'asc' },
        });

        return rows.map((r) => ({
            adaptiveRiskScore: r.adaptiveRiskScore?.toNumber() ?? 50,
            panicSellScore: r.panicSellScore?.toNumber() ?? 0,
            recencyBiasScore: r.recencyBiasScore?.toNumber() ?? 0,
            riskChasingScore: r.riskChasingScore?.toNumber() ?? 0,
            liquidityStressScore: r.liquidityStressScore?.toNumber() ?? 0,
            updatedAt: r.updatedAt.toISOString(),
        }));
    });
}
