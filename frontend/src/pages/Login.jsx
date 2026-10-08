import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Input from '../components/Input';
import { BarChart3, Leaf, LogIn, Milk, ShieldCheck } from 'lucide-react';

const schema = z.object({
    phone_number: z.string().min(10, "Invalid phone number"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

const Login = () => {
    const { t } = useTranslation();
    const { login } = useAuth();
    const navigate = useNavigate();
    const [serverError, setServerError] = useState('');
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
        resolver: zodResolver(schema)
    });

    const onSubmit = async (data) => {
        setServerError('');
        try {
            await login(data.phone_number, data.password);
            navigate('/dashboard');
        } catch (error) {
            setServerError(error.response?.data?.detail || 'Login failed. Check your phone number and password.');
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
                        <p className="text-xs font-bold uppercase tracking-wider text-emerald-300">Dairy farm operations</p>
                        <h1 className="font-heading text-4xl lg:text-5xl font-bold leading-tight tracking-tight text-white">
                            Manage production, herd care, and cash flow.
                        </h1>
                        <p className="text-base leading-relaxed text-emerald-100/90 font-normal">
                            A calm workspace for farmers who need reliable records, timely alerts, and personalised AI guidance without the clutter.
                        </p>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-xs text-emerald-100">
                        <div className="rounded-xl border border-white/15 bg-white/10 p-3.5 backdrop-blur-lg flex flex-col gap-1.5">
                            <Milk size={20} className="text-emerald-300" />
                            <strong className="text-white text-xs">Milk Ledger</strong>
                            <span className="text-[11px] text-emerald-200/80">Usage records</span>
                        </div>
                        <div className="rounded-xl border border-white/15 bg-white/10 p-3.5 backdrop-blur-lg flex flex-col gap-1.5">
                            <BarChart3 size={20} className="text-emerald-300" />
                            <strong className="text-white text-xs">Insights</strong>
                            <span className="text-[11px] text-emerald-200/80">Yield trends</span>
                        </div>
                        <div className="rounded-xl border border-white/15 bg-white/10 p-3.5 backdrop-blur-lg flex flex-col gap-1.5">
                            <ShieldCheck size={20} className="text-emerald-300" />
                            <strong className="text-white text-xs">Herd Care</strong>
                            <span className="text-[11px] text-emerald-200/80">Health alerts</span>
                        </div>
                    </div>
                </section>

                {/* Glassmorphic Form Container */}
                <div className="flex items-center justify-center rounded-[1.75rem] border border-white/40 bg-white/90 p-6 sm:p-10 shadow-xl backdrop-blur-xl">
                    <div className="w-full max-w-md">
                        <div className="mb-6">
                            <div className="mb-4 flex items-center gap-3 md:hidden">
                                <div className="inline-flex rounded-xl bg-emerald-100 p-2.5 text-emerald-700">
                                    <Leaf size={22} />
                                </div>
                                <div>
                                    <p className="font-heading text-lg font-bold text-slate-900">Arvion</p>
                                    <p className="text-xs text-slate-500">Dairy Operations Platform</p>
                                </div>
                            </div>
                            <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Welcome Back</p>
                            <h2 className="mt-1 font-heading text-3xl font-extrabold text-slate-900 tracking-tight">{t('login')}</h2>
                            <p className="mt-1.5 text-sm text-slate-600">Use your registered phone number and password to continue.</p>
                        </div>

                        {serverError && (
                            <div className="mb-5 rounded-xl border border-red-200/80 bg-red-50/90 p-3.5 text-sm text-red-700 backdrop-blur-sm">
                                {serverError}
                            </div>
                        )}

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <Input 
                                label={t('phone_number')} 
                                type="tel" 
                                placeholder="+254712345678" 
                                {...register('phone_number')} 
                                error={errors.phone_number} 
                            />
                            <Input 
                                label={t('password')} 
                                type="password" 
                                placeholder="••••••••"
                                {...register('password')} 
                                error={errors.password} 
                            />
                            <button 
                                type="submit" 
                                disabled={isSubmitting}
                                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3.5 font-bold text-white shadow-lg shadow-emerald-900/20 transition-all hover:from-emerald-700 hover:to-teal-700 hover:shadow-xl hover:shadow-emerald-900/30 active:scale-[0.99] disabled:opacity-70"
                            >
                                <LogIn size={18} /> {isSubmitting ? 'Signing in...' : t('login')}
                            </button>
                        </form>

                        <p className="mt-6 text-center text-sm text-slate-600">
                            Don't have an account?{' '}
                            <Link to="/register" className="font-bold text-emerald-700 hover:text-emerald-900 underline underline-offset-4 decoration-emerald-500/30 transition-colors">
                                {t('register')}
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
