import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Input from '../components/Input';
import { Leaf, ArrowRight, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';
import api from '../api/axios';

const schema = z.object({
    full_name: z.string().min(2, "Name must be at least 2 characters"),
    phone_number: z.string().min(10, "Invalid phone number").startsWith("+254", "Must start with +254 (e.g. +254712345678)"),
});

const Register = () => {
    const { t } = useTranslation();
    const { register: registerUser } = useAuth();
    const navigate = useNavigate();
    const [serverError, setServerError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(schema)
    });

    const onSubmit = async (data) => {
        setServerError('');
        setIsSubmitting(true);
        try {
            await registerUser({
                full_name: data.full_name,
                phone_number: data.phone_number,
            });
            try {
                await api.post('/auth/request-otp/', { phone_number: data.phone_number });
            } catch (otpErr) {
                console.error("Initial OTP trigger error:", otpErr);
            }
            navigate('/otp', { state: { phone_number: data.phone_number } });
        } catch (error) {
            const details = error.response?.data;
            setServerError(
                details 
                    ? (typeof details === 'object' ? Object.values(details).flat().join(' ') : String(details)) 
                    : 'Registration failed. Please check your phone number and details.'
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="relative min-h-screen bg-gradient-to-br from-emerald-950 via-[#0a2318] to-slate-950 px-4 py-8 flex items-center justify-center overflow-hidden">
            {/* Ambient Glassmorphism Glow Spheres */}
            <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-teal-500/20 blur-3xl" />
            <div className="pointer-events-none absolute top-1/2 left-1/4 h-80 w-80 rounded-full bg-emerald-400/10 blur-3xl" />

            <div className="relative z-10 w-full max-w-5xl rounded-[2rem] border border-white/20 bg-white/10 p-2 sm:p-4 backdrop-blur-2xl shadow-2xl shadow-black/50 md:grid md:grid-cols-[1.1fr_0.9fr] md:gap-4 items-stretch">
                {/* Visual Showcase Panel */}
                <section
                    className="relative hidden min-h-[580px] overflow-hidden rounded-[1.75rem] bg-cover bg-center p-8 text-white md:flex md:flex-col md:justify-between border border-white/10 shadow-lg"
                    style={{
                        backgroundImage: "linear-gradient(135deg, rgba(6, 45, 28, 0.92) 0%, rgba(6, 30, 20, 0.75) 100%), url('https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=1500&q=80')"
                    }}
                >
                    <div className="flex items-center gap-3">
                        <div className="rounded-2xl border border-white/20 bg-white/10 p-3 text-emerald-300 backdrop-blur-xl shadow-inner">
                            <Leaf size={26} />
                        </div>
                        <div>
                            <span className="block font-heading text-2xl font-bold tracking-tight">Arvion</span>
                            <span className="text-xs font-medium text-emerald-200">Smart Livestock Ecosystem</span>
                        </div>
                    </div>

                    <div className="space-y-4 max-w-md">
                        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-200 backdrop-blur-md">
                            <Sparkles size={14} className="text-emerald-300" />
                            <span>Quick 2-Step Onboarding</span>
                        </div>
                        <h1 className="font-heading text-4xl lg:text-5xl font-bold leading-tight tracking-tight text-white">
                            Build a resilient farm from day one.
                        </h1>
                        <p className="text-base leading-relaxed text-emerald-100/90 font-normal">
                            Register with your phone number. You will securely set your account password right after verifying your 6-digit OTP code.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs text-emerald-100">
                        <div className="rounded-xl border border-white/15 bg-white/10 p-3.5 backdrop-blur-lg flex items-center gap-2.5">
                            <CheckCircle2 size={18} className="text-emerald-300 shrink-0" />
                            <span>Automated Farm Profile</span>
                        </div>
                        <div className="rounded-xl border border-white/15 bg-white/10 p-3.5 backdrop-blur-lg flex items-center gap-2.5">
                            <ShieldCheck size={18} className="text-emerald-300 shrink-0" />
                            <span>Secure Phone Verification</span>
                        </div>
                    </div>
                </section>

                {/* Glassmorphic Form Container */}
                <div className="flex items-center justify-center rounded-[1.75rem] border border-white/40 bg-white/90 p-6 sm:p-10 shadow-xl backdrop-blur-xl">
                    <div className="w-full max-w-md">
                        <div className="mb-6">
                            <div className="mb-3 flex items-center justify-between">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/80 px-3 py-1 text-xs font-bold text-emerald-800">
                                    Step 1 of 2
                                </span>
                                <span className="text-xs text-slate-500">Phone & Identity</span>
                            </div>
                            <h2 className="font-heading text-3xl font-extrabold text-slate-900 tracking-tight">Create Account</h2>
                            <p className="mt-1.5 text-sm text-slate-600">Enter your details to receive your one-time verification code.</p>
                        </div>

                        {serverError && (
                            <div className="mb-5 rounded-xl border border-red-200/80 bg-red-50/90 p-3.5 text-sm text-red-700 backdrop-blur-sm">
                                {serverError}
                            </div>
                        )}

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div>
                                <Input 
                                    label={t('full_name')} 
                                    placeholder="e.g. Grace Wanjiku"
                                    {...register('full_name')} 
                                    error={errors.full_name} 
                                />
                            </div>

                            <div>
                                <Input 
                                    label={t('phone_number')} 
                                    type="tel" 
                                    placeholder="+254712345678" 
                                    {...register('phone_number')} 
                                    error={errors.phone_number} 
                                />
                                <p className="mt-1 text-xs text-slate-500">Must start with +254 (Kenyan mobile format)</p>
                            </div>

                            {/* Informative Security Notice */}
                            <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/70 p-3.5 text-xs text-emerald-900 backdrop-blur-sm flex items-start gap-2.5">
                                <ShieldCheck size={18} className="text-emerald-700 shrink-0 mt-0.5" />
                                <div>
                                    <strong className="block font-semibold">Password Setup Follows Next</strong>
                                    You will set and confirm your account password on the next step right after entering your OTP code.
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                disabled={isSubmitting}
                                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 py-3.5 font-bold text-white shadow-lg shadow-emerald-900/25 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70"
                            >
                                <span>{isSubmitting ? 'Sending Code...' : 'Send Verification Code'}</span>
                                <ArrowRight size={18} />
                            </button>
                        </form>

                        <p className="mt-6 text-center text-sm text-slate-600">
                            Already registered?{' '}
                            <Link to="/login" className="font-bold text-emerald-700 hover:text-emerald-800 transition">
                                {t('login')}
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
