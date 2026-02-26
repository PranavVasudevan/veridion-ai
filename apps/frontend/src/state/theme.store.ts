import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
    mode: 'dark' | 'light';
    accentColor: string;
    reducedMotion: boolean;
    toggleMode: () => void;
    setAccentColor: (color: string) => void;
    setReducedMotion: (value: boolean) => void;
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (set, get) => ({
            mode: 'dark',
            accentColor: '#00D4AA',
            reducedMotion: false,
            toggleMode: () => {
                const newMode = get().mode === 'dark' ? 'light' : 'dark';
                document.documentElement.setAttribute('data-theme', newMode);
                set({ mode: newMode });
            },
            setAccentColor: (color) => {
                document.documentElement.style.setProperty('--color-accent-teal', color);
                document.documentElement.style.setProperty('--color-accent-teal-dim', color + '33');
                set({ accentColor: color });
            },
            setReducedMotion: (value) => set({ reducedMotion: value }),
        }),
        { name: 'veridion-theme' }
    )
);
