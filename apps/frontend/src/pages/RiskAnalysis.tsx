import { motion } from 'framer-motion';
import GlassCard from '../components/ui/GlassCard';
import CountUp from '../components/reactbits/CountUp';
import ScrollReveal from '../components/reactbits/ScrollReveal';
import Diagrams from '../components/charts/Diagrams';
import SkeletonLoader from '../components/ui/SkeletonLoader';
import Tooltip from '../components/ui/Tooltip';
import ExplainabilityModal from '../components/ui/ExplainabilityModal';
import { useRiskMetrics } from '../hooks/useRiskMetrics';
import { formatPercent } from '../utils/formatters';
import { chartColors } from '../utils/colors';
import { GLOSSARY } from '../utils/constants';
import { demoRiskExplanation } from '../utils/demoData';

const pageV = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0, transition: { duration: 0.4 } }, exit: { opacity: 0 } };
const cardV = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

export default function RiskAnalysis() {
    const { metrics, history, contributions, frontier, covariance, isLoading } = useRiskMetrics();

    const historyData = history.map((h) => ({
        date: new Date(h.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        volatility: +(h.volatility * 100).toFixed(2),
        sharpe: +h.sharpeRatio.toFixed(2),
    }));

    const contribData = contributions.map((c) => ({
        name: c.ticker,
        contribution: Math.round(c.contribution * 100),
        weight: Math.round(c.weight * 100),
    }));

    const frontierData = frontier.map((f) => ({
        volatility: +(f.volatility * 100).toFixed(2),
        return: +(f.expectedReturn * 100).toFixed(2),
        name: f.isOptimal ? 'Optimal' : f.isCurrent ? 'Current' : '',
    }));

    return (
        <motion.div variants={pageV} initial="initial" animate="animate" exit="exit">
            {/* Metric Cards */}
            <ScrollReveal>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                    {metrics ? [
                        { label: 'Volatility', value: formatPercent(metrics.volatility), tip: GLOSSARY['Volatility'] },
                        { label: 'Sharpe Ratio', value: metrics.sharpeRatio.toFixed(2), tip: GLOSSARY['Sharpe Ratio'] },
                        { label: 'Sortino Ratio', value: metrics.sortinoRatio.toFixed(2), tip: GLOSSARY['Sortino Ratio'] },
                        { label: 'Max Drawdown', value: formatPercent(Math.abs(metrics.maxDrawdown)), tip: GLOSSARY['Max Drawdown'] },
                        { label: 'VaR (95%)', value: formatPercent(Math.abs(metrics.var95)), tip: GLOSSARY['VaR (95%)'] },
                    ].map((m) => (
                        <GlassCard key={m.label} padding="p-4">
                            <Tooltip content={m.tip}>
                                <p className="text-caption" style={{ color: 'var(--color-text-muted)' }}>{m.label}</p>
                            </Tooltip>
                            <p className="text-xl font-bold font-numeric mt-2">{m.value}</p>
                        </GlassCard>
                    )) : <SkeletonLoader count={5} height="h-20" />}
                </div>
            </ScrollReveal>

            {/* Risk History */}
            <ScrollReveal>
                <GlassCard className="mb-6">
                    <h3 className="text-h3 mb-4">Risk History</h3>
                    {historyData.length > 0 ? (
                        <Diagrams data={historyData} type="line" dataKeys={['volatility', 'sharpe']} xKey="date" height={300} showLegend />
                    ) : <SkeletonLoader count={4} height="h-6" />}
                </GlassCard>
            </ScrollReveal>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Risk Contribution */}
                <ScrollReveal>
                    <GlassCard>
                        <h3 className="text-h3 mb-4">Risk Contribution</h3>
                        {contribData.length > 0 ? (
                            <Diagrams data={contribData} type="bar" dataKeys={['contribution']} xKey="name" height={280} />
                        ) : <SkeletonLoader count={4} height="h-6" />}
                    </GlassCard>
                </ScrollReveal>

                {/* Covariance Heatmap */}
                <ScrollReveal delay={0.1}>
                    <GlassCard>
                        <h3 className="text-h3 mb-4">
                            <Tooltip content={GLOSSARY['Covariance Matrix']}>Covariance Matrix</Tooltip>
                        </h3>
                        {covariance ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr>
                                            <th></th>
                                            {covariance.tickers.map((t) => (
                                                <th key={t} className="py-2 px-1 font-medium" style={{ color: 'var(--color-text-muted)' }}>{t}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {covariance.tickers.map((t, i) => (
                                            <tr key={t}>
                                                <td className="py-1 px-1 font-medium" style={{ color: 'var(--color-text-muted)' }}>{t}</td>
                                                {covariance.matrix[i].map((val, j) => {
                                                    const abs = Math.abs(val);
                                                    const color = val > 0
                                                        ? `rgba(0, 212, 170, ${abs * 0.6})`
                                                        : `rgba(239, 68, 68, ${abs * 0.6})`;
                                                    return (
                                                        <td key={j} className="py-1 px-1 text-center font-numeric rounded" style={{ background: color }}>
                                                            {val.toFixed(2)}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : <SkeletonLoader count={6} height="h-6" />}
                    </GlassCard>
                </ScrollReveal>
            </div>

            {/* Efficient Frontier */}
            <ScrollReveal>
                <GlassCard className="mb-6">
                    <h3 className="text-h3 mb-4">
                        <Tooltip content={GLOSSARY['Efficient Frontier']}>Efficient Frontier</Tooltip>
                    </h3>
                    {frontierData.length > 0 ? (
                        <Diagrams data={frontierData} type="scatter" dataKeys={['return']} xKey="volatility" height={300} />
                    ) : <SkeletonLoader count={4} height="h-6" />}
                </GlassCard>
            </ScrollReveal>

            {/* Explainability */}
            <ScrollReveal>
                <GlassCard>
                    <ExplainabilityModal explanation={demoRiskExplanation.summary} factors={demoRiskExplanation.factors}>
                        <h3 className="text-h3">Risk Explainability</h3>
                        <p className="text-body mt-2" style={{ color: 'var(--color-text-secondary)' }}>
                            Understand what's driving your portfolio risk and how different factors contribute.
                        </p>
                    </ExplainabilityModal>
                    <div className="mt-4 p-4 rounded-xl" style={{ background: 'var(--color-bg-tertiary)' }}>
                        <p className="text-caption font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>Assumptions</p>
                        <ul className="text-xs space-y-1" style={{ color: 'var(--color-text-secondary)' }}>
                            {demoRiskExplanation.assumptions.map((a, i) => <li key={i}>• {a}</li>)}
                        </ul>
                    </div>
                    {demoRiskExplanation.historicalAnalog && (
                        <p className="mt-3 text-xs italic" style={{ color: 'var(--color-text-muted)' }}>
                            📊 {demoRiskExplanation.historicalAnalog}
                        </p>
                    )}
                </GlassCard>
            </ScrollReveal>
        </motion.div>
    );
}
