import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';
import { useUIStore } from '../../state/ui.store';

const iconMap = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertTriangle,
    info: Info,
};

const accentColors = {
    success: '#1DB876',
    error: '#E5484D',
    warning: '#D4922B',
    info: '#5B8AF0',
};

export default function ToastNotification() {
    const { toasts, removeToast } = useUIStore();

    return (
        <div className="fixed z-[100] flex flex-col gap-2" style={{
            bottom: '16px', right: '16px',
            maxWidth: '320px',
        }}>
            <AnimatePresence>
                {toasts.map((toast) => {
                    const Icon = iconMap[toast.type];
                    const accent = accentColors[toast.type];
                    return (
                        <motion.div
                            key={toast.id}
                            initial={{ opacity: 0, x: 'calc(100% + 16px)' }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 'calc(100% + 16px)' }}
                            transition={{ duration: 0.32, ease: [0.19, 1, 0.22, 1] }}
                            className="flex items-start gap-3 relative overflow-hidden"
                            style={{
                                padding: '12px 14px',
                                background: 'var(--surface-overlay)',
                                border: '1px solid var(--border-default)',
                                borderRadius: 'var(--radius-lg)',
                                boxShadow: 'var(--shadow-elevated)',
                            }}
                        >
                            {/* Left accent bar */}
                            <div style={{
                                position: 'absolute', left: 0, top: 0, bottom: 0,
                                width: '3px', background: accent,
                                borderRadius: 'var(--radius-lg) 0 0 var(--radius-lg)',
                            }} />
                            <Icon size={16} style={{ color: accent, flexShrink: 0, marginTop: '1px' }} />
                            <div className="flex-1 min-w-0">
                                <p style={{
                                    fontSize: '13px', fontWeight: 500,
                                    color: 'var(--text-primary)',
                                }}>{toast.title}</p>
                                <p style={{
                                    fontSize: '12px', marginTop: '2px',
                                    color: 'var(--text-secondary)',
                                }}>{toast.message}</p>
                            </div>
                            <button
                                onClick={() => removeToast(toast.id)}
                                style={{ color: 'var(--text-tertiary)', flexShrink: 0 }}
                            >
                                <X size={14} />
                            </button>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
}
