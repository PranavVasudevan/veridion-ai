import { stateColors } from '../../utils/colors';

interface StateBadgeProps {
    state: string;
    className?: string;
}

export default function StateBadge({ state, className = '' }: StateBadgeProps) {
    const colors = stateColors[state] || stateColors.Stable;

    return (
        <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${className}`}
            style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}
        >
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: colors.text }} />
            {state}
        </span>
    );
}
