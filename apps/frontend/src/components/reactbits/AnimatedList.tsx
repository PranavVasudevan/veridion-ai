import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface AnimatedListProps {
    children: ReactNode[];
    className?: string;
    staggerDelay?: number;
}

export default function AnimatedList({ children, className = '', staggerDelay = 0.08 }: AnimatedListProps) {
    return (
        <motion.div
            className={className}
            initial="hidden"
            animate="visible"
            variants={{
                hidden: {},
                visible: { transition: { staggerChildren: staggerDelay } },
            }}
        >
            {children.map((child, i) => (
                <motion.div
                    key={i}
                    variants={{
                        hidden: { opacity: 0, x: 20 },
                        visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: 'easeOut' } },
                    }}
                >
                    {child}
                </motion.div>
            ))}
        </motion.div>
    );
}
