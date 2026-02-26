import { useEffect } from 'react';
import { useEventsStore } from '../state/events.store';

export function useEvents() {
    const store = useEventsStore();

    useEffect(() => {
        if (store.events.length === 0) {
            store.fetchAll();
        }
    }, []);

    return store;
}
