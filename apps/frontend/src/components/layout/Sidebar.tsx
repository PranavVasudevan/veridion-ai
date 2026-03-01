import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    LayoutDashboard, Briefcase, Shield, Target, Newspaper,
    Brain, FlaskConical, Bell, FileText, Settings, UserCircle,
    ChevronLeft, Hexagon,
} from 'lucide-react';
import { useUIStore } from '../../state/ui.store';
import { useAlertStore } from '../../state/alert.store';

const iconMap: Record<string, any> = {
    LayoutDashboard, Briefcase, Shield, Target, Newspaper,
    Brain, FlaskConical, Bell, FileText, Settings, UserCircle,
};

/* ── Nav groups for section dividers ── */
const NAV_GROUPS = [
    {
        label: 'OVERVIEW',
        items: [
            { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', path: '/dashboard' },
            { id: 'portfolio', label: 'Portfolio', icon: 'Briefcase', path: '/portfolio' },
            { id: 'risk', label: 'Risk Analysis', icon: 'Shield', path: '/risk' },
        ],
    },
    {
        label: 'INTELLIGENCE',
        items: [
            { id: 'goals', label: 'Goals', icon: 'Target', path: '/goals' },
            { id: 'events', label: 'Event Intel', icon: 'Newspaper', path: '/events' },
            { id: 'behavioral', label: 'Behavioral', icon: 'Brain', path: '/behavioral' },
            { id: 'simulation', label: 'Sim Lab', icon: 'FlaskConical', path: '/simulation' },
        ],
    },
    {
        label: 'ACTIVITY',
        items: [
            { id: 'alerts', label: 'Alerts', icon: 'Bell', path: '/alerts' },
            { id: 'audit', label: 'Audit Log', icon: 'FileText', path: '/audit' },
        ],
    },
];

const NAV_BOTTOM = [
    { id: 'settings', label: 'Settings', icon: 'Settings', path: '/settings' },
    { id: 'profile', label: 'Profile', icon: 'UserCircle', path: '/profile' },
];

export default function Sidebar() {
    const location = useLocation();
    const { sidebarCollapsed, setSidebarCollapsed } = useUIStore();
    const unreadCount = useAlertStore((s) => s.unreadCount);

    return (
        <motion.aside
            className="fixed left-0 top-0 h-screen z-40 flex flex-col hidden md:flex"
            style={{
                background: 'var(--surface-raised)',
                borderRight: '1px solid var(--border-subtle)',
            }}
            animate={{ width: sidebarCollapsed ? 64 : 220 }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
            {/* Logo */}
            <div className="flex items-center gap-3 border-b" style={{
                borderColor: 'var(--border-subtle)',
                padding: sidebarCollapsed ? '20px 18px' : '20px 16px',
            }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))' }}>
                    <Hexagon size={16} style={{ color: 'var(--text-inverse)' }} />
                </div>
                {!sidebarCollapsed && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="min-w-0"
                    >
                        <span style={{
                            fontSize: '15px', fontWeight: 600,
                            letterSpacing: '-0.01em',
                            color: 'var(--text-primary)',
                        }}>
                            Veridion{' '}
                            <span style={{
                                background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}>AI</span>
                        </span>
                        <p style={{
                            fontSize: '11px',
                            color: 'var(--text-tertiary)',
                            letterSpacing: '0.04em',
                            marginTop: '1px',
                        }}>Intelligent Investing</p>
                    </motion.div>
                )}
            </div>

            {/* Nav Groups */}
            <nav className="flex-1 py-3 overflow-y-auto" style={{ paddingLeft: 8, paddingRight: 8 }}>
                {NAV_GROUPS.map((group, gi) => (
                    <div key={group.label} style={{ marginTop: gi > 0 ? '16px' : '0' }}>
                        {!sidebarCollapsed && (
                            <div className="text-label" style={{
                                padding: '4px 12px 6px',
                                fontSize: '10px',
                            }}>{group.label}</div>
                        )}
                        <div className="space-y-0.5">
                            {group.items.map((item) => {
                                const Icon = iconMap[item.icon];
                                const isActive = location.pathname === item.path;
                                const badge = item.id === 'alerts' ? unreadCount : undefined;

                                return (
                                    <NavLink
                                        key={item.id}
                                        to={item.path}
                                        className="relative flex items-center gap-3 rounded-lg group"
                                        style={{
                                            padding: sidebarCollapsed ? '10px 0' : '8px 12px',
                                            justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                                            fontSize: '13px',
                                            fontWeight: 500,
                                            color: isActive ? 'var(--brand-primary)' : 'var(--text-secondary)',
                                            background: isActive ? 'var(--brand-primary-dim)' : 'transparent',
                                            transition: 'all var(--duration-base) var(--ease-in-out)',
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!isActive) {
                                                e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                                                e.currentTarget.style.color = 'var(--text-primary)';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!isActive) {
                                                e.currentTarget.style.background = 'transparent';
                                                e.currentTarget.style.color = 'var(--text-secondary)';
                                            }
                                        }}
                                    >
                                        {isActive && (
                                            <motion.div
                                                layoutId="sidebar-active"
                                                className="absolute left-0 top-1/2 -translate-y-1/2 rounded-r-full"
                                                style={{
                                                    width: '2px', height: '24px',
                                                    background: 'var(--brand-primary)',
                                                }}
                                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                            />
                                        )}
                                        {Icon && <Icon size={16} strokeWidth={1.75} />}
                                        {!sidebarCollapsed && <span>{item.label}</span>}
                                        {!sidebarCollapsed && badge !== undefined && badge > 0 && (
                                            <span style={{
                                                marginLeft: 'auto',
                                                padding: '1px 6px',
                                                borderRadius: 'var(--radius-pill)',
                                                fontSize: '10px',
                                                fontWeight: 600,
                                                fontFamily: 'var(--font-mono)',
                                                background: 'var(--semantic-negative)',
                                                color: 'white',
                                                minWidth: '18px',
                                                textAlign: 'center',
                                            }}>
                                                {badge > 9 ? '9+' : badge}
                                            </span>
                                        )}
                                    </NavLink>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Bottom items */}
            <div className="space-y-0.5" style={{
                padding: '8px',
                borderTop: '1px solid var(--border-subtle)',
            }}>
                {NAV_BOTTOM.map((item) => {
                    const Icon = iconMap[item.icon];
                    const isActive = location.pathname === item.path;
                    return (
                        <NavLink
                            key={item.id}
                            to={item.path}
                            className="flex items-center gap-3 rounded-lg"
                            style={{
                                padding: sidebarCollapsed ? '10px 0' : '8px 12px',
                                justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                                fontSize: '13px',
                                fontWeight: 500,
                                color: isActive ? 'var(--text-primary)' : 'var(--text-tertiary)',
                                transition: 'all var(--duration-base) var(--ease-in-out)',
                            }}
                        >
                            {Icon && <Icon size={16} strokeWidth={1.75} />}
                            {!sidebarCollapsed && <span>{item.label}</span>}
                        </NavLink>
                    );
                })}
                <button
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    className="flex items-center gap-3 rounded-lg w-full"
                    style={{
                        padding: sidebarCollapsed ? '10px 0' : '8px 12px',
                        justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                        fontSize: '13px',
                        color: 'var(--text-tertiary)',
                        transition: 'all var(--duration-base) var(--ease-in-out)',
                    }}
                >
                    <motion.div animate={{ rotate: sidebarCollapsed ? 180 : 0 }} transition={{ duration: 0.3 }}>
                        <ChevronLeft size={16} strokeWidth={1.75} />
                    </motion.div>
                    {!sidebarCollapsed && <span>Collapse</span>}
                </button>
            </div>
        </motion.aside>
    );
}
