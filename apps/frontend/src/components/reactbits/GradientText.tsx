// GradientText animation component

interface GradientTextProps {
    text: string;
    className?: string;
    from?: string;
    to?: string;
    animate?: boolean;
}

export default function GradientText({
    text,
    className = '',
    from = '#00D4AA',
    to = '#3B82F6',
    animate = true,
}: GradientTextProps) {
    return (
        <span
            className={`inline-block bg-clip-text text-transparent ${className}`}
            style={{
                backgroundImage: `linear-gradient(135deg, ${from}, ${to}, ${from})`,
                backgroundSize: animate ? '200% auto' : '100% auto',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                animation: animate ? 'gradientFlow 3s linear infinite' : 'none',
            }}
        >
            <style>{`
        @keyframes gradientFlow {
          0% { background-position: 0% center; }
          100% { background-position: 200% center; }
        }
      `}</style>
            {text}
        </span>
    );
}
