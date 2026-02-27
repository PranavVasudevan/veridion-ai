import api from './api';
import type { AuthResponse } from '../types';

export const authService = {
    login: async (email: string, password: string): Promise<AuthResponse> => {
        const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
        return data;
    },

    register: async (email: string, password: string, name: string): Promise<AuthResponse> => {
        const { data } = await api.post<AuthResponse>('/auth/register', { email, password, name });
        return data;
    },

    googleLogin: async (credential: string): Promise<AuthResponse> => {
        // Send the Google ID token (credential) to backend for verification
        const { data } = await api.post<AuthResponse>('/auth/google', { idToken: credential });
        return data;
    },
};
