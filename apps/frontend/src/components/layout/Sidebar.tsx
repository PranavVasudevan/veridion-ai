import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    LayoutDashboard, Briefcase, Shield, Target, Newspaper,
    Brain, FlaskConical, Bell, FileText, Settings, UserCircle,
    ChevronLeft, Hexagon,
} from 'lucide-react';
import { NAV_ITEMS, NAV_BOTTOM_ITEMS } from '../../utils/constants';
import { useUIStore } from '../../state/ui.store';
import { useAlertStore } from '../../state/alert.store';

const iconMap: Record<string, any> = {
    LayoutDashboard, Briefcase, Shield, Target, Newspaper,
    Brain, FlaskConical, Bell, FileText, Settings, UserCircle,
};

export default function Sidebar() {
    const location = useLocation();
    const { sidebarCollapsed, setSidebarCollapsed } = useUIStore();
    const unreadCount = useAlertStore((s) => s.unreadCount);

    return (
        <motion.aside
            className="fixed left-0 top-0 h-screen z-40 flex flex-col border-r hidden md:flex"
            style={{
                background: 'var(--color-bg-secondary)',
                borderColor: 'var(--color-border)',
            }}
            animate={{ width: sidebarCollapsed ? 72 : 240 }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
            {/* Logo */}
            <div className="h-16 flex items-center px-4 gap-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--gradient-accent)' }}>
                    <Hexagon size={18} className="text-bg-primary" />
                </div>
                {!sidebarCollapsed && (
                    <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="font-bold text-base tracking-tight"
                        style={{ color: 'var(--color-text-primary)' }}
                    >
                        Veridion AI
                    </motion.span>
                )}
            </div>

            {/* Nav Items */}
            <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
                {NAV_ITEMS.map((item) => {
                    const Icon = iconMap[item.icon];
                    const isActive = location.pathname === item.path;
                    const badge = item.id === 'alerts' ? unreadCount : undefined;

                    return (
                        <NavLink
                            key={item.id}
                            to={item.path}
                            className="relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group"
                            style={{
                                color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                                background: isActive ? 'var(--color-bg-tertiary)' : 'transparent',
                            }}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="sidebar-active"
                                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
                                    style={{ background: 'var(--color-accent-teal)' }}
                                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                />
                            )}
                            {Icon && <Icon size={18} />}
                            {!sidebarCollapsed && <span>{item.label}</span>}
                            {badge !== undefined && badge > 0 && (
                                <span className="ml-auto px-1.5 py-0.5 rounded-full text-[10px] font-bold min-w-[18px] text-center"
                                    style={{ background: 'var(--color-danger)', color: 'white' }}
                                >
                                    {badge}
                                </span>
                            )}
                        </NavLink>
                    );
                })}
            </nav>

            {/* Bottom items */}
            <div className="px-2 py-2 space-y-1 border-t" style={{ borderColor: 'var(--color-border)' }}>
                {NAV_BOTTOM_ITEMS.map((item) => {
                    const Icon = iconMap[item.icon];
                    const isActive = location.pathname === item.path;
                    return (
                        <NavLink
                            key={item.id}
                            to={item.path}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150"
                            style={{
                                color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                            }}
                        >
                            {Icon && <Icon size={18} />}
                            {!sidebarCollapsed && <span>{item.label}</span>}
                        </NavLink>
                    );
                })}
                <button
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm w-full transition-colors duration-150 hover:bg-bg-tertiary"
                    style={{ color: 'var(--color-text-muted)' }}
                >
                    <motion.div animate={{ rotate: sidebarCollapsed ? 180 : 0 }} transition={{ duration: 0.3 }}>
                        <ChevronLeft size={18} />
                    </motion.div>
                    {!sidebarCollapsed && <span>Collapse</span>}
                </button>
            </div>
        </motion.aside>
    );
}
