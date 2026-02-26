import { useEffect, useRef } from 'react';

interface ParticlesProps {
    className?: string;
    count?: number;
    color?: string;
    speed?: number;
}

export default function Particles({ className = '', count = 50, color = '#00D4AA', speed = 0.5 }: ParticlesProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animId: number;
        const particles: { x: number; y: number; vx: number; vy: number; size: number; opacity: number }[] = [];

        const resize = () => {
            canvas.width = canvas.offsetWidth * window.devicePixelRatio;
            canvas.height = canvas.offsetHeight * window.devicePixelRatio;
            ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        };
        resize();

        const w = () => canvas.offsetWidth;
        const h = () => canvas.offsetHeight;

        for (let i = 0; i < count; i++) {
            particles.push({
                x: Math.random() * w(),
                y: Math.random() * h(),
                vx: (Math.random() - 0.5) * speed,
                vy: (Math.random() - 0.5) * speed,
                size: Math.random() * 2 + 0.5,
                opacity: Math.random() * 0.5 + 0.1,
            });
        }

        const draw = () => {
            ctx.clearRect(0, 0, w(), h());

            particles.forEach((p) => {
                p.x += p.vx;
                p.y += p.vy;

                if (p.x < 0) p.x = w();
                if (p.x > w()) p.x = 0;
                if (p.y < 0) p.y = h();
                if (p.y > h()) p.y = 0;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = color;
                ctx.globalAlpha = p.opacity;
                ctx.fill();
            });

            // Draw connections
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 120) {
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.strokeStyle = color;
                        ctx.globalAlpha = (1 - dist / 120) * 0.15;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                }
            }

            ctx.globalAlpha = 1;
            animId = requestAnimationFrame(draw);
        };

        draw();
        window.addEventListener('resize', resize);

        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener('resize', resize);
        };
    }, [count, color, speed]);

    return <canvas ref={canvasRef} className={`absolute inset-0 w-full h-full ${className}`} />;
}
