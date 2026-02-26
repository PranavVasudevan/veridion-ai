import { Sun, Moon } from 'lucide-react';
import { useThemeStore } from '../../state/theme.store';
import ClickSpark from '../reactbits/ClickSpark';

export default function ThemeToggle() {
    const { mode, toggleMode } = useThemeStore();

    return (
        <ClickSpark>
            <button
                onClick={toggleMode}
                className="relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 hover:bg-bg-tertiary"
                aria-label={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}
            >
                {mode === 'dark' ? (
                    <Sun size={18} className="text-text-secondary hover:text-accent-gold transition-colors" />
                ) : (
                    <Moon size={18} className="text-text-secondary hover:text-accent-blue transition-colors" />
                )}
            </button>
        </ClickSpark>
    );
}
