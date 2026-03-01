import { prisma } from '../../infrastructure/prisma/client';
import { NotFoundError } from '../../core/errors';
import { Decimal } from '@prisma/client/runtime/library';

const PRIORITY_MAP: Record<string, number> = { low: 1, medium: 2, high: 3 };
const PRIORITY_LABEL: Record<number, string> = { 1: 'low', 2: 'medium', 3: 'high' };

function goalToResponse(g: any) {
    return {
        id: g.id,
        name: g.goalName,
        type: 'custom',
        targetAmount: g.targetAmount.toNumber(),
        currentAmount: 0,
        targetDate: g.targetDate instanceof Date ? g.targetDate.toISOString().split('T')[0] : g.targetDate,
        monthlyContribution: 0,
        probability: 50,
        priority: PRIORITY_LABEL[g.priority ?? 2] ?? 'medium',
        timeHorizonYears: Math.max(1, Math.round((new Date(g.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 365))),
        createdAt: g.createdAt.toISOString(),
    };
}

export interface CreateGoalInput {
    name: string;
    type?: string;
    targetAmount: number;
    currentAmount?: number;
    targetDate: string;
    monthlyContribution?: number;
    priority?: string;
}

export const goalsService = {
    async getGoals(userId: number) {
        const goals = await prisma.financialGoal.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
        return goals.map(goalToResponse);
    },

    async createGoal(userId: number, input: CreateGoalInput) {
        const goal = await prisma.financialGoal.create({
            data: {
                userId,
                goalName: input.name,
                targetAmount: new Decimal(input.targetAmount),
                targetDate: new Date(input.targetDate),
                priority: PRIORITY_MAP[input.priority ?? 'medium'] ?? 2,
            },
        });
        return goalToResponse(goal);
    },

    async updateGoal(userId: number, goalId: number, input: Partial<CreateGoalInput>) {
        const existing = await prisma.financialGoal.findFirst({ where: { id: goalId, userId } });
        if (!existing) throw new NotFoundError('Goal', goalId);

        const updated = await prisma.financialGoal.update({
            where: { id: goalId },
            data: {
                ...(input.name && { goalName: input.name }),
                ...(input.targetAmount !== undefined && { targetAmount: new Decimal(input.targetAmount) }),
                ...(input.targetDate && { targetDate: new Date(input.targetDate) }),
                ...(input.priority && { priority: PRIORITY_MAP[input.priority] ?? 2 }),
            },
        });
        return goalToResponse(updated);
    },

    async deleteGoal(userId: number, goalId: number) {
        const existing = await prisma.financialGoal.findFirst({ where: { id: goalId, userId } });
        if (!existing) throw new NotFoundError('Goal', goalId);
        // Delete related Monte Carlo results first
        await prisma.monteCarloResult.deleteMany({ where: { goalId } });
        await prisma.financialGoal.delete({ where: { id: goalId } });
        return { deleted: true, id: goalId };
    },
};
