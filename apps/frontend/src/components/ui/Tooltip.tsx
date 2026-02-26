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
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg text-xs max-w-xs z-50 whitespace-normal pointer-events-none"
                    style={{
                        background: 'var(--color-bg-tertiary)',
                        color: 'var(--color-text-secondary)',
                        border: '1px solid var(--color-border)',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                        animation: 'tooltipIn 150ms ease-out',
                    }}
                >
                    {content}
                    <div
                        className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 rotate-45"
                        style={{ background: 'var(--color-bg-tertiary)', borderRight: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)' }}
                    />
                    <style>{`
            @keyframes tooltipIn {
              from { opacity: 0; transform: translate(-50%, 4px) scale(0.95); }
              to { opacity: 1; transform: translate(-50%, 0) scale(1); }
            }
          `}</style>
                </div>
            )}
        </div>
    );
}
