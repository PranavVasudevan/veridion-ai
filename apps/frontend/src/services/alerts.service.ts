import api from './api';
import type { Alert } from '../types';

export const alertsService = {
    getAlerts: async (): Promise<Alert[]> => {
        const { data } = await api.get<any>('/alerts');
        const arr = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        return arr.map((a: any) => ({
            id: a.id,
            type: a.type ?? a.alertType ?? 'risk_threshold',
            severity: a.severity ?? 'LOW',
            title: a.title ?? '',
            message: a.message ?? '',
            explanation: a.explanation ?? '',
            actionSuggestion: a.actionSuggestion ?? '',
            isRead: a.isRead ?? false,
            createdAt: a.createdAt,
        }));
    },
    markRead: async (alertId: number): Promise<void> => {
        await api.patch(`/alerts/${alertId}/read`);
    },
    markAllRead: async (): Promise<void> => {
        await api.patch('/alerts/read-all');
    },
};