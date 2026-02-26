// ShinyText animation component

interface ShinyTextProps {
    text: string;
    className?: string;
    shimmerWidth?: number;
}

export default function ShinyText({ text, className = '', shimmerWidth = 100 }: ShinyTextProps) {
    return (
        <span
            className={`inline-block bg-clip-text ${className}`}
            style={{
                backgroundImage: `linear-gradient(120deg, rgba(255,255,255,0) 40%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0) 60%)`,
                backgroundSize: `${shimmerWidth}% 100%`,
                WebkitBackgroundClip: 'text',
                animation: 'shinyText 3s linear infinite',
                color: 'inherit',
            }}
        >
            <style>{`
        @keyframes shinyText {
          0% { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
      `}</style>
            {text}
        </span>
    );
}
