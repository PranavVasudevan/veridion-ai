import { useEffect } from 'react';
import { useUIStore } from '../state/ui.store';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../utils/constants';

export function useKeyboardShortcuts() {
    const setCommandPaletteOpen = useUIStore((s) => s.setCommandPaletteOpen);
    const navigate = useNavigate();

    useEffect(() => {
        let gPressed = false;
        let gTimer: ReturnType<typeof setTimeout>;

        const handleKeyDown = (e: KeyboardEvent) => {
            // ⌘+K / Ctrl+K → command palette
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setCommandPaletteOpen(true);
                return;
            }

            // Escape → close modals
            if (e.key === 'Escape') {
                setCommandPaletteOpen(false);
                return;
            }

            // G then <key> navigation
            if (e.key === 'g' && !e.metaKey && !e.ctrlKey && !e.altKey) {
                if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
                gPressed = true;
                clearTimeout(gTimer);
                gTimer = setTimeout(() => { gPressed = false; }, 1000);
                return;
            }

            if (gPressed) {
                gPressed = false;
                const map: Record<string, string> = {
                    d: ROUTES.DASHBOARD,
                    p: ROUTES.PORTFOLIO,
                    r: ROUTES.RISK,
                    e: ROUTES.EVENTS,
                    a: ROUTES.ALERTS,
                    s: ROUTES.SETTINGS,
                };
                if (map[e.key]) {
                    e.preventDefault();
                    navigate(map[e.key]);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            clearTimeout(gTimer);
        };
    }, [setCommandPaletteOpen, navigate]);
}
