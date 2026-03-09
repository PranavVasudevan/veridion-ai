import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, DollarSign, PieChart, Shield, Target, Droplets, Zap, ChevronLeft, ChevronRight } from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';
import AnimatedGauge from '../components/ui/AnimatedGauge';
import BlurText from '../components/reactbits/BlurText';
import CountUp from '../components/reactbits/CountUp';
import DecryptedText from '../components/reactbits/DecryptedText';
import StarBorder from '../components/reactbits/StarBorder';
import { userService } from '../services/user.service';
import { useUIStore } from '../state/ui.store';
import api from '../services/api';

const steps = [
    { icon: User, title: 'Basic Information' },
    { icon: DollarSign, title: 'Financial Snapshot' },
    { icon: PieChart, title: 'Spending Pattern' },
    { icon: Shield, title: 'Risk Tolerance' },
    { icon: Zap, title: 'Your Risk Profile' },
];

const riskQuestions = [
    { q: 'If your portfolio dropped 20% in a month, you would:', options: ['Sell everything immediately', 'Sell some to limit losses', 'Hold and wait for recovery', 'Buy more at lower prices'] },
    { q: 'Your primary investment priority is:', options: ['Preserving capital', 'Steady income', 'Balanced growth', 'Maximum growth'] },
    { q: 'How long can you invest without needing the money?', options: ['Less than 2 years', '2-5 years', '5-10 years', 'More than 10 years'] },
    { q: 'How do you feel about market volatility?', options: ['Very uncomfortable', 'Somewhat uncomfortable', 'Neutral', 'Comfortable — opportunities'] },
    { q: 'What percentage of savings are you investing?', options: ['Less than 10%', '10-25%', '25-50%', 'More than 50%'] },
];


const horizonMap: Record<number, number> = { 0: 2, 1: 5, 2: 8, 3: 15 };

export default function Onboarding() {
    const navigate = useNavigate();
    const addToast = useUIStore((s) => s.addToast);
    const [step, setStep] = useState(0);
    const [saving, setSaving] = useState(false);

    // Form state
    const [name, setName] = useState('');
    const [occupation, setOccupation] = useState('');
    const [dob, setDob] = useState('');
    const [country, setCountry] = useState('United States');
    const currencyMap: Record<string, string> = {
    "United States": "$",
    "India": "₹",
    "United Kingdom": "£",
    "Canada": "$",
    "Australia": "$",
    "Germany": "€",
    "France": "€",
    "Japan": "¥",
    "Singapore": "S$",
    "UAE": "د.إ"
};
const currencySymbol = currencyMap[country] || "$";
    const [annualIncome, setAnnualIncome] = useState('');
    const [totalSavings, setTotalSavings] = useState('');
    const [totalDebt, setTotalDebt] = useState('');
    const [monthlyExpenses, setMonthlyExpenses] = useState(0);
    const [spending, setSpending] = useState<Record<string, number>>({});
    const [riskAnswers, setRiskAnswers] = useState<number[]>(Array(5).fill(-1));

    const riskScore = Math.round(riskAnswers.filter(a => a >= 0).reduce((sum, a) => sum + (a + 1) * 20, 0) / Math.max(riskAnswers.filter(a => a >= 0).length, 1));
    const riskTolerance = riskScore / 100; // 0-1 scale

    const totalSpending = Object.values(spending).reduce((s, v) => s + v, 0);

    // Determine horizon from risk answers
    const horizonAnswer = riskAnswers[2] >= 0 ? riskAnswers[2] : 2;
    const investmentHorizon = horizonMap[horizonAnswer] || 10;

    const saveAndFinish = async () => {
        setSaving(true);
        try {
            const payload = {
                name: name || undefined,
                occupation: occupation || undefined,
                annualIncome: parseFloat(annualIncome) || 0,
                totalSavings: parseFloat(totalSavings) || 0,
                totalDebt: parseFloat(totalDebt) || 0,
                monthlyExpenses: totalSpending || monthlyExpenses,
                riskTolerance,
                investmentHorizon,
                country,
                dateOfBirth: dob || undefined,
            };
            await userService.updateProfile(payload);
            // Seed sample portfolio data so Dashboard/Portfolio aren't empty
            try {
                await api.post('/portfolio/seed');
            } catch {
                // Non-critical — dashboard will just be empty
            }
            addToast({ type: 'success', title: 'Profile Complete', message: 'Your investment profile has been saved!' });
            navigate('/dashboard', { replace: true });
        } catch {
            addToast({ type: 'error', title: 'Save Failed', message: 'Could not save profile. Please try again.' });
        } finally {
            setSaving(false);
        }
    };

    const next = () => {
        if (step < 4) {
            setStep(step + 1);
        } else {
            saveAndFinish();
        }
    };
    const prev = () => step > 0 && setStep(step - 1);

    const slideVariants = {
        enter: { x: 50, opacity: 0 },
        center: { x: 0, opacity: 1 },
        exit: { x: -50, opacity: 0 },
    };



    return (
        <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-bg-primary)' }}>
            {/* Progress */}
            <div className="sticky top-0 z-10 px-6 py-4 backdrop-blur-xl" style={{ background: 'var(--color-bg-card)' }}>
                <div className="max-w-2xl mx-auto">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-caption" style={{ color: 'var(--color-text-muted)' }}>Step {step + 1} of 5</span>
                        <span className="text-caption" style={{ color: 'var(--color-text-muted)' }}>{steps[step].title}</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-bg-tertiary)' }}>
                        <motion.div className="h-full rounded-full" style={{ background: 'var(--gradient-accent)' }} animate={{ width: `${((step + 1) / 5) * 100}%` }} transition={{ duration: 0.4 }} />
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex items-center justify-center p-6">
                <div className="w-full max-w-2xl">
                    <AnimatePresence mode="wait">
                        <motion.div key={step} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
                            {/* Step 0: Basic Info */}
                            {step === 0 && (
                                <GlassCard>
                                    <BlurText text="Let's get to know you" className="text-h2 mb-6" />
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-caption block mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Full Name</label>
                                            <input className="input-field" placeholder="Alex Thompson" value={name} onChange={e => setName(e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="text-caption block mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Date of Birth</label>
                                            <input type="date" className="input-field" value={dob} onChange={e => setDob(e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="text-caption block mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Country</label>
                                            <select className="input-field" value={country} onChange={e => setCountry(e.target.value)}>
<option>United States</option>
<option>India</option>
<option>United Kingdom</option>
<option>Canada</option>
<option>Australia</option>
<option>Germany</option>
<option>France</option>
<option>Japan</option>
<option>Singapore</option>
<option>UAE</option>
<option>Other</option>
</select>
                                        </div>
                                    </div>
                                    <div>
<label className="text-caption block mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
Occupation
</label>

<input
className="input-field"
placeholder="Software Engineer"
value={occupation}
onChange={(e) => setOccupation(e.target.value)}
/>

</div>
                                </GlassCard>
                            )}

                            {/* Step 1: Financial */}
                            {step === 1 && (
                                <GlassCard>
                                    <BlurText text="Your financial snapshot" className="text-h2 mb-6" />
                                    <div className="space-y-6">
                                        <div>
                                            <label className="text-caption block mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Annual Income</label>
                                            <input
className="input-field"
placeholder={`${currencySymbol} 85000`}
type="number"
value={annualIncome}
onChange={e => setAnnualIncome(e.target.value)}
/>
                                        </div>
                                        <div>
                                            <label className="text-caption block mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Total Savings</label>
<input
className="input-field"
placeholder={`${currencySymbol} 50000`}
type="number"
value={totalSavings}
onChange={e => setTotalSavings(e.target.value)}
/>                                        </div>
                                        <div>
                                            <label className="text-caption block mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Total Debt</label>
<input
className="input-field"
placeholder={`${currencySymbol} 12000`}
type="number"
value={totalDebt}
onChange={e => setTotalDebt(e.target.value)}
/>                                        </div>
                                    </div>
                                </GlassCard>
                            )}
                            {/* Step 2: Spending */}
                            {step === 2 && (
                                <GlassCard>
                                    <BlurText text="Spending patterns" className="text-h2 mb-6" />
                                    <div className="grid grid-cols-2 gap-3">
                                        {['Housing', 'Transportation', 'Food', 'Entertainment', 'Health', 'Other'].map((cat) => (
                                            <div key={cat} className="p-4 rounded-xl border cursor-pointer hover:border-accent-teal transition-colors" style={{ background: 'var(--color-bg-tertiary)', borderColor: 'var(--color-border)' }}>
                                                <p className="text-sm font-medium mb-2">{cat}</p>
                                                <input className="input-field py-2 text-sm" placeholder={`${currencySymbol}/month`} type="number"
                                                    value={spending[cat] || ''} onChange={e => setSpending(prev => ({ ...prev, [cat]: parseFloat(e.target.value) || 0 }))} />
                                            </div>
                                        ))}
                                    </div>
                                    {totalSpending > 0 && (
                                        <p className="mt-4 text-sm font-medium" style={{ color: 'var(--color-accent-teal)' }}>
Total monthly expenses: {currencySymbol}{totalSpending.toLocaleString()}                                        </p>
                                    )}
                                </GlassCard>
                            )}

                            {/* Step 3: Risk */}
                            {step === 3 && (
                                <GlassCard>
                                    <BlurText text="Risk tolerance" className="text-h2 mb-6" />
                                    <div className="space-y-6">
                                        {riskQuestions.map((rq, qi) => (
                                            <div key={qi}>
                                                <p className="text-sm font-medium mb-3">{rq.q}</p>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                    {rq.options.map((opt, oi) => (
                                                        <motion.button
                                                            key={oi}
                                                            onClick={() => { const a = [...riskAnswers]; a[qi] = oi; setRiskAnswers(a); }}
                                                            className="p-3 rounded-xl text-sm text-left border transition-all"
                                                            style={{
                                                                background: riskAnswers[qi] === oi ? 'var(--color-accent-teal-dim)' : 'var(--color-bg-tertiary)',
                                                                borderColor: riskAnswers[qi] === oi ? 'var(--color-accent-teal)' : 'var(--color-border)',
                                                                color: 'var(--color-text-primary)',
                                                            }}
                                                            whileTap={{ scale: 0.98 }}
                                                        >
                                                            {opt}
                                                        </motion.button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-8 text-center">

<p className="text-sm mb-3" style={{ color: 'var(--color-text-secondary)' }}>
Your current risk profile
</p>

<AnimatedGauge
value={riskScore || 50}
size={140}
strokeWidth={10}
/>

<div className="mt-2 text-sm font-medium">
{riskScore >= 70
? "Growth-Oriented"
: riskScore >= 40
? "Balanced"
: "Conservative"}
</div>

</div>
                                </GlassCard>
                            )}




                            {/* Step 6: Risk Score */}
                            {step === 4 && (
                                <GlassCard className="text-center">
                                    <BlurText text="Your Risk Profile" className="text-h2 mb-8 justify-center" />
                                    <AnimatedGauge
value={riskScore || 50}
size={140}
strokeWidth={10}
color={
riskScore >= 70
? "#22c55e"
: riskScore >= 40
? "#f59e0b"
: "#ef4444"
}
/>
                                    <div className="mt-6">
                                        <CountUp end={riskScore || 72} className="text-metric" />
                                        <span className="text-metric" style={{ color: 'var(--color-text-muted)' }}>/100</span>
                                    </div>
                                    <div className="mt-4">
                                        <DecryptedText text={riskScore >= 70 ? 'Growth-Oriented Investor' : riskScore >= 40 ? 'Balanced Investor' : 'Conservative Investor'} className="text-lg font-semibold" />
                                    </div>
                                    <p className="mt-4 text-body" style={{ color: 'var(--color-text-secondary)' }}>
                                        Your profile will guide portfolio optimization and risk management.
                                    </p>
                                </GlassCard>
                            )}
                        </motion.div>
                    </AnimatePresence>

                    {/* Navigation */}
                    <div className="flex justify-between mt-8">
                        <button onClick={prev} disabled={step === 0} className="btn-ghost" style={{ opacity: step === 0 ? 0.3 : 1 }}>
                            <ChevronLeft size={16} /> Back
                        </button>
                        <button onClick={next} disabled={saving} className="btn-primary">
                            {step === 4 ? (saving ? 'Saving...' : 'Launch Dashboard') : 'Continue'} <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
