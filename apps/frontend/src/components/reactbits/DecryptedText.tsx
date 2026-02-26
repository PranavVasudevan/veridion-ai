import { useState, useEffect, useRef } from 'react';
import { useInView } from 'framer-motion';

interface DecryptedTextProps {
    text: string;
    className?: string;
    speed?: number;
    characters?: string;
}

export default function DecryptedText({
    text,
    className = '',
    speed = 50,
    characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*',
}: DecryptedTextProps) {
    const [displayed, setDisplayed] = useState(text.replace(/./g, '█'));
    const ref = useRef<HTMLSpanElement>(null);
    const isInView = useInView(ref, { once: true });

    useEffect(() => {
        if (!isInView) return;

        let currentIndex = 0;
        const interval = setInterval(() => {
            if (currentIndex >= text.length) {
                clearInterval(interval);
                return;
            }

            setDisplayed((prev) => {
                const revealed = text.slice(0, currentIndex + 1);
                const scrambled = Array.from({ length: text.length - currentIndex - 1 }, () =>
                    characters.charAt(Math.floor(Math.random() * characters.length))
                ).join('');
                return revealed + scrambled;
            });

            currentIndex++;
        }, speed);

        return () => clearInterval(interval);
    }, [isInView, text, speed, characters]);

    return (
        <span ref={ref} className={`font-mono ${className}`}>
            {displayed}
        </span>
    );
}
