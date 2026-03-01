import { useState, type ReactNode } from 'react';

interface TooltipProps {
    children: ReactNode;
    content: string;
    className?: string;
}

export default function Tooltip({ children, content, className = '' }: TooltipProps) {
    const [show, setShow] = useState(false);

    return (
        <div
            className={`relative inline-flex ${className}`}
            onMouseEnter={() => setShow(true)}
            onMouseLeave={() => setShow(false)}
        >
            {children}
            {show && (
                <div
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 whitespace-normal pointer-events-none"
                    style={{
                        padding: '8px 12px',
                        maxWidth: '220px',
                        background: 'var(--surface-overlay)',
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-md)',
                        boxShadow: 'var(--shadow-elevated)',
                        fontSize: '12px',
                        lineHeight: '1.5',
                        animation: 'tooltipIn 120ms ease-out',
                    }}
                >
                    {content}
                    <div
                        className="absolute top-full left-1/2 -translate-x-1/2 w-1.5 h-1.5 rotate-45"
                        style={{
                            background: 'var(--surface-overlay)',
                            borderRight: '1px solid var(--border-default)',
                            borderBottom: '1px solid var(--border-default)',
                        }}
                    />
                    <style>{`
            @keyframes tooltipIn {
              from { opacity: 0; transform: translate(-50%, 0) scale(0.95); }
              to { opacity: 1; transform: translate(-50%, 0) scale(1); }
            }
          `}</style>
                </div>
            )}
        </div>
    );
}
