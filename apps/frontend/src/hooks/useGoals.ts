import { useEffect } from 'react';
import { useGoalsStore } from '../state/goals.store';

export function useGoals() {
    const store = useGoalsStore();

    useEffect(() => {
        if (store.goals.length === 0) {
            store.fetchGoals();
        }
    }, []);

    return store;
}
