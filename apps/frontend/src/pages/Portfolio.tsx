import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2 } from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';
import CountUp from '../components/reactbits/CountUp';
import ScrollReveal from '../components/reactbits/ScrollReveal';
import Diagrams from '../components/charts/Diagrams';
import SkeletonLoader from '../components/ui/SkeletonLoader';
import Tooltip from '../components/ui/Tooltip';
import AddAssetModal, { AddAssetData } from '../components/ui/AddAssetModal';
import { usePortfolio } from '../hooks/usePortfolio';
import { useRiskMetrics } from '../hooks/useRiskMetrics';
import { formatCurrency, formatPercent, formatDate } from '../utils/formatters';
import { TIME_HORIZONS } from '../utils/constants';

const tabs = ['Allocation', 'Risk Decomposition', 'Rebalancing', 'Performance'];

const pageVariants = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
    exit: { opacity: 0, y: -8 },
};

export default function Portfolio() {
    const [activeTab, setActiveTab] = useState(0);
    const [timeHorizon, setTimeHorizon] = useState('1Y');
    const [showAddAsset, setShowAddAsset] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const { totalValue, holdings, snapshots, isLoading, addHolding, removeHolding } = usePortfolio();
    const { contributions, frontier } = useRiskMetrics();

    const allocData = holdings.map((h) => ({ name: h.ticker, value: Math.round(h.weight * 100) }));
    const contribData = contributions.map((c) => ({ name: c.ticker, contribution: Math.round(c.contribution * 100) }));
    const perfData = snapshots.map((s) => ({ date: new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), value: Math.round(s.totalValue) }));

    const handleAddAsset = async (data: AddAssetData) => {
        await addHolding({
            ticker: data.ticker,
            name: data.name || undefined,
            assetType: data.assetType,
            sector: data.sector,
            country: data.country,
            quantity: data.quantity,
            avgCost: data.avgCost || undefined,
        });
    };

    const handleDeleteHolding = async (holdingId: number) => {
        setDeletingId(holdingId);
        try {
            await removeHolding(holdingId);
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-6">
                <div>
                    <p className="text-caption" style={{ color: 'var(--color-text-muted)' }}>Total Portfolio Value</p>
                    {totalValue !== null ? (
                        <CountUp end={totalValue} prefix="$" separator="," className="text-metric" />
                    ) : <SkeletonLoader height="h-12" className="w-48" />}
                </div>
                <div className="flex gap-2 mt-4 md:mt-0">
                    <button onClick={() => setShowAddAsset(true)}
                        className="btn-primary flex items-center gap-2 text-sm">
                        <Plus size={16} /> Add Asset
                    </button>
                    <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--color-bg-tertiary)' }}>
                        {TIME_HORIZONS.map((h) => (
                            <button key={h} onClick={() => setTimeHorizon(h)}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                                style={{
                                    background: timeHorizon === h ? 'var(--color-bg-secondary)' : 'transparent',
                                    color: timeHorizon === h ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                                }}
                            >{h}</button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 p-1 rounded-xl overflow-x-auto" style={{ background: 'var(--color-bg-tertiary)' }}>
                {tabs.map((tab, i) => (
                    <button key={tab} onClick={() => setActiveTab(i)}
                        className="relative px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all"
                        style={{
                            background: activeTab === i ? 'var(--color-bg-secondary)' : 'transparent',
                            color: activeTab === i ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                        }}
                    >
                        {tab}
                        {activeTab === i && (
                            <motion.div layoutId="portfolio-tab" className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full" style={{ background: 'var(--color-accent-teal)' }} />
                        )}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === 0 && (
                <ScrollReveal>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <GlassCard>
                            <h3 className="text-h3 mb-4">Allocation</h3>
                            {allocData.length > 0 ? (
                                <Diagrams data={allocData} type="pie" dataKeys={['value']} xKey="name" height={280} showLegend />
                            ) : <SkeletonLoader count={5} />}
                        </GlassCard>
                        <GlassCard>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-h3">Holdings</h3>
                                <span className="text-xs font-medium px-2 py-1 rounded-lg" style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-muted)' }}>
                                    {holdings.length} assets
                                </span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b" style={{ borderColor: 'var(--color-border)' }}>
                                            <th className="text-left py-3 text-caption" style={{ color: 'var(--color-text-muted)' }}>Asset</th>
                                            <th className="text-right py-3 text-caption" style={{ color: 'var(--color-text-muted)' }}>Weight</th>
                                            <th className="text-right py-3 text-caption" style={{ color: 'var(--color-text-muted)' }}>Value</th>
                                            <th className="text-right py-3 text-caption" style={{ color: 'var(--color-text-muted)' }}>P&L</th>
                                            <th className="text-right py-3 text-caption" style={{ color: 'var(--color-text-muted)' }}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {holdings.map((h) => (
                                            <tr key={h.ticker} className="border-b hover:bg-bg-tertiary transition-colors" style={{ borderColor: 'var(--color-border)' }}>
                                                <td className="py-3">
                                                    <p className="font-semibold">{h.ticker}</p>
                                                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{h.name}</p>
                                                </td>
                                                <td className="text-right font-numeric">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-bg-tertiary)' }}>
                                                            <div className="h-full rounded-full" style={{ width: `${h.weight * 100}%`, background: 'var(--color-accent-teal)' }} />
                                                        </div>
                                                        {(h.weight * 100).toFixed(1)}%
                                                    </div>
                                                </td>
                                                <td className="text-right font-numeric">{formatCurrency(h.value)}</td>
                                                <td className="text-right font-numeric" style={{ color: (h.change24h ?? 0) >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                                                    {(h.change24h ?? 0) >= 0 ? '+' : ''}{(h.change24h ?? 0).toFixed(2)}%
                                                </td>
                                                <td className="text-right">
                                                    <Tooltip content="Remove this holding">
                                                        <button onClick={() => h.id && handleDeleteHolding(h.id)}
                                                            disabled={deletingId === h.id}
                                                            className="p-1.5 rounded-lg hover:bg-bg-tertiary transition-colors"
                                                            style={{ color: 'var(--color-text-muted)', opacity: deletingId === h.id ? 0.4 : 1 }}>
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </Tooltip>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </GlassCard>
                    </div>
                </ScrollReveal>
            )}

            {activeTab === 1 && (
                <ScrollReveal>
                    <GlassCard>
                        <h3 className="text-h3 mb-4">Risk Contribution by Asset</h3>
                        {contribData.length > 0 ? (
                            <Diagrams data={contribData} type="bar" dataKeys={['contribution']} xKey="name" height={350} />
                        ) : <SkeletonLoader count={5} height="h-8" />}
                    </GlassCard>
                </ScrollReveal>
            )}

            {activeTab === 2 && (
                <ScrollReveal>
                    <GlassCard>
                        <h3 className="text-h3 mb-4">Rebalancing History</h3>
                        <div className="space-y-4">
                            {[
                                { date: '2 days ago', action: 'Drift rebalance triggered', detail: 'VTI weight exceeded 37% threshold. Rebalanced to 35% target.' },
                                { date: '2 weeks ago', action: 'Quarterly scheduled rebalance', detail: '6 trades executed. Total turnover: 4.2%. Cost: $12.50.' },
                                { date: '1 month ago', action: 'Tax-loss harvesting', detail: 'VXUS showing short-term losses. Estimated tax benefit: $340.' },
                            ].map((item, i) => (
                                <div key={i} className="flex gap-4 p-4 rounded-xl" style={{ background: 'var(--color-bg-tertiary)' }}>
                                    <div className="w-3 h-3 rounded-full mt-1 flex-shrink-0" style={{ background: 'var(--color-accent-teal)' }} />
                                    <div>
                                        <p className="text-sm font-semibold">{item.action}</p>
                                        <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>{item.detail}</p>
                                        <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>{item.date}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </GlassCard>
                </ScrollReveal>
            )}

            {activeTab === 3 && (
                <ScrollReveal>
                    <GlassCard>
                        <h3 className="text-h3 mb-4">Portfolio Value Over Time</h3>
                        {perfData.length > 0 ? (
                            <Diagrams data={perfData} type="area" dataKeys={['value']} xKey="date" height={350} />
                        ) : <SkeletonLoader count={5} height="h-8" />}
                    </GlassCard>
                </ScrollReveal>
            )}

            {/* Add Asset Modal */}
            <AddAssetModal isOpen={showAddAsset} onClose={() => setShowAddAsset(false)} onAdd={handleAddAsset} />
        </motion.div>
    );
}
