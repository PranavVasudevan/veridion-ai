import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../components/ui/GlassCard';
import CountUp from '../components/reactbits/CountUp';
import ScrollReveal from '../components/reactbits/ScrollReveal';
import Diagrams from '../components/charts/Diagrams';
import { SIMULATION_DEFAULTS } from '../utils/constants';
import { formatCurrency, formatPercent } from '../utils/formatters';

const pageV = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0, transition: { duration: 0.4 } }, exit: { opacity: 0 } };

function runSimulation(volMult: number, crashDepth: number, numPaths: number) {
    const years = 10;
    const steps = years * 12;
    const dt = 1 / 12;
    const mu = 0.08;
    const sigma = 0.15 * volMult;
    const crashProb = Math.abs(crashDepth) / 100 * 0.05;

    const paths: number[][] = [];
    const terminalValues: number[] = [];

    for (let p = 0; p < Math.min(numPaths, 200); p++) {
        const path = [100000];
        let val = 100000;
        for (let t = 1; t <= steps; t++) {
            const z = Math.sqrt(-2 * Math.log(Math.random())) * Math.cos(2 * Math.PI * Math.random());
            let ret = (mu - 0.5 * sigma * sigma) * dt + sigma * Math.sqrt(dt) * z;
            if (Math.random() < crashProb * dt) ret += crashDepth / 100;
            val = val * Math.exp(ret);
            path.push(Math.round(val));
        }
        paths.push(path);
        terminalValues.push(Math.round(val));
    }

    terminalValues.sort((a, b) => a - b);
    const percentileAt = (pct: number) => terminalValues[Math.floor(pct / 100 * (terminalValues.length - 1))];

    const coneData = Array.from({ length: steps + 1 }, (_, i) => {
        const vals = paths.map(p => p[i]).sort((a, b) => a - b);
        const pAt = (pct: number) => vals[Math.floor(pct / 100 * (vals.length - 1))];
        return { period: i, p10: pAt(10), p25: pAt(25), p50: pAt(50), p75: pAt(75), p90: pAt(90) };
    });

    const losing = terminalValues.filter(v => v < 100000).length;

    return {
        coneData,
        terminalValues,
        probLoss: losing / terminalValues.length,
        expectedDrawdown: Math.abs(crashDepth) * 0.6,
        median: percentileAt(50),
        mean: Math.round(terminalValues.reduce((s, v) => s + v, 0) / terminalValues.length),
    };
}

export default function SimulationLab() {
    const [volMult, setVolMult] = useState(SIMULATION_DEFAULTS.volatilityMultiplier);
    const [crashDepth, setCrashDepth] = useState(SIMULATION_DEFAULTS.crashDepth);
    const [inflation, setInflation] = useState(SIMULATION_DEFAULTS.inflationRate);
    const [rateShock, setRateShock] = useState(SIMULATION_DEFAULTS.interestRateShock);

    const results = useMemo(() => runSimulation(volMult, crashDepth, 200), [volMult, crashDepth]);

    return (
        <motion.div variants={pageV} initial="initial" animate="animate" exit="exit">
            <ScrollReveal>
                <GlassCard className="mb-6">
                    <h3 className="text-h3 mb-6">Stress Test Parameters</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { label: 'Volatility Multiplier', value: volMult, set: setVolMult, min: 1, max: 5, step: 0.5, suffix: 'x', display: `${volMult}x` },
                            { label: 'Market Crash Depth', value: crashDepth, set: setCrashDepth, min: -60, max: -10, step: 5, suffix: '%', display: `${crashDepth}%` },
                            { label: 'Inflation Rate', value: inflation, set: setInflation, min: 2, max: 15, step: 1, suffix: '%', display: `${inflation}%` },
                            { label: 'Rate Shock', value: rateShock, set: setRateShock, min: 0, max: 5, step: 0.5, suffix: '%', display: `+${rateShock}%` },
                        ].map((s) => (
                            <div key={s.label}>
                                <div className="flex justify-between mb-2">
                                    <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{s.label}</span>
                                    <span className="text-sm font-bold font-numeric" style={{ color: 'var(--color-accent-teal)' }}>{s.display}</span>
                                </div>
                                <input type="range" min={s.min} max={s.max} step={s.step} value={s.value}
                                    onChange={(e) => s.set(Number(e.target.value))}
                                    className="w-full accent-[var(--color-accent-teal)]"
                                />
                            </div>
                        ))}
                    </div>
                </GlassCard>
            </ScrollReveal>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                    { label: 'Prob. of Loss', value: `${(results.probLoss * 100).toFixed(1)}%`, color: 'var(--color-danger)' },
                    { label: 'Expected Drawdown', value: `${results.expectedDrawdown.toFixed(1)}%`, color: 'var(--color-warning)' },
                    { label: 'Median Outcome', value: formatCurrency(results.median, true), color: 'var(--color-success)' },
                    { label: 'Mean Outcome', value: formatCurrency(results.mean, true), color: 'var(--color-accent-teal)' },
                ].map((m) => (
                    <GlassCard key={m.label} padding="p-4">
                        <p className="text-caption" style={{ color: 'var(--color-text-muted)' }}>{m.label}</p>
                        <p className="text-xl font-bold font-numeric mt-2" style={{ color: m.color }}>{m.value}</p>
                    </GlassCard>
                ))}
            </div>

            {/* Probability Cone */}
            <ScrollReveal>
                <GlassCard className="mb-6">
                    <h3 className="text-h3 mb-4">Probability Cone (10yr projection)</h3>
                    <Diagrams data={results.coneData} type="area" dataKeys={['p10', 'p25', 'p50', 'p75', 'p90']} xKey="period" height={400} showLegend
                        colors={['rgba(239,68,68,0.3)', 'rgba(245,158,11,0.4)', '#00D4AA', 'rgba(245,158,11,0.4)', 'rgba(239,68,68,0.3)']}
                    />
                </GlassCard>
            </ScrollReveal>

            {/* Distribution */}
            <ScrollReveal>
                <GlassCard>
                    <h3 className="text-h3 mb-4">Terminal Value Distribution</h3>
                    <Diagrams
                        data={(() => {
                            const bins: Record<string, number> = {};
                            results.terminalValues.forEach(v => {
                                const bucket = `${Math.floor(v / 50000) * 50}k`;
                                bins[bucket] = (bins[bucket] || 0) + 1;
                            });
                            return Object.entries(bins).map(([name, count]) => ({ name, count }));
                        })()}
                        type="bar" dataKeys={['count']} xKey="name" height={280}
                    />
                </GlassCard>
            </ScrollReveal>
        </motion.div>
    );
}
