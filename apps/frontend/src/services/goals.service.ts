import api from './api';
import { isDemoMode, sleep } from '../utils';
import { demoGoals } from '../utils/demoData';
import type { FinancialGoal } from '../types';

export interface CreateGoalPayload {
    name: string;
    type: string;
    targetAmount: number;
    currentAmount?: number;
    targetDate: string;
    monthlyContribution?: number;
    priority?: string;
}

export interface SimulationResult {
    goalId: number;
    probability: number;
    medianProjection: number;
    worstCaseProjection: number;
    numberOfSimulations: number;
    error?: string;
}

export const goalsService = {
    getGoals: async (): Promise<FinancialGoal[]> => {
        if (isDemoMode()) { await sleep(300); return [...demoGoals]; }
        try {
            const { data } = await api.get<any>('/goals');
            const arr = Array.isArray(data) ? data : [];
            return arr.map((g: any) => ({
                id: g.id,
                name: g.name,
                type: g.type ?? 'custom',
                targetAmount: Number(g.targetAmount),
                currentAmount: Number(g.currentAmount ?? 0),
                timeHorizonYears: g.timeHorizonYears ?? 5,
                monthlyContribution: Number(g.monthlyContribution ?? 0),
                probability: g.probability ?? 50,
                priority: g.priority ?? 'medium',
                createdAt: g.createdAt ?? new Date().toISOString(),
            }));
        } catch { return [...demoGoals]; }
    },

    createGoal: async (goal: Omit<FinancialGoal, 'id' | 'createdAt' | 'probability'>): Promise<FinancialGoal> => {
        if (isDemoMode()) {
            await sleep(400);
            return { ...goal, id: Date.now(), probability: 50, createdAt: new Date().toISOString() };
        }
        // Calculate targetDate from timeHorizonYears
        const targetDate = new Date();
        targetDate.setFullYear(targetDate.getFullYear() + (goal.timeHorizonYears ?? 5));

        const { data } = await api.post<any>('/goals', {
            name: goal.name,
            type: goal.type,
            targetAmount: goal.targetAmount,
            currentAmount: goal.currentAmount ?? 0,
            targetDate: targetDate.toISOString().split('T')[0],
            monthlyContribution: goal.monthlyContribution ?? 0,
            priority: goal.priority ?? 'medium',
        });

        const g = data;
        return {
            id: g.id,
            name: g.name,
            type: g.type ?? 'custom',
            targetAmount: Number(g.targetAmount),
            currentAmount: Number(g.currentAmount ?? 0),
            timeHorizonYears: g.timeHorizonYears ?? goal.timeHorizonYears ?? 5,
            monthlyContribution: Number(g.monthlyContribution ?? 0),
            probability: g.probability ?? 50,
            priority: g.priority ?? 'medium',
            createdAt: g.createdAt ?? new Date().toISOString(),
        };
    },

    deleteGoal: async (goalId: number): Promise<void> => {
        if (isDemoMode()) { await sleep(200); return; }
        await api.delete(`/goals/${goalId}`);
    },

    simulateGoal: async (goalId: number): Promise<SimulationResult> => {
        if (isDemoMode()) {
            await sleep(800);
            return { goalId, probability: 72, medianProjection: 500000, worstCaseProjection: 280000, numberOfSimulations: 1000 };
        }
        try {
            const { data } = await api.post<any>(`/goals/${goalId}/simulate`);
            const r = data;
            return {
                goalId: r.goalId ?? goalId,
                probability: r.probability ?? 50,
                medianProjection: r.medianProjection ?? 0,
                worstCaseProjection: r.worstCaseProjection ?? 0,
                numberOfSimulations: r.numberOfSimulations ?? 0,
                error: r.error,
            };
        } catch {
            return { goalId, probability: 50, medianProjection: 0, worstCaseProjection: 0, numberOfSimulations: 0, error: 'Simulation failed' };
        }
    },
};
