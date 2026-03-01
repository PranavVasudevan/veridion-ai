// ============================================
// VERIDION AI — COLOR MAPS (Premium Palette)
// ============================================

export const severityColors: Record<string, { bg: string; text: string; border: string; dot: string }> = {
    LOW: {
        bg: 'rgba(75, 87, 104, 0.08)',
        text: '#8B95A5',
        border: 'rgba(75, 87, 104, 0.16)',
        dot: '#4B5768',
    },
    MEDIUM: {
        bg: 'rgba(212, 146, 43, 0.08)',
        text: '#D4922B',
        border: 'rgba(212, 146, 43, 0.16)',
        dot: '#D4922B',
    },
    HIGH: {
        bg: 'rgba(229, 72, 77, 0.08)',
        text: '#E5484D',
        border: 'rgba(229, 72, 77, 0.16)',
        dot: '#E5484D',
    },
    CRITICAL: {
        bg: 'rgba(204, 42, 42, 0.08)',
        text: '#F87171',
        border: 'rgba(204, 42, 42, 0.16)',
        dot: '#CC2A2A',
    },
};

export const stateColors: Record<string, { bg: string; text: string; border: string }> = {
    Stable: {
        bg: 'rgba(29, 184, 118, 0.08)',
        text: '#1DB876',
        border: 'rgba(29, 184, 118, 0.16)',
    },
    'Elevated Event Risk': {
        bg: 'rgba(212, 146, 43, 0.08)',
        text: '#D4922B',
        border: 'rgba(212, 146, 43, 0.16)',
    },
    Underfunded: {
        bg: 'rgba(212, 146, 43, 0.08)',
        text: '#D4922B',
        border: 'rgba(212, 146, 43, 0.16)',
    },
    'Over-risked': {
        bg: 'rgba(229, 72, 77, 0.08)',
        text: '#E5484D',
        border: 'rgba(229, 72, 77, 0.16)',
    },
    Rebalancing: {
        bg: 'rgba(91, 138, 240, 0.08)',
        text: '#5B8AF0',
        border: 'rgba(91, 138, 240, 0.16)',
    },
};

export const eventTypeColors: Record<string, { bg: string; text: string }> = {
    regulatory_shock: { bg: 'rgba(229, 72, 77, 0.08)', text: '#E5484D' },
    earnings_surprise: { bg: 'rgba(91, 138, 240, 0.08)', text: '#5B8AF0' },
    macro_event: { bg: 'rgba(212, 146, 43, 0.08)', text: '#D4922B' },
    operational_disruption: { bg: 'rgba(168, 85, 247, 0.08)', text: '#A855F7' },
};

export const chartColors = [
    '#00C896',
    '#5B8AF0',
    '#C9A84C',
    '#A855F7',
    '#E5484D',
    '#1DB876',
    '#EC4899',
    '#D4922B',
    '#6366F1',
    '#14B8A6',
];

export const alertTypeColors: Record<string, string> = {
    risk_threshold: '#E5484D',
    exposure_warning: '#D4922B',
    rebalance_suggestion: '#5B8AF0',
    behavioral_flag: '#A855F7',
    projection_change: '#D4922B',
};
