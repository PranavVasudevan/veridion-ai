import React from 'react';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface AnimatedListProps {
    children: ReactNode;
    className?: string;
    staggerDelay?: number;
}

export default function AnimatedList({ children, className = '', staggerDelay = 0.08 }: AnimatedListProps) {
    // Use React.Children.toArray to safely handle single child, multiple children,
    // or even null/undefined — prevents "children.map is not a function" crashes
    const items = React.Children.toArray(children);

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
            {items.map((child, i) => (
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
