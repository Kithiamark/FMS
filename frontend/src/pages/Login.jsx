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
    const { register, handleSubmit, formState: { errors } } = useForm({
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
        <div className="min-h-screen bg-[#f4f7f3] px-4 py-6 md:grid md:grid-cols-[1.12fr_0.88fr] md:gap-6 md:px-6">
            <section
                className="relative hidden min-h-[calc(100vh-3rem)] overflow-hidden rounded-[1.75rem] bg-cover bg-center p-10 text-white shadow-2xl shadow-emerald-950/10 md:flex md:flex-col md:justify-between"
                style={{ backgroundImage: "linear-gradient(90deg, rgba(6, 50, 31, 0.94), rgba(6, 50, 31, 0.52)), url('https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=1500&q=80')" }}
            >
                <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-white p-3 text-emerald-700"><Leaf size={26} /></div>
                    <div>
                        <span className="block font-heading text-2xl font-bold">Arvion</span>
                        <span className="text-sm text-emerald-100">Dairy operations platform</span>
                    </div>
                </div>
                <div className="max-w-lg">
                    <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-emerald-100">Dairy farm operations</p>
                    <h1 className="font-heading text-5xl font-bold leading-tight">Manage production, herd care, and cash flow with confidence.</h1>
                    <p className="mt-5 text-lg leading-8 text-emerald-50">A calm workspace for farmers who need useful records, timely alerts, and personalised AI guidance without the clutter.</p>
                </div>
                <div className="grid grid-cols-3 gap-3 text-sm text-emerald-50">
                    <div className="rounded-2xl border border-white/15 bg-white/12 p-4 backdrop-blur"><Milk className="mb-3" size={22} /><strong className="block text-white">Milk</strong>Usage ledger</div>
                    <div className="rounded-2xl border border-white/15 bg-white/12 p-4 backdrop-blur"><BarChart3 className="mb-3" size={22} /><strong className="block text-white">Insights</strong>Production trends</div>
                    <div className="rounded-2xl border border-white/15 bg-white/12 p-4 backdrop-blur"><ShieldCheck className="mb-3" size={22} /><strong className="block text-white">Care</strong>Health alerts</div>
                </div>
            </section>
            <div className="flex min-h-[calc(100vh-3rem)] items-center justify-center">
                <div className="w-full max-w-md rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70 sm:p-8">
                    <div className="mb-8">
                        <div className="mb-5 flex items-center gap-3 md:hidden">
                            <div className="inline-flex rounded-xl bg-emerald-50 p-3 text-emerald-700"><Leaf size={24} /></div>
                            <div>
                                <p className="font-heading text-xl font-bold text-slate-950">Arvion</p>
                                <p className="text-xs font-medium text-slate-500">Dairy operations</p>
                            </div>
                        </div>
                        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Welcome back</p>
                        <h2 className="mt-2 font-heading text-3xl font-bold text-slate-950">{t('login')}</h2>
                        <p className="mt-2 text-sm text-slate-500">Use your registered phone number to continue.</p>
                    </div>
                    {serverError && (
                        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                            {serverError}
                        </div>
                    )}
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-1">
                    <Input 
                        label={t('phone_number')} 
                        type="tel" 
                        placeholder="+254..." 
                        {...register('phone_number')} 
                        error={errors.phone_number} 
                    />
                    <Input 
                        label={t('password')} 
                        type="password" 
                        {...register('password')} 
                        error={errors.password} 
                    />
                    <button type="submit" className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 py-3 font-bold text-white shadow-sm transition hover:bg-emerald-800">
                        <LogIn size={18} /> {t('login')}
                    </button>
                </form>
                <p className="mt-6 text-center text-sm text-slate-600">
                    Don't have an account? <Link to="/register" className="font-bold text-emerald-700 hover:text-emerald-900">{t('register')}</Link>
                </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
