import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';
import { useUIStore } from '../../state/ui.store';

const iconMap = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertTriangle,
    info: Info,
};

const colorMap = {
    success: { bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.3)', icon: '#10B981' },
    error: { bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.3)', icon: '#EF4444' },
    warning: { bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.3)', icon: '#F59E0B' },
    info: { bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.3)', icon: '#3B82F6' },
};

export default function ToastNotification() {
    const { toasts, removeToast } = useUIStore();

    return (
        <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 max-w-sm">
            <AnimatePresence>
                {toasts.map((toast) => {
                    const Icon = iconMap[toast.type];
                    const colors = colorMap[toast.type];
                    return (
                        <motion.div
                            key={toast.id}
                            initial={{ opacity: 0, x: 50, scale: 0.95 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 50, scale: 0.95 }}
                            transition={{ duration: 0.3 }}
                            className="glass p-4 flex items-start gap-3"
                            style={{ borderColor: colors.border, background: colors.bg }}
                        >
                            <Icon size={18} style={{ color: colors.icon }} className="mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{toast.title}</p>
                                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>{toast.message}</p>
                            </div>
                            <button onClick={() => removeToast(toast.id)} className="text-text-muted hover:text-text-primary transition-colors">
                                <X size={14} />
                            </button>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
}
