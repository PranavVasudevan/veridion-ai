import type { ReactNode } from 'react';

interface GlassCardProps {
    children: ReactNode;
    className?: string;
    interactive?: boolean;
    padding?: string;
    onClick?: () => void;
}

export default function GlassCard({ children, className = '', interactive = false, padding = 'p-6', onClick }: GlassCardProps) {
    return (
        <div
            onClick={onClick}
            className={`
                relative overflow-hidden backdrop-blur-xl
                border transition-all
                ${interactive ? 'cursor-pointer' : ''}
                ${padding} ${className}
            `}
            style={{
                background: 'var(--surface-glass)',
                borderColor: 'var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-card)',
                transition: `border-color var(--duration-base) var(--ease-in-out), transform var(--duration-base) var(--ease-in-out), box-shadow var(--duration-base) var(--ease-in-out)`,
            }}
            onMouseEnter={(e) => {
                const el = e.currentTarget;
                el.style.borderColor = 'var(--border-default)';
                if (interactive) {
                    el.style.transform = 'translateY(-2px)';
                    el.style.boxShadow = 'var(--shadow-elevated)';
                }
            }}
            onMouseLeave={(e) => {
                const el = e.currentTarget;
                el.style.borderColor = 'var(--border-subtle)';
                if (interactive) {
                    el.style.transform = 'translateY(0)';
                    el.style.boxShadow = 'var(--shadow-card)';
                }
            }}
        >
            {/* Inner shimmer layer */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{
                    borderRadius: 'inherit',
                    background: 'linear-gradient(135deg, var(--surface-glass-light) 0%, transparent 60%)',
                }}
            />
            {/* Top-edge light line */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-px"
                style={{
                    borderRadius: 'inherit',
                    background: 'linear-gradient(90deg, transparent 0%, var(--border-default) 40%, var(--border-default) 60%, transparent 100%)',
                }}
            />
            <div className="relative z-10">{children}</div>
        </div>
    );
}
