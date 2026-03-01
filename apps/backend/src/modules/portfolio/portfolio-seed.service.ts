import { Prisma } from '@prisma/client';
import { prisma } from '../../infrastructure/prisma/client';

// ---------- helpers ----------
function randomPrice(base: number, volatility: number): number {
    const change = (Math.random() - 0.5) * 2 * volatility * base;
    return Math.round((base + change) * 100) / 100;
}

function dateNDaysAgo(n: number): Date {
    const d = new Date();
    d.setDate(d.getDate() - n);
    d.setHours(0, 0, 0, 0);
    return d;
}

/**
 * Initializes a user's portfolio with sample data.
 * Called after onboarding. Idempotent — skips if user already has holdings.
 */
export async function seedUserPortfolio(userId: number): Promise<{ seeded: boolean }> {
    // Check if user already has holdings — don't re-seed
    const existingHoldings = await prisma.holding.count({ where: { userId } });
    if (existingHoldings > 0) {
        return { seeded: false };
    }

    // ── 1. Upsert Assets ──
    const assetsData = [
        { ticker: 'AAPL', name: 'Apple Inc.', assetType: 'stock', sector: 'Technology', country: 'US' },
        { ticker: 'MSFT', name: 'Microsoft Corp.', assetType: 'stock', sector: 'Technology', country: 'US' },
        { ticker: 'GOOGL', name: 'Alphabet Inc.', assetType: 'stock', sector: 'Technology', country: 'US' },
        { ticker: 'TSLA', name: 'Tesla Inc.', assetType: 'stock', sector: 'Consumer Discretionary', country: 'US' },
        { ticker: 'BTC', name: 'Bitcoin', assetType: 'crypto', sector: 'Crypto', country: null },
    ];

    const assets: { id: number; ticker: string }[] = [];
    for (const a of assetsData) {
        const asset = await prisma.asset.upsert({
            where: { ticker: a.ticker },
            update: {},
            create: a,
        });
        assets.push({ id: asset.id, ticker: asset.ticker });
    }

    // ── 2. 90 days of prices ──
    const basePrices: Record<string, number> = {
        AAPL: 175, MSFT: 305, GOOGL: 140, TSLA: 220, BTC: 42000,
    };
    const volatilities: Record<string, number> = {
        AAPL: 0.02, MSFT: 0.018, GOOGL: 0.025, TSLA: 0.04, BTC: 0.05,
    };

    for (const asset of assets) {
        let price = basePrices[asset.ticker];
        for (let day = 90; day >= 0; day--) {
            price = randomPrice(price, volatilities[asset.ticker]);
            const priceDate = dateNDaysAgo(day);

            await prisma.assetPrice.upsert({
                where: { assetId_priceDate: { assetId: asset.id, priceDate } },
                update: { price: new Prisma.Decimal(price) },
                create: {
                    assetId: asset.id,
                    price: new Prisma.Decimal(price),
                    priceDate,
                },
            });
        }
    }

    // ── 3. Holdings ──
    const holdingsData = [
        { ticker: 'AAPL', quantity: 10, avgCost: 150.0 },
        { ticker: 'MSFT', quantity: 8, avgCost: 280.0 },
        { ticker: 'GOOGL', quantity: 5, avgCost: 120.0 },
        { ticker: 'TSLA', quantity: 12, avgCost: 200.0 },
        { ticker: 'BTC', quantity: 0.5, avgCost: 35000.0 },
    ];

    for (const h of holdingsData) {
        const asset = assets.find((a) => a.ticker === h.ticker)!;
        await prisma.holding.upsert({
            where: { userId_assetId: { userId, assetId: asset.id } },
            update: {},
            create: {
                userId,
                assetId: asset.id,
                quantity: new Prisma.Decimal(h.quantity),
                avgCost: new Prisma.Decimal(h.avgCost),
            },
        });
    }

    // ── 4. Portfolio Snapshots (90 days) — only if none exist ──
    const existingSnapshots = await prisma.portfolioSnapshot.count({ where: { userId } });
    if (existingSnapshots === 0) {
        let snapshotValue = 115000;
        for (let day = 90; day >= 0; day--) {
            snapshotValue = snapshotValue + (Math.random() - 0.45) * 600;
            snapshotValue = Math.round(snapshotValue * 100) / 100;
            const snapshotDate = dateNDaysAgo(day);

            await prisma.portfolioSnapshot.create({
                data: {
                    userId,
                    snapshotDate,
                    totalValue: new Prisma.Decimal(snapshotValue),
                    cashValue: new Prisma.Decimal(Math.round(4500 + Math.random() * 1000)),
                },
            });
        }
    }

    // ── 5. Portfolio State — only if none exists ──
    const existingState = await prisma.portfolioState.findFirst({ where: { userId } });
    if (!existingState) {
        await prisma.portfolioState.create({
            data: { userId, state: 'Stable', healthIndex: new Prisma.Decimal(78.5) },
        });
    }

    // ── 6. Risk Metrics — only if none exists ──
    const existingRisk = await prisma.riskMetricsHistory.findFirst({ where: { userId } });
    if (!existingRisk) {
        await prisma.riskMetricsHistory.create({
            data: {
                userId,
                volatility: new Prisma.Decimal(0.1823),
                sharpeRatio: new Prisma.Decimal(1.42),
                sortinoRatio: new Prisma.Decimal(1.89),
                maxDrawdown: new Prisma.Decimal(-0.2341),
                var95: new Prisma.Decimal(-0.0312),
            },
        });
    }

    // ── 7. Behavioral Score — only if none exists ──
    const existingBehavioral = await prisma.behavioralScore.findFirst({ where: { userId } });
    if (!existingBehavioral) {
        await prisma.behavioralScore.create({
            data: {
                userId,
                adaptiveRiskScore: new Prisma.Decimal(62.5),
                panicSellScore: new Prisma.Decimal(0.31),
                recencyBiasScore: new Prisma.Decimal(0.44),
                riskChasingScore: new Prisma.Decimal(0.18),
                liquidityStressScore: new Prisma.Decimal(0.22),
            },
        });
    }

    // ── 8. Sample Alerts ──
    const alertsData = [
        {
            alertType: 'exposure_warning',
            severity: 'HIGH',
            message: 'Your AAPL holding is significantly exposed to the Fed rate decision event.',
            isRead: false,
        },
        {
            alertType: 'rebalance_suggestion',
            severity: 'MEDIUM',
            message: 'Portfolio drift detected. Consider rebalancing your holdings.',
            isRead: false,
        },
        {
            alertType: 'behavioral_flag',
            severity: 'LOW',
            message: 'Recency bias detected in recent trades. Review your strategy.',
            isRead: true,
        },
        {
            alertType: 'risk_threshold',
            severity: 'CRITICAL',
            message: 'Portfolio volatility has exceeded your risk tolerance threshold.',
            isRead: false,
        },
    ];

    for (const alert of alertsData) {
        await prisma.alert.create({
            data: { userId, ...alert },
        });
    }

    // ── 9. Optimization Run + Allocations ──
    const run = await prisma.optimizationRun.create({
        data: {
            userId,
            objectiveType: 'max_sharpe',
            riskTolerance: new Prisma.Decimal(0.15),
            expectedReturnAssumption: new Prisma.Decimal(0.10),
            volatilityAssumption: new Prisma.Decimal(0.18),
        },
    });

    const allocationWeights = [0.35, 0.25, 0.20, 0.15, 0.05];
    for (let i = 0; i < assets.length; i++) {
        await prisma.portfolioAllocation.create({
            data: {
                optimizationRunId: run.id,
                assetId: assets[i].id,
                weight: new Prisma.Decimal(allocationWeights[i]),
            },
        });
    }

    // ── 10. Financial Goal + Monte Carlo ──
    const goal = await prisma.financialGoal.create({
        data: {
            userId,
            goalName: 'Retirement Fund',
            targetAmount: new Prisma.Decimal(500000),
            targetDate: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000),
            priority: 1,
        },
    });

    await prisma.monteCarloResult.create({
        data: {
            userId,
            goalId: goal.id,
            numberOfSimulations: 10000,
            driftAssumption: new Prisma.Decimal(0.07),
            volatilityAssumption: new Prisma.Decimal(0.18),
            goalProbability: new Prisma.Decimal(0.76),
            medianProjection: new Prisma.Decimal(542000),
            worstCaseProjection: new Prisma.Decimal(210000),
            inflationAdjusted: true,
        },
    });

    return { seeded: true };
}
