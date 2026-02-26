import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

interface ProbabilityMeterProps {
    value: number; // 0-100
    className?: string;
    height?: number;
}

export default function ProbabilityMeter({ value, className = '', height = 8 }: ProbabilityMeterProps) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true });

    const getColor = () => {
        if (value >= 80) return 'var(--color-success)';
        if (value >= 60) return 'var(--color-accent-teal)';
        if (value >= 40) return 'var(--color-warning)';
        return 'var(--color-danger)';
    };

    return (
        <div ref={ref} className={`w-full ${className}`}>
            <div
                className="w-full rounded-full overflow-hidden"
                style={{ height, background: 'var(--color-bg-tertiary)' }}
            >
                <motion.div
                    className="h-full rounded-full"
                    style={{ background: getColor() }}
                    initial={{ width: 0 }}
                    animate={isInView ? { width: `${value}%` } : {}}
                    transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.2 }}
                />
            </div>
        </div>
    );
}
