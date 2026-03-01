const stateTokens: Record<string, string> = {
    Stable: '#1DB876',
    'Elevated Event Risk': '#D4922B',
    Underfunded: '#D4922B',
    'Over-risked': '#E5484D',
    Rebalancing: '#5B8AF0',
};

interface StateBadgeProps {
    state: string;
    className?: string;
}

export default function StateBadge({ state, className = '' }: StateBadgeProps) {
    const color = stateTokens[state] || stateTokens.Stable;

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
                color: color,
                border: `1px solid ${color}28`,
            }}
        >
            <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: color, flexShrink: 0,
            }} />
            {state}
        </span>
    );
}
