import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../state/auth.store';
import { authService } from '../services/auth.service';
import { useUIStore } from '../state/ui.store';
import { usePortfolioStore } from '../state/portfolio.store';
import { useGoalsStore } from '../state/goals.store';
import { useRiskStore } from '../state/risk.store';
import { useAlertStore } from '../state/alert.store';
import { useBehavioralStore } from '../state/behavioral.store';
import { useEventsStore } from '../state/events.store';

export function useAuth() {
    const { token, user, login: setAuth, logout: clearAuth } = useAuthStore();
    const addToast = useUIStore((s) => s.addToast);
    const navigate = useNavigate();

    const login = useCallback(async (email: string, password: string) => {
        try {
            const data = await authService.login(email, password);
            setAuth(data.token, data.user);
            navigate('/dashboard');
            addToast({ type: 'success', title: 'Welcome back', message: `Logged in as ${data.user.name || data.user.email}` });
        } catch {
            addToast({ type: 'error', title: 'Login failed', message: 'Invalid email or password' });
            throw new Error('Login failed');
        }
    }, [setAuth, navigate, addToast]);

    const register = useCallback(async (email: string, password: string, name: string) => {
        try {
            const data = await authService.register(email, password, name);
            setAuth(data.token, data.user);
            navigate('/onboarding');
            addToast({ type: 'success', title: 'Account created', message: 'Welcome to Veridion AI!' });
        } catch {
            addToast({ type: 'error', title: 'Registration failed', message: 'An account with that email may already exist' });
            throw new Error('Registration failed');
        }
    }, [setAuth, navigate, addToast]);

    const googleLogin = useCallback(async (credential: string) => {
        try {
            const data = await authService.googleLogin(credential);
            setAuth(data.token, data.user);
            if (data.isNewUser) {
                navigate('/onboarding');
                addToast({ type: 'success', title: 'Account created!', message: 'Complete your profile to get started.' });
            } else {
                navigate('/dashboard');
                addToast({ type: 'success', title: 'Welcome back!', message: `Signed in as ${data.user.name || data.user.email}` });
            }
        } catch {
            addToast({ type: 'error', title: 'Google login failed', message: 'Could not sign in with Google' });
            throw new Error('Google login failed');
        }
    }, [setAuth, navigate, addToast]);

    const logout = useCallback(() => {
        clearAuth();
        // Reset ALL data stores — critical to prevent cross-user data contamination
        // Without this, user A's portfolio/risk/goals data stays visible to user B
        usePortfolioStore.setState({ totalValue: null, totalReturn: null, holdings: [], snapshots: [], state: null, isLoading: false, error: null });
        useGoalsStore.setState({ goals: [], mcResults: [], isLoading: false });
        useRiskStore.setState({ metrics: null, history: [], contributions: [], frontier: [], covariance: null, isLoading: false });
        useAlertStore.setState({ alerts: [], unreadCount: 0, isLoading: false });
        useBehavioralStore.setState({ score: null, spending: null, history: [], isLoading: false });
        useEventsStore.setState({ events: [], exposure: null, isLoading: false });
        navigate('/login');
    }, [clearAuth, navigate]);

    return { token, user, login, register, googleLogin, logout, isAuthenticated: !!token };
}
