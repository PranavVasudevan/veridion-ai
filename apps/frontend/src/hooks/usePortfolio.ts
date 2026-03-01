import { useEffect } from 'react';
import { usePortfolioStore } from '../state/portfolio.store';
import { useAuthStore } from '../state/auth.store';

export function usePortfolio() {
    const store = usePortfolioStore();
    const userId = useAuthStore((s) => s.user?.id);

    useEffect(() => {
        if (!userId) return;
        store.refreshAll();
    }, [userId]);

    return store;
}
