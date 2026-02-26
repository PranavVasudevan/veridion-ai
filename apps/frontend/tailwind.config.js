/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    darkMode: ['class', '[data-theme="dark"]'],
    theme: {
        extend: {
            colors: {
                bg: {
                    primary: 'var(--color-bg-primary)',
                    secondary: 'var(--color-bg-secondary)',
                    tertiary: 'var(--color-bg-tertiary)',
                    card: 'var(--color-bg-card)',
                },
                accent: {
                    teal: 'var(--color-accent-teal)',
                    'teal-dim': 'var(--color-accent-teal-dim)',
                    gold: 'var(--color-accent-gold)',
                    blue: 'var(--color-accent-blue)',
                },
                semantic: {
                    success: 'var(--color-success)',
                    warning: 'var(--color-warning)',
                    danger: 'var(--color-danger)',
                    critical: 'var(--color-critical)',
                    info: 'var(--color-info)',
                },
                text: {
                    primary: 'var(--color-text-primary)',
                    secondary: 'var(--color-text-secondary)',
                    muted: 'var(--color-text-muted)',
                },
                border: {
                    DEFAULT: 'var(--color-border)',
                    hover: 'var(--color-border-hover)',
                },
            },
            fontFamily: {
                sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
            },
            borderRadius: {
                '2xl': '16px',
            },
            backdropBlur: {
                xl: '24px',
            },
            animation: {
                'gradient-shift': 'gradientShift 15s ease infinite',
                shimmer: 'shimmer 2s linear infinite',
            },
            keyframes: {
                gradientShift: {
                    '0%': { backgroundPosition: '0% 50%' },
                    '50%': { backgroundPosition: '100% 50%' },
                    '100%': { backgroundPosition: '0% 50%' },
                },
                shimmer: {
                    '0%': { transform: 'translateX(-100%)' },
                    '100%': { transform: 'translateX(100%)' },
                },
            },
        },
    },
    plugins: [],
};
