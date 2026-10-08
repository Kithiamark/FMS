import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, ArrowRight, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
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

        if (password && password.length < 6) {
            setErrorMsg('Password must be at least 6 characters.');
            return;
        }

        if (password && password !== confirmPassword) {
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
                indemnity_agreed: true
            };
            if (password) {
                payload.password = password;
            }

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
            setErrorMsg(errData?.error || errData?.detail || 'Verification failed. Please check the code.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#EEF4EC] p-4">
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl w-full max-w-lg border border-slate-200">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-emerald-50 rounded-xl text-emerald-700">
                        <ShieldCheck size={28} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold font-heading text-slate-900">{t('otp_verify')}</h2>
                        <p className="text-xs text-slate-500">Security Verification & Regulatory Onboarding</p>
                    </div>
                </div>

                {errorMsg && (
                    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 flex items-start gap-2">
                        <AlertCircle size={18} className="shrink-0 mt-0.5" />
                        <span>{errorMsg}</span>
                    </div>
                )}

                {step === 1 && (
                    <form onSubmit={handleProceedToStep2} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                            <input
                                required
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                placeholder="+2547..."
                                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">6-Digit Verification Code</label>
                            <input
                                required
                                maxLength={6}
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.trim())}
                                placeholder="123456"
                                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-center font-mono text-2xl tracking-widest text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                            <p className="mt-1.5 text-xs text-slate-500">
                                Active verification codes are also displayed on the platform Admin Dashboard.
                            </p>
                        </div>

                        <Button type="submit" className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2">
                            <span>Verify Code & Continue</span>
                            <ArrowRight size={18} />
                        </Button>

                        <div className="text-center pt-2">
                            {timer > 0 ? (
                                <p className="text-xs text-slate-500">Resend code in {timer}s</p>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleResend}
                                    className="text-xs font-bold text-emerald-700 hover:underline"
                                >
                                    {t('resend_otp')}
                                </button>
                            )}
                        </div>
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={handleCompleteVerification} className="space-y-4">
                        <div className="rounded-xl bg-emerald-50/80 border border-emerald-200 p-3 text-xs text-emerald-800 flex items-center gap-2">
                            <CheckCircle2 size={16} className="text-emerald-700 shrink-0" />
                            <span>Verification code accepted for <strong>{phoneNumber}</strong></span>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Account Password (Optional to update)</label>
                            <div className="relative">
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Leave blank to keep existing password"
                                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                                <Lock size={16} className="absolute right-3.5 top-3.5 text-slate-400" />
                            </div>
                        </div>

                        {password && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm new password"
                                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                        )}

                        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs">
                            <p className="font-bold text-amber-900 mb-1">Farm Management & Advisory Indemnity Agreement</p>
                            <p className="text-amber-800 leading-relaxed mb-3">
                                By joining the platform, you acknowledge that all AI veterinary recommendations, lactation projections, financial calculations, and aggregator matching features are provided strictly as agricultural management aids. Decisions regarding clinical livestock treatments, culling, and commercial contracts remain the sole responsibility of the farm operator.
                            </p>
                            <label className="flex items-start gap-2.5 font-bold text-slate-900 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={indemnityAgreed}
                                    onChange={(e) => setIndemnityAgreed(e.target.checked)}
                                    className="h-4 w-4 mt-0.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                />
                                <span className="leading-tight">I have read, understood, and accept the Farm Management & Advisory Indemnity Agreement</span>
                            </label>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button type="button" variant="ghost" onClick={() => setStep(1)} className="flex-1">
                                Back
                            </Button>
                            <Button type="submit" disabled={loading} className="flex-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3 rounded-xl">
                                {loading ? 'Finalizing...' : 'Complete & Enter Farm'}
                            </Button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default OTPVerification;
