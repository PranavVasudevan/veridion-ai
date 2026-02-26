import { useEffect } from 'react';
import { useBehavioralStore } from '../state/behavioral.store';

export function useBehavioral() {
    const store = useBehavioralStore();

    useEffect(() => {
        if (!store.score) {
            store.fetchAll();
        }
    }, []);

    return store;
}
