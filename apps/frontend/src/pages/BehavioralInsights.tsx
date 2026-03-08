console.log('useBehavioral called');
import { motion } from 'framer-motion';
import {
    Brain,
    TrendingUp,
    Zap,
    Activity,
    Shield,
    RefreshCw,
    Info,
    AlertTriangle,
    CheckCircle,
    ChevronRight,
    Target,
    Wallet
} from 'lucide-react';

import GlassCard from '../components/ui/GlassCard';
import AnimatedGauge from '../components/ui/AnimatedGauge';
import CountUp from '../components/reactbits/CountUp';
import ScrollReveal from '../components/reactbits/ScrollReveal';
import Diagrams from '../components/charts/Diagrams';
import SkeletonLoader from '../components/ui/SkeletonLoader';
import Tooltip from '../components/ui/Tooltip';

import { useBehavioral } from '../hooks/useBehavioral';
import { useBehavioralStore } from '../state/behavioral.store';

import { GLOSSARY } from '../utils/constants';

const pageV = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
    exit: { opacity: 0 },
};

function scoreColor(val: number): React.CSSProperties['color'] {
    if (val >= 70) return 'var(--color-success)';
    if (val >= 40) return 'var(--color-warning)';
    return 'var(--color-danger)';
}

function riskColor(val: number): React.CSSProperties['color'] {
    if (val <= 30) return 'var(--color-success)';
    if (val <= 60) return 'var(--color-warning)';
    return 'var(--color-danger)';
}

function ScoreBar({ label, value, isRisk = false, tip }: { label: string; value: number; isRisk?: boolean; tip?: string }) {
    const col = isRisk ? riskColor(value) : scoreColor(value);

    const content = (
        <div>
            <div className="flex justify-between text-sm mb-1.5">
                <span style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
                <span className="font-bold font-numeric" style={{ color: col }}>
                    {value.toFixed(0)}
                </span>
            </div>

            <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--color-bg-tertiary)' }}>
                <motion.div
                    className="h-full rounded-full"
                    style={{ background: col }}
                    initial={{ width: 0 }}
                    animate={{ width: `${value}%` }}
                    transition={{ duration: 0.8 }}
                />
            </div>
        </div>
    );

    return tip ? <Tooltip content={tip}>{content}</Tooltip> : content;
}

function InsightRow({ text, type }: { text: string; type: 'good' | 'warn' | 'bad' }) {

    const colors = {
        good: 'var(--color-success)',
        warn: 'var(--color-warning)',
        bad: 'var(--color-danger)'
    };

    const icons = {
        good: <CheckCircle size={14} />,
        warn: <AlertTriangle size={14} />,
        bad: <AlertTriangle size={14} />
    };

    return (
        <div
            className="flex items-start gap-3 p-3 rounded-xl"
            style={{
                background: 'var(--color-bg-tertiary)',
                borderLeft: `3px solid ${colors[type]}`
            }}
        >
            <span style={{ color: colors[type], marginTop: 2 }}>
                {icons[type]}
            </span>

            <p
                className="text-sm leading-relaxed"
                style={{ color: 'var(--color-text-secondary)' }}
            >
                {text}
            </p>
        </div>
    );
}

function classifyInsight(text: string): 'good' | 'warn' | 'bad' {

    const lower = text.toLowerCase();

    if (lower.includes('low') && lower.includes('panic')) return 'good';
    if (lower.includes('strong') || lower.includes('healthy')) return 'good';
    if (lower.includes('high')) return 'bad';

    return 'warn';
}

export default function BehavioralInsights() {


    const { scores, adaptiveRisk, history = [], wallet, trades = [], isLoading } = useBehavioral();
    const { isRefreshing, refreshScores } = useBehavioralStore();
    console.log('scores in component:', scores);
    const adaptiveScore = scores?.adaptiveRiskScore ?? 0;
    const alerts = scores?.alerts ?? [];
const insights = scores?.insights ?? [];

    const radarData = scores ? [
        { name: 'Adaptive', value: Math.round(scores.adaptiveRiskScore) },
        { name: 'Panic Sell', value: Math.round(scores.panicSellScore) },
        { name: 'Recency', value: Math.round(scores.recencyBiasScore) },
        { name: 'Risk Chase', value: Math.round(scores.riskChasingScore) },
        { name: 'Liquidity', value: Math.round(scores.liquidityStressScore) },
    ] : [];

    const historyChartData = history.map(h => ({
        date: new Date(h.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        Adaptive: Math.round(h.adaptiveRiskScore),
        Panic: Math.round(h.panicSellScore),
    }));

    const regimeConfig = {
        LOW_VOLATILITY: { color: 'var(--color-success)', label: 'Low Volatility' },
        NORMAL: { color: 'var(--color-warning)', label: 'Normal' },
        HIGH_VOLATILITY: { color: 'var(--color-danger)', label: 'High Volatility' },
    };

    const regimeKey = adaptiveRisk?.marketRegime ?? 'NORMAL';
const regime = regimeConfig[regimeKey as keyof typeof regimeConfig];;

    return (
        <motion.div variants={pageV} initial="initial" animate="animate" exit="exit" className="space-y-6">

            {/* Header */}

            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">

                <div>
                    <h1 className="text-h1 flex items-center gap-2">
                        <Brain size={28} style={{ color: 'var(--color-accent-teal)' }} />
                        Behavioral Insights
                    </h1>

                    <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
                        AI-powered analysis of your trading behaviour and biases
                    </p>
                </div>

                <button
                    onClick={refreshScores}
                    disabled={isRefreshing}
                    className="btn-primary text-sm flex items-center gap-2"
                >
                    <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
                    {isRefreshing ? 'Analysing…' : 'Run Analysis'}
                </button>

            </div>
            {/* Behavioral Risk Alerts */}

{scores && scores.alerts.length > 0 && (

<GlassCard>

<h2 className="text-h3 mb-4 flex items-center gap-2">
<AlertTriangle size={18} style={{ color: 'var(--color-danger)' }} />
Behavioral Risk Alerts
</h2>

<div className="space-y-2">

{scores?.alerts?.map((a, i) => (

<div
key={i}
className="flex items-center gap-3 p-3 rounded-xl"
style={{
background: 'rgba(255,80,80,0.08)',
borderLeft: '3px solid var(--color-danger)'
}}
>

<AlertTriangle size={14} style={{ color: 'var(--color-danger)' }} />

<p className="text-sm">{a}</p>

</div>

))}

</div>

</GlassCard>

)}

            {/* Wallet Overview */}

            <ScrollReveal>

                <GlassCard className="flex items-center justify-between p-6">

                    <div>

                        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                            Wallet Balance
                        </p>

                        <p className="text-3xl font-bold font-numeric mt-1">
                            ${wallet?.balance?.toLocaleString() ?? '0'}
                        </p>

                        <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                            Available for trading
                        </p>

                    </div>

                    <Wallet size={34} style={{ color: 'var(--color-accent-teal)' }} />

                </GlassCard>

            </ScrollReveal>

            {/* Score Cards */}

            <ScrollReveal>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                    <GlassCard className="flex flex-col items-center py-6 gap-3">

                        <Tooltip content={GLOSSARY['Adaptive Risk Score']}>

                            <p className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
                                Adaptive Risk Score
                            </p>

                        </Tooltip>

                        {isLoading ? (

<SkeletonLoader height="h-32" className="w-32 rounded-full" />

) : (

<>
<AnimatedGauge value={adaptiveScore} size={130} strokeWidth={12} />

<span style={{ color: scoreColor(adaptiveScore) }}>
  <CountUp
    end={adaptiveScore}
    className="text-3xl font-bold font-numeric"
  />
</span>
</>

)}

                    </GlassCard>

                    <GlassCard className="py-6">

                        <ScoreBar
                            label="Panic Sell"
                            value={scores?.panicSellScore ?? 0}
                            isRisk
                        />

                        <ScoreBar
                            label="Recency Bias"
                            value={scores?.recencyBiasScore ?? 0}
                            isRisk
                        />

                    </GlassCard>

                    <GlassCard className="py-6">

                        <ScoreBar
                            label="Liquidity Stress"
                            value={scores?.liquidityStressScore ?? 0}
                            isRisk
                        />

                        <ScoreBar
                            label="Risk Chasing"
                            value={scores?.riskChasingScore ?? 0}
                            isRisk
                        />

                    </GlassCard>

                </div>

            </ScrollReveal>

            {/* Radar + AI Insights */}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                <GlassCard>

                    <h2 className="text-h3 mb-4 flex items-center gap-2">
                        <Activity size={18} style={{ color: 'var(--color-accent-teal)' }} />
                        Behavioral Profile
                    </h2>

                    {isLoading
                        ? <SkeletonLoader height="h-64" />
                        : <Diagrams
  key={scores?.calculatedAt ?? scores?.updatedAt}
  data={radarData}
  type="radar"
  dataKeys={['value']}
  xKey="name"
  height={280}
/>
                    }

                </GlassCard>

                <GlassCard>

                    <h2 className="text-h3 mb-4 flex items-center gap-2">
                        <Brain size={18} style={{ color: 'var(--color-accent-teal)' }} />
                        AI Insights
                    </h2>

                    {scores?.insights?.map((i, idx) =>
                        <InsightRow key={idx} text={i} type={classifyInsight(i)} />
                    )}

                </GlassCard>

            </div>

            {/* Recent Trades */}

            <ScrollReveal>

                <GlassCard>

                    <h2 className="text-h3 mb-4 flex items-center gap-2">
                        <TrendingUp size={18} style={{ color: 'var(--color-accent-teal)' }} />
                        Recent Trades
                    </h2>

                    {trades?.length ? (

                        <div className="space-y-2">

                            {trades.slice(0, 6).map(t => (

                                <div
                                    key={t.id}
                                    className="flex items-center justify-between p-3 rounded-xl"
                                    style={{ background: 'var(--color-bg-tertiary)' }}
                                >

                                    <div>

                                        <p className="text-sm font-semibold">
                                            {t.side} {t.assetTicker}
                                        </p>

                                        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                                            {t.quantity} @ ${t.price}
                                        </p>

                                    </div>

                                    <p
                                        className="text-sm font-bold font-numeric"
                                        style={{
                                            color: t.side === 'BUY'
                                                ? 'var(--color-danger)'
                                                : 'var(--color-success)'
                                        }}
                                    >
                                        ${t.total.toLocaleString()}
                                    </p>

                                </div>

                            ))}

                        </div>

                    ) : (

                        <div className="flex flex-col items-center py-8">

                            <Activity size={30} style={{ opacity: 0.3 }} />

                            <p className="text-sm mt-2">
                                No trades yet
                            </p>

                        </div>

                    )}

                </GlassCard>

            </ScrollReveal>

            {/* Score Evolution */}

{history.length > 0 && (

<GlassCard>

<h2 className="text-h3 mb-4 flex items-center gap-2">
<TrendingUp size={18} style={{ color: 'var(--color-accent-teal)' }} />
Score Evolution
</h2>

<Diagrams
  key={history.length}
  data={historyChartData}
  type="area"
  dataKeys={['Adaptive', 'Panic']}
  xKey="date"
  height={220}
/>

</GlassCard>

)}

        </motion.div>
    );
}