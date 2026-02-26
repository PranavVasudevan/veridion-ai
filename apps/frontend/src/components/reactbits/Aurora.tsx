interface AuroraProps {
    className?: string;
    colors?: string[];
    speed?: number;
}

export default function Aurora({
    className = '',
    colors = ['#00D4AA', '#3B82F6', '#8B5CF6', '#00D4AA'],
    speed = 8,
}: AuroraProps) {
    return (
        <div className={`absolute inset-0 overflow-hidden ${className}`}>
            {colors.map((color, i) => (
                <div
                    key={i}
                    className="absolute rounded-full mix-blend-screen opacity-30"
                    style={{
                        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
                        width: `${400 + i * 100}px`,
                        height: `${400 + i * 100}px`,
                        left: `${15 + i * 20}%`,
                        top: `${10 + i * 15}%`,
                        animation: `auroraFloat${i} ${speed + i * 2}s ease-in-out infinite alternate`,
                        filter: 'blur(60px)',
                    }}
                />
            ))}
            <style>{`
        @keyframes auroraFloat0 { from { transform: translate(0, 0) scale(1); } to { transform: translate(80px, -40px) scale(1.2); } }
        @keyframes auroraFloat1 { from { transform: translate(0, 0) scale(1.1); } to { transform: translate(-60px, 50px) scale(0.9); } }
        @keyframes auroraFloat2 { from { transform: translate(0, 0) scale(0.9); } to { transform: translate(50px, 30px) scale(1.15); } }
        @keyframes auroraFloat3 { from { transform: translate(0, 0) scale(1); } to { transform: translate(-40px, -60px) scale(1.1); } }
      `}</style>
        </div>
    );
}
