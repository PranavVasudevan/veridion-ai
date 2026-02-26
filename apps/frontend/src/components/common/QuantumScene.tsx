import Particles from '../reactbits/Particles';

export default function QuantumScene({ className = '' }: { className?: string }) {
    return (
        <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}>
            <Particles count={35} color="#00D4AA" speed={0.3} />
            <div
                className="absolute inset-0"
                style={{
                    background: 'radial-gradient(circle at 50% 50%, transparent 0%, var(--color-bg-primary) 70%)',
                }}
            />
        </div>
    );
}
