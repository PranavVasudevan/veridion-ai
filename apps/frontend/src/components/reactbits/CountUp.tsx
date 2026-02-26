import { useEffect, useRef, useState } from 'react';
import { useInView } from 'framer-motion';

interface CountUpProps {
    end: number;
    start?: number;
    duration?: number;
    decimals?: number;
    prefix?: string;
    suffix?: string;
    className?: string;
    separator?: string;
}

export default function CountUp({
    end,
    start = 0,
    duration = 1.5,
    decimals = 0,
    prefix = '',
    suffix = '',
    className = '',
    separator = ',',
}: CountUpProps) {
    const [value, setValue] = useState(start);
    const ref = useRef<HTMLSpanElement>(null);
    const isInView = useInView(ref, { once: true });
    const startTime = useRef<number | null>(null);
    const rafId = useRef<number>(0);

    useEffect(() => {
        if (!isInView) return;

        const easeOutExpo = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

        const animate = (timestamp: number) => {
            if (!startTime.current) startTime.current = timestamp;
            const progress = Math.min((timestamp - startTime.current) / (duration * 1000), 1);
            const easedProgress = easeOutExpo(progress);
            setValue(start + (end - start) * easedProgress);

            if (progress < 1) {
                rafId.current = requestAnimationFrame(animate);
            }
        };

        rafId.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(rafId.current);
    }, [isInView, end, start, duration]);

    const formatNumber = (num: number): string => {
        const fixed = num.toFixed(decimals);
        if (!separator) return fixed;
        const [intPart, decPart] = fixed.split('.');
        const withSep = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
        return decPart ? `${withSep}.${decPart}` : withSep;
    };

    return (
        <span ref={ref} className={`font-numeric ${className}`}>
            {prefix}{formatNumber(value)}{suffix}
        </span>
    );
}
