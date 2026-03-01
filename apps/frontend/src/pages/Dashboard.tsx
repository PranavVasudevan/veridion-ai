import { motion, AnimatePresence } from 'framer-motion';
import {
    TrendingUp, TrendingDown, Shield, Target, Bell, AlertTriangle,
    Info, Brain, Zap, BarChart2, PieChart, Clock, DollarSign,
    Activity, ChevronRight, RefreshCw, X, ArrowUpRight, ArrowDownRight,
    Wallet, Layers,
} from 'lucide-react';
import { useDashboard } from '../hooks/useDashboard';
import { useAuthStore } from '../state/auth.store';
import GlassCard from '../components/ui/GlassCard';
import SkeletonLoader from '../components/ui/SkeletonLoader';
import Diagrams from '../components/charts/Diagrams';
import { formatCurrency, formatPercent } from '../utils/formatters';

// ─── helpers ────────────────────────────────────────────────────────────────
const fade = (delay = 0) => ({
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.45, delay } },
});

function Pill({ label, color }: { label: string; color: string }) {
    return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
            style={{ background: `${color}22`, color, border: `1px solid ${color}44` }}>
            {label}
        </span>
    );
}

function MetricCard({ icon, label, value, sub, color = 'var(--brand-primary)', delay = 0 }:
    { icon: React.ReactNode; label: string; value: string; sub?: string; color?: string; delay?: number }) {
    return (
        <motion.div {...fade(delay)}>
            <GlassCard className="flex items-start gap-4" padding="p-5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${color}14` }}>
                    <span style={{ color }}>{icon}</span>
                </div>
                <div className="min-w-0">
                    <p className="text-label">{label}</p>
                    <p className="text-metric-md mt-1 truncate"
                        style={{ color: 'var(--text-primary)' }}>{value}</p>
                    {sub && <p className="text-mono-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>{sub}</p>}
                </div>
            </GlassCard>
        </motion.div>
    );
}

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <div>
            <div className="flex justify-between items-center mb-2">
                <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{label}</span>
                <span className="text-mono-sm" style={{ color }}>{value}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border-subtle)' }}>
                <motion.div
                    className="h-full rounded-full"
                    style={{ background: color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${value}%` }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                />
            </div>
        </div>
    );
}

function PlaceholderCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
    return (
        <div className="flex items-start gap-3 p-4 rounded-xl"
            style={{ background: 'var(--color-bg-tertiary)', border: '1px dashed var(--color-border)' }}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--color-accent-teal)' }}>
                {icon}
            </div>
            <div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>{description}</p>
                <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--color-accent-teal)' }}>
                    Coming soon
                </span>
            </div>
        </div>
    );
}

// ─── severity colors ─────────────────────────────────────────────────────────
const severityColor: Record<string, string> = {
    CRITICAL: '#CC2A2A', HIGH: '#E5484D', MEDIUM: '#D4922B', LOW: '#1DB876', INFO: '#5B8AF0',
};

// ─── risk profile config ──────────────────────────────────────────────────────
const riskProfileConfig: Record<string, { color: string; icon: string; desc: string }> = {
    Conservative: { color: '#1DB876', icon: 'shield', desc: 'You prefer capital preservation with steady, low-risk growth.' },
    Moderate: { color: '#D4922B', icon: 'scale', desc: 'You balance growth and safety with diversified investments.' },
    Aggressive: { color: '#E5484D', icon: 'rocket', desc: 'You pursue high returns and can tolerate significant swings.' },
};

// ─── horizon labels ───────────────────────────────────────────────────────────
const horizonLabel: Record<string, string> = {
    'short-term': '< 2 Years', 'medium-term': '2–5 Years',
    'long-term': '5–10 Years', 'very-long-term': '10+ Years',
};

// ─── component ───────────────────────────────────────────────────────────────
export default function Dashboard() {
    const { data, isLoading, isRefreshing, error, refresh, clearError } = useDashboard();
    const authUser = useAuthStore((s) => s.user);

    const firstName = (data?.userName ?? authUser?.name ?? 'Investor').split(' ')[0];
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

    // ── derived values ──────────────────────────────────────────────────────
    const totalValue = data?.totalValue ?? 0;
    const totalReturn = data?.totalReturn ?? 0;
    const healthIndex = data?.portfolioState.healthIndex ?? 0;
    const profileConfig = riskProfileConfig[data?.riskProfile ?? 'Moderate'];
    const sectorPieData = (data?.sectorAllocation ?? []).map(s => ({ name: s.sector, value: s.weight }));
    const perfChartData = (data?.performanceData ?? []).map(p => ({ date: p.date, value: Math.round(p.value) }));
    const hasPortfolio = totalValue > 0 || (data?.holdingsCount ?? 0) > 0;
    const hasPerformance = perfChartData.length > 0;
    const hasSector = sectorPieData.length > 0;
    const b = data?.behavioral;

    const lastUpdatedStr = data?.lastSnapshotDate
        ? `Data as of ${new Date(data.lastSnapshotDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
        : null;

    return (
        <div className="space-y-6">

            {/* ─── Error Banner ──────────────────────────────────────────── */}
            <AnimatePresence>
                {error && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className="flex items-center justify-between px-4 py-3 rounded-xl"
                        style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}>
                        <div className="flex items-center gap-2">
                            <AlertTriangle size={16} style={{ color: 'var(--color-danger)' }} />
                            <span className="text-sm" style={{ color: 'var(--color-danger)' }}>{error}</span>
                        </div>
                        <button onClick={clearError} className="p-1.5 rounded-lg" style={{ color: 'var(--color-danger)' }}><X size={14} /></button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── Header ───────────────────────────────────────────────── */}
            <motion.div {...fade(0)} className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                <div>
                    <p className="text-label" style={{ letterSpacing: '0.04em' }}>{greeting},</p>
                    <h1 className="text-h1 mt-1" style={{ color: 'var(--text-primary)' }}>
                        {firstName}
                    </h1>
                    <p className="text-caption mt-1">
                        {data ? `${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}` : 'Loading your dashboard…'}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Last updated */}
                    {lastUpdatedStr && (
                        <span className="text-xs hidden sm:block" style={{ color: 'var(--color-text-muted)' }}>{lastUpdatedStr}</span>
                    )}
                    {/* Refresh button */}
                    <button onClick={refresh} disabled={isRefreshing}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all"
                        style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>
                        <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
                        {isRefreshing ? 'Refreshing…' : 'Refresh'}
                    </button>
                    {/* Unread alerts badge */}
                    {(data?.unreadAlertsCount ?? 0) > 0 && (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium"
                            style={{ background: 'rgba(229,72,77,0.1)', color: '#E5484D', border: '1px solid rgba(229,72,77,0.2)' }}>
                            <Bell size={14} />
                            {data!.unreadAlertsCount} unread
                        </div>
                    )}
                </div>
            </motion.div>

            {/* ─── Key Metrics Strip ────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {isLoading ? (
                    <>{Array.from({ length: 5 }).map((_, i) => <SkeletonLoader key={i} height="h-20" />)}</>
                ) : (
                    <>
                        <MetricCard delay={0.05} icon={<DollarSign size={20} />} label="Portfolio Value"
                            value={formatCurrency(totalValue)}
                            sub={hasPortfolio ? `${data?.holdingsCount} assets` : 'No holdings yet'} />
                        <MetricCard delay={0.1} icon={totalReturn >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                            label="Total Return" value={`${totalReturn >= 0 ? '+' : ''}${totalReturn.toFixed(2)}%`}
                            color={totalReturn >= 0 ? 'var(--color-success)' : 'var(--color-danger)'}
                            sub="vs. your avg cost" />
                        <MetricCard delay={0.15} icon={<Wallet size={20} />} label="Cash Balance"
                            value={formatCurrency(data?.cashBalance ?? 0)}
                            sub="Available liquidity"
                            color="#3b82f6" />
                        <MetricCard delay={0.2} icon={<Activity size={20} />} label="Portfolio Health"
                            value={`${healthIndex.toFixed(0)} / 100`}
                            sub={data?.portfolioState.state ?? 'Stable'}
                            color={healthIndex >= 70 ? 'var(--color-success)' : healthIndex >= 40 ? '#D4922B' : 'var(--color-danger)'} />
                        <MetricCard delay={0.25} icon={<Shield size={20} />} label="Risk Profile"
                            value={data?.riskProfile ?? '—'}
                            sub={data?.investmentHorizon ? horizonLabel[data.investmentHorizon] ?? data.investmentHorizon : 'From questionnaire'}
                            color={profileConfig.color} />
                    </>
                )}
            </div>

            {/* ─── Portfolio Performance + Sector Allocation ────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <motion.div {...fade(0.3)} className="lg:col-span-3">
                    <GlassCard>
                        <h2 className="text-h3 mb-4 flex items-center gap-2">
                            <BarChart2 size={18} style={{ color: 'var(--color-accent-teal)' }} />
                            Portfolio Performance
                        </h2>
                        {isLoading ? <SkeletonLoader height="h-52" /> :
                            hasPerformance ? (
                                <Diagrams data={perfChartData} type="area" dataKeys={['value']} xKey="date" height={200} />
                            ) : (
                                <div className="h-52 flex flex-col items-center justify-center text-center gap-2"
                                    style={{ color: 'var(--color-text-muted)' }}>
                                    <BarChart2 size={36} style={{ opacity: 0.3 }} />
                                    <p className="text-sm">Performance chart will appear once you add holdings</p>
                                </div>
                            )}
                    </GlassCard>
                </motion.div>

                <motion.div {...fade(0.35)} className="lg:col-span-2">
                    <GlassCard className="h-full">
                        <h2 className="text-h3 mb-4 flex items-center gap-2">
                            <PieChart size={18} style={{ color: 'var(--color-accent-teal)' }} />
                            Sector Allocation
                        </h2>
                        {isLoading ? <SkeletonLoader height="h-52" /> :
                            hasSector ? (
                                <Diagrams data={sectorPieData} type="pie" dataKeys={['value']} xKey="name" height={200} showLegend />
                            ) : (
                                <div className="h-52 flex flex-col items-center justify-center text-center gap-2"
                                    style={{ color: 'var(--color-text-muted)' }}>
                                    <PieChart size={36} style={{ opacity: 0.3 }} />
                                    <p className="text-sm">Add holdings to see sector breakdown</p>
                                </div>
                            )}
                    </GlassCard>
                </motion.div>
            </div>

            {/* ─── Risk Profile + Risk Metrics ──────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Risk profile from questionnaire */}
                <motion.div {...fade(0.4)}>
                    <GlassCard>
                        <h2 className="text-h3 mb-4 flex items-center gap-2">
                            <Shield size={18} style={{ color: 'var(--color-accent-teal)' }} />
                            Your Risk Profile
                        </h2>
                        {isLoading ? <SkeletonLoader count={4} /> : (
                            <div className="space-y-4">
                                {/* Badge + description */}
                                <div className="flex items-center gap-3 p-4 rounded-xl"
                                    style={{ background: `${profileConfig.color}14`, border: `1px solid ${profileConfig.color}28`, borderLeft: `3px solid ${profileConfig.color}` }}>
                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${profileConfig.color}14` }}>
                                        <Shield size={18} style={{ color: profileConfig.color }} />
                                    </div>
                                    <div>
                                        <p className="text-metric-md" style={{ color: profileConfig.color }}>{data?.riskProfile ?? 'Moderate'}</p>
                                        <p className="text-caption mt-0.5">{profileConfig.desc}</p>
                                    </div>
                                </div>
                                {/* Risk tolerance bar */}
                                <div>
                                    <div className="flex justify-between text-xs mb-1.5">
                                        <span style={{ color: 'var(--color-text-muted)' }}>Risk Tolerance Score</span>
                                        <span className="font-bold font-numeric" style={{ color: profileConfig.color }}>
                                            {data?.riskToleranceScore?.toFixed(0) ?? 50}/100
                                        </span>
                                    </div>
                                    <div className="relative h-3 rounded-full overflow-hidden" style={{ background: 'var(--color-bg-tertiary)' }}>
                                        <div className="absolute inset-y-0 left-0 w-1/3 rounded-full" style={{ background: '#1DB876' }} />
                                        <div className="absolute inset-y-0 left-1/3 w-1/3 rounded-full" style={{ background: '#D4922B' }} />
                                        <div className="absolute inset-y-0 left-2/3 w-1/3 rounded-full" style={{ background: '#E5484D' }} />
                                        <motion.div
                                            className="absolute top-0 bottom-0 w-1 rounded-full bg-white shadow-md"
                                            initial={{ left: 0 }}
                                            animate={{ left: `calc(${data?.riskToleranceScore ?? 50}% - 2px)` }}
                                            transition={{ duration: 0.8, delay: 0.4 }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                                        <span>Conservative</span><span>Moderate</span><span>Aggressive</span>
                                    </div>
                                </div>
                                {/* Goal + Horizon pills */}
                                <div className="flex flex-wrap gap-2">
                                    {data?.investmentGoal && (
                                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                                            style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}>
                                            <Target size={12} style={{ color: 'var(--color-accent-teal)' }} />
                                            {data.investmentGoal}
                                        </div>
                                    )}
                                    {data?.investmentHorizon && (
                                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                                            style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}>
                                            <Clock size={12} style={{ color: 'var(--color-accent-teal)' }} />
                                            {horizonLabel[data.investmentHorizon] ?? data.investmentHorizon}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </GlassCard>
                </motion.div>

                {/* Quantitative risk metrics */}
                <motion.div {...fade(0.45)}>
                    <GlassCard>
                        <h2 className="text-h3 mb-4 flex items-center gap-2">
                            <Activity size={18} style={{ color: 'var(--color-accent-teal)' }} />
                            Risk Metrics
                            {!data?.hasRiskData && <Pill label="Needs data" color="#D4922B" />}
                        </h2>
                        {isLoading ? <SkeletonLoader count={5} /> : (
                            <div className="space-y-4">
                                {[
                                    { label: 'Sharpe Ratio', value: (data?.riskMetrics.sharpeRatio ?? 0).toFixed(2), note: '> 1 is good', color: (data?.riskMetrics.sharpeRatio ?? 0) > 1 ? 'var(--color-success)' : '#D4922B' },
                                    { label: 'Sortino Ratio', value: (data?.riskMetrics.sortinoRatio ?? 0).toFixed(2), note: 'Downside-adjusted', color: (data?.riskMetrics.sortinoRatio ?? 0) > 1 ? 'var(--color-success)' : '#D4922B' },
                                    { label: 'Volatility (Ann.)', value: `${(data?.riskMetrics.volatility ?? 0).toFixed(1)}%`, note: 'Std dev of returns', color: (data?.riskMetrics.volatility ?? 0) < 15 ? 'var(--color-success)' : '#D4922B' },
                                    { label: 'Max Drawdown', value: `${(data?.riskMetrics.maxDrawdown ?? 0).toFixed(1)}%`, note: 'Peak-to-trough loss', color: (data?.riskMetrics.maxDrawdown ?? 0) > -20 ? 'var(--color-success)' : 'var(--color-danger)' },
                                    { label: 'VaR (95%)', value: `${(data?.riskMetrics.var95 ?? 0).toFixed(1)}%`, note: '1-day at 95% confidence', color: 'var(--color-text-secondary)' },
                                ].map(m => (
                                    <div key={m.label} className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium">{m.label}</p>
                                            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{m.note}</p>
                                        </div>
                                        <span className="text-lg font-bold font-numeric" style={{ color: m.color }}>{m.value}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </GlassCard>
                </motion.div>
            </div>

            {/* ─── Enhanced Holdings Table ────────────────────────────────── */}
            {(hasPortfolio || isLoading) && (
                <motion.div {...fade(0.5)}>
                    <GlassCard>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-h3 flex items-center gap-2">
                                <DollarSign size={18} style={{ color: 'var(--color-accent-teal)' }} />
                                Top Holdings
                            </h2>
                            <span className="text-xs px-2.5 py-1 rounded-lg font-medium"
                                style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-muted)' }}>
                                {data?.holdingsCount ?? 0} total
                            </span>
                        </div>
                        {isLoading ? <SkeletonLoader count={4} /> : (
                            <div className="overflow-x-auto -mx-6 px-6">
                                <table className="w-full text-sm min-w-[800px]">
                                    <thead>
                                        <tr className="border-b" style={{ borderColor: 'var(--color-border)' }}>
                                            {['Asset', 'Type', 'Qty', 'Avg Cost', 'Price', 'Value', 'Weight', '24h', 'P&L'].map((h, i) => (
                                                <th key={h} className={`py-3 text-xs font-medium ${i === 0 ? 'text-left' : 'text-right'}`}
                                                    style={{ color: 'var(--color-text-muted)' }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(data?.holdings ?? []).map((h, i) => {
                                            const pnl = h.unrealizedPnL ?? 0;
                                            const pnlPct = h.unrealizedPnLPercent ?? 0;
                                            const change = h.change24h ?? 0;
                                            const pnlPos = pnl >= 0;
                                            const changePos = change >= 0;
                                            return (
                                                <motion.tr key={h.ticker}
                                                    initial={{ opacity: 0, x: -8 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: 0.05 * i }}
                                                    className="border-b group transition-colors" style={{ borderColor: 'var(--color-border)' }}
                                                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg-tertiary)')}
                                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                                    {/* Asset */}
                                                    <td className="py-3">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                                                                style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-accent-teal)' }}>
                                                                {h.ticker.slice(0, 2)}
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold">{h.ticker}</p>
                                                                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{h.name}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    {/* Type */}
                                                    <td className="py-3 text-right">
                                                        <span className="px-2 py-0.5 rounded-full text-xs font-medium capitalize"
                                                            style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}>
                                                            {h.assetType ?? '—'}
                                                        </span>
                                                    </td>
                                                    {/* Quantity */}
                                                    <td className="py-3 text-right font-numeric">{h.quantity.toFixed(2)}</td>
                                                    {/* Avg Cost */}
                                                    <td className="py-3 text-right font-numeric">{formatCurrency(h.avgCost)}</td>
                                                    {/* Price */}
                                                    <td className="py-3 text-right font-numeric">{formatCurrency(h.price)}</td>
                                                    {/* Value */}
                                                    <td className="py-3 text-right font-numeric font-semibold">{formatCurrency(h.value)}</td>
                                                    {/* Weight */}
                                                    <td className="py-3 text-right">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            <div className="w-12 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-bg-tertiary)' }}>
                                                                <div className="h-full rounded-full" style={{ width: `${h.weight * 100}%`, background: 'var(--color-accent-teal)' }} />
                                                            </div>
                                                            <span className="text-xs font-numeric">{(h.weight * 100).toFixed(1)}%</span>
                                                        </div>
                                                    </td>
                                                    {/* 24h Change */}
                                                    <td className="py-3 text-right">
                                                        <span className="inline-flex items-center gap-0.5 text-xs font-medium font-numeric"
                                                            style={{ color: changePos ? 'var(--color-success)' : 'var(--color-danger)' }}>
                                                            {changePos ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                                                            {changePos ? '+' : ''}{change.toFixed(2)}%
                                                        </span>
                                                    </td>
                                                    {/* P&L */}
                                                    <td className="py-3 text-right">
                                                        <p className="text-xs font-numeric font-semibold"
                                                            style={{ color: pnlPos ? 'var(--color-success)' : 'var(--color-danger)' }}>
                                                            {pnlPos ? '+' : ''}{formatCurrency(pnl)}
                                                        </p>
                                                        <p className="text-xs font-numeric"
                                                            style={{ color: pnlPos ? 'var(--color-success)' : 'var(--color-danger)' }}>
                                                            {pnlPos ? '+' : ''}{pnlPct.toFixed(2)}%
                                                        </p>
                                                    </td>
                                                </motion.tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </GlassCard>
                </motion.div>
            )}

            {/* ─── Behavioral Insights ─────────────────────────────────── */}
            <motion.div {...fade(0.55)}>
                <GlassCard>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-h3 flex items-center gap-2">
                            <Brain size={18} style={{ color: 'var(--color-accent-teal)' }} />
                            Behavioral Insights
                        </h2>
                        {b?.hasRealData ? (
                            <Pill label="Live" color="var(--color-success)" />
                        ) : (
                            <Pill label="Placeholder" color="#eab308" />
                        )}
                    </div>
                    {isLoading ? <SkeletonLoader count={3} /> : (
                        b?.hasRealData ? (
                            <div className="space-y-4">
                                {/* Adaptive Risk Score gauge */}
                                <div className="flex items-center gap-4 p-4 rounded-xl"
                                    style={{ background: 'var(--color-bg-tertiary)' }}>
                                    <div className="relative w-16 h-16 flex-shrink-0">
                                        <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
                                            <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--color-border)" strokeWidth="3" />
                                            <circle cx="18" cy="18" r="15.9" fill="none"
                                                stroke="var(--color-accent-teal)" strokeWidth="3"
                                                strokeDasharray={`${(b.adaptiveRiskScore / 100) * 100} 100`}
                                                strokeLinecap="round" />
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-sm font-bold font-numeric">{b.adaptiveRiskScore.toFixed(0)}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="font-semibold">Adaptive Risk Score</p>
                                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                                            {b.adaptiveRiskScore > 70 ? 'High risk appetite detected' : b.adaptiveRiskScore > 40 ? 'Balanced trading behaviour' : 'Cautious / risk-averse behaviour'}
                                        </p>
                                    </div>
                                </div>
                                {/* Behavioral bias bars */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-3">
                                        <ScoreBar label="Panic Selling Tendency" value={b.panicSellScore} color={b.panicSellScore > 50 ? '#E5484D' : '#1DB876'} />
                                        <ScoreBar label="Recency Bias" value={b.recencyBiasScore} color={b.recencyBiasScore > 50 ? '#D4922B' : '#1DB876'} />
                                    </div>
                                    <div className="space-y-3">
                                        <ScoreBar label="Risk Chasing" value={b.riskChasingScore} color={b.riskChasingScore > 50 ? '#E5484D' : '#1DB876'} />
                                        <ScoreBar label="Liquidity Stress" value={b.liquidityStressScore} color={b.liquidityStressScore > 50 ? '#D4922B' : '#1DB876'} />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Placeholder cards when no behavioral data */
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <PlaceholderCard icon={<Zap size={16} />} title="Panic Selling Detection"
                                    description="Detects emotional sell-offs during market dips and alerts you before you act." />
                                <PlaceholderCard icon={<Brain size={16} />} title="Recency Bias Monitor"
                                    description="Tracks whether recent returns are over-influencing your allocation decisions." />
                                <PlaceholderCard icon={<TrendingUp size={16} />} title="Risk Chasing Alert"
                                    description="Identifies when you tilt towards high-risk assets after strong market runs." />
                                <PlaceholderCard icon={<Activity size={16} />} title="Liquidity Stress Test"
                                    description="Simulates sudden market events and measures your portfolio's resilience." />
                            </div>
                        )
                    )}
                </GlassCard>
            </motion.div>

            {/* ─── Goals + Alerts row ───────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Goals */}
                <motion.div {...fade(0.6)}>
                    <GlassCard className="h-full">
                        <h2 className="text-h3 mb-4 flex items-center gap-2">
                            <Target size={18} style={{ color: 'var(--color-accent-teal)' }} />
                            Financial Goals
                        </h2>
                        {isLoading ? <SkeletonLoader count={3} /> :
                            (data?.goals ?? []).length > 0 ? (
                                <div className="space-y-4">
                                    {(data?.goals ?? []).map(g => {
                                        const prob = g.probability ?? 0;
                                        const probColor = prob >= 75 ? '#1DB876' : prob >= 50 ? '#D4922B' : '#E5484D';
                                        const yearsLeft = g.targetDate
                                            ? Math.max(0, Math.round((new Date(g.targetDate).getTime() - Date.now()) / (365.25 * 24 * 3600 * 1000)))
                                            : null;
                                        return (
                                            <div key={g.id} className="p-4 rounded-xl"
                                                style={{ background: 'var(--color-bg-tertiary)' }}>
                                                <div className="flex items-center justify-between mb-2">
                                                    <p className="font-semibold text-sm">{g.name}</p>
                                                    {g.probability != null && (
                                                        <span className="text-xs font-bold font-numeric px-2 py-0.5 rounded-full"
                                                            style={{ background: `${probColor}22`, color: probColor }}>
                                                            {prob}% likely
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-end justify-between">
                                                    <div>
                                                        <p className="text-lg font-bold font-numeric">{formatCurrency(g.targetAmount)}</p>
                                                        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                                                            Target{yearsLeft != null ? ` • ${yearsLeft}y left` : ''}
                                                        </p>
                                                    </div>
                                                    {g.medianProjection && (
                                                        <div className="text-right">
                                                            <p className="text-sm font-semibold" style={{ color: 'var(--color-success)' }}>{formatCurrency(g.medianProjection)}</p>
                                                            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Median projection</p>
                                                        </div>
                                                    )}
                                                </div>
                                                {g.probability != null && (
                                                    <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-bg-secondary)' }}>
                                                        <motion.div className="h-full rounded-full" style={{ background: probColor }}
                                                            initial={{ width: 0 }} animate={{ width: `${prob}%` }}
                                                            transition={{ duration: 0.8, delay: 0.5 }} />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-8 gap-2"
                                    style={{ color: 'var(--color-text-muted)' }}>
                                    <Target size={32} style={{ opacity: 0.3 }} />
                                    <p className="text-sm">No goals set yet. Visit the Goals page to add one.</p>
                                </div>
                            )}
                    </GlassCard>
                </motion.div>

                {/* Alerts */}
                <motion.div {...fade(0.65)}>
                    <GlassCard className="h-full">
                        <h2 className="text-h3 mb-4 flex items-center gap-2">
                            <Bell size={18} style={{ color: 'var(--color-accent-teal)' }} />
                            Recent Alerts
                            {(data?.unreadAlertsCount ?? 0) > 0 && (
                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold"
                                    style={{ background: 'var(--color-danger)', color: 'white' }}>
                                    {data?.unreadAlertsCount}
                                </span>
                            )}
                        </h2>
                        {isLoading ? <SkeletonLoader count={4} /> :
                            (data?.alerts ?? []).length > 0 ? (
                                <div className="space-y-3">
                                    {(data?.alerts ?? []).map(a => {
                                        const col = severityColor[a.severity] ?? severityColor.INFO;
                                        return (
                                            <div key={a.id} className="flex gap-3 p-3 rounded-xl"
                                                style={{ background: 'var(--color-bg-tertiary)', opacity: a.isRead ? 0.65 : 1 }}>
                                                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                                    style={{ background: `${col}20` }}>
                                                    <AlertTriangle size={14} style={{ color: col }} />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <Pill label={a.severity} color={col} />
                                                        {!a.isRead && <span className="text-xs font-bold" style={{ color: col }}>New</span>}
                                                    </div>
                                                    <p className="text-xs leading-relaxed"
                                                        style={{ color: 'var(--color-text-secondary)' }}>{a.message}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-8 gap-2"
                                    style={{ color: 'var(--color-text-muted)' }}>
                                    <Bell size={32} style={{ opacity: 0.3 }} />
                                    <p className="text-sm">No alerts — your portfolio looks healthy!</p>
                                </div>
                            )}
                    </GlassCard>
                </motion.div>
            </div>

            {/* ─── News & Events ────────────────────────────────────────── */}
            {((data?.events ?? []).length > 0 || isLoading) && (
                <motion.div {...fade(0.7)}>
                    <GlassCard>
                        <h2 className="text-h3 mb-4 flex items-center gap-2">
                            <Info size={18} style={{ color: 'var(--color-accent-teal)' }} />
                            Market Events Affecting Your Portfolio
                        </h2>
                        {isLoading ? <SkeletonLoader count={3} /> : (
                            <div className="space-y-3">
                                {(data?.events ?? []).map(e => {
                                    const sentiment = e.sentiment ?? 0;
                                    const sentColor = sentiment > 0.2 ? '#1DB876' : sentiment < -0.2 ? '#E5484D' : '#D4922B';
                                    const sentLabel = sentiment > 0.2 ? 'Bullish' : sentiment < -0.2 ? 'Bearish' : 'Neutral';
                                    return (
                                        <div key={e.id} className="flex items-start gap-3 p-3 rounded-xl"
                                            style={{ background: 'var(--color-bg-tertiary)' }}>
                                            <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: sentColor }} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium leading-snug">{e.headline}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{e.source}</span>
                                                    <Pill label={sentLabel} color={sentColor} />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </GlassCard>
                </motion.div>
            )}
        </div>
    );
}
