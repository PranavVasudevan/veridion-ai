import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Activity, AlertTriangle } from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';
import AnimatedGauge from '../components/ui/AnimatedGauge';
import RiskRing from '../components/ui/RiskRing';
import ProbabilityMeter from '../components/ui/ProbabilityMeter';
import StateBadge from '../components/ui/StateBadge';
import SeverityBadge from '../components/ui/SeverityBadge';
import CountUp from '../components/reactbits/CountUp';
import SplitText from '../components/reactbits/SplitText';
import AnimatedList from '../components/reactbits/AnimatedList';
import Diagrams from '../components/charts/Diagrams';
import SkeletonLoader from '../components/ui/SkeletonLoader';
import Tooltip from '../components/ui/Tooltip';
import { usePortfolio } from '../hooks/usePortfolio';
import { useRiskMetrics } from '../hooks/useRiskMetrics';
import { useAlerts } from '../hooks/useAlerts';
import { useGoals } from '../hooks/useGoals';
import { useBehavioral } from '../hooks/useBehavioral';
import { useEvents } from '../hooks/useEvents';
import { formatCurrency, formatPercent, formatRelativeTime } from '../utils/formatters';
import { useAuthStore } from '../state/auth.store';

const containerVariants = { animate: { transition: { staggerChildren: 0.08 } } };
const cardVariants = {
    initial: { opacity: 0, y: 20, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: 'easeOut' } },
};

export default function Dashboard() {
    const user = useAuthStore((s) => s.user);
    const { totalValue, holdings, state, isLoading: pLoad } = usePortfolio();
    const { metrics, isLoading: rLoad } = useRiskMetrics();
    const { alerts } = useAlerts();
    const { goals } = useGoals();
    const { score } = useBehavioral();
    const { events } = useEvents();

    const topGoal = goals[0];
    const recentAlerts = alerts.filter((a) => !a.isRead).slice(0, 5);
    const topEvents = events.slice(0, 4);

    const allocationData = holdings.map((h) => ({ name: h.ticker, value: Math.round(h.weight * 100) }));
    const sectorData = holdings.reduce<Record<string, number>>((acc, h) => {
        acc[h.sector] = (acc[h.sector] || 0) + h.weight * 100;
        return acc;
    }, {});
    const sectorChartData = Object.entries(sectorData).map(([name, value]) => ({ name, value: Math.round(value) }));

    return (
        <motion.div variants={containerVariants} initial="initial" animate="animate">
            {/* Welcome */}
            <motion.div variants={cardVariants} className="mb-6">
                <h1 className="text-h2">
                    <SplitText text={`Welcome back, ${user?.name?.split(' ')[0] || 'Investor'}`} />
                </h1>
                <p className="text-body mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                    Here's your portfolio overview
                </p>
            </motion.div>

            {/* Top Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <motion.div variants={cardVariants}>
                    <GlassCard>
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <Tooltip content="A 0–100 composite score reflecting overall portfolio health across risk, goals, and behavioral factors.">
                                    <p className="text-caption" style={{ color: 'var(--color-text-muted)' }}>Health Index</p>
                                </Tooltip>
                                {state ? (
                                    <div className="flex items-center gap-3 mt-1">
                                        <CountUp end={state.healthIndex} className="text-metric" />
                                        <StateBadge state={state.state} />
                                    </div>
                                ) : <SkeletonLoader height="h-10" />}
                            </div>
                        </div>
                        {state && <AnimatedGauge value={state.healthIndex} size={160} strokeWidth={10} />}
                    </GlassCard>
                </motion.div>

                <motion.div variants={cardVariants}>
                    <GlassCard>
                        <Tooltip content="Your effective risk tolerance adjusted for behavioral biases (0–100).">
                            <p className="text-caption" style={{ color: 'var(--color-text-muted)' }}>Risk Score</p>
                        </Tooltip>
                        {score ? (
                            <div className="flex items-center gap-4 mt-3">
                                <RiskRing value={score.adaptiveRiskScore} size={100} />
                                <div>
                                    <CountUp end={score.adaptiveRiskScore} className="text-metric" />
                                    <p className="text-caption mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                                        {score.adaptiveRiskScore >= 70 ? 'Growth' : score.adaptiveRiskScore >= 40 ? 'Balanced' : 'Conservative'}
                                    </p>
                                </div>
                            </div>
                        ) : <SkeletonLoader count={2} height="h-8" className="mt-3" />}
                    </GlassCard>
                </motion.div>

                <motion.div variants={cardVariants}>
                    <GlassCard>
                        <Tooltip content="Probability of reaching your primary financial goal based on Monte Carlo simulation.">
                            <p className="text-caption" style={{ color: 'var(--color-text-muted)' }}>Goal Funding</p>
                        </Tooltip>
                        {topGoal ? (
                            <>
                                <div className="flex items-end gap-2 mt-3">
                                    <CountUp end={topGoal.probability} className="text-metric" suffix="%" />
                                    <span className="text-caption mb-2" style={{ color: 'var(--color-text-muted)' }}>{topGoal.name}</span>
                                </div>
                                <ProbabilityMeter value={topGoal.probability} className="mt-4" />
                            </>
                        ) : <SkeletonLoader count={2} height="h-8" className="mt-3" />}
                    </GlassCard>
                </motion.div>
            </div>

            {/* Portfolio Value Banner */}
            <motion.div variants={cardVariants} className="mb-6">
                <GlassCard>
                    <div className="flex flex-col md:flex-row md:items-center justify-between">
                        <div>
                            <p className="text-caption" style={{ color: 'var(--color-text-muted)' }}>Total Portfolio Value</p>
                            {totalValue ? (
                                <div className="flex items-end gap-3 mt-1">
                                    <CountUp end={totalValue} prefix="$" separator="," className="text-metric" />
                                    <span className="flex items-center gap-1 text-sm font-semibold mb-1" style={{ color: 'var(--color-success)' }}>
                                        <TrendingUp size={14} /> +12.47%
                                    </span>
                                </div>
                            ) : <SkeletonLoader height="h-12" className="w-48 mt-1" />}
                        </div>
                        {metrics && (
                            <div className="flex gap-6 mt-4 md:mt-0">
                                {[
                                    { label: 'Sharpe', value: metrics.sharpeRatio.toFixed(2) },
                                    { label: 'Volatility', value: formatPercent(metrics.volatility) },
                                    { label: 'VaR (95%)', value: formatPercent(Math.abs(metrics.var95)) },
                                ].map((m) => (
                                    <div key={m.label} className="text-center">
                                        <p className="text-caption" style={{ color: 'var(--color-text-muted)' }}>{m.label}</p>
                                        <p className="font-numeric text-sm font-semibold mt-0.5">{m.value}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </GlassCard>
            </motion.div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <motion.div variants={cardVariants}>
                    <GlassCard>
                        <h3 className="text-h3 mb-4">Asset Allocation</h3>
                        {holdings.length > 0 ? (
                            <Diagrams data={allocationData} type="pie" dataKeys={['value']} xKey="name" height={240} showLegend />
                        ) : <SkeletonLoader count={4} height="h-6" />}
                    </GlassCard>
                </motion.div>

                <motion.div variants={cardVariants}>
                    <GlassCard>
                        <h3 className="text-h3 mb-4">Sector Exposure</h3>
                        {sectorChartData.length > 0 ? (
                            <Diagrams data={sectorChartData} type="bar" dataKeys={['value']} xKey="name" height={240} />
                        ) : <SkeletonLoader count={4} height="h-6" />}
                    </GlassCard>
                </motion.div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Recent Alerts */}
                <motion.div variants={cardVariants}>
                    <GlassCard>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-h3">Recent Alerts</h3>
                            <AlertTriangle size={16} style={{ color: 'var(--color-warning)' }} />
                        </div>
                        {recentAlerts.length > 0 ? (
                            <AnimatedList className="space-y-3">
                                {recentAlerts.map((alert) => (
                                    <div key={alert.id} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: 'var(--color-bg-tertiary)' }}>
                                        <SeverityBadge severity={alert.severity} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{alert.title}</p>
                                            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{formatRelativeTime(alert.createdAt)}</p>
                                        </div>
                                    </div>
                                ))}
                            </AnimatedList>
                        ) : <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>No unread alerts</p>}
                    </GlassCard>
                </motion.div>

                {/* Market Regime */}
                <motion.div variants={cardVariants}>
                    <GlassCard>
                        <h3 className="text-h3 mb-4">Market Regime</h3>
                        <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: 'var(--color-bg-tertiary)' }}>
                            <Activity size={20} style={{ color: 'var(--color-warning)' }} />
                            <div>
                                <p className="text-sm font-semibold">Moderate Volatility</p>
                                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>VIX-equivalent: moderate range</p>
                            </div>
                        </div>
                        <div className="mt-4 space-y-3">
                            <div className="flex justify-between text-sm">
                                <span style={{ color: 'var(--color-text-secondary)' }}>Trend</span>
                                <span className="font-medium flex items-center gap-1" style={{ color: 'var(--color-success)' }}><TrendingUp size={12} /> Bullish</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span style={{ color: 'var(--color-text-secondary)' }}>Sentiment</span>
                                <span className="font-medium" style={{ color: 'var(--color-warning)' }}>Mixed</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span style={{ color: 'var(--color-text-secondary)' }}>Rate Outlook</span>
                                <span className="font-medium" style={{ color: 'var(--color-accent-teal)' }}>Pause Expected</span>
                            </div>
                        </div>
                    </GlassCard>
                </motion.div>

                {/* News Sentiment */}
                <motion.div variants={cardVariants}>
                    <GlassCard>
                        <h3 className="text-h3 mb-4">News Sentiment</h3>
                        {topEvents.length > 0 ? (
                            <div className="space-y-3">
                                {topEvents.map((ev) => (
                                    <div key={ev.id} className="flex items-start gap-2">
                                        <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: ev.sentiment > 0 ? 'var(--color-success)' : 'var(--color-danger)' }} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium truncate">{ev.headline}</p>
                                            <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{ev.source} · {formatRelativeTime(ev.publishedAt)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : <SkeletonLoader count={4} />}
                    </GlassCard>
                </motion.div>
            </div>
        </motion.div>
    );
}
