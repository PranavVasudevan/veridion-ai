import api from './api';

export interface UserProfile {
    id: number;
    email: string;
    name: string | null;
    role: string;
    createdAt: string;
    profile: {
        annualIncome: number | null;
        totalSavings: number | null;
        totalDebt: number | null;
        monthlyExpenses: number | null;
        riskTolerance: number | null;
        investmentGoal: string | null;
        investmentHorizon: number | null;
        occupation: string | null;
        country: string | null;
        dateOfBirth: string | null;
    } | null;
}

export interface UpdateProfilePayload {
    name?: string;
    annualIncome?: number;
    totalSavings?: number;
    totalDebt?: number;
    monthlyExpenses?: number;
    riskTolerance?: number;
    investmentGoal?: string;
    investmentHorizon?: number;
    occupation?: string;
    country?: string;
    dateOfBirth?: string;
}

export const userService = {
    getProfile: async (): Promise<UserProfile> => {
        const { data } = await api.get<UserProfile>('/user/profile');
        return data;
    },

    updateProfile: async (payload: UpdateProfilePayload): Promise<UserProfile> => {
        const { data } = await api.put<UserProfile>('/user/profile', payload);
        return data;
    },
};
