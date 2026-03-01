import { useEffect } from 'react';
import { useRiskStore } from '../state/risk.store';
import { useAuthStore } from '../state/auth.store';

export function useRiskMetrics() {
    const store = useRiskStore();
    const userId = useAuthStore((s) => s.user?.id);

    useEffect(() => {
        if (!userId) return;
        store.fetchAll();
    }, [userId]);

    return store;
}
