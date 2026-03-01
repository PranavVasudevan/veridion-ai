import { useEffect } from 'react';
import { useGoalsStore } from '../state/goals.store';
import { useAuthStore } from '../state/auth.store';

export function useGoals() {
    const store = useGoalsStore();
    const userId = useAuthStore((s) => s.user?.id);

    useEffect(() => {
        if (!userId) return;
        store.fetchGoals();
    }, [userId]);

    return store;
}
