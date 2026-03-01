import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Target, X, Loader2, RefreshCw } from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';
import ProbabilityMeter from '../components/ui/ProbabilityMeter';
import CountUp from '../components/reactbits/CountUp';
import ScrollReveal from '../components/reactbits/ScrollReveal';
import StarBorder from '../components/reactbits/StarBorder';
import Diagrams from '../components/charts/Diagrams';
import { useGoalsStore } from '../state/goals.store';
import { goalsService, type SimulationResult } from '../services/goals.service';
import { formatCurrency } from '../utils/formatters';
import { GOAL_ICONS } from '../utils/constants';
import { useUIStore } from '../state/ui.store';

const pageV = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0, transition: { duration: 0.4 } }, exit: { opacity: 0 } };

const GOAL_TYPES = [
    { value: 'retirement', label: 'Retirement' },
    { value: 'house', label: 'Buy a House' },
    { value: 'education', label: 'Education' },
    { value: 'custom', label: 'Custom Goal' },
];

const PRIORITIES = ['low', 'medium', 'high'] as const;

interface NewGoalForm {
    name: string;
    type: string;
    targetAmount: string;
    currentAmount: string;
    timeHorizonYears: string;
    monthlyContribution: string;
    priority: 'low' | 'medium' | 'high';
}

const defaultForm: NewGoalForm = {
    name: '',
    type: 'custom',
    targetAmount: '',
    currentAmount: '0',
    timeHorizonYears: '5',
    monthlyContribution: '0',
    priority: 'medium',
};

export default function Goals() {
    const { goals, isLoading, fetchGoals, addGoal, deleteGoal } = useGoalsStore();
    const addToast = useUIStore((s) => s.addToast);
    const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState<NewGoalForm>(defaultForm);
    const [submitting, setSubmitting] = useState(false);
    const [simulating, setSimulating] = useState<number | null>(null);
    const [simResults, setSimResults] = useState<Record<number, SimulationResult>>({});
    const [deletingId, setDeletingId] = useState<number | null>(null);

    useEffect(() => {
        fetchGoals();
    }, []);

    const selectedGoal = goals.find((g) => g.id === selectedGoalId) ?? goals[0] ?? null;
    const simResult = selectedGoal ? simResults[selectedGoal.id] : null;

    const generateConeData = (sim: SimulationResult, horizonYears: number) => {
        const pts = Math.max(horizonYears * 12, 12);
        return Array.from({ length: pts + 1 }, (_, i) => {
            const t = i / pts;
            const growth = Math.exp(0.07 * t * horizonYears);
            const spread = 0.3 * t * horizonYears;
            const base = sim.medianProjection * growth;
            return {
                period: i,
                p10: Math.round(base * Math.exp(-spread * 1.3)),
                p25: Math.round(base * Math.exp(-spread * 0.6)),
                p50: Math.round(base),
                p75: Math.round(base * Math.exp(spread * 0.6)),
                p90: Math.round(base * Math.exp(spread * 1.3)),
            };
        });
    };

    const runSimulation = async (goalId: number) => {
        setSimulating(goalId);
        try {
            const result = await goalsService.simulateGoal(goalId);
            setSimResults((prev) => ({ ...prev, [goalId]: result }));
            addToast({ type: 'success', title: 'Simulation Complete', message: `${result.probability}% probability of reaching your goal!` });
        } catch {
            addToast({ type: 'error', title: 'Simulation Failed', message: 'Could not run Monte Carlo simulation' });
        } finally {
            setSimulating(null);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name || !form.targetAmount) {
            addToast({ type: 'error', title: 'Missing Fields', message: 'Please fill in name and target amount' });
            return;
        }
        setSubmitting(true);
        try {
            await addGoal({
                name: form.name,
                type: form.type,
                targetAmount: parseFloat(form.targetAmount),
                currentAmount: parseFloat(form.currentAmount) || 0,
                timeHorizonYears: parseInt(form.timeHorizonYears) || 5,
                monthlyContribution: parseFloat(form.monthlyContribution) || 0,
                priority: form.priority,
            });
            addToast({ type: 'success', title: 'Goal Created!', message: `"${form.name}" has been added to your goals.` });
            setShowModal(false);
            setForm(defaultForm);
            // Auto-simulate the newly created goal
            const newGoal = useGoalsStore.getState().goals.at(-1);
            if (newGoal) {
                setSelectedGoalId(newGoal.id);
                runSimulation(newGoal.id);
            }
        } catch {
            addToast({ type: 'error', title: 'Failed to Create Goal', message: 'Please try again.' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (goalId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setDeletingId(goalId);
        try {
            await deleteGoal(goalId);
            addToast({ type: 'success', title: 'Goal Deleted', message: 'Goal has been removed.' });
            if (selectedGoalId === goalId) setSelectedGoalId(null);
        } catch {
            addToast({ type: 'error', title: 'Delete Failed', message: 'Could not delete goal' });
        } finally {
            setDeletingId(null);
        }
    };

    const coneData = simResult && selectedGoal
        ? generateConeData(simResult, selectedGoal.timeHorizonYears)
        : [];

    return (
        <motion.div variants={pageV} initial="initial" animate="animate" exit="exit">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-h2">Financial Goals</h2>
                <button className="btn-primary flex items-center gap-2" onClick={() => setShowModal(true)}>
                    <Plus size={16} /> New Goal
                </button>
            </div>

            {/* Goal Cards */}
            {isLoading ? (
                <div className="flex items-center justify-center h-32">
                    <Loader2 className="animate-spin" style={{ color: 'var(--color-accent-teal)' }} />
                </div>
            ) : goals.length === 0 ? (
                <GlassCard className="text-center py-16 mb-6">
                    <Target size={48} className="mx-auto mb-4" style={{ color: 'var(--color-text-muted)' }} />
                    <p className="text-h3 mb-2">No goals yet</p>
                    <p className="text-body mb-4" style={{ color: 'var(--color-text-muted)' }}>Create your first financial goal to run projections</p>
                    <button className="btn-primary" onClick={() => setShowModal(true)}>
                        <Plus size={16} className="inline mr-2" /> Create a Goal
                    </button>
                </GlassCard>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                    {goals.map((goal) => {
                        const isSelected = selectedGoalId === goal.id || (!selectedGoalId && goal === goals[0]);
                        const card = (
                            <GlassCard
                                interactive
                                className={isSelected ? 'glow-border' : ''}
                                key={goal.id}
                                onClick={() => setSelectedGoalId(goal.id)}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl">{GOAL_ICONS[goal.type] || '🎯'}</span>
                                        <div>
                                            <h3 className="text-h3">{goal.name}</h3>
                                            <p className="text-caption" style={{ color: 'var(--color-text-muted)' }}>{goal.timeHorizonYears}yr horizon</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="px-2 py-0.5 rounded text-xs font-medium capitalize" style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}>{goal.priority}</span>
                                        <button
                                            onClick={(e) => handleDelete(goal.id, e)}
                                            disabled={deletingId === goal.id}
                                            className="p-1 rounded hover:bg-red-500/20 transition-colors"
                                            style={{ color: 'var(--color-danger)' }}
                                            title="Delete goal"
                                        >
                                            {deletingId === goal.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                        </button>
                                    </div>
                                </div>
                                <div className="mb-3">
                                    <p className="text-caption" style={{ color: 'var(--color-text-muted)' }}>Target</p>
                                    <CountUp end={goal.targetAmount} prefix="$" separator="," className="text-xl font-bold font-numeric" />
                                </div>
                                <div className="mb-3">
                                    <div className="flex justify-between text-xs mb-1">
                                        <span style={{ color: 'var(--color-text-muted)' }}>Probability</span>
                                        <span className="font-semibold font-numeric">
                                            {simResults[goal.id] ? simResults[goal.id].probability : goal.probability}%
                                        </span>
                                    </div>
                                    <ProbabilityMeter value={simResults[goal.id] ? simResults[goal.id].probability : goal.probability} />
                                </div>
                                <div className="flex justify-between text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                                    <span>Monthly: {formatCurrency(goal.monthlyContribution)}</span>
                                    <span>Funded: {formatCurrency(goal.currentAmount)}</span>
                                </div>
                                {isSelected && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); runSimulation(goal.id); }}
                                        disabled={simulating === goal.id}
                                        className="mt-3 w-full flex items-center justify-center gap-2 py-1.5 rounded-lg text-xs font-medium transition-colors"
                                        style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-accent-teal)' }}
                                    >
                                        {simulating === goal.id ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                                        {simulating === goal.id ? 'Simulating…' : 'Run Simulation'}
                                    </button>
                                )}
                            </GlassCard>
                        );
                        return goal.priority === 'high' ? <StarBorder key={goal.id}>{card}</StarBorder> : card;
                    })}
                </div>
            )}

            {/* Monte Carlo Visualization */}
            {selectedGoal && (
                <ScrollReveal>
                    <GlassCard>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-h3">Monte Carlo Projection — {selectedGoal.name}</h3>
                            {!simResult && (
                                <button
                                    onClick={() => runSimulation(selectedGoal.id)}
                                    disabled={simulating === selectedGoal.id}
                                    className="btn-primary text-sm"
                                >
                                    {simulating === selectedGoal.id ? 'Running...' : 'Run Simulation'}
                                </button>
                            )}
                        </div>

                        {simResult ? (
                            <>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                    {[
                                        { label: 'Probability', value: `${simResult.probability}%`, color: simResult.probability >= 70 ? 'var(--color-success)' : simResult.probability >= 50 ? 'var(--color-warning)' : 'var(--color-danger)' },
                                        { label: 'Median Projection', value: formatCurrency(simResult.medianProjection, true), color: 'var(--color-accent-teal)' },
                                        { label: 'Worst Case (10th pct)', value: formatCurrency(simResult.worstCaseProjection, true), color: 'var(--color-danger)' },
                                        { label: 'Target Amount', value: formatCurrency(selectedGoal.targetAmount, true), color: 'var(--color-text-primary)' },
                                    ].map((m) => (
                                        <div key={m.label} className="p-3 rounded-xl text-center" style={{ background: 'var(--color-bg-tertiary)' }}>
                                            <p className="text-caption" style={{ color: 'var(--color-text-muted)' }}>{m.label}</p>
                                            <p className="text-lg font-bold font-numeric mt-1" style={{ color: m.color }}>{m.value}</p>
                                        </div>
                                    ))}
                                </div>
                                {coneData.length > 0 && (
                                    <Diagrams
                                        data={coneData}
                                        type="area"
                                        dataKeys={['p10', 'p25', 'p50', 'p75', 'p90']}
                                        xKey="period"
                                        height={350}
                                        stacked={false}
                                        showLegend
                                        colors={['rgba(239,68,68,0.3)', 'rgba(245,158,11,0.3)', '#00D4AA', 'rgba(245,158,11,0.3)', 'rgba(239,68,68,0.3)']}
                                    />
                                )}
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-16" style={{ color: 'var(--color-text-muted)' }}>
                                <RefreshCw size={40} className="mb-4" />
                                <p>Click "Run Simulation" or the button on the goal card to generate a Monte Carlo projection.</p>
                            </div>
                        )}
                    </GlassCard>
                </ScrollReveal>
            )}

            {/* New Goal Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
                        onClick={() => setShowModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="w-full max-w-lg rounded-2xl p-6"
                            style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-h3">Create New Goal</h3>
                                <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleCreate} className="space-y-4">
                                {/* Goal Name */}
                                <div>
                                    <label className="text-caption block mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Goal Name *</label>
                                    <input
                                        type="text"
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        placeholder="e.g. Retire at 55"
                                        className="input-field w-full"
                                        required
                                    />
                                </div>

                                {/* Goal Type */}
                                <div>
                                    <label className="text-caption block mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Goal Type</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {GOAL_TYPES.map((gt) => (
                                            <button
                                                key={gt.value}
                                                type="button"
                                                onClick={() => setForm({ ...form, type: gt.value })}
                                                className="p-2 rounded-lg text-sm font-medium transition-colors"
                                                style={{
                                                    background: form.type === gt.value ? 'var(--gradient-accent)' : 'var(--color-bg-tertiary)',
                                                    color: form.type === gt.value ? 'white' : 'var(--color-text-secondary)',
                                                    border: `1px solid ${form.type === gt.value ? 'transparent' : 'var(--color-border)'}`,
                                                }}
                                            >
                                                {gt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Two-column fields */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-caption block mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Target Amount ($) *</label>
                                        <input
                                            type="number"
                                            value={form.targetAmount}
                                            onChange={(e) => setForm({ ...form, targetAmount: e.target.value })}
                                            placeholder="500000"
                                            className="input-field w-full"
                                            min="1"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="text-caption block mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Current Savings ($)</label>
                                        <input
                                            type="number"
                                            value={form.currentAmount}
                                            onChange={(e) => setForm({ ...form, currentAmount: e.target.value })}
                                            placeholder="0"
                                            className="input-field w-full"
                                            min="0"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-caption block mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Time Horizon (years)</label>
                                        <input
                                            type="number"
                                            value={form.timeHorizonYears}
                                            onChange={(e) => setForm({ ...form, timeHorizonYears: e.target.value })}
                                            placeholder="5"
                                            className="input-field w-full"
                                            min="1"
                                            max="50"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-caption block mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Monthly Contribution ($)</label>
                                        <input
                                            type="number"
                                            value={form.monthlyContribution}
                                            onChange={(e) => setForm({ ...form, monthlyContribution: e.target.value })}
                                            placeholder="500"
                                            className="input-field w-full"
                                            min="0"
                                        />
                                    </div>
                                </div>

                                {/* Priority */}
                                <div>
                                    <label className="text-caption block mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Priority</label>
                                    <div className="flex gap-2">
                                        {PRIORITIES.map((p) => (
                                            <button
                                                key={p}
                                                type="button"
                                                onClick={() => setForm({ ...form, priority: p })}
                                                className="flex-1 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors"
                                                style={{
                                                    background: form.priority === p ? 'var(--gradient-accent)' : 'var(--color-bg-tertiary)',
                                                    color: form.priority === p ? 'white' : 'var(--color-text-secondary)',
                                                }}
                                            >
                                                {p}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button type="button" onClick={() => setShowModal(false)} className="flex-1 btn-secondary">Cancel</button>
                                    <button type="submit" disabled={submitting} className="flex-1 btn-primary">
                                        {submitting ? <><Loader2 size={14} className="animate-spin inline mr-2" />Creating...</> : 'Create Goal'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
