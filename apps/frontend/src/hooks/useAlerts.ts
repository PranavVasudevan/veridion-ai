import { useEffect } from 'react';
import { useAlertStore } from '../state/alert.store';

export function useAlerts() {
    const store = useAlertStore();

    useEffect(() => {
        if (store.alerts.length === 0) {
            store.fetchAlerts();
        }
    }, []);

    return store;
}
