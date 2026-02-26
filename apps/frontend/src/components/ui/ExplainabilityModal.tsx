import { useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, ChevronDown } from 'lucide-react';

interface ExplainabilityModalProps {
    children: ReactNode;
    explanation: string;
    factors?: { name: string; contribution: number; description: string }[];
    className?: string;
}

export default function ExplainabilityModal({ children, explanation, factors, className = '' }: ExplainabilityModalProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className={className}>
            {children}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="inline-flex items-center gap-1 mt-2 text-xs font-medium transition-colors hover:text-accent-teal"
                style={{ color: 'var(--color-text-muted)' }}
            >
                <HelpCircle size={12} />
                Why?
                <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown size={12} />
                </motion.span>
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <div className="mt-3 p-4 rounded-xl text-sm" style={{ background: 'var(--color-bg-tertiary)' }}>
                            <p style={{ color: 'var(--color-text-secondary)' }}>{explanation}</p>
                            {factors && factors.length > 0 && (
                                <div className="mt-3 space-y-2">
                                    <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Contributing Factors</p>
                                    {factors.map((f) => (
                                        <div key={f.name} className="flex items-center gap-3">
                                            <div className="flex-1">
                                                <div className="flex justify-between text-xs mb-1">
                                                    <span style={{ color: 'var(--color-text-primary)' }}>{f.name}</span>
                                                    <span className="font-numeric" style={{ color: f.contribution >= 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
                                                        {f.contribution >= 0 ? '+' : ''}{(f.contribution * 100).toFixed(0)}%
                                                    </span>
                                                </div>
                                                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-bg-secondary)' }}>
                                                    <div
                                                        className="h-full rounded-full"
                                                        style={{
                                                            width: `${Math.abs(f.contribution) * 100}%`,
                                                            background: f.contribution >= 0 ? 'var(--color-danger)' : 'var(--color-success)',
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
