// ============================================
// VERIDION AI — COLOR MAPS
// ============================================

export const severityColors: Record<string, { bg: string; text: string; border: string; dot: string }> = {
    LOW: {
        bg: 'rgba(107, 114, 128, 0.15)',
        text: '#9CA3AF',
        border: 'rgba(107, 114, 128, 0.3)',
        dot: '#6B7280',
    },
    MEDIUM: {
        bg: 'rgba(245, 158, 11, 0.15)',
        text: '#F59E0B',
        border: 'rgba(245, 158, 11, 0.3)',
        dot: '#F59E0B',
    },
    HIGH: {
        bg: 'rgba(249, 115, 22, 0.15)',
        text: '#F97316',
        border: 'rgba(249, 115, 22, 0.3)',
        dot: '#F97316',
    },
    CRITICAL: {
        bg: 'rgba(239, 68, 68, 0.15)',
        text: '#EF4444',
        border: 'rgba(239, 68, 68, 0.3)',
        dot: '#EF4444',
    },
};

export const stateColors: Record<string, { bg: string; text: string; border: string }> = {
    Stable: {
        bg: 'rgba(16, 185, 129, 0.15)',
        text: '#10B981',
        border: 'rgba(16, 185, 129, 0.3)',
    },
    'Elevated Event Risk': {
        bg: 'rgba(245, 158, 11, 0.15)',
        text: '#F59E0B',
        border: 'rgba(245, 158, 11, 0.3)',
    },
    Underfunded: {
        bg: 'rgba(234, 179, 8, 0.15)',
        text: '#EAB308',
        border: 'rgba(234, 179, 8, 0.3)',
    },
    'Over-risked': {
        bg: 'rgba(239, 68, 68, 0.15)',
        text: '#EF4444',
        border: 'rgba(239, 68, 68, 0.3)',
    },
    Rebalancing: {
        bg: 'rgba(59, 130, 246, 0.15)',
        text: '#3B82F6',
        border: 'rgba(59, 130, 246, 0.3)',
    },
};

export const eventTypeColors: Record<string, { bg: string; text: string }> = {
    regulatory_shock: { bg: 'rgba(239, 68, 68, 0.15)', text: '#EF4444' },
    earnings_surprise: { bg: 'rgba(59, 130, 246, 0.15)', text: '#3B82F6' },
    macro_event: { bg: 'rgba(249, 115, 22, 0.15)', text: '#F97316' },
    operational_disruption: { bg: 'rgba(168, 85, 247, 0.15)', text: '#A855F7' },
};

export const chartColors = [
    '#00D4AA',
    '#3B82F6',
    '#F5A623',
    '#A855F7',
    '#EF4444',
    '#10B981',
    '#EC4899',
    '#F59E0B',
    '#6366F1',
    '#14B8A6',
];

export const alertTypeColors: Record<string, string> = {
    risk_threshold: '#EF4444',
    exposure_warning: '#F97316',
    rebalance_suggestion: '#3B82F6',
    behavioral_flag: '#A855F7',
    projection_change: '#F59E0B',
};
