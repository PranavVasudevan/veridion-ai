import { PrismaClient, Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

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

async function main() {
    console.log('🌱 Seeding database...');

    // ── 1. User ──
    const hashedPw = await bcrypt.hash('password123', 10);
    const user = await prisma.user.upsert({
        where: { email: 'test@veridion.ai' },
        update: {},
        create: {
            email: 'test@veridion.ai',
            name: 'Test User',
            password: hashedPw,
            role: 'USER',
        },
    });
    console.log(`  ✓ User: ${user.email} (id=${user.id})`);

    // ── 2. Assets ──
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
    console.log(`  ✓ Assets: ${assets.map((a) => a.ticker).join(', ')}`);

    // ── 3. 90 days of prices ──
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
    console.log('  ✓ 90 days of price history per asset');

    // ── 4. Holdings ──
    const holdingsData: { ticker: string; quantity: number; avgCost: number }[] = [
        { ticker: 'AAPL', quantity: 10, avgCost: 150.0 },
        { ticker: 'MSFT', quantity: 8, avgCost: 280.0 },
        { ticker: 'GOOGL', quantity: 5, avgCost: 120.0 },
        { ticker: 'TSLA', quantity: 12, avgCost: 200.0 },
        { ticker: 'BTC', quantity: 0.5, avgCost: 35000.0 },
    ];

    for (const h of holdingsData) {
        const asset = assets.find((a) => a.ticker === h.ticker)!;
        await prisma.holding.upsert({
            where: { userId_assetId: { userId: user.id, assetId: asset.id } },
            update: {},
            create: {
                userId: user.id,
                assetId: asset.id,
                quantity: new Prisma.Decimal(h.quantity),
                avgCost: new Prisma.Decimal(h.avgCost),
            },
        });
    }
    console.log('  ✓ Holdings seeded');

    // ── 5. Portfolio Snapshots (90 days) ──
    let snapshotValue = 115000;
    for (let day = 90; day >= 0; day--) {
        snapshotValue = snapshotValue + (Math.random() - 0.45) * 600;
        snapshotValue = Math.round(snapshotValue * 100) / 100;
        const snapshotDate = dateNDaysAgo(day);

        await prisma.portfolioSnapshot.create({
            data: {
                userId: user.id,
                snapshotDate,
                totalValue: new Prisma.Decimal(snapshotValue),
                cashValue: new Prisma.Decimal(Math.round(4500 + Math.random() * 1000)),
            },
        });
    }
    console.log('  ✓ Portfolio snapshots seeded');

    // ── 6. Portfolio State ──
    await prisma.portfolioState.create({
        data: {
            userId: user.id,
            state: 'Stable',
            healthIndex: new Prisma.Decimal(78.5),
        },
    });
    console.log('  ✓ Portfolio state seeded');

    // ── 7. Risk Metrics History ──
    await prisma.riskMetricsHistory.create({
        data: {
            userId: user.id,
            volatility: new Prisma.Decimal(0.1823),
            sharpeRatio: new Prisma.Decimal(1.42),
            sortinoRatio: new Prisma.Decimal(1.89),
            maxDrawdown: new Prisma.Decimal(-0.2341),
            var95: new Prisma.Decimal(-0.0312),
        },
    });
    console.log('  ✓ Risk metrics seeded');

    // ── 8. Behavioral Score ──
    await prisma.behavioralScore.create({
        data: {
            userId: user.id,
            adaptiveRiskScore: new Prisma.Decimal(62.5),
            panicSellScore: new Prisma.Decimal(0.31),
            recencyBiasScore: new Prisma.Decimal(0.44),
            riskChasingScore: new Prisma.Decimal(0.18),
            liquidityStressScore: new Prisma.Decimal(0.22),
        },
    });
    console.log('  ✓ Behavioral score seeded');

    // ── 9. Sample Alerts ──
    const alertsData = [
        {
            alertType: 'exposure_warning',
            severity: 'HIGH',
            message: 'Your AAPL holding (28% of portfolio) is significantly exposed to the Fed rate decision event.',
            isRead: false,
        },
        {
            alertType: 'rebalance_suggestion',
            severity: 'MEDIUM',
            message: 'Portfolio drift detected. AAPL has grown from 25% to 31% of your portfolio.',
            isRead: false,
        },
        {
            alertType: 'behavioral_flag',
            severity: 'LOW',
            message: 'Recency bias detected. Your recent trades suggest overweighting last month\'s top performers.',
            isRead: true,
        },
        {
            alertType: 'risk_threshold',
            severity: 'CRITICAL',
            message: 'Portfolio volatility has exceeded your risk tolerance threshold of 15%.',
            isRead: false,
        },
    ];

    for (const alert of alertsData) {
        await prisma.alert.create({
            data: { userId: user.id, ...alert },
        });
    }
    console.log('  ✓ Alerts seeded');

    // ── 10. Sample Optimization Run ──
    const run = await prisma.optimizationRun.create({
        data: {
            userId: user.id,
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
    console.log('  ✓ Optimization run seeded');

    console.log('\n🎉 Seed complete!');
}

main()
    .catch((e) => {
        console.error('Seed error:', e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
