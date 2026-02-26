import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

interface BlurTextProps {
    text: string;
    className?: string;
    delay?: number;
}

export default function BlurText({ text, className = '', delay = 0 }: BlurTextProps) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true });

    const words = text.split(' ');

    return (
        <span ref={ref} className={`inline-flex flex-wrap gap-x-1.5 ${className}`}>
            {words.map((word, i) => (
                <motion.span
                    key={i}
                    initial={{ opacity: 0, filter: 'blur(12px)' }}
                    animate={isInView ? { opacity: 1, filter: 'blur(0px)' } : {}}
                    transition={{ duration: 0.6, delay: delay + i * 0.08, ease: 'easeOut' }}
                    className="inline-block"
                >
                    {word}
                </motion.span>
            ))}
        </span>
    );
}
