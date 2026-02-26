// ============================================
// VERIDION AI — SHARED UTILITIES
// ============================================

export function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

export function lerp(start: number, end: number, t: number): number {
    return start + (end - start) * t;
}

export function generateId(): string {
    return Math.random().toString(36).substring(2, 9);
}

export function debounce<T extends (...args: unknown[]) => void>(fn: T, ms: number): T {
    let timer: ReturnType<typeof setTimeout>;
    return ((...args: unknown[]) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), ms);
    }) as T;
}

export function classNames(...classes: (string | boolean | undefined | null)[]): string {
    return classes.filter(Boolean).join(' ');
}

export function getHealthColor(index: number): string {
    if (index >= 71) return 'var(--color-success)';
    if (index >= 41) return 'var(--color-warning)';
    return 'var(--color-danger)';
}

export function getHealthLabel(index: number): string {
    if (index >= 71) return 'Healthy';
    if (index >= 41) return 'Caution';
    return 'At Risk';
}

export function isDemoMode(): boolean {
    return import.meta.env.VITE_DEMO_MODE === 'false';
}

export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
