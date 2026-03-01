import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, LayoutDashboard, Briefcase, Shield, Target,
    Newspaper, Brain, FlaskConical, Bell, FileText, Settings, UserCircle,
    Zap, Plus,
} from 'lucide-react';
import { useUIStore } from '../../state/ui.store';
import { ROUTES } from '../../utils/constants';

const icons: Record<string, any> = {
    LayoutDashboard, Briefcase, Shield, Target, Newspaper,
    Brain, FlaskConical, Bell, FileText, Settings, UserCircle, Zap, Plus,
};

interface CmdItem {
    id: string;
    label: string;
    icon: string;
    category: 'navigation' | 'action';
    keywords: string[];
    path?: string;
}

const items: CmdItem[] = [
    { id: 'nav-dashboard', label: 'Go to Dashboard', icon: 'LayoutDashboard', category: 'navigation', keywords: ['home', 'dashboard', 'overview'], path: ROUTES.DASHBOARD },
    { id: 'nav-portfolio', label: 'Go to Portfolio', icon: 'Briefcase', category: 'navigation', keywords: ['portfolio', 'holdings', 'allocation'], path: ROUTES.PORTFOLIO },
    { id: 'nav-risk', label: 'Go to Risk Analysis', icon: 'Shield', category: 'navigation', keywords: ['risk', 'volatility', 'sharpe'], path: ROUTES.RISK },
    { id: 'nav-goals', label: 'Go to Goals', icon: 'Target', category: 'navigation', keywords: ['goals', 'retirement', 'targets'], path: ROUTES.GOALS },
    { id: 'nav-events', label: 'Go to Event Intelligence', icon: 'Newspaper', category: 'navigation', keywords: ['events', 'news', 'market'], path: ROUTES.EVENTS },
    { id: 'nav-behavioral', label: 'Go to Behavioral Insights', icon: 'Brain', category: 'navigation', keywords: ['behavioral', 'bias', 'spending'], path: ROUTES.BEHAVIORAL },
    { id: 'nav-simulation', label: 'Go to Simulation Lab', icon: 'FlaskConical', category: 'navigation', keywords: ['simulation', 'stress', 'monte carlo'], path: ROUTES.SIMULATION },
    { id: 'nav-alerts', label: 'Go to Alerts', icon: 'Bell', category: 'navigation', keywords: ['alerts', 'notifications'], path: ROUTES.ALERTS },
    { id: 'nav-audit', label: 'Go to Audit Log', icon: 'FileText', category: 'navigation', keywords: ['audit', 'log', 'decisions'], path: ROUTES.AUDIT },
    { id: 'nav-settings', label: 'Go to Settings', icon: 'Settings', category: 'navigation', keywords: ['settings', 'preferences', 'theme'], path: ROUTES.SETTINGS },
    { id: 'action-optimize', label: 'Run Portfolio Optimization', icon: 'Zap', category: 'action', keywords: ['optimize', 'rebalance', 'sharpe'] },
    { id: 'action-goal', label: 'Create New Goal', icon: 'Plus', category: 'action', keywords: ['create', 'new', 'goal'] },
];

export default function CommandPalette() {
    const { commandPaletteOpen, setCommandPaletteOpen } = useUIStore();
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    const filtered = items.filter((item) => {
        const q = query.toLowerCase();
        return item.label.toLowerCase().includes(q) || item.keywords.some((k) => k.includes(q));
    });

    useEffect(() => {
        if (commandPaletteOpen) {
            setQuery('');
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [commandPaletteOpen]);

    const handleSelect = (item: CmdItem) => {
        setCommandPaletteOpen(false);
        if (item.path) navigate(item.path);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex((prev) => Math.min(prev + 1, filtered.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex((prev) => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter' && filtered[selectedIndex]) {
            handleSelect(filtered[selectedIndex]);
        }
    };

    return (
        <AnimatePresence>
            {commandPaletteOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50"
                        style={{
                            background: 'rgba(8, 12, 20, 0.85)',
                            backdropFilter: 'blur(8px)',
                        }}
                        onClick={() => setCommandPaletteOpen(false)}
                    />

                    {/* Palette */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: -8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: -8 }}
                        transition={{ duration: 0.2, ease: [0.19, 1, 0.22, 1] }}
                        className="fixed top-[15%] left-1/2 -translate-x-1/2 z-50 w-full"
                        style={{ maxWidth: '560px' }}
                    >
                        <div style={{
                            background: 'var(--surface-overlay)',
                            border: '1px solid var(--border-strong)',
                            borderRadius: 'var(--radius-xl)',
                            boxShadow: 'var(--shadow-elevated), 0 0 0 1px rgba(0,200,150,0.1)',
                            overflow: 'hidden',
                            maxHeight: '420px',
                        }}>
                            {/* Search input */}
                            <div className="flex items-center gap-3" style={{
                                padding: '0 16px',
                                height: '52px',
                                borderBottom: '1px solid var(--border-subtle)',
                            }}>
                                <Search size={16} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={query}
                                    onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Search pages, actions..."
                                    className="flex-1 bg-transparent outline-none"
                                    style={{
                                        color: 'var(--text-primary)',
                                        fontSize: '15px',
                                        fontWeight: 450,
                                    }}
                                />
                                <kbd style={{
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    fontSize: '10px',
                                    fontFamily: 'var(--font-mono)',
                                    background: 'var(--surface-sunken)',
                                    color: 'var(--text-tertiary)',
                                    border: '1px solid var(--border-subtle)',
                                }}>
                                    ESC
                                </kbd>
                            </div>

                            {/* Results */}
                            <div className="overflow-y-auto" style={{ maxHeight: '360px', padding: '4px 0' }}>
                                {filtered.length === 0 && (
                                    <div style={{
                                        padding: '32px 16px',
                                        textAlign: 'center',
                                        fontSize: '13px',
                                        color: 'var(--text-tertiary)',
                                    }}>
                                        No results found
                                    </div>
                                )}
                                {filtered.map((item, i) => {
                                    const Icon = icons[item.icon];
                                    const isSelected = i === selectedIndex;
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => handleSelect(item)}
                                            onMouseEnter={() => setSelectedIndex(i)}
                                            className="w-full flex items-center gap-3 text-left"
                                            style={{
                                                height: '40px',
                                                padding: '0 12px',
                                                fontSize: '13px',
                                                fontWeight: 500,
                                                color: 'var(--text-primary)',
                                                background: isSelected ? 'var(--brand-primary-dim)' : 'transparent',
                                                borderLeft: isSelected ? '2px solid var(--brand-primary)' : '2px solid transparent',
                                                transition: 'all 80ms ease',
                                            }}
                                        >
                                            {Icon && <Icon size={16} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />}
                                            <span className="flex-1">{item.label}</span>
                                            <span style={{
                                                fontSize: '10px',
                                                fontFamily: 'var(--font-mono)',
                                                padding: '2px 6px',
                                                borderRadius: '4px',
                                                background: 'var(--surface-sunken)',
                                                color: 'var(--text-tertiary)',
                                            }}>
                                                {item.category}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
