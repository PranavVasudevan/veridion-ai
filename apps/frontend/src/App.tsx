import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './state/auth.store';
import AppShell from './components/layout/AppShell';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Portfolio from './pages/Portfolio';
import RiskAnalysis from './pages/RiskAnalysis';
import Goals from './pages/Goals';
import BehavioralInsights from './pages/BehavioralInsights';
import EventInsights from './pages/EventInsights';
import SimulationLab from './pages/SimulationLab';
import Alerts from './pages/Alerts';
import AuditLog from './pages/AuditLog';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import { ROUTES } from './utils/constants';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const token = useAuthStore((s) => s.token);
    if (!token) return <Navigate to="/login" replace />;
    return <>{children}</>;
}

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Public */}
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/onboarding" element={<Onboarding />} />

                {/* Protected App */}
                <Route
                    element={
                        <ProtectedRoute>
                            <AppShell />
                        </ProtectedRoute>
                    }
                >
                    <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
                    <Route path={ROUTES.PORTFOLIO} element={<Portfolio />} />
                    <Route path={ROUTES.RISK} element={<RiskAnalysis />} />
                    <Route path={ROUTES.GOALS} element={<Goals />} />
                    <Route path={ROUTES.BEHAVIORAL} element={<BehavioralInsights />} />
                    <Route path={ROUTES.EVENTS} element={<EventInsights />} />
                    <Route path={ROUTES.SIMULATION} element={<SimulationLab />} />
                    <Route path={ROUTES.ALERTS} element={<Alerts />} />
                    <Route path={ROUTES.AUDIT} element={<AuditLog />} />
                    <Route path={ROUTES.PROFILE} element={<Profile />} />
                    <Route path={ROUTES.SETTINGS} element={<Settings />} />
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}
