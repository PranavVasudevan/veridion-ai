import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff, Hexagon } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import GradientText from '../components/reactbits/GradientText';
import Particles from '../components/reactbits/Particles';

export default function Register() {
    const { register } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPwd, setShowPwd] = useState(false);
    const [loading, setLoading] = useState(false);

    const pwdStrength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
    const strengthColors = ['', 'var(--color-danger)', 'var(--color-warning)', 'var(--color-success)'];
    const strengthLabels = ['', 'Weak', 'Fair', 'Strong'];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await register(email || 'demo@veridion.ai', password || 'demo', name || 'Demo User');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex" style={{ background: 'var(--color-bg-primary)' }}>
            <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center overflow-hidden" style={{ background: 'var(--color-bg-secondary)' }}>
                <Particles count={40} />
                <div className="relative z-10 text-center px-12">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-8" style={{ background: 'var(--gradient-accent)' }}>
                        <Hexagon size={32} className="text-bg-primary" />
                    </div>
                    <GradientText text="Veridion AI" className="text-4xl font-bold mb-4" />
                    <p className="text-lg" style={{ color: 'var(--color-text-secondary)' }}>Join thousands of data-driven investors.</p>
                </div>
            </div>

            <div className="flex-1 flex items-center justify-center p-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
                    <h1 className="text-h1 mb-2">Create your account</h1>
                    <p className="text-body mb-8" style={{ color: 'var(--color-text-secondary)' }}>Start your intelligent investing journey</p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-caption block mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Full Name</label>
                            <div className="relative">
                                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
                                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex Thompson" className="input-field pl-10" />
                            </div>
                        </div>
                        <div>
                            <label className="text-caption block mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Email</label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
                                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="input-field pl-10" />
                            </div>
                        </div>
                        <div>
                            <label className="text-caption block mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Password</label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
                                <input type={showPwd ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" className="input-field pl-10 pr-10" />
                                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }}>
                                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {password.length > 0 && (
                                <div className="mt-2 flex items-center gap-2">
                                    <div className="flex-1 flex gap-1">
                                        {[1, 2, 3].map((level) => (
                                            <div key={level} className="h-1 flex-1 rounded-full transition-colors duration-300"
                                                style={{ background: pwdStrength >= level ? strengthColors[pwdStrength] : 'var(--color-bg-tertiary)' }}
                                            />
                                        ))}
                                    </div>
                                    <span className="text-[10px] font-medium" style={{ color: strengthColors[pwdStrength] }}>{strengthLabels[pwdStrength]}</span>
                                </div>
                            )}
                        </div>

                        <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2">
                            {loading ? 'Creating account...' : 'Create Account'}
                        </button>
                    </form>

                    <p className="text-center mt-6 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                        Already have an account? <Link to="/login" className="font-medium" style={{ color: 'var(--color-accent-teal)' }}>Sign in</Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
