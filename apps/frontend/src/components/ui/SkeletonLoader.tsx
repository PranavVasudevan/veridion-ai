interface SkeletonLoaderProps {
    className?: string;
    count?: number;
    height?: string;
    rounded?: string;
}

export default function SkeletonLoader({ className = '', count = 1, height = 'h-4', rounded = 'rounded-lg' }: SkeletonLoaderProps) {
    return (
        <div className={`flex flex-col gap-3 ${className}`}>
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className={`shimmer ${height} ${rounded} w-full`}
                    style={{ background: 'var(--color-bg-tertiary)' }}
                />
            ))}
        </div>
    );
}
