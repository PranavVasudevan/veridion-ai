const severityTokens: Record<string, string> = {
    LOW: '#4B5768',
    MEDIUM: '#D4922B',
    HIGH: '#E5484D',
    CRITICAL: '#CC2A2A',
};

interface SeverityBadgeProps {
    severity: string;
    className?: string;
}

export default function SeverityBadge({ severity, className = '' }: SeverityBadgeProps) {
    const color = severityTokens[severity] || severityTokens.LOW;

    return (
        <span
            className={className}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '2px 8px',
                borderRadius: 'var(--radius-pill)',
                fontSize: '11px',
                fontWeight: 500,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                fontFamily: 'var(--font-mono)',
                background: `${color}14`,
                color: severity === 'CRITICAL' ? '#F87171' : color,
                border: `1px solid ${color}28`,
            }}
        >
            <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: color, flexShrink: 0,
                boxShadow: severity === 'CRITICAL' ? 'var(--glow-danger)' : 'none',
            }} />
            {severity}
        </span>
    );
}
