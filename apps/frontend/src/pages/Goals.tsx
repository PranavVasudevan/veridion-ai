import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Target } from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';
import ProbabilityMeter from '../components/ui/ProbabilityMeter';
import CountUp from '../components/reactbits/CountUp';
import ScrollReveal from '../components/reactbits/ScrollReveal';
import StarBorder from '../components/reactbits/StarBorder';
import Diagrams from '../components/charts/Diagrams';
import { useGoals } from '../hooks/useGoals';
import { formatCurrency } from '../utils/formatters';
import { GOAL_ICONS } from '../utils/constants';
import { demoMonteCarloResults } from '../utils/demoData';

const pageV = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0, transition: { duration: 0.4 } }, exit: { opacity: 0 } };

export default function Goals() {
    const { goals, isLoading } = useGoals();
    const [selectedGoal, setSelectedGoal] = useState<number | null>(null);

    const mcResult = selectedGoal ? demoMonteCarloResults.find(r => r.goalId === selectedGoal) : demoMonteCarloResults[0];
    const coneData = mcResult ? mcResult.percentiles.p50.map((_, i) => ({
        period: i,
        p10: mcResult.percentiles.p10[i],
        p25: mcResult.percentiles.p25[i],
        p50: mcResult.percentiles.p50[i],
        p75: mcResult.percentiles.p75[i],
        p90: mcResult.percentiles.p90[i],
    })) : [];

    return (
        <motion.div variants={pageV} initial="initial" animate="animate" exit="exit">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-h2">Financial Goals</h2>
                <button className="btn-primary">
                    <Plus size={16} /> New Goal
                </button>
            </div>

            {/* Goal Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {goals.map((goal, i) => {
                    const isSelected = selectedGoal === goal.id || (!selectedGoal && i === 0);
                    const card = (
                        <GlassCard interactive className={isSelected ? 'glow-border' : ''} key={goal.id}>
                            <div onClick={() => setSelectedGoal(goal.id)} className="cursor-pointer">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl">{GOAL_ICONS[goal.type] || '🎯'}</span>
                                        <div>
                                            <h3 className="text-h3">{goal.name}</h3>
                                            <p className="text-caption" style={{ color: 'var(--color-text-muted)' }}>{goal.timeHorizonYears}yr horizon</p>
                                        </div>
                                    </div>
                                    <span className="px-2 py-0.5 rounded text-xs font-medium capitalize" style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}>{goal.priority}</span>
                                </div>
                                <div className="mb-3">
                                    <p className="text-caption" style={{ color: 'var(--color-text-muted)' }}>Target</p>
                                    <CountUp end={goal.targetAmount} prefix="$" separator="," className="text-xl font-bold font-numeric" />
                                </div>
                                <div className="mb-3">
                                    <div className="flex justify-between text-xs mb-1">
                                        <span style={{ color: 'var(--color-text-muted)' }}>Probability</span>
                                        <span className="font-semibold font-numeric">{goal.probability}%</span>
                                    </div>
                                    <ProbabilityMeter value={goal.probability} />
                                </div>
                                <div className="flex justify-between text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                                    <span>Monthly: {formatCurrency(goal.monthlyContribution)}</span>
                                    <span>Funded: {formatCurrency(goal.currentAmount)}</span>
                                </div>
                            </div>
                        </GlassCard>
                    );

                    return goal.priority === 'high' ? <StarBorder key={goal.id}>{card}</StarBorder> : card;
                })}
            </div>

            {/* Monte Carlo Visualization */}
            <ScrollReveal>
                <GlassCard>
                    <h3 className="text-h3 mb-4">Monte Carlo Projection</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
                        {mcResult && [
                            { label: 'Probability', value: `${mcResult.probability}%` },
                            { label: 'Expected Value', value: formatCurrency(mcResult.statistics.mean, true) },
                            { label: 'Loss Probability', value: `${(mcResult.statistics.probabilityOfLoss * 100).toFixed(1)}%` },
                            { label: 'Std Deviation', value: formatCurrency(mcResult.statistics.std, true) },
                        ].map((m) => (
                            <div key={m.label} className="p-3 rounded-xl text-center" style={{ background: 'var(--color-bg-tertiary)' }}>
                                <p className="text-caption" style={{ color: 'var(--color-text-muted)' }}>{m.label}</p>
                                <p className="text-lg font-bold font-numeric mt-1">{m.value}</p>
                            </div>
                        ))}
                    </div>
                    {coneData.length > 0 && (
                        <Diagrams data={coneData} type="area" dataKeys={['p10', 'p25', 'p50', 'p75', 'p90']} xKey="period" height={350} stacked={false} showLegend
                            colors={['rgba(239,68,68,0.3)', 'rgba(245,158,11,0.3)', '#00D4AA', 'rgba(245,158,11,0.3)', 'rgba(239,68,68,0.3)']}
                        />
                    )}
                </GlassCard>
            </ScrollReveal>
        </motion.div>
    );
}
