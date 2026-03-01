import { create } from 'zustand';
import { dashboardService, DashboardSummary } from '../services/dashboard.service';

interface DashboardState {
    data: DashboardSummary | null;
    isLoading: boolean;
    isRefreshing: boolean;
    error: string | null;

    fetchSummary: () => Promise<void>;
    refresh: () => Promise<void>;
    clearError: () => void;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
    data: null,
    isLoading: false,
    isRefreshing: false,
    error: null,

    fetchSummary: async () => {
        set({ isLoading: true, error: null });
        try {
            const data = await dashboardService.getSummary();
            set({ data });
        } catch (err: any) {
            const message = err?.response?.data?.error?.message ?? err?.response?.data?.message ?? 'Failed to load dashboard';
            set({ error: message });
        } finally {
            set({ isLoading: false });
        }
    },

    refresh: async () => {
        set({ isRefreshing: true, error: null });
        try {
            const data = await dashboardService.getSummary();
            set({ data });
        } catch (err: any) {
            const message = err?.response?.data?.error?.message ?? err?.response?.data?.message ?? 'Failed to refresh dashboard';
            set({ error: message });
        } finally {
            set({ isRefreshing: false });
        }
    },

    clearError: () => set({ error: null }),
}));
