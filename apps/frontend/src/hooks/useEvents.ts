import { useEffect } from 'react';
import { useEventsStore } from '../state/events.store';
import { useAuthStore } from '../state/auth.store';

export function useEvents() {
    const store = useEventsStore();
    const userId = useAuthStore((s) => s.user?.id);

    useEffect(() => {
        if (!userId) return;
        store.fetchAll();
    }, [userId]);

    return store;
}
