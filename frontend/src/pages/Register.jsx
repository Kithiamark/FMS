import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Input from '../components/Input';
import { Leaf, UserPlus } from 'lucide-react';

const schema = z.object({
    full_name: z.string().min(2, "Name is too short"),
    phone_number: z.string().min(10, "Invalid phone number").startsWith("+254", "Must start with +254"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirm_password: z.string()
}).refine((data) => data.password === data.confirm_password, {
    message: "Passwords don't match",
    path: ["confirm_password"],
});

const Register = () => {
    const { t } = useTranslation();
    const { register: registerUser } = useAuth();
    const navigate = useNavigate();
    const [serverError, setServerError] = useState('');
    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(schema)
    });

    const onSubmit = async (data) => {
        setServerError('');
        try {
            await registerUser(data);
            navigate('/login');
        } catch (error) {
            const details = error.response?.data;
            setServerError(details ? Object.values(details).flat().join(' ') : 'Registration failed. Please check your details.');
        }
    };

    return (
        <div className="min-h-screen bg-[#eef4ec] px-4 py-8 md:grid md:grid-cols-[0.9fr_1.1fr] md:px-8">
            <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
                <div className="w-full max-w-md rounded-2xl border border-white/70 bg-white p-6 shadow-xl shadow-green-900/10 sm:p-8">
                    <div className="mb-8">
                        <div className="mb-4 inline-flex rounded-xl bg-green-50 p-3 text-forest-green md:hidden"><Leaf size={24} /></div>
                        <h2 className="font-heading text-3xl font-bold text-gray-900">{t('register')}</h2>
                        <p className="mt-2 text-sm text-gray-500">Create your farmer account. Your first farm profile is set up automatically.</p>
                    </div>
                    {serverError && (
                        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                            {serverError}
                        </div>
                    )}
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-1">
                    <Input 
                        label={t('full_name')} 
                        {...register('full_name')} 
                        error={errors.full_name} 
                    />
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
                    <Input 
                        label={t('confirm_password')} 
                        type="password" 
                        {...register('confirm_password')} 
                        error={errors.confirm_password} 
                    />
                    <button type="submit" className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-forest-green py-3 font-bold text-white transition hover:bg-green-mid">
                        <UserPlus size={18} /> {t('register')}
                    </button>
                </form>
                <p className="mt-6 text-center text-sm text-gray-600">
                    Already have an account? <Link to="/login" className="font-bold text-forest-green hover:text-green-mid">{t('login')}</Link>
                </p>
                </div>
            </div>
            <section className="hidden md:flex min-h-[calc(100vh-4rem)] flex-col justify-between rounded-2xl bg-forest-green p-10 text-white">
                <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-white/10 p-3"><Leaf size={26} /></div>
                    <span className="font-heading text-2xl font-bold">Arvion</span>
                </div>
                <div className="max-w-lg">
                    <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-amber-200">Start clean</p>
                    <h1 className="font-heading text-5xl font-bold leading-tight">Build a reliable record of your farm from day one.</h1>
                    <p className="mt-5 text-lg text-green-100">Track animals, production, finances, and care decisions with fewer scattered notes.</p>
                </div>
                <div className="rounded-xl bg-white/10 p-5 text-green-100">
                    <strong className="mb-1 block text-white">Tip</strong>
                    Use the Kenyan international format, for example +254712345678.
                </div>
            </section>
        </div>
    );
};

export default Register;
