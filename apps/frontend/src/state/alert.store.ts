import { create } from 'zustand';
import type { Alert } from '../types';
import { alertsService } from '../services/alerts.service';

interface AlertState {
    alerts: Alert[];
    unreadCount: number;
    isLoading: boolean;
    fetchAlerts: () => Promise<void>;
    markRead: (alertId: number) => Promise<void>;
    markAllRead: () => Promise<void>;
}

export const useAlertStore = create<AlertState>((set, get) => ({
    alerts: [],
    unreadCount: 0,
    isLoading: false,
    fetchAlerts: async () => {
        set({ isLoading: true });
        try {
            const data = await alertsService.getAlerts();
            set({ alerts: data, unreadCount: data.filter((a) => !a.isRead).length });
        } catch {
            // API may fail for new users — keep empty alerts
        } finally {
            set({ isLoading: false });
        }
    },
    markRead: async (alertId) => {
        await alertsService.markRead(alertId);
        const alerts = get().alerts.map((a) => (a.id === alertId ? { ...a, isRead: true } : a));
        set({ alerts, unreadCount: alerts.filter((a) => !a.isRead).length });
    },
    markAllRead: async () => {
        await alertsService.markAllRead();
        const alerts = get().alerts.map((a) => ({ ...a, isRead: true }));
        set({ alerts, unreadCount: 0 });
    },
}));
