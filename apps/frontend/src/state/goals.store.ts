import { create } from 'zustand';
import type { FinancialGoal, MonteCarloResult } from '../types';
import { goalsService } from '../services/goals.service';

interface GoalsState {
    goals: FinancialGoal[];
    mcResults: MonteCarloResult[];
    isLoading: boolean;
    fetchGoals: () => Promise<void>;
    addGoal: (goal: Omit<FinancialGoal, 'id' | 'createdAt' | 'probability'>) => Promise<void>;
    deleteGoal: (goalId: number) => Promise<void>;
}

export const useGoalsStore = create<GoalsState>((set, get) => ({
    goals: [],
    mcResults: [],
    isLoading: false,
    fetchGoals: async () => {
        set({ isLoading: true });
        try {
            const goals = await goalsService.getGoals();
            set({ goals });
        } catch {
            // API may fail for new users — keep empty goals
        } finally {
            set({ isLoading: false });
        }
    },
    addGoal: async (goal) => {
        const newGoal = await goalsService.createGoal(goal);
        set({ goals: [...get().goals, newGoal] });
    },
    deleteGoal: async (goalId) => {
        await goalsService.deleteGoal(goalId);
        set({ goals: get().goals.filter((g) => g.id !== goalId) });
    },
}));
