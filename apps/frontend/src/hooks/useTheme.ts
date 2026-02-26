import { useEffect } from 'react';
import { useThemeStore } from '../state/theme.store';

export function useTheme() {
    const store = useThemeStore();

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', store.mode);
        if (store.accentColor !== '#00D4AA') {
            document.documentElement.style.setProperty('--color-accent-teal', store.accentColor);
            document.documentElement.style.setProperty('--color-accent-teal-dim', store.accentColor + '33');
        }
    }, []);

    return store;
}
