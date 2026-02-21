import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "../../infrastructure/prisma/client";
import { NotFoundError } from "../../core/errors";
import { generateMonteCarloPaths } from "./path-generator";

export class MonteCarloService {
    /**
     * Runs a Monte Carlo simulation for a user's financial goal.
     * 
     * @param userId - ID of the user
     * @param goalId - ID of the financial goal
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
}

export const monteCarloService = new MonteCarloService();
