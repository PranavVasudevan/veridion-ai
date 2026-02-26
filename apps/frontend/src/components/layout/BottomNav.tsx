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
            className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around py-2 border-t md:hidden"
            style={{
                background: 'var(--color-bg-secondary)',
                borderColor: 'var(--color-border)',
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
                            className="flex flex-col items-center gap-0.5 px-2 py-1 min-w-[48px]"
                            style={{ color: 'var(--color-text-muted)' }}
                        >
                            <Icon size={20} />
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </button>
                    );
                }

                return (
                    <NavLink
                        key={item.id}
                        to={item.path}
                        className="flex flex-col items-center gap-0.5 px-2 py-1 min-w-[48px]"
                        style={{ color: isActive ? 'var(--color-accent-teal)' : 'var(--color-text-muted)' }}
                    >
                        <Icon size={20} />
                        <span className="text-[10px] font-medium">{item.label}</span>
                        {isActive && (
                            <div className="absolute bottom-0 w-8 h-0.5 rounded-full" style={{ background: 'var(--color-accent-teal)' }} />
                        )}
                    </NavLink>
                );
            })}
        </nav>
    );
}
