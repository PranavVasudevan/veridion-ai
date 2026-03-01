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
                    className={`${height} ${rounded} w-full`}
                    style={{
                        background: 'linear-gradient(90deg, var(--surface-overlay) 0%, var(--surface-sunken) 40%, rgba(255,255,255,0.04) 50%, var(--surface-sunken) 60%, var(--surface-overlay) 100%)',
                        backgroundSize: '200% 100%',
                        animation: 'shimmer 1.6s ease-in-out infinite',
                        borderRadius: 'var(--radius-sm)',
                    }}
                />
            ))}
        </div>
    );
}
