import api from './api';
import { isDemoMode } from '../utils';
import { demoUser } from '../utils/demoData';
import type { AuthResponse } from '../types';

export const authService = {
    login: async (email: string, password: string): Promise<AuthResponse> => {
        if (isDemoMode()) {
            return { token: 'demo-jwt-token', user: demoUser };
        }
        const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
        return data;
    },

    register: async (email: string, password: string, name: string): Promise<AuthResponse> => {
        if (isDemoMode()) {
            return { token: 'demo-jwt-token', user: { ...demoUser, email, name } };
        }
        const { data } = await api.post<AuthResponse>('/auth/register', { email, password, name });
        return data;
    },
};
