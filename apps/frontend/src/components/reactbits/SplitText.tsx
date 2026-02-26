import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

interface SplitTextProps {
    text: string;
    className?: string;
    delay?: number;
}

export default function SplitText({ text, className = '', delay = 0 }: SplitTextProps) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true });

    return (
        <span ref={ref} className={`inline-flex flex-wrap ${className}`}>
            {text.split('').map((char, i) => (
                <motion.span
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.4, delay: delay + i * 0.03, ease: [0.25, 0.46, 0.45, 0.94] }}
                    style={{ display: 'inline-block', whiteSpace: char === ' ' ? 'pre' : 'normal' }}
                >
                    {char}
                </motion.span>
            ))}
        </span>
    );
}
