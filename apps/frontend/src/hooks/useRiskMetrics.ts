import { useEffect } from 'react';
import { useRiskStore } from '../state/risk.store';

export function useRiskMetrics() {
    const store = useRiskStore();

    useEffect(() => {
        if (!store.metrics) {
            store.fetchAll();
        }
    }, []);

    return store;
}
