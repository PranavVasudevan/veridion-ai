import { motion } from 'framer-motion';
import GlassCard from '../components/ui/GlassCard';
import AnimatedGauge from '../components/ui/AnimatedGauge';
import CountUp from '../components/reactbits/CountUp';
import ScrollReveal from '../components/reactbits/ScrollReveal';
import Diagrams from '../components/charts/Diagrams';
import SkeletonLoader from '../components/ui/SkeletonLoader';
import Tooltip from '../components/ui/Tooltip';
import { useBehavioral } from '../hooks/useBehavioral';
import { formatCurrency, formatPercent } from '../utils/formatters';
import { GLOSSARY } from '../utils/constants';

const pageV = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0, transition: { duration: 0.4 } }, exit: { opacity: 0 } };

export default function BehavioralInsights() {
    const { score, spending, history, isLoading } = useBehavioral();

    const biases = score ? [
        { label: 'Panic Selling', value: score.panicSellingIndex, tip: GLOSSARY['Panic Selling Index'] },
        { label: 'Recency Bias', value: score.recencyBias, tip: GLOSSARY['Recency Bias'] },
        { label: 'Risk Chasing', value: score.riskChasing, tip: GLOSSARY['Risk Chasing'] },
        { label: 'Liquidity Stress', value: score.liquidityStress, tip: GLOSSARY['Liquidity Stress'] },
    ] : [];

    const radarData = score ? [
        { name: 'Panic Sell', value: Math.round(score.panicSellingIndex * 100) },
        { name: 'Recency', value: Math.round(score.recencyBias * 100) },
        { name: 'Risk Chase', value: Math.round(score.riskChasing * 100) },
        { name: 'Liquidity', value: Math.round(score.liquidityStress * 100) },
        { name: 'Adaptive', value: score.adaptiveRiskScore },
    ] : [];

    const historyData = history.map((h) => ({
        date: new Date(h.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        score: Math.round(h.adaptiveRiskScore),
    }));

    return (
        <motion.div variants={pageV} initial="initial" animate="animate" exit="exit">
            {/* Adaptive Risk Score */}
            <ScrollReveal>
                <GlassCard className="mb-6">
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        <div className="text-center">
                            <Tooltip content={GLOSSARY['Adaptive Risk Score']}>
                                <p className="text-caption mb-4" style={{ color: 'var(--color-text-muted)' }}>Adaptive Risk Score</p>
                            </Tooltip>
                            {score ? (
                                <>
                                    <AnimatedGauge value={score.adaptiveRiskScore} size={200} strokeWidth={14} />
                                    <div className="mt-4">
                                        <CountUp end={score.adaptiveRiskScore} className="text-metric" />
                                        <span className="text-2xl font-bold" style={{ color: 'var(--color-text-muted)' }}>/100</span>
                                    </div>
                                </>
                            ) : <SkeletonLoader height="h-40" className="w-48" />}
                        </div>
                        <div className="flex-1 w-full">
                            <h3 className="text-h3 mb-4">Bias Detection</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {biases.map((b) => (
                                    <div key={b.label} className="p-4 rounded-xl" style={{ background: 'var(--color-bg-tertiary)' }}>
                                        <Tooltip content={b.tip}>
                                            <div className="flex justify-between text-sm mb-2">
                                                <span style={{ color: 'var(--color-text-secondary)' }}>{b.label}</span>
                                                <span className="font-numeric font-semibold" style={{ color: b.value > 0.5 ? 'var(--color-danger)' : b.value > 0.3 ? 'var(--color-warning)' : 'var(--color-success)' }}>
                                                    {(b.value * 100).toFixed(0)}%
                                                </span>
                                            </div>
                                        </Tooltip>
                                        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-bg-secondary)' }}>
                                            <motion.div
                                                className="h-full rounded-full"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${b.value * 100}%` }}
                                                transition={{ duration: 0.8, delay: 0.2 }}
                                                style={{ background: b.value > 0.5 ? 'var(--color-danger)' : b.value > 0.3 ? 'var(--color-warning)' : 'var(--color-success)' }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </GlassCard>
            </ScrollReveal>

            {/* Spending Metrics */}
            {spending && (
                <ScrollReveal>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <GlassCard>
                            <Tooltip content={GLOSSARY['Burn Rate']}>
                                <p className="text-caption" style={{ color: 'var(--color-text-muted)' }}>Monthly Burn Rate</p>
                            </Tooltip>
                            <CountUp end={spending.monthlyBurnRate} prefix="$" separator="," className="text-2xl font-bold font-numeric mt-2" />
                        </GlassCard>
                        <GlassCard>
                            <Tooltip content={GLOSSARY['Savings Rate']}>
                                <p className="text-caption" style={{ color: 'var(--color-text-muted)' }}>Savings Rate</p>
                            </Tooltip>
                            <CountUp end={spending.savingsRate * 100} suffix="%" decimals={1} className="text-2xl font-bold font-numeric mt-2" />
                        </GlassCard>
                        <GlassCard>
                            <Tooltip content={GLOSSARY['Expense Volatility']}>
                                <p className="text-caption" style={{ color: 'var(--color-text-muted)' }}>Expense Volatility</p>
                            </Tooltip>
                            <CountUp end={spending.expenseVolatility * 100} suffix="%" decimals={1} className="text-2xl font-bold font-numeric mt-2" />
                        </GlassCard>
                    </div>
                </ScrollReveal>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Radar Chart */}
                <ScrollReveal>
                    <GlassCard>
                        <h3 className="text-h3 mb-4">Behavioral Profile</h3>
                        {radarData.length > 0 ? (
                            <Diagrams data={radarData} type="radar" dataKeys={['value']} xKey="name" height={300} />
                        ) : <SkeletonLoader count={4} />}
                    </GlassCard>
                </ScrollReveal>

                {/* Timeline */}
                <ScrollReveal delay={0.1}>
                    <GlassCard>
                        <h3 className="text-h3 mb-4">Score Evolution</h3>
                        {historyData.length > 0 ? (
                            <Diagrams data={historyData} type="area" dataKeys={['score']} xKey="date" height={300} />
                        ) : <SkeletonLoader count={4} />}
                    </GlassCard>
                </ScrollReveal>
            </div>
        </motion.div>
    );
}
