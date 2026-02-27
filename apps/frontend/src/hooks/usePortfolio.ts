import { useEffect } from 'react';
import { usePortfolioStore } from '../state/portfolio.store';

export function usePortfolio() {
    const store = usePortfolioStore();

    useEffect(() => {
        // Use totalValue === null to detect "never fetched" state
        // (totalValue of 0 is valid for new users with no holdings)
        if (store.totalValue === null && !store.isLoading) {
            store.fetchPortfolio();
            store.fetchState();
            store.fetchSnapshots();
        }
    }, []);

    return store;
}
