import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCheck } from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';
import SeverityBadge from '../components/ui/SeverityBadge';
import ExplainabilityModal from '../components/ui/ExplainabilityModal';
import AnimatedList from '../components/reactbits/AnimatedList';
import ClickSpark from '../components/reactbits/ClickSpark';
import StarBorder from '../components/reactbits/StarBorder';
import SkeletonLoader from '../components/ui/SkeletonLoader';
import { useAlerts } from '../hooks/useAlerts';
import { formatRelativeTime, formatDateTime } from '../utils/formatters';
import { ALERT_CATEGORIES } from '../utils/constants';
import { alertTypeColors } from '../utils/colors';

const pageV = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0, transition: { duration: 0.4 } }, exit: { opacity: 0 } };

export default function Alerts() {
    const { alerts, unreadCount, markRead, markAllRead, isLoading } = useAlerts();
    const [activeCategory, setActiveCategory] = useState('all');

    const filtered = activeCategory === 'all' ? alerts : alerts.filter((a) => a.type === activeCategory);

    return (
        <motion.div variants={pageV} initial="initial" animate="animate" exit="exit">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-h2">Alerts</h2>
                    <p className="text-body" style={{ color: 'var(--color-text-secondary)' }}>{unreadCount} unread</p>
                </div>
                {unreadCount > 0 && (
                    <ClickSpark>
                        <button onClick={markAllRead} className="btn-secondary text-sm">
                            <CheckCheck size={14} /> Mark All Read
                        </button>
                    </ClickSpark>
                )}
            </div>

            {/* Category Tabs */}
            <div className="flex gap-1 mb-6 p-1 rounded-xl overflow-x-auto" style={{ background: 'var(--color-bg-tertiary)' }}>
                {ALERT_CATEGORIES.map((cat) => {
                    const count = cat.id === 'all' ? alerts.length : alerts.filter(a => a.type === cat.id).length;
                    return (
                        <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                            className="px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1.5"
                            style={{
                                background: activeCategory === cat.id ? 'var(--color-bg-secondary)' : 'transparent',
                                color: activeCategory === cat.id ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                            }}
                        >
                            {cat.label}
                            <span className="text-[10px] px-1.5 rounded-full" style={{ background: 'var(--color-bg-tertiary)' }}>{count}</span>
                        </button>
                    );
                })}
            </div>

            {/* Alert List */}
            {isLoading ? <SkeletonLoader count={5} height="h-24" /> : (
                <AnimatedList className="space-y-3">
                    {filtered.map((alert) => {
                        const typeColor = alertTypeColors[alert.type] || '#6B7280';
                        const card = (
                            <GlassCard key={alert.id} padding="p-4" className={!alert.isRead ? 'border-l-2' : ''} interactive>
                                <div style={{ borderLeftColor: !alert.isRead ? typeColor : 'transparent' }}>
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                <SeverityBadge severity={alert.severity} />
                                                <span className="text-[10px] font-medium px-2 py-0.5 rounded" style={{ background: `${typeColor}20`, color: typeColor }}>
                                                    {alert.type.replace('_', ' ')}
                                                </span>
                                                {!alert.isRead && <span className="w-2 h-2 rounded-full" style={{ background: 'var(--color-accent-teal)' }} />}
                                            </div>
                                            <h4 className="text-sm font-semibold mt-2">{alert.title}</h4>
                                            <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>{alert.message}</p>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>{formatRelativeTime(alert.createdAt)}</p>
                                            {!alert.isRead && (
                                                <ClickSpark>
                                                    <button onClick={() => markRead(alert.id)} className="mt-2 text-[10px] font-medium px-2 py-1 rounded-lg transition-colors" style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}>
                                                        Mark read
                                                    </button>
                                                </ClickSpark>
                                            )}
                                        </div>
                                    </div>
                                    <ExplainabilityModal explanation={alert.explanation}>
                                        {alert.actionSuggestion && (
                                            <p className="text-xs mt-3 p-2 rounded-lg" style={{ background: 'var(--color-accent-teal-dim)', color: 'var(--color-accent-teal)' }}>
                                                {alert.actionSuggestion}
                                            </p>
                                        )}
                                    </ExplainabilityModal>
                                </div>
                            </GlassCard>
                        );

                        return alert.severity === 'CRITICAL' ? <StarBorder key={alert.id}>{card}</StarBorder> : <div key={alert.id}>{card}</div>;
                    })}
                </AnimatedList>
            )}
        </motion.div>
    );
}
