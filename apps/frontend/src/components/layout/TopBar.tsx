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
    const user = useAuthStore((s) => s.user);

    const title = pageTitles[location.pathname] || 'Veridion AI';

    /* Avatar initials */
    const initials = user?.name
        ? user.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
        : 'V';

    return (
        <header
            className="sticky top-0 z-30 flex items-center justify-between px-6 backdrop-blur-sm"
            style={{
                height: '52px',
                background: 'var(--surface-raised)',
                borderBottom: '1px solid var(--border-subtle)',
            }}
        >
            {/* Left: Title + State */}
            <div className="flex items-center gap-4">
                <h1 style={{
                    fontSize: '15px', fontWeight: 600,
                    letterSpacing: '-0.01em',
                    color: 'var(--text-primary)',
                }}>
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
                    className="hidden md:flex items-center gap-2 text-sm"
                    style={{
                        width: '180px',
                        padding: '6px 12px',
                        background: 'var(--surface-sunken)',
                        color: 'var(--text-tertiary)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-pill)',
                        fontSize: '12px',
                        transition: 'all var(--duration-base) var(--ease-in-out)',
                    }}
                >
                    <Search size={14} strokeWidth={2} />
                    <span>Search...</span>
                    <kbd style={{
                        marginLeft: 'auto',
                        padding: '1px 5px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontFamily: 'var(--font-mono)',
                        background: 'var(--surface-overlay)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-tertiary)',
                    }}>
                        ⌘K
                    </kbd>
                </button>

                <ThemeToggle />

                {/* Alerts */}
                <button
                    onClick={() => navigate('/alerts')}
                    className="relative flex items-center justify-center"
                    style={{
                        width: '36px', height: '36px',
                        borderRadius: 'var(--radius-md)',
                        transition: 'all var(--duration-base) var(--ease-in-out)',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-overlay)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                    <Bell size={18} strokeWidth={1.5} style={{ color: 'var(--text-secondary)' }} />
                    {unreadCount > 0 && (
                        unreadCount <= 9
                            ? <span className="absolute" style={{
                                top: '8px', right: '8px',
                                width: '6px', height: '6px',
                                borderRadius: '50%',
                                background: 'var(--brand-primary)',
                            }} />
                            : <span className="absolute flex items-center justify-center" style={{
                                top: '4px', right: '2px',
                                padding: '0 4px', height: '14px',
                                borderRadius: 'var(--radius-pill)',
                                fontSize: '9px', fontWeight: 700,
                                background: 'var(--semantic-negative)',
                                color: 'white',
                            }}>9+</span>
                    )}
                </button>

                {/* Avatar */}
                <button
                    onClick={() => { logout(); navigate('/login'); }}
                    className="flex items-center justify-center"
                    title="Logout"
                    style={{
                        width: '28px', height: '28px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))',
                        border: '1.5px solid var(--border-default)',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: 'var(--text-inverse)',
                        transition: 'all var(--duration-base) var(--ease-in-out)',
                    }}
                >
                    {initials}
                </button>
            </div>
        </header>
    );
}
