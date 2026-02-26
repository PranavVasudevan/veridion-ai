import type { ReactNode } from 'react';

interface GlassCardProps {
    children: ReactNode;
    className?: string;
    interactive?: boolean;
    padding?: string;
}

export default function GlassCard({ children, className = '', interactive = false, padding = 'p-6' }: GlassCardProps) {
    return (
        <div className={`glass ${interactive ? 'glass-interactive cursor-pointer' : ''} ${padding} ${className}`}>
            {children}
        </div>
    );
}
