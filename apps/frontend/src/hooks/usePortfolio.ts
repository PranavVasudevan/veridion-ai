import { useEffect } from 'react';
import { usePortfolioStore } from '../state/portfolio.store';

export function usePortfolio() {
    const store = usePortfolioStore();

    useEffect(() => {
        if (!store.totalValue) {
            store.fetchPortfolio();
            store.fetchState();
            store.fetchSnapshots();
        }
    }, []);

    return store;
}
