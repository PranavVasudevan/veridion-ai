import api from './api';
import { isDemoMode, sleep } from '../utils';
import { demoGoals } from '../utils/demoData';
import type { FinancialGoal } from '../types';

export const goalsService = {
    getGoals: async (): Promise<FinancialGoal[]> => {
        if (isDemoMode()) { await sleep(300); return [...demoGoals]; }
        const { data } = await api.get<FinancialGoal[]>('/goals');
        return data;
    },
    createGoal: async (goal: Omit<FinancialGoal, 'id' | 'createdAt' | 'probability'>): Promise<FinancialGoal> => {
        if (isDemoMode()) {
            await sleep(400);
            return { ...goal, id: Date.now(), probability: 50, createdAt: new Date().toISOString() };
        }
        const { data } = await api.post<FinancialGoal>('/goals', goal);
        return data;
    },
    deleteGoal: async (goalId: number): Promise<void> => {
        if (isDemoMode()) { await sleep(200); return; }
        await api.delete(`/goals/${goalId}`);
    },
};
