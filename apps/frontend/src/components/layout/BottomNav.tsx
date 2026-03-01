import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Briefcase, Target, Newspaper, Menu } from 'lucide-react';
import { useUIStore } from '../../state/ui.store';

const items = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard, path: '/dashboard' },
    { id: 'portfolio', label: 'Portfolio', icon: Briefcase, path: '/portfolio' },
    { id: 'goals', label: 'Goals', icon: Target, path: '/goals' },
    { id: 'events', label: 'Events', icon: Newspaper, path: '/events' },
    { id: 'more', label: 'More', icon: Menu, path: '' },
];

export default function BottomNav() {
    const location = useLocation();
    const { setMobileMenuOpen } = useUIStore();

    return (
        <nav
            className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around md:hidden backdrop-blur-xl"
            style={{
                height: '60px',
                background: 'var(--surface-glass)',
                borderTop: '1px solid var(--border-subtle)',
                paddingBottom: 'env(safe-area-inset-bottom, 8px)',
            }}
        >
            {items.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;

                if (item.id === 'more') {
                    return (
                        <button
                            key="more"
                            onClick={() => setMobileMenuOpen(true)}
                            className="flex flex-col items-center gap-0.5 relative"
                            style={{
                                color: 'var(--text-tertiary)',
                                minWidth: '48px', minHeight: '44px',
                                padding: '6px 8px',
                                justifyContent: 'center',
                            }}
                        >
                            <Icon size={20} strokeWidth={1.5} />
                        </button>
                    );
                }

                return (
                    <NavLink
                        key={item.id}
                        to={item.path}
                        className="flex flex-col items-center gap-0.5 relative"
                        style={{
                            color: isActive ? 'var(--brand-primary)' : 'var(--text-tertiary)',
                            minWidth: '48px', minHeight: '44px',
                            padding: '6px 8px',
                            justifyContent: 'center',
                        }}
                    >
                        <Icon size={20} strokeWidth={1.5} />
                        {isActive && (
                            <>
                                <span style={{
                                    fontSize: '10px', fontWeight: 500,
                                    lineHeight: 1,
                                }}>{item.label}</span>
                                <span style={{
                                    width: '3px', height: '3px',
                                    borderRadius: '50%',
                                    background: 'var(--brand-primary)',
                                    marginTop: '2px',
                                }} />
                            </>
                        )}
                    </NavLink>
                );
            })}
        </nav>
    );
}
