import { prisma } from '../../infrastructure/prisma/client';
import { NotFoundError } from '../../core/errors';

export const alertsService = {
    async getAlerts(userId: number) {
        try {
            const alerts = await prisma.alert.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: 50,
            });
            return alerts.map(a => ({
                id: a.id,
                type: a.alertType ?? 'risk_threshold',
                severity: a.severity ?? 'LOW',
                title: a.message?.substring(0, 60) ?? 'Alert',
                message: a.message ?? '',
                explanation: '',
                actionSuggestion: '',
                isRead: a.isRead,
                createdAt: a.createdAt.toISOString(),
            }));
        } catch {
            return [];
        }
    },

    async markRead(userId: number, alertId: number) {
        const alert = await prisma.alert.findFirst({ where: { id: alertId, userId } });
        if (!alert) throw new NotFoundError('Alert', alertId);
        await prisma.alert.update({ where: { id: alertId }, data: { isRead: true } });
        return { id: alertId, isRead: true };
    },

    async markAllRead(userId: number) {
        await prisma.alert.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
        return { updated: true };
    },

    async getUnreadCount(userId: number): Promise<number> {
        try {
            return await prisma.alert.count({ where: { userId, isRead: false } });
        } catch {
            return 0;
        }
    },
};
