import { useCallback, useRef, type ReactNode, type MouseEvent } from 'react';

interface ClickSparkProps {
    children: ReactNode;
    color?: string;
    count?: number;
}

export default function ClickSpark({ children, color = '#00D4AA', count = 8 }: ClickSparkProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    const createSpark = useCallback(
        (e: MouseEvent) => {
            const container = containerRef.current;
            if (!container) return;

            for (let i = 0; i < count; i++) {
                const spark = document.createElement('div');
                const angle = (360 / count) * i;
                const distance = 20 + Math.random() * 30;

                Object.assign(spark.style, {
                    position: 'fixed',
                    left: `${e.clientX}px`,
                    top: `${e.clientY}px`,
                    width: '4px',
                    height: '4px',
                    borderRadius: '50%',
                    pointerEvents: 'none',
                    zIndex: '9999',
                    backgroundColor: color,
                    transform: 'translate(-50%, -50%)',
                    animation: 'none',
                });

                document.body.appendChild(spark);

                const rad = (angle * Math.PI) / 180;
                const endX = Math.cos(rad) * distance;
                const endY = Math.sin(rad) * distance;

                spark.animate(
                    [
                        { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
                        { transform: `translate(calc(-50% + ${endX}px), calc(-50% + ${endY}px)) scale(0)`, opacity: 0 },
                    ],
                    { duration: 500, easing: 'ease-out' }
                ).onfinish = () => spark.remove();
            }
        },
        [color, count]
    );

    return (
        <div ref={containerRef} onClick={createSpark} className="inline-block">
            {children}
        </div>
    );
}
