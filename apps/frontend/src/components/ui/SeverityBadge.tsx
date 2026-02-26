import { severityColors } from '../../utils/colors';

interface SeverityBadgeProps {
    severity: string;
    className?: string;
}

export default function SeverityBadge({ severity, className = '' }: SeverityBadgeProps) {
    const colors = severityColors[severity] || severityColors.LOW;

    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${className}`}
            style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}
        >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: colors.dot }} />
            {severity}
        </span>
    );
}
