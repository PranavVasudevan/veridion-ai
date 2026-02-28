import api from './api';
import { isDemoMode, sleep } from '../utils';
import { demoAlerts } from '../utils/demoData';
import type { Alert } from '../types';

export const alertsService = {
    getAlerts: async (): Promise<Alert[]> => {
        if (isDemoMode()) { await sleep(200); return [...demoAlerts]; }
        const { data } = await api.get<{ alerts: any[]; unreadCount: number }>('/alerts');
        // Map backend shape (alertType, no title/explanation/actionSuggestion) to frontend Alert type
        return (data.alerts ?? data).map((a: any) => ({
            id: a.id,
            type: a.alertType ?? a.type ?? 'risk_threshold',
            severity: a.severity ?? 'LOW',
            title: a.title ?? a.message?.substring(0, 50) ?? 'Alert',
            message: a.message ?? '',
            explanation: a.explanation ?? '',
            actionSuggestion: a.actionSuggestion ?? '',
            isRead: a.isRead ?? false,
            createdAt: a.createdAt,
        }));
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
