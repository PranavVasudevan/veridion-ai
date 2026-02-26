import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, Search, LogOut } from 'lucide-react';
import { useUIStore } from '../../state/ui.store';
import { useAlertStore } from '../../state/alert.store';
import { useAuthStore } from '../../state/auth.store';
import ThemeToggle from '../ui/ThemeToggle';
import StateBadge from '../ui/StateBadge';
import { usePortfolioStore } from '../../state/portfolio.store';

const pageTitles: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/portfolio': 'Portfolio',
    '/risk': 'Risk Analysis',
    '/goals': 'Goals',
    '/behavioral': 'Behavioral Insights',
    '/events': 'Event Intelligence',
    '/simulation': 'Simulation Lab',
    '/alerts': 'Alerts',
    '/audit': 'Audit Log',
    '/profile': 'Profile',
    '/settings': 'Settings',
};

export default function TopBar() {
    const location = useLocation();
    const navigate = useNavigate();
    const { setCommandPaletteOpen } = useUIStore();
    const unreadCount = useAlertStore((s) => s.unreadCount);
    const portfolioState = usePortfolioStore((s) => s.state);
    const logout = useAuthStore((s) => s.logout);

    const title = pageTitles[location.pathname] || 'Veridion AI';

    return (
        <header
            className="sticky top-0 z-30 h-16 flex items-center justify-between px-6 border-b backdrop-blur-xl"
            style={{
                background: 'var(--color-bg-card)',
                borderColor: 'var(--color-border)',
            }}
        >
            {/* Left: Title + State */}
            <div className="flex items-center gap-4">
                <h1 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    {title}
                </h1>
                {portfolioState && location.pathname === '/dashboard' && (
                    <StateBadge state={portfolioState.state} />
                )}
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
                {/* Search / Command Palette */}
                <button
                    onClick={() => setCommandPaletteOpen(true)}
                    className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors"
                    style={{
                        background: 'var(--color-bg-tertiary)',
                        color: 'var(--color-text-muted)',
                        border: '1px solid var(--color-border)',
                    }}
                >
                    <Search size={14} />
                    <span>Search...</span>
                    <kbd className="ml-4 px-1.5 py-0.5 rounded text-[10px] font-mono" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
                        ⌘K
                    </kbd>
                </button>

                <ThemeToggle />

                {/* Alerts */}
                <button
                    onClick={() => navigate('/alerts')}
                    className="relative w-10 h-10 rounded-xl flex items-center justify-center transition-colors hover:bg-bg-tertiary"
                >
                    <Bell size={18} style={{ color: 'var(--color-text-secondary)' }} />
                    {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold"
                            style={{ background: 'var(--color-danger)', color: 'white' }}
                        >
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </button>

                {/* User Menu */}
                <button
                    onClick={() => { logout(); navigate('/login'); }}
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors hover:bg-bg-tertiary"
                    title="Logout"
                >
                    <LogOut size={18} style={{ color: 'var(--color-text-secondary)' }} />
                </button>
            </div>
        </header>
    );
}
