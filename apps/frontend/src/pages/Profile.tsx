import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Shield, Download, Trash2, CheckCircle, AlertTriangle, Save, Edit3, DollarSign, Briefcase, Target, Clock, MapPin, Calendar } from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';
import { useAuthStore } from '../state/auth.store';
import { userService, UserProfile, UpdateProfilePayload } from '../services/user.service';

const pageV = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0, transition: { duration: 0.4 } }, exit: { opacity: 0 } };

const GOALS = ['growth', 'income', 'preservation', 'balanced'];
const RISK_LABELS = ['Very Conservative', 'Conservative', 'Moderate', 'Growth', 'Aggressive'];

function riskLabel(val: number): string {
    const idx = Math.min(Math.floor(val * RISK_LABELS.length), RISK_LABELS.length - 1);
    return RISK_LABELS[idx];
}

export default function Profile() {
    const navigate = useNavigate();
    const user = useAuthStore((s) => s.user);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [form, setForm] = useState<UpdateProfilePayload>({});

    useEffect(() => {
        userService.getProfile().then((p) => {
            setProfile(p);
            setForm({
                name: p.name ?? '',
                annualIncome: p.profile?.annualIncome ?? 0,
                totalSavings: p.profile?.totalSavings ?? 0,
                totalDebt: p.profile?.totalDebt ?? 0,
                monthlyExpenses: p.profile?.monthlyExpenses ?? 0,
                riskTolerance: p.profile?.riskTolerance ?? 0.5,
                investmentGoal: p.profile?.investmentGoal ?? 'growth',
                investmentHorizon: p.profile?.investmentHorizon ?? 10,
                occupation: p.profile?.occupation ?? '',
                country: p.profile?.country ?? '',
            });
        });
    }, []);

    const update = (field: keyof UpdateProfilePayload, value: string | number) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const updated = await userService.updateProfile(form);
            setProfile(updated);
            setIsEditing(false);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
            // Sync auth store with updated user name
            if (updated && user) {
                useAuthStore.getState().setUser({
                    ...user,
                    name: updated.name ?? user.name,
                });
            }
        } finally {
            setIsSaving(false);
        }
    };

    const formatCurrency = (val: number | undefined) => {
        if (!val) return '$0';
        return '$' + val.toLocaleString();
    };

    return (
        <motion.div variants={pageV} initial="initial" animate="animate" exit="exit" className="max-w-2xl">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-h2">Profile</h2>
                <button onClick={() => isEditing ? handleSave() : setIsEditing(true)} disabled={isSaving}
                    className={isEditing ? 'btn-primary flex items-center gap-2' : 'btn-secondary flex items-center gap-2'}
                    style={{ opacity: isSaving ? 0.7 : 1 }}>
                    {isEditing ? <><Save size={16} /> {isSaving ? 'Saving...' : 'Save Changes'}</> : <><Edit3 size={16} /> Edit Profile</>}
                </button>
            </div>

            {saved && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-3 rounded-xl flex items-center gap-2 text-sm font-medium"
                    style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--color-success)' }}>
                    <CheckCircle size={16} /> Profile updated successfully
                </motion.div>
            )}

            {/* Personal Info */}
            <GlassCard className="mb-6">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold" style={{ background: 'var(--gradient-accent)', color: 'var(--color-bg-primary)' }}>
                        {(form.name as string)?.charAt(0) || user?.name?.charAt(0) || 'A'}
                    </div>
                    <div className="flex-1">
                        {isEditing ? (
                            <input className="input-field text-lg font-semibold" value={form.name as string}
                                onChange={(e) => update('name', e.target.value)} placeholder="Full Name" />
                        ) : (
                            <>
                                <h3 className="text-h3">{profile?.name || user?.name || 'Alex Thompson'}</h3>
                                <p className="text-body" style={{ color: 'var(--color-text-secondary)' }}>{profile?.email || user?.email || 'demo@veridion.ai'}</p>
                            </>
                        )}
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-caption block mb-1" style={{ color: 'var(--color-text-muted)' }}>
                            <Briefcase size={12} className="inline mr-1" /> Occupation
                        </label>
                        {isEditing ? (
                            <input className="input-field" value={form.occupation as string} onChange={(e) => update('occupation', e.target.value)} placeholder="e.g. Software Engineer" />
                        ) : (
                            <p className="text-sm font-medium">{profile?.profile?.occupation || '—'}</p>
                        )}
                    </div>
                    <div>
                        <label className="text-caption block mb-1" style={{ color: 'var(--color-text-muted)' }}>
                            <MapPin size={12} className="inline mr-1" /> Country
                        </label>
                        {isEditing ? (
                            <input className="input-field" value={form.country as string} onChange={(e) => update('country', e.target.value)} placeholder="e.g. US" />
                        ) : (
                            <p className="text-sm font-medium">{profile?.profile?.country || '—'}</p>
                        )}
                    </div>
                </div>
            </GlassCard>

            {/* Financial Info */}
            <GlassCard className="mb-6">
                <h3 className="text-h3 mb-4 flex items-center gap-2">
                    <DollarSign size={18} style={{ color: 'var(--color-accent-teal)' }} /> Financial Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-caption block mb-1" style={{ color: 'var(--color-text-muted)' }}>Annual Income</label>
                        {isEditing ? (
                            <input className="input-field" type="number" value={form.annualIncome || ''} onChange={(e) => update('annualIncome', parseFloat(e.target.value) || 0)} />
                        ) : (
                            <p className="text-sm font-semibold font-numeric">{formatCurrency(profile?.profile?.annualIncome ?? undefined)}</p>
                        )}
                    </div>
                    <div>
                        <label className="text-caption block mb-1" style={{ color: 'var(--color-text-muted)' }}>Total Savings</label>
                        {isEditing ? (
                            <input className="input-field" type="number" value={form.totalSavings || ''} onChange={(e) => update('totalSavings', parseFloat(e.target.value) || 0)} />
                        ) : (
                            <p className="text-sm font-semibold font-numeric">{formatCurrency(profile?.profile?.totalSavings ?? undefined)}</p>
                        )}
                    </div>
                    <div>
                        <label className="text-caption block mb-1" style={{ color: 'var(--color-text-muted)' }}>Total Debt</label>
                        {isEditing ? (
                            <input className="input-field" type="number" value={form.totalDebt || ''} onChange={(e) => update('totalDebt', parseFloat(e.target.value) || 0)} />
                        ) : (
                            <p className="text-sm font-semibold font-numeric" style={{ color: (profile?.profile?.totalDebt ?? 0) > 0 ? 'var(--color-danger)' : 'var(--color-text-primary)' }}>
                                {formatCurrency(profile?.profile?.totalDebt ?? undefined)}
                            </p>
                        )}
                    </div>
                    <div>
                        <label className="text-caption block mb-1" style={{ color: 'var(--color-text-muted)' }}>Monthly Expenses</label>
                        {isEditing ? (
                            <input className="input-field" type="number" value={form.monthlyExpenses || ''} onChange={(e) => update('monthlyExpenses', parseFloat(e.target.value) || 0)} />
                        ) : (
                            <p className="text-sm font-semibold font-numeric">{formatCurrency(profile?.profile?.monthlyExpenses ?? undefined)}</p>
                        )}
                    </div>
                </div>
            </GlassCard>

            {/* Investment Preferences */}
            <GlassCard className="mb-6">
                <h3 className="text-h3 mb-4 flex items-center gap-2">
                    <Target size={18} style={{ color: 'var(--color-accent-teal)' }} /> Investment Preferences
                </h3>
                <div className="space-y-4">
                    <div>
                        <label className="text-caption block mb-1.5" style={{ color: 'var(--color-text-muted)' }}>Investment Goal</label>
                        {isEditing ? (
                            <div className="flex flex-wrap gap-1.5">
                                {GOALS.map((g) => (
                                    <button key={g} type="button" onClick={() => update('investmentGoal', g)}
                                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize"
                                        style={{
                                            background: form.investmentGoal === g ? 'var(--color-accent-teal)' : 'var(--color-bg-tertiary)',
                                            color: form.investmentGoal === g ? 'var(--color-bg-primary)' : 'var(--color-text-secondary)',
                                        }}>
                                        {g}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm font-semibold capitalize">{profile?.profile?.investmentGoal || '—'}</p>
                        )}
                    </div>
                    <div>
                        <label className="text-caption block mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
                            Risk Tolerance — {riskLabel(form.riskTolerance ?? 0.5)}
                        </label>
                        {isEditing ? (
                            <div className="flex items-center gap-3">
                                <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Low</span>
                                <input type="range" min="0" max="1" step="0.05" value={form.riskTolerance ?? 0.5}
                                    onChange={(e) => update('riskTolerance', parseFloat(e.target.value))}
                                    className="flex-1" style={{ accentColor: 'var(--color-accent-teal)' }} />
                                <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>High</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-bg-tertiary)' }}>
                                    <div className="h-full rounded-full" style={{ width: `${(profile?.profile?.riskTolerance ?? 0.5) * 100}%`, background: 'var(--gradient-accent)' }} />
                                </div>
                                <span className="text-xs font-numeric font-medium">{Math.round((profile?.profile?.riskTolerance ?? 0.5) * 100)}%</span>
                            </div>
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-caption block mb-1" style={{ color: 'var(--color-text-muted)' }}>
                                <Clock size={12} className="inline mr-1" /> Investment Horizon (years)
                            </label>
                            {isEditing ? (
                                <input className="input-field" type="number" min="1" max="50" value={form.investmentHorizon || ''} onChange={(e) => update('investmentHorizon', parseInt(e.target.value) || 10)} />
                            ) : (
                                <p className="text-sm font-semibold">{profile?.profile?.investmentHorizon ?? 10} years</p>
                            )}
                        </div>
                        <div>
                            <label className="text-caption block mb-1" style={{ color: 'var(--color-text-muted)' }}>Role</label>
                            <p className="text-sm font-semibold">{profile?.role || user?.role || 'Investor'}</p>
                        </div>
                    </div>
                </div>
            </GlassCard>

            {/* KYC Status */}
            <GlassCard className="mb-6">
                <h3 className="text-h3 mb-4">Verification Status</h3>
                <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                    <CheckCircle size={20} style={{ color: 'var(--color-success)' }} />
                    <div>
                        <p className="text-sm font-semibold" style={{ color: 'var(--color-success)' }}>Verified</p>
                        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>KYC completed on Jan 15, 2025</p>
                    </div>
                </div>
            </GlassCard>

            {/* Retake Questionnaire */}
            <GlassCard className="mb-6">
                <h3 className="text-h3 mb-4 flex items-center gap-2">
                    <Shield size={18} style={{ color: 'var(--color-accent-teal)' }} /> Risk Assessment
                </h3>
                <p className="text-body mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                    Retake the risk questionnaire to update your investment profile, risk tolerance, and financial details.
                </p>
                <button onClick={() => navigate('/onboarding')} className="btn-secondary w-full flex items-center justify-center gap-2">
                    <Target size={16} /> Retake Questionnaire
                </button>
            </GlassCard>

            {/* Data Export */}
            <GlassCard className="mb-6">
                <h3 className="text-h3 mb-4">Data Management</h3>
                <button className="btn-secondary w-full">
                    <Download size={16} /> Export My Data
                </button>
            </GlassCard>

            {/* Danger Zone */}
            <GlassCard>
                <h3 className="text-h3 mb-4 flex items-center gap-2" style={{ color: 'var(--color-danger)' }}>
                    <AlertTriangle size={18} /> Danger Zone
                </h3>
                <p className="text-body mb-4" style={{ color: 'var(--color-text-secondary)' }}>Permanently delete your account and all associated data. This action cannot be undone.</p>
                <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-colors" style={{ borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }}>
                    <Trash2 size={14} /> Delete Account
                </button>
            </GlassCard>
        </motion.div>
    );
}
