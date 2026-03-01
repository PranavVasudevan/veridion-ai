import { Outlet } from 'react-router-dom';
import { useUIStore } from '../../state/ui.store';
import { useThemeStore } from '../../state/theme.store';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import BottomNav from './BottomNav';
import CommandPalette from './CommandPalette';
import ToastNotification from '../ui/ToastNotification';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useTheme } from '../../hooks/useTheme';

export default function AppShell() {
    const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);
    const theme = useThemeStore((s) => s.theme);
    useKeyboardShortcuts();
    useTheme();

    const isDark = theme === 'dark';

    return (
        <div className="min-h-screen app-bg" style={{ position: 'relative' }}>
            {/* Ambient glow sources — dark mode only */}
            {isDark && (
                <>
                    <div aria-hidden="true" style={{
                        position: 'fixed', top: '-10%', left: '15%',
                        width: '40vw', height: '40vw',
                        background: 'radial-gradient(circle, rgba(0,200,150,0.04) 0%, transparent 70%)',
                        pointerEvents: 'none', zIndex: 0,
                    }} />
                    <div aria-hidden="true" style={{
                        position: 'fixed', bottom: '-10%', right: '10%',
                        width: '35vw', height: '35vw',
                        background: 'radial-gradient(circle, rgba(91,138,240,0.03) 0%, transparent 70%)',
                        pointerEvents: 'none', zIndex: 0,
                    }} />
                </>
            )}
            <Sidebar />
            <div
                className="transition-all duration-300 min-h-screen flex flex-col"
                style={{
                    marginLeft: `${typeof window !== 'undefined' && window.innerWidth >= 768 ? (sidebarCollapsed ? 64 : 220) : 0}px`,
                    position: 'relative',
                    zIndex: 1,
                }}
            >
                <TopBar />
                <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6">
                    <Outlet />
                </main>
            </div>
            <BottomNav />
            <CommandPalette />
            <ToastNotification />
        </div>
    );
}
