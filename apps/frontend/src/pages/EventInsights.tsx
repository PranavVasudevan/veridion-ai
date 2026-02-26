import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, TrendingDown, TrendingUp } from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';
import SeverityBadge from '../components/ui/SeverityBadge';
import AnimatedList from '../components/reactbits/AnimatedList';
import DecryptedText from '../components/reactbits/DecryptedText';
import StarBorder from '../components/reactbits/StarBorder';
import ScrollReveal from '../components/reactbits/ScrollReveal';
import Diagrams from '../components/charts/Diagrams';
import SkeletonLoader from '../components/ui/SkeletonLoader';
import { useEvents } from '../hooks/useEvents';
import { formatRelativeTime, formatSentiment } from '../utils/formatters';
import { eventTypeColors } from '../utils/colors';
import { demoEventImpact } from '../utils/demoData';

const pageV = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0, transition: { duration: 0.4 } }, exit: { opacity: 0 } };

export default function EventInsights() {
    const { events, exposure, isLoading } = useEvents();
    const [expandedEvent, setExpandedEvent] = useState<number | null>(null);

    const sentimentAvg = events.length > 0 ? events.reduce((s, e) => s + e.sentiment, 0) / events.length : 0;
    const { label: sentLabel, color: sentColor } = formatSentiment(sentimentAvg);

    const exposureData = exposure?.sectorExposure.map((s) => ({
        name: s.sector,
        exposure: Math.round(s.exposure * 100),
        weight: Math.round(s.weight * 100),
    })) || [];

    return (
        <motion.div variants={pageV} initial="initial" animate="animate" exit="exit">
            {/* Top banner */}
            <ScrollReveal>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <GlassCard>
                        <p className="text-caption" style={{ color: 'var(--color-text-muted)' }}>Sentiment Index</p>
                        <div className="flex items-center gap-2 mt-2">
                            {sentimentAvg > 0 ? <TrendingUp size={20} style={{ color: sentColor }} /> : <TrendingDown size={20} style={{ color: sentColor }} />}
                            <span className="text-2xl font-bold font-numeric" style={{ color: sentColor }}>{sentLabel}</span>
                        </div>
                        <p className="text-xs mt-1 font-numeric" style={{ color: 'var(--color-text-muted)' }}>Avg: {sentimentAvg.toFixed(2)}</p>
                    </GlassCard>
                    <GlassCard>
                        <p className="text-caption" style={{ color: 'var(--color-text-muted)' }}>Portfolio Exposure</p>
                        <p className="text-2xl font-bold font-numeric mt-2" style={{ color: 'var(--color-warning)' }}>
                            {exposure ? `${Math.round(exposure.overallExposure * 100)}%` : '—'}
                        </p>
                        <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>Overall event exposure</p>
                    </GlassCard>
                    <GlassCard>
                        <p className="text-caption" style={{ color: 'var(--color-text-muted)' }}>Active Events</p>
                        <p className="text-2xl font-bold font-numeric mt-2">{events.length}</p>
                        <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                            {events.filter(e => e.severity === 'CRITICAL' || e.severity === 'HIGH').length} high/critical
                        </p>
                    </GlassCard>
                </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
                {/* News Feed */}
                <div className="lg:col-span-3">
                    <ScrollReveal>
                        <GlassCard>
                            <h3 className="text-h3 mb-4">News Feed</h3>
                            {events.length > 0 ? (
                                <AnimatedList className="space-y-3">
                                    {events.map((ev) => {
                                        const isExpanded = expandedEvent === ev.id;
                                        const typeColor = eventTypeColors[ev.eventType] || eventTypeColors.macro_event;
                                        const card = (
                                            <div key={ev.id} className="p-4 rounded-xl border transition-colors cursor-pointer" style={{ background: 'var(--color-bg-tertiary)', borderColor: isExpanded ? 'var(--color-border-hover)' : 'var(--color-border)' }}
                                                onClick={() => setExpandedEvent(isExpanded ? null : ev.id)}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                            <SeverityBadge severity={ev.severity} />
                                                            <span className="px-2 py-0.5 rounded text-[10px] font-medium" style={{ background: typeColor.bg, color: typeColor.text }}>
                                                                {ev.eventType.replace('_', ' ')}
                                                            </span>
                                                        </div>
                                                        <h4 className="text-sm font-semibold mt-2">
                                                            <DecryptedText text={ev.headline} speed={20} />
                                                        </h4>
                                                        <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>{ev.source} · {formatRelativeTime(ev.publishedAt)}</p>
                                                    </div>
                                                    <motion.div animate={{ rotate: isExpanded ? 180 : 0 }}>
                                                        <ChevronDown size={16} style={{ color: 'var(--color-text-muted)' }} />
                                                    </motion.div>
                                                </div>
                                                <AnimatePresence>
                                                    {isExpanded && (
                                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                                            <p className="text-xs mt-3 pt-3 border-t" style={{ color: 'var(--color-text-secondary)', borderColor: 'var(--color-border)' }}>{ev.summary}</p>
                                                            <div className="mt-3 flex gap-4 text-xs">
                                                                <span>Sentiment: <strong style={{ color: ev.sentiment > 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>{ev.sentiment.toFixed(2)}</strong></span>
                                                                <span>Sectors: {ev.affectedSectors.join(', ')}</span>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        );

                                        return ev.severity === 'CRITICAL' ? <StarBorder key={ev.id}>{card}</StarBorder> : <div key={ev.id}>{card}</div>;
                                    })}
                                </AnimatedList>
                            ) : <SkeletonLoader count={5} height="h-20" />}
                        </GlassCard>
                    </ScrollReveal>
                </div>

                {/* Sector Exposure */}
                <div className="lg:col-span-2">
                    <ScrollReveal delay={0.1}>
                        <GlassCard>
                            <h3 className="text-h3 mb-4">Sector Exposure</h3>
                            {exposureData.length > 0 ? (
                                <Diagrams data={exposureData} type="bar" dataKeys={['exposure', 'weight']} xKey="name" height={350} showLegend />
                            ) : <SkeletonLoader count={5} />}
                        </GlassCard>
                    </ScrollReveal>
                </div>
            </div>

            {/* Shock Simulation */}
            <ScrollReveal>
                <GlassCard>
                    <h3 className="text-h3 mb-4">Shock Simulation</h3>
                    <p className="text-body mb-4" style={{ color: 'var(--color-text-secondary)' }}>Click on any event above to see estimated portfolio impact.</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 rounded-xl" style={{ background: 'var(--color-bg-tertiary)' }}>
                            <p className="text-caption" style={{ color: 'var(--color-text-muted)' }}>Est. Drawdown</p>
                            <p className="text-xl font-bold font-numeric mt-1" style={{ color: 'var(--color-danger)' }}>{(demoEventImpact.estimatedDrawdown * 100).toFixed(1)}%</p>
                        </div>
                        <div className="p-4 rounded-xl" style={{ background: 'var(--color-bg-tertiary)' }}>
                            <p className="text-caption" style={{ color: 'var(--color-text-muted)' }}>Vol. Projection</p>
                            <p className="text-xl font-bold font-numeric mt-1">{(demoEventImpact.volatilityProjection * 100).toFixed(1)}%</p>
                        </div>
                        <div className="p-4 rounded-xl" style={{ background: 'var(--color-bg-tertiary)' }}>
                            <p className="text-caption" style={{ color: 'var(--color-text-muted)' }}>Exposed Holdings</p>
                            <p className="text-xl font-bold font-numeric mt-1">{demoEventImpact.exposedHoldings.length}</p>
                        </div>
                    </div>
                </GlassCard>
            </ScrollReveal>
        </motion.div>
    );
}
