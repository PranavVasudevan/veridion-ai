// ============================================
// VERIDION AI — FORMATTERS
// ============================================

export function formatCurrency(value: number, compact = false): string {
    if (compact && Math.abs(value) >= 1_000_000) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            notation: 'compact',
            maximumFractionDigits: 1,
        }).format(value);
    }
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
}

export function formatPercent(value: number, decimals = 2): string {
    return `${(value * 100).toFixed(decimals)}%`;
}

export function formatPercentRaw(value: number, decimals = 2): string {
    return `${value.toFixed(decimals)}%`;
}

export function formatNumber(value: number, decimals = 2): string {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(value);
}

export function formatCompactNumber(value: number): string {
    return new Intl.NumberFormat('en-US', {
        notation: 'compact',
        maximumFractionDigits: 1,
    }).format(value);
}

export function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

export function formatDateTime(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function formatRelativeTime(dateStr: string): string {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateStr);
}

export function formatSentiment(value: number): { label: string; color: string } {
    if (value > 0.3) return { label: 'Bullish', color: 'var(--color-success)' };
    if (value > 0) return { label: 'Slightly Bullish', color: 'var(--color-success)' };
    if (value > -0.3) return { label: 'Slightly Bearish', color: 'var(--color-warning)' };
    return { label: 'Bearish', color: 'var(--color-danger)' };
}

export function formatRatio(value: number): string {
    return value.toFixed(3);
}
