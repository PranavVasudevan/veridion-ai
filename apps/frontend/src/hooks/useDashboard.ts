import { useEffect } from 'react';
import { useDashboardStore } from '../state/dashboard.store';
import { useAuthStore } from '../state/auth.store';

export function useDashboard() {
    const store = useDashboardStore();
    const userId = useAuthStore((s) => s.user?.id);

    useEffect(() => {
        if (!userId) return;
        store.fetchSummary();
    }, [userId]);

    return store;
}
