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
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                        onClick={() => setCommandPaletteOpen(false)}
                    />

                    {/* Palette */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                        className="fixed top-[15%] left-1/2 -translate-x-1/2 z-50 w-full max-w-lg"
                    >
                        <div
                            className="glass overflow-hidden"
                            style={{ borderColor: 'var(--color-border-hover)' }}
                        >
                            {/* Search input */}
                            <div className="flex items-center gap-3 px-4 py-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
                                <Search size={18} style={{ color: 'var(--color-text-muted)' }} />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={query}
                                    onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Search commands..."
                                    className="flex-1 bg-transparent outline-none text-sm"
                                    style={{ color: 'var(--color-text-primary)' }}
                                />
                                <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono" style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}>
                                    ESC
                                </kbd>
                            </div>

                            {/* Results */}
                            <div className="max-h-80 overflow-y-auto py-2">
                                {filtered.length === 0 && (
                                    <div className="px-4 py-8 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
                                        No results found
                                    </div>
                                )}
                                {filtered.map((item, i) => {
                                    const Icon = icons[item.icon];
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => handleSelect(item)}
                                            onMouseEnter={() => setSelectedIndex(i)}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors"
                                            style={{
                                                color: 'var(--color-text-primary)',
                                                background: i === selectedIndex ? 'var(--color-bg-tertiary)' : 'transparent',
                                            }}
                                        >
                                            {Icon && <Icon size={16} className="flex-shrink-0" />}
                                            <span className="flex-1">{item.label}</span>
                                            <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-muted)' }}>
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
