import { useEffect } from 'react';
import { useAlertStore } from '../state/alert.store';
import { useAuthStore } from '../state/auth.store';

export function useAlerts() {
    const store = useAlertStore();
    const userId = useAuthStore((s) => s.user?.id);

    useEffect(() => {
        if (!userId) return;
        store.fetchAlerts();
    }, [userId]);

    return store;
}
