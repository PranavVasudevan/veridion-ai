import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

interface RiskRingProps {
    value: number; // 0-100
    size?: number;
    strokeWidth?: number;
    color?: string;
    className?: string;
}

export default function RiskRing({ value, size = 120, strokeWidth = 8, color = 'var(--color-accent-teal)', className = '' }: RiskRingProps) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true });

    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = (value / 100) * circumference;

    return (
        <div ref={ref} className={`relative inline-flex items-center justify-center ${className}`}>
            <svg width={size} height={size} className="-rotate-90">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="var(--color-bg-tertiary)"
                    strokeWidth={strokeWidth}
                />
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={isInView ? { strokeDashoffset: circumference - progress } : {}}
                    transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.3 }}
                    style={{ filter: `drop-shadow(0 0 6px ${color})` }}
                />
            </svg>
        </div>
    );
}
