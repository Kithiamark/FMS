import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, ArrowRight, Lock, CheckCircle2, AlertCircle, KeyRound, Sparkles } from 'lucide-react';
import api, { setAuthToken } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';

const OTPVerification = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const { refreshUser } = useAuth();

    const [phoneNumber, setPhoneNumber] = useState(location.state?.phone_number || '');
    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [indemnityAgreed, setIndemnityAgreed] = useState(false);
    
    const [step, setStep] = useState(1); // 1: Verify OTP, 2: Set Password & Accept Indemnity
    const [timer, setTimer] = useState(60);
    const [errorMsg, setErrorMsg] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setTimer((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const handleResend = async () => {
        if (!phoneNumber) {
            setErrorMsg('Please provide a valid phone number');
            return;
        }
        setErrorMsg('');
        setTimer(60);
        try {
            await api.post('/auth/request-otp/', { phone_number: phoneNumber });
        } catch (err) {
            setErrorMsg(err.response?.data?.phone_number?.[0] || 'Failed to request new code.');
        }
    };

    const handleProceedToStep2 = (e) => {
        e.preventDefault();
        setErrorMsg('');
        if (!phoneNumber) {
            setErrorMsg('Phone number is required.');
            return;
        }
        if (!otp || otp.length !== 6) {
            setErrorMsg('Please enter a valid 6-digit verification code.');
            return;
        }
        setStep(2);
    };

    const handleCompleteVerification = async (e) => {
        e.preventDefault();
        setErrorMsg('');

        if (!password || password.length < 6) {
            setErrorMsg('Password must be at least 6 characters.');
            return;
        }

        if (password !== confirmPassword) {
            setErrorMsg('Passwords do not match.');
            return;
        }

        if (!indemnityAgreed) {
            setErrorMsg('You must accept the Farm Management & Advisory Indemnity Agreement to proceed.');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                phone_number: phoneNumber,
                otp: otp,
                password: password,
                indemnity_agreed: true
            };

            const response = await api.post('/auth/verify-otp/', payload);
            const { access, refresh } = response.data;

            if (access) {
                localStorage.setItem('access_token', access);
                localStorage.setItem('refresh_token', refresh);
                setAuthToken(access);
                await refreshUser();
                navigate('/dashboard');
            } else {
                navigate('/login');
            }
        } catch (err) {
            const errData = err.response?.data;
            setErrorMsg(errData?.error || errData?.detail || 'Verification failed. Please check your code.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen bg-gradient-to-br from-emerald-950 via-[#0a2318] to-slate-950 px-4 py-8 flex items-center justify-center overflow-hidden">
            {/* Ambient Glassmorphic Background Orbs */}
            <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-teal-500/20 blur-3xl" />
            <div className="pointer-events-none absolute top-1/2 left-1/3 h-80 w-80 rounded-full bg-emerald-400/10 blur-3xl" />

            <div className="relative z-10 w-full max-w-lg rounded-[2rem] border border-white/30 bg-white/85 p-6 sm:p-10 backdrop-blur-2xl shadow-2xl shadow-black/40">
                {/* Header with step pill */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-2xl text-emerald-800 shadow-inner">
                            {step === 1 ? <ShieldCheck size={28} /> : <KeyRound size={28} />}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold font-heading text-slate-900 tracking-tight">
                                {step === 1 ? t('otp_verify') : 'Set Account Password'}
                            </h2>
                            <p className="text-xs text-slate-500 font-medium">
                                {step === 1 ? 'Step 1 of 2: Phone Verification' : 'Step 2 of 2: Security & Terms'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className={`h-2.5 w-8 rounded-full transition-all ${step === 1 ? 'bg-emerald-600 shadow-sm' : 'bg-emerald-200'}`} />
                        <div className={`h-2.5 w-8 rounded-full transition-all ${step === 2 ? 'bg-emerald-600 shadow-sm' : 'bg-slate-200'}`} />
                    </div>
                </div>

                {errorMsg && (
                    <div className="mb-5 rounded-xl border border-red-200/90 bg-red-50/90 p-3.5 text-sm text-red-700 flex items-start gap-2.5 backdrop-blur-sm">
                        <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-600" />
                        <span className="leading-snug">{errorMsg}</span>
                    </div>
                )}

                {step === 1 && (
                    <form onSubmit={handleProceedToStep2} className="space-y-5">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Phone Number</label>
                            <input
                                required
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                placeholder="+2547..."
                                className="w-full rounded-xl border border-slate-200 bg-white/70 px-4 py-3 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition shadow-inner"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">6-Digit Verification Code</label>
                            <input
                                required
                                maxLength={6}
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.trim())}
                                placeholder="······"
                                className="w-full rounded-xl border border-slate-200 bg-white/70 px-4 py-3.5 text-center font-mono text-3xl tracking-[0.5em] text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition shadow-inner font-bold"
                            />
                            <p className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
                                <Sparkles size={14} className="text-emerald-600 shrink-0" />
                                <span>Verification codes are sent via SMS and visible on the Admin Dashboard.</span>
                            </p>
                        </div>

                        <button 
                            type="submit" 
                            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/25 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
                        >
                            <span>Verify Code & Set Password</span>
                            <ArrowRight size={18} />
                        </button>

                        <div className="text-center pt-1">
                            {timer > 0 ? (
                                <p className="text-xs text-slate-500 font-medium">Resend new code in <span className="font-mono font-bold text-slate-700">{timer}s</span></p>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleResend}
                                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline transition"
                                >
                                    {t('resend_otp')}
                                </button>
                            )}
                        </div>
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={handleCompleteVerification} className="space-y-4">
                        <div className="rounded-xl bg-emerald-50/90 border border-emerald-200/80 p-3 text-xs text-emerald-900 flex items-center gap-2.5 backdrop-blur-sm">
                            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                            <span>Verification code verified for <strong className="font-mono">{phoneNumber}</strong></span>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                Create Account Password <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    required
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter minimum 6 characters"
                                    className="w-full rounded-xl border border-slate-200 bg-white/70 px-4 py-3 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition shadow-inner"
                                />
                                <Lock size={18} className="absolute right-3.5 top-3.5 text-slate-400" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                Confirm Password <span className="text-rose-500">*</span>
                            </label>
                            <input
                                required
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Re-type your password"
                                className="w-full rounded-xl border border-slate-200 bg-white/70 px-4 py-3 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition shadow-inner"
                            />
                        </div>

                        <div className="rounded-xl border border-amber-200/90 bg-amber-50/80 p-4 text-xs backdrop-blur-sm">
                            <p className="font-bold text-amber-950 mb-1 flex items-center gap-1.5">
                                <span>Regulatory & Advisory Indemnity</span>
                            </p>
                            <p className="text-amber-900/90 leading-relaxed mb-3">
                                Platform recommendations, AI veterinary assists, milk estimates, and aggregator matchmaking are advisory tools. Clinical livestock decisions and commercial trading remain the responsibility of the operator.
                            </p>
                            <label className="flex items-start gap-2.5 font-bold text-slate-900 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={indemnityAgreed}
                                    onChange={(e) => setIndemnityAgreed(e.target.checked)}
                                    className="h-4 w-4 mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                />
                                <span className="leading-snug">I accept the Farm Management & Advisory Indemnity Agreement</span>
                            </label>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button type="button" variant="ghost" onClick={() => setStep(1)} className="flex-1 rounded-xl">
                                Back
                            </Button>
                            <button
                                type="submit" 
                                disabled={loading} 
                                className="flex-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-emerald-900/25 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 flex items-center justify-center gap-2"
                            >
                                <span>{loading ? 'Finalizing Account...' : 'Complete & Enter Farm'}</span>
                                <ArrowRight size={18} />
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default OTPVerification;
