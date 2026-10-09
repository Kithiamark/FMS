import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, ArrowRight, Lock, CheckCircle2, AlertCircle, KeyRound, Sparkles, Eye, EyeOff } from 'lucide-react';
import api, { setAuthToken } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { normalizeKenyanPhone } from '../utils/phone';

const OTPVerification = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const { refreshUser } = useAuth();

    const [phoneNumber, setPhoneNumber] = useState(
        location.state?.phone_number ? normalizeKenyanPhone(location.state.phone_number) : ''
    );
    const [otp, setOtp] = useState(location.state?.test_otp || location.state?.test_mode_otp || '');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [indemnityAgreed, setIndemnityAgreed] = useState(false);
    
    const [step, setStep] = useState(1); // 1: Verify OTP, 2: Set Password & Accept Indemnity
    const [timer, setTimer] = useState(60);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setTimer((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const handleResend = async () => {
        const normalized = normalizeKenyanPhone(phoneNumber);
        if (!normalized) {
            setErrorMsg('Please provide a valid Kenyan phone number (e.g. 712 345 678)');
            return;
        }
        setErrorMsg('');
        setSuccessMsg('');
        setTimer(60);
        try {
            const res = await api.post('/auth/request-otp/', { phone_number: normalized });
            if (res.data?.test_mode_otp) {
                setOtp(res.data.test_mode_otp);
                setSuccessMsg(`Test OTP code generated: ${res.data.test_mode_otp}`);
            } else {
                setSuccessMsg('A new verification code has been dispatched.');
            }
        } catch (err) {
            const data = err.response?.data;
            setErrorMsg(
                data?.phone_number?.[0] || data?.error || data?.detail || 'Failed to request new code.'
            );
        }
    };

    const handleProceedToStep2 = (e) => {
        e.preventDefault();
        setErrorMsg('');
        setSuccessMsg('');
        const normalized = normalizeKenyanPhone(phoneNumber);
        if (!normalized) {
            setErrorMsg('Phone number is required.');
            return;
        }
        if (!otp || otp.trim().length !== 6) {
            setErrorMsg('Please enter a valid 6-digit verification code.');
            return;
        }
        setStep(2);
    };

    const handleCompleteVerification = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        setSuccessMsg('');

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
                phone_number: normalizeKenyanPhone(phoneNumber),
                otp: otp.trim(),
                password: password,
                indemnity_agreed: true
            };

            const response = await api.post('/auth/verify-otp/', payload);
            const { access, refresh } = response.data;

            if (access) {
                localStorage.setItem('access_token', access);
                localStorage.setItem('refresh_token', refresh);
                setAuthToken(access);
                const user = await refreshUser();
                if (user?.role === 'ADMIN') {
                    navigate('/admin/dashboard');
                } else if (user?.role === 'VETERINARIAN') {
                    navigate('/vet/dashboard');
                } else if (user?.role === 'AGGREGATOR') {
                    navigate('/aggregator/dashboard');
                } else {
                    navigate('/dashboard');
                }
            } else {
                navigate('/login');
            }
        } catch (err) {
            const errData = err.response?.data;
            setErrorMsg(
                errData?.error || 
                errData?.detail || 
                (errData?.otp ? (Array.isArray(errData.otp) ? errData.otp.join(' ') : errData.otp) : null) ||
                (errData?.phone_number ? (Array.isArray(errData.phone_number) ? errData.phone_number.join(' ') : errData.phone_number) : null) ||
                'Verification failed. Please check your code.'
            );
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

                {successMsg && (
                    <div className="mb-5 rounded-xl border border-emerald-200/90 bg-emerald-50/90 p-3.5 text-sm text-emerald-800 flex items-start gap-2.5 backdrop-blur-sm">
                        <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-emerald-600" />
                        <span className="leading-snug">{successMsg}</span>
                    </div>
                )}

                {step === 1 && (
                    <form onSubmit={handleProceedToStep2} className="space-y-5">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Phone Number</label>
                            <div className="flex w-full items-stretch rounded-xl border border-slate-200 bg-white/70 shadow-inner focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500 overflow-hidden">
                                <span className="inline-flex items-center px-3.5 border-r border-slate-200 bg-slate-50/80 text-slate-700 font-semibold text-sm select-none">
                                    +254
                                </span>
                                <input
                                    required
                                    type="tel"
                                    value={phoneNumber ? (phoneNumber.startsWith('+254') ? phoneNumber.slice(4) : phoneNumber) : ''}
                                    onChange={(e) => {
                                        const raw = e.target.value.replace(/[^0-9]/g, '');
                                        if (!raw) {
                                            setPhoneNumber('');
                                        } else {
                                            setPhoneNumber(normalizeKenyanPhone(raw));
                                        }
                                    }}
                                    placeholder="712 345 678"
                                    className="flex-1 min-w-0 bg-transparent px-4 py-3 text-slate-900 focus:outline-none text-sm"
                                />
                            </div>
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
                            <div className="relative flex items-center">
                                <input
                                    required
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter minimum 6 characters"
                                    className="w-full rounded-xl border border-slate-200 bg-white/70 pl-4 pr-11 py-3 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition shadow-inner text-sm"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 p-1 text-slate-400 hover:text-slate-600 focus:outline-none"
                                    tabIndex={-1}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                Confirm Password <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative flex items-center">
                                <input
                                    required
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Re-type your password"
                                    className="w-full rounded-xl border border-slate-200 bg-white/70 pl-4 pr-11 py-3 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition shadow-inner text-sm"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3.5 p-1 text-slate-400 hover:text-slate-600 focus:outline-none"
                                    tabIndex={-1}
                                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                >
                                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
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
