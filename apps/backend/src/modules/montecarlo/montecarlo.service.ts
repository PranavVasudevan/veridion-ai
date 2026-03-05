import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "../../infrastructure/prisma/client";
import { NotFoundError } from "../../core/errors";
import { generateMonteCarloPaths } from "./path-generator";

function computeMaxDrawdown(path: number[]): number {
    let peak = path[0];
    let maxDrawdown = 0;

    for (const value of path) {
        if (value > peak) peak = value;

        const drawdown = (peak - value) / peak;

        if (drawdown > maxDrawdown) {
            maxDrawdown = drawdown;
        }
    }

    return maxDrawdown;
}
function gaussian(): number {
    const u = Math.random();
    const v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function percentile(arr: number[], p: number): number {
    const index = Math.floor(p * (arr.length - 1));
    return arr[index];
}
// ── Stress-test types (used by Simulation Lab) ───────

export interface StressTestParams {
    volatilityMultiplier: number;
    crashDepth: number;
    inflationRate: number;
    interestRateShock: number;
    numPaths?: number;
}

export interface ConeDataPoint {
    period: number;
    p10: number;
    p25: number;
    p50: number;
    p75: number;
    p90: number;
}

export interface StressTestResult {
    initialValue: number;
    coneData: ConeDataPoint[];
    terminalValues: number[];
    probLoss: number;
    median: number;
    mean: number;
    expectedDrawdown: number;
    holdingsCount: number;
    largestHolding: { ticker: string; value: number } | null;
}

// ── Helper: get latest price for an asset ────────────

async function getLatestPrice(assetId: number): Promise<number | null> {
    const row = await prisma.assetPrice.findFirst({
        where: { assetId },
        orderBy: { priceDate: "desc" },
    });
    return row ? Number(row.price) : null;
}


// ── Service ──────────────────────────────────────────

export class MonteCarloService {
    /**
     * Runs a Monte Carlo simulation for a user's financial goal.
     * (Original goal-based method — untouched)
     */
    async runSimulation(userId: number, goalId: number) {
        // 1. Fetch latest PortfolioSnapshot for user
        const snapshot = await prisma.portfolioSnapshot.findFirst({
            where: { userId },
            orderBy: { snapshotDate: "desc" },
        });

        if (!snapshot || snapshot.totalValue === null) {
            throw new NotFoundError("Portfolio snapshot", userId);
        }

        // 2. Fetch latest RiskMetricsHistory for user
        const riskMetrics = await prisma.riskMetricsHistory.findFirst({
            where: { userId },
            orderBy: { calculatedAt: "desc" },
        });

        if (!riskMetrics || riskMetrics.volatility === null || riskMetrics.sharpeRatio === null) {
            throw new NotFoundError("Risk metrics history", userId);
        }

        // 3. Fetch FinancialGoal by goalId
        const goal = await prisma.financialGoal.findUnique({
            where: { id: goalId },
        });

        if (!goal || goal.userId !== userId) {
            throw new NotFoundError("Financial goal", goalId);
        }

        // 4. Calculations
        const initialValue = Number(snapshot.totalValue);
        const volatility = Number(riskMetrics.volatility);
        const sharpeRatio = Number(riskMetrics.sharpeRatio);
        const expectedReturn = sharpeRatio * volatility;
        const targetAmount = Number(goal.targetAmount);

        const now = new Date();
        const targetDate = new Date(goal.targetDate);
        const years = (targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 365.25);

        const numSimulations = 5000;

        // 5. Call generateMonteCarloPaths
        const paths = generateMonteCarloPaths(
            initialValue,
            expectedReturn,
            volatility,
            Math.max(0.01, years),
            numSimulations
        );

        // 6. From paths: Extract final values
        const finalValues = paths.map(path => path[path.length - 1]);
        finalValues.sort((a, b) => a - b);

        // Compute goalProbability = fraction(final ≥ targetAmount)
        const goalSuccessCount = finalValues.filter(v => v >= targetAmount).length;
        const goalProbability = goalSuccessCount / numSimulations;

        // medianProjection = 50th percentile
        const medianProjection = finalValues[Math.floor(numSimulations * 0.5)];

        // worstCaseProjection = 10th percentile
        const worstCaseProjection = finalValues[Math.floor(numSimulations * 0.1)];

        // 7. Store result in MonteCarloResult
        const result = await prisma.monteCarloResult.create({
            data: {
                userId,
                goalId,
                numberOfSimulations: numSimulations,
                goalProbability: new Decimal(goalProbability),
                medianProjection: new Decimal(medianProjection),
                worstCaseProjection: new Decimal(worstCaseProjection),
                driftAssumption: new Decimal(expectedReturn),
                volatilityAssumption: new Decimal(volatility),
            },
        });

        return result;
    }

    /**
     * Runs a stress-test Monte Carlo simulation using the user's real
     * portfolio holdings. This is an ephemeral what-if scenario — results
     * are NOT persisted to the database.
     */
    async runStressTest(userId: number, params: StressTestParams): Promise<StressTestResult> {
        const {
            volatilityMultiplier = 1,
            crashDepth = -30,
            inflationRate = 3,
            interestRateShock = 0,
            numPaths = 200,
        } = params;

        // 1. Fetch user holdings with asset info
        const holdings = await prisma.holding.findMany({
            where: { userId },
            include: { asset: true },
        });

        if (holdings.length === 0) {
            throw new NotFoundError("Holdings for user", userId);
        }

        // 2. Compute per-holding values and portfolio total
        let totalValue = 0;
        let largestHolding: { ticker: string; value: number } | null = null;
        const assetIds = holdings.map(h => h.assetId);

        const prices = await prisma.assetPrice.findMany({
            where: { assetId: { in: assetIds } },
            orderBy: { priceDate: "desc" },
        });

        const latestPriceMap = new Map<number, number>();

        for (const p of prices) {
            if (!latestPriceMap.has(p.assetId)) {
                latestPriceMap.set(p.assetId, Number(p.price));
            }
        }
        for (const h of holdings) {
            const quantity = Number(h.quantity);
            // Try latest market price, fall back to avgCost
            let price = latestPriceMap.get(h.assetId);

            if (!price) {
                price = Number(h.avgCost ?? 0);
            }


            const holdingValue = quantity * price;
            totalValue += holdingValue;

            if (!largestHolding || holdingValue > largestHolding.value) {
                largestHolding = { ticker: h.asset.ticker, value: holdingValue };
            }
        }

        if (totalValue <= 0) {
            throw new NotFoundError("Portfolio value (all holdings priced at 0)", userId);
        }

        // 3. Simulation parameters — simple model
        const baseMu = 0.08;                                    // 8% expected return
        const baseSigma = 0.15;                                 // 15% base volatility
        const weights = holdings.map(h => {
            const price = latestPriceMap.get(h.assetId) ?? Number(h.avgCost ?? 0);
            return (Number(h.quantity) * price) / totalValue;
        });

        const portfolioVol = baseSigma * Math.sqrt(
            weights.reduce((sum, w) => sum + w * w, 0)
        );

        const sigma = portfolioVol * volatilityMultiplier;
        const nominalReturn = baseMu - (interestRateShock / 100);
        const realReturn = nominalReturn - (inflationRate / 100);
        const mu = realReturn;
        const years = 10;
        const steps = years * 12;                               // monthly steps
        const dt = 1 / 12;
        const annualCrashProbability = 0.05;
        const crashProb = annualCrashProbability;   // probability per step
        const MIN_PATHS = 50;
        const MAX_PATHS = 500;

        const pathCount = Math.min(Math.max(numPaths, MIN_PATHS), MAX_PATHS); // clamp 50–500

        // 4. Generate paths (using monthly GBM with crash overlay)
        const paths: number[][] = [];
        const terminalValues: number[] = [];

        for (let p = 0; p < pathCount; p++) {
            const path = [totalValue];
            let val = totalValue;
            for (let t = 1; t <= steps; t++) {
                // Box-Muller for N(0,1)
                const z = gaussian();

                let ret = (mu - 0.5 * sigma * sigma) * dt + sigma * Math.sqrt(dt) * z;
                // Crash overlay
                if (Math.random() < crashProb * dt) {
                    ret += crashDepth / 100;
                }
                val = val * Math.exp(ret);
                path.push(val);
            }
            paths.push(path);
            terminalValues.push(val);
        }

        // 5. Compute cone data (percentiles at each time step)
        const coneData: ConeDataPoint[] = [];
        for (let i = 0; i <= steps; i++) {
            const vals = paths.map(p => p[i]).sort((a, b) => a - b);
            const pAt = (pct: number) => percentile(vals, pct / 100);
            coneData.push({
                period: i,
                p10: pAt(10),
                p25: pAt(25),
                p50: pAt(50),
                p75: pAt(75),
                p90: pAt(90),
            });
        }

        // 6. Compute statistics
        terminalValues.sort((a, b) => a - b);
        const percentileAt = (pct: number) => terminalValues[Math.floor(pct / 100 * (terminalValues.length - 1))];
        const losing = terminalValues.filter(v => v < totalValue).length;
        const drawdowns = paths.map(p => computeMaxDrawdown(p));

        const expectedDrawdown =
            drawdowns.reduce((sum, d) => sum + d, 0) / drawdowns.length;
        return {
            initialValue: Math.round(totalValue),
            coneData,
            terminalValues,
            probLoss: losing / terminalValues.length,
            median: percentileAt(50),
            mean: Math.round(terminalValues.reduce((s, v) => s + v, 0) / terminalValues.length),
            expectedDrawdown: expectedDrawdown * 100,
            holdingsCount: holdings.length,
            largestHolding,
        };
    }
}

export const monteCarloService = new MonteCarloService();
