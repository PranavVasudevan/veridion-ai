import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

interface AnimatedGaugeProps {
    value: number; // 0-100
    size?: number;
    strokeWidth?: number;
    color?: string;
    label?: string;
    className?: string;
}

export default function AnimatedGauge({ value, size = 140, strokeWidth = 10, color, label, className = '' }: AnimatedGaugeProps) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true });

    const getColor = () => {
        if (color) return color;
        if (value >= 71) return 'var(--color-success)';
        if (value >= 41) return 'var(--color-warning)';
        return 'var(--color-danger)';
    };

    const radius = (size - strokeWidth) / 2;
    const circumference = Math.PI * radius; // half circle
    const progress = (value / 100) * circumference;

    return (
        <div ref={ref} className={`flex flex-col items-center ${className}`}>
            <svg width={size} height={size / 2 + 20} viewBox={`0 0 ${size} ${size / 2 + 20}`}>
                {/* Background arc */}
                <path
                    d={`M ${strokeWidth / 2} ${size / 2 + 10} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2 + 10}`}
                    fill="none"
                    stroke="var(--color-bg-tertiary)"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                />
                {/* Progress arc */}
                <motion.path
                    d={`M ${strokeWidth / 2} ${size / 2 + 10} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2 + 10}`}
                    fill="none"
                    stroke={getColor()}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={isInView ? { strokeDashoffset: circumference - progress } : {}}
                    transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.2 }}
                    style={{
                        filter: `drop-shadow(0 0 8px ${getColor()})`,
                    }}
                />
            </svg>
            {label && <span className="text-caption text-text-secondary mt-1">{label}</span>}
        </div>
    );
}
