import { create } from 'zustand';
import type { User } from '../types';

const STORAGE_KEY_TOKEN = 'auth_token';
const STORAGE_KEY_USER = 'auth_user';

interface AuthState {
    token: string | null;
    user: User | null;
    login: (token: string, user: User) => void;
    logout: () => void;
    setUser: (user: User) => void;
    isAuthenticated: () => boolean;
}

function loadToken(): string | null {
    try {
        return localStorage.getItem(STORAGE_KEY_TOKEN);
    } catch {
        return null;
    }
}

function loadUser(): User | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY_USER);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

export const useAuthStore = create<AuthState>((set, get) => ({
    token: loadToken(),
    user: loadUser(),
    login: (token, user) => {
        localStorage.setItem(STORAGE_KEY_TOKEN, token);
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
        set({ token, user });
    },
    logout: () => {
        localStorage.removeItem(STORAGE_KEY_TOKEN);
        localStorage.removeItem(STORAGE_KEY_USER);
        set({ token: null, user: null });
    },
    setUser: (user) => {
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
        set({ user });
    },
    isAuthenticated: () => !!get().token,
}));
