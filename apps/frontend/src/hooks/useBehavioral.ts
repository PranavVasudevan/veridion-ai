import { useEffect } from 'react';
import { useBehavioralStore } from '../state/behavioral.store';
import { useAuthStore } from '../state/auth.store';

export function useBehavioral() {
    const store = useBehavioralStore();
    const userId = useAuthStore((s) => s.user?.id);

    useEffect(() => {
        if (!userId) return;
        store.fetchAll();
    }, [userId]);

    return store;
}
