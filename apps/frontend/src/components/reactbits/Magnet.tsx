import { useRef, useState, type ReactNode, type MouseEvent } from 'react';

interface MagnetProps {
    children: ReactNode;
    className?: string;
    strength?: number;
}

export default function Magnet({ children, className = '', strength = 0.3 }: MagnetProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [transform, setTransform] = useState('translate(0px, 0px)');

    const handleMouse = (e: MouseEvent) => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const x = (e.clientX - rect.left - rect.width / 2) * strength;
        const y = (e.clientY - rect.top - rect.height / 2) * strength;
        setTransform(`translate(${x}px, ${y}px)`);
    };

    const handleLeave = () => setTransform('translate(0px, 0px)');

    return (
        <div
            ref={ref}
            className={`inline-block transition-transform duration-200 ease-out ${className}`}
            style={{ transform }}
            onMouseMove={handleMouse}
            onMouseLeave={handleLeave}
        >
            {children}
        </div>
    );
}
