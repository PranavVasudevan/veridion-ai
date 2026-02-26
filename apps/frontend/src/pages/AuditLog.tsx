import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../components/ui/GlassCard';
import SeverityBadge from '../components/ui/SeverityBadge';
import ScrollReveal from '../components/reactbits/ScrollReveal';
import DecryptedText from '../components/reactbits/DecryptedText';
import SkeletonLoader from '../components/ui/SkeletonLoader';
import { explainabilityService } from '../services/explainability.service';
import { formatRelativeTime, formatDateTime } from '../utils/formatters';
import type { DecisionLogEntry } from '../types';

const pageV = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0, transition: { duration: 0.4 } }, exit: { opacity: 0 } };

const typeLabels: Record<string, string> = {
    rebalance_trigger: 'Rebalance',
    risk_change: 'Risk Change',
    event_impact: 'Event Impact',
    user_override: 'User Override',
};

const typeColors: Record<string, string> = {
    rebalance_trigger: '#3B82F6',
    risk_change: '#F59E0B',
    event_impact: '#EF4444',
    user_override: '#A855F7',
};

export default function AuditLog() {
    const [entries, setEntries] = useState<DecisionLogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        (async () => {
            setLoading(true);
            const data = await explainabilityService.getDecisionLog();
            setEntries(data);
            setLoading(false);
        })();
    }, []);

    const filtered = filter === 'all' ? entries : entries.filter(e => e.type === filter);

    return (
        <motion.div variants={pageV} initial="initial" animate="animate" exit="exit">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-h2">Audit Log</h2>
                <select className="input-field w-auto text-sm" value={filter} onChange={(e) => setFilter(e.target.value)}>
                    <option value="all">All Types</option>
                    <option value="rebalance_trigger">Rebalance</option>
                    <option value="risk_change">Risk Change</option>
                    <option value="event_impact">Event Impact</option>
                    <option value="user_override">User Override</option>
                </select>
            </div>

            {loading ? <SkeletonLoader count={5} height="h-24" /> : (
                <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-[19px] top-0 bottom-0 w-0.5" style={{ background: 'var(--color-border)' }} />

                    <div className="space-y-4">
                        {filtered.map((entry, i) => {
                            const color = typeColors[entry.type] || '#6B7280';
                            return (
                                <ScrollReveal key={entry.id} delay={i * 0.05}>
                                    <div className="flex gap-4 pl-0">
                                        {/* Timeline dot */}
                                        <div className="relative flex-shrink-0">
                                            <div className="w-10 h-10 rounded-full flex items-center justify-center z-10 relative" style={{ background: `${color}20`, border: `2px solid ${color}` }}>
                                                <div className="w-3 h-3 rounded-full" style={{ background: color }} />
                                            </div>
                                        </div>

                                        <GlassCard className="flex-1">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase" style={{ background: `${color}20`, color }}>
                                                            {typeLabels[entry.type]}
                                                        </span>
                                                        <SeverityBadge severity={entry.severity} />
                                                    </div>
                                                    <h4 className="text-sm font-semibold mt-2">{entry.title}</h4>
                                                    <div className="mt-2">
                                                        <DecryptedText text={entry.explanation} speed={15} className="text-xs" />
                                                    </div>
                                                </div>
                                                <div className="text-right flex-shrink-0">
                                                    <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>{formatRelativeTime(entry.timestamp)}</p>
                                                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{formatDateTime(entry.timestamp)}</p>
                                                </div>
                                            </div>
                                        </GlassCard>
                                    </div>
                                </ScrollReveal>
                            );
                        })}
                    </div>
                </div>
            )}
        </motion.div>
    );
}
