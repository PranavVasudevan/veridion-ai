import { motion } from 'framer-motion';
import { Monitor, Palette, Bell, RefreshCw, ShieldCheck, Accessibility } from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';
import ThemeToggle from '../components/ui/ThemeToggle';
import ClickSpark from '../components/reactbits/ClickSpark';
import { useThemeStore } from '../state/theme.store';
import { ACCENT_PRESETS } from '../utils/constants';

const pageV = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0, transition: { duration: 0.4 } }, exit: { opacity: 0 } };

export default function Settings() {
    const { mode, accentColor, reducedMotion, toggleMode, setAccentColor, setReducedMotion } = useThemeStore();

    return (
        <motion.div variants={pageV} initial="initial" animate="animate" exit="exit" className="max-w-2xl">
            <h2 className="text-h2 mb-6">Settings</h2>

            {/* Theme */}
            <GlassCard className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                    <Monitor size={18} style={{ color: 'var(--color-accent-teal)' }} />
                    <h3 className="text-h3">Theme</h3>
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'var(--color-bg-tertiary)' }}>
                    <div>
                        <p className="text-sm font-medium">Dark / Light Mode</p>
                        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Currently: {mode}</p>
                    </div>
                    <ClickSpark>
                        <button onClick={toggleMode} className="btn-secondary text-sm">
                            Switch to {mode === 'dark' ? 'Light' : 'Dark'}
                        </button>
                    </ClickSpark>
                </div>
            </GlassCard>

            {/* Accent Color */}
            <GlassCard className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                    <Palette size={18} style={{ color: 'var(--color-accent-teal)' }} />
                    <h3 className="text-h3">Accent Color</h3>
                </div>
                <div className="flex gap-3">
                    {ACCENT_PRESETS.map((preset) => (
                        <button key={preset.name} onClick={() => setAccentColor(preset.value)}
                            className="flex flex-col items-center gap-2 p-3 rounded-xl transition-all"
                            style={{
                                background: accentColor === preset.value ? `${preset.value}15` : 'var(--color-bg-tertiary)',
                                border: `2px solid ${accentColor === preset.value ? preset.value : 'var(--color-border)'}`,
                            }}
                        >
                            <div className="w-8 h-8 rounded-full" style={{ background: preset.value }} />
                            <span className="text-xs font-medium">{preset.name}</span>
                        </button>
                    ))}
                </div>
            </GlassCard>

            {/* Notifications */}
            <GlassCard className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                    <Bell size={18} style={{ color: 'var(--color-accent-teal)' }} />
                    <h3 className="text-h3">Notifications</h3>
                </div>
                <div className="space-y-3">
                    {['Risk Alerts', 'Event Alerts', 'Rebalancing', 'Behavioral', 'Projections'].map((label) => (
                        <div key={label} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--color-bg-tertiary)' }}>
                            <span className="text-sm">{label}</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" defaultChecked className="sr-only peer" />
                                <div className="w-9 h-5 rounded-full peer-checked:bg-accent-teal bg-bg-primary border border-border peer-checked:border-accent-teal transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
                            </label>
                        </div>
                    ))}
                </div>
            </GlassCard>

            {/* Data Refresh */}
            <GlassCard className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                    <RefreshCw size={18} style={{ color: 'var(--color-accent-teal)' }} />
                    <h3 className="text-h3">Data Refresh</h3>
                </div>
                <select className="input-field">
                    <option>Real-time</option>
                    <option>Every 5 minutes</option>
                    <option>Every 15 minutes</option>
                    <option>Manual only</option>
                </select>
            </GlassCard>

            {/* Privacy */}
            <GlassCard className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                    <ShieldCheck size={18} style={{ color: 'var(--color-accent-teal)' }} />
                    <h3 className="text-h3">Privacy</h3>
                </div>
                <div className="space-y-3">
                    {['Share anonymized usage data', 'Personalized recommendations'].map((label) => (
                        <div key={label} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--color-bg-tertiary)' }}>
                            <span className="text-sm">{label}</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" defaultChecked className="sr-only peer" />
                                <div className="w-9 h-5 rounded-full peer-checked:bg-accent-teal bg-bg-primary border border-border peer-checked:border-accent-teal transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
                            </label>
                        </div>
                    ))}
                </div>
            </GlassCard>

            {/* Accessibility */}
            <GlassCard>
                <div className="flex items-center gap-3 mb-4">
                    <Accessibility size={18} style={{ color: 'var(--color-accent-teal)' }} />
                    <h3 className="text-h3">Accessibility</h3>
                </div>
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--color-bg-tertiary)' }}>
                        <div>
                            <span className="text-sm">Reduced Motion</span>
                            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Disable animations for accessibility</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={reducedMotion} onChange={(e) => setReducedMotion(e.target.checked)} className="sr-only peer" />
                            <div className="w-9 h-5 rounded-full peer-checked:bg-accent-teal bg-bg-primary border border-border peer-checked:border-accent-teal transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
                        </label>
                    </div>
                    <div>
                        <span className="text-sm block mb-2">Font Size</span>
                        <input type="range" min={12} max={20} defaultValue={14} className="w-full accent-[var(--color-accent-teal)]" />
                    </div>
                </div>
            </GlassCard>
        </motion.div>
    );
}
