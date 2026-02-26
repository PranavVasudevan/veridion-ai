import { useRef, useState, type ReactNode, type MouseEvent } from 'react';

interface SpotlightProps {
    children: ReactNode;
    className?: string;
    color?: string;
    size?: number;
}

export default function Spotlight({ children, className = '', color = 'rgba(0, 212, 170, 0.08)', size = 300 }: SpotlightProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isHovering, setIsHovering] = useState(false);

    const handleMouse = (e: MouseEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    return (
        <div
            ref={containerRef}
            className={`relative overflow-hidden ${className}`}
            onMouseMove={handleMouse}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            <div
                className="pointer-events-none absolute -inset-px rounded-2xl transition-opacity duration-300"
                style={{
                    opacity: isHovering ? 1 : 0,
                    background: `radial-gradient(${size}px circle at ${position.x}px ${position.y}px, ${color}, transparent 65%)`,
                }}
            />
            {children}
        </div>
    );
}
