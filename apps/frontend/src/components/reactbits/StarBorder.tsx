import type { ReactNode } from 'react';

interface StarBorderProps {
    children: ReactNode;
    className?: string;
    color?: string;
    speed?: number;
}

export default function StarBorder({
    children,
    className = '',
    color = '#00D4AA',
    speed = 4,
}: StarBorderProps) {
    return (
        <div className={`relative ${className}`} style={{ padding: '1px', borderRadius: '16px', overflow: 'hidden' }}>
            <div
                className="absolute inset-0"
                style={{
                    background: `conic-gradient(from 0deg, transparent 0%, ${color} 10%, transparent 20%)`,
                    animation: `starBorderSpin ${speed}s linear infinite`,
                    borderRadius: '16px',
                }}
            />
            <div className="absolute inset-[1px] rounded-2xl" style={{ background: 'var(--color-bg-secondary)' }} />
            <div className="relative z-10">{children}</div>
            <style>{`
        @keyframes starBorderSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
}
