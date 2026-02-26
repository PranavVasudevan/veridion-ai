import { motion } from 'framer-motion';
import { User, Shield, Download, Trash2, CheckCircle, AlertTriangle } from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';
import { useAuthStore } from '../state/auth.store';

const pageV = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0, transition: { duration: 0.4 } }, exit: { opacity: 0 } };

export default function Profile() {
    const user = useAuthStore((s) => s.user);

    return (
        <motion.div variants={pageV} initial="initial" animate="animate" exit="exit" className="max-w-2xl">
            <h2 className="text-h2 mb-6">Profile</h2>

            <GlassCard className="mb-6">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold" style={{ background: 'var(--gradient-accent)', color: 'var(--color-bg-primary)' }}>
                        {user?.name?.charAt(0) || 'A'}
                    </div>
                    <div>
                        <h3 className="text-h3">{user?.name || 'Alex Thompson'}</h3>
                        <p className="text-body" style={{ color: 'var(--color-text-secondary)' }}>{user?.email || 'demo@veridion.ai'}</p>
                    </div>
                </div>
                <div className="space-y-4">
                    {[
                        { label: 'Full Name', value: user?.name || 'Alex Thompson' },
                        { label: 'Email', value: user?.email || 'demo@veridion.ai' },
                        { label: 'Role', value: user?.role || 'Investor' },
                        { label: 'Member Since', value: 'January 2025' },
                    ].map((field) => (
                        <div key={field.label}>
                            <label className="text-caption block mb-1" style={{ color: 'var(--color-text-muted)' }}>{field.label}</label>
                            <input className="input-field" defaultValue={field.value} readOnly />
                        </div>
                    ))}
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
