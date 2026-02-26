import api from './api';
import { isDemoMode, sleep } from '../utils';
import { demoAlerts } from '../utils/demoData';
import type { Alert } from '../types';

export const alertsService = {
    getAlerts: async (): Promise<Alert[]> => {
        if (isDemoMode()) { await sleep(200); return [...demoAlerts]; }
        const { data } = await api.get<Alert[]>('/alerts');
        return data;
    },
    markRead: async (alertId: number): Promise<void> => {
        if (isDemoMode()) { await sleep(100); return; }
        await api.patch(`/alerts/${alertId}/read`);
    },
    markAllRead: async (): Promise<void> => {
        if (isDemoMode()) { await sleep(100); return; }
        await api.patch('/alerts/read-all');
    },
};
