import { Outlet } from 'react-router-dom';
import { useUIStore } from '../../state/ui.store';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import BottomNav from './BottomNav';
import CommandPalette from './CommandPalette';
import ToastNotification from '../ui/ToastNotification';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useTheme } from '../../hooks/useTheme';

export default function AppShell() {
    const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);
    useKeyboardShortcuts();
    useTheme();

    return (
        <div className="min-h-screen" style={{ background: 'var(--color-bg-primary)' }}>
            <Sidebar />
            <div
                className="transition-all duration-300 min-h-screen flex flex-col"
                style={{ marginLeft: `${typeof window !== 'undefined' && window.innerWidth >= 768 ? (sidebarCollapsed ? 72 : 240) : 0}px` }}
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
