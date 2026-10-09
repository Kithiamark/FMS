import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Input from '../components/Input';
import { normalizeKenyanPhone } from '../utils/phone';
import { 
    Leaf, ArrowRight, ShieldCheck, Sparkles, CheckCircle2, 
    Stethoscope, Truck, Building2, Award, MapPin 
} from 'lucide-react';
import Cow from '../components/ui/CowIcon';
import api from '../api/axios';

const KENYAN_COUNTIES = [
    'Kiambu', 'Murang\'a', 'Nyeri', 'Nyandarua', 'Nakuru', 'Meru', 
    'Embu', 'Kirinyaga', 'Uasin Gishu', 'Machakos', 'Kajiado', 'Laikipia', 
    'Bomet', 'Kericho', 'Nandi', 'Bungoma', 'Kakamega', 'Kisii', 
    'Kisumu', 'Narok', 'Trans Nzoia', 'Nairobi', 'Baringo', 'Busia',
    'Elgeyo Marakwet', 'Homa Bay', 'Isiolo', 'Kilifi', 'Kitui', 'Kwale',
    'Lamu', 'Makueni', 'Mandera', 'Marsabit', 'Migori', 'Mombasa',
    'Nyamira', 'Samburu', 'Siaya', 'Taita Taveta', 'Tana River',
    'Tharaka Nithi', 'Turkana', 'Vihiga', 'Wajir', 'West Pokot'
];

const schema = z.object({
    role: z.enum(['FARMER', 'VETERINARIAN', 'AGGREGATOR']),
    full_name: z.string().min(2, "Name must be at least 2 characters"),
    phone_number: z.string().min(8, "Enter a valid mobile number (e.g. 712345678)"),
    // Vet fields
    license_number: z.string().optional(),
    county: z.string().optional(),
    specialization: z.string().optional(),
    years_experience: z.coerce.number().min(0).optional(),
    clinic_name: z.string().optional(),
    // Aggregator fields
    organization_name: z.string().optional(),
    operating_county: z.string().optional(),
    payment_terms: z.string().optional(),
    vehicle_capacity_litres: z.coerce.number().min(0).optional(),
    business_reg_no: z.string().optional(),
}).superRefine((data, ctx) => {
    if (data.role === 'VETERINARIAN') {
        if (!data.license_number || data.license_number.trim().length < 3) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Valid KVB license number is required",
                path: ["license_number"],
            });
        }
        if (!data.county || !data.county.trim()) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Please select your primary county of practice",
                path: ["county"],
            });
        }
    }
    if (data.role === 'AGGREGATOR') {
        if (!data.organization_name || data.organization_name.trim().length < 2) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Organization or business name is required",
                path: ["organization_name"],
            });
        }
        if (!data.operating_county || !data.operating_county.trim()) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Please select your primary operating county",
                path: ["operating_county"],
            });
        }
    }
});

const Register = () => {
    const { t } = useTranslation();
    const { register: registerUser } = useAuth();
    const navigate = useNavigate();
    const [serverError, setServerError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedRole, setSelectedRole] = useState('FARMER');
    
    const { register, handleSubmit, setValue, formState: { errors } } = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            role: 'FARMER',
            specialization: 'Dairy',
            payment_terms: 'Weekly',
            years_experience: 1,
            vehicle_capacity_litres: 2000,
            county: 'Kiambu',
            operating_county: 'Kiambu'
        }
    });

    const handleRoleChange = (role) => {
        setSelectedRole(role);
        setValue('role', role);
        setServerError('');
    };

    const onSubmit = async (data) => {
        setServerError('');
        setIsSubmitting(true);
        try {
            const formattedPhone = normalizeKenyanPhone(data.phone_number);
            const payload = {
                role: data.role,
                full_name: data.full_name,
                phone_number: formattedPhone,
            };

            if (data.role === 'VETERINARIAN') {
                payload.license_number = data.license_number.trim();
                payload.county = data.county;
                payload.specialization = data.specialization || 'Dairy';
                payload.years_experience = data.years_experience || 0;
                payload.clinic_name = data.clinic_name?.trim() || '';
            } else if (data.role === 'AGGREGATOR') {
                payload.organization_name = data.organization_name.trim();
                payload.operating_counties = [data.operating_county];
                payload.operating_county = data.operating_county;
                payload.payment_terms = data.payment_terms || 'Weekly';
                payload.vehicle_capacity_litres = data.vehicle_capacity_litres || 0;
                payload.business_reg_no = data.business_reg_no?.trim() || '';
            }

            await registerUser(payload);

            let testOtp = null;
            try {
                const otpRes = await api.post('/auth/request-otp/', { phone_number: formattedPhone });
                testOtp = otpRes.data?.test_mode_otp || null;
            } catch (otpErr) {
                console.error("Initial OTP trigger error:", otpErr);
            }

            navigate('/otp', { 
                state: { 
                    phone_number: formattedPhone, 
                    test_otp: testOtp,
                    role: data.role
                } 
            });
        } catch (error) {
            const details = error.response?.data;
            setServerError(
                details 
                    ? (typeof details === 'object' ? Object.values(details).flat().join(' ') : String(details)) 
                    : 'Registration failed. Please check your credentials and mobile number.'
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

            <div className="relative z-10 w-full max-w-5xl rounded-[2rem] border border-white/20 bg-white/10 p-2 sm:p-4 backdrop-blur-2xl shadow-2xl shadow-black/50 md:grid md:grid-cols-[1fr_1.1fr] md:gap-4 items-stretch">
                {/* Visual Showcase Panel */}
                <section
                    className="relative hidden min-h-[640px] overflow-hidden rounded-[1.75rem] bg-cover bg-center p-8 text-white md:flex md:flex-col md:justify-between border border-white/10 shadow-lg"
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
                            <span>
                                {selectedRole === 'FARMER' && 'Dairy Farmer Onboarding'}
                                {selectedRole === 'VETERINARIAN' && 'Veterinary Professional Onboarding'}
                                {selectedRole === 'AGGREGATOR' && 'Commercial Milk Off-Taker Onboarding'}
                            </span>
                        </div>
                        <h1 className="font-heading text-3xl lg:text-4xl font-bold leading-tight tracking-tight text-white">
                            {selectedRole === 'FARMER' && 'Build a resilient farm from day one.'}
                            {selectedRole === 'VETERINARIAN' && 'Connect with progressive dairy farms.'}
                            {selectedRole === 'AGGREGATOR' && 'Digitize dairy routes & milk collections.'}
                        </h1>
                        <p className="text-sm leading-relaxed text-emerald-100/90 font-normal">
                            {selectedRole === 'FARMER' && 'Register with your phone number to record milk yields, monitor cattle health, track income, and connect with verified buyers and veterinarians.'}
                            {selectedRole === 'VETERINARIAN' && 'Provide clinical consultations, view farm herd records with farmer consent, and expand your private practice across local dairy clusters.'}
                            {selectedRole === 'AGGREGATOR' && 'Manage milk collection routes, record digital lactometer quality tests, and settle farmer payments with complete transparency.'}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs text-emerald-100">
                        {selectedRole === 'FARMER' && (
                            <>
                                <div className="rounded-xl border border-white/15 bg-white/10 p-3.5 backdrop-blur-lg flex items-center gap-2.5">
                                    <CheckCircle2 size={18} className="text-emerald-300 shrink-0" />
                                    <span>Automated Farm Profile</span>
                                </div>
                                <div className="rounded-xl border border-white/15 bg-white/10 p-3.5 backdrop-blur-lg flex items-center gap-2.5">
                                    <ShieldCheck size={18} className="text-emerald-300 shrink-0" />
                                    <span>Secure Phone Verification</span>
                                </div>
                            </>
                        )}
                        {selectedRole === 'VETERINARIAN' && (
                            <>
                                <div className="rounded-xl border border-white/15 bg-white/10 p-3.5 backdrop-blur-lg flex items-center gap-2.5">
                                    <Award size={18} className="text-emerald-300 shrink-0" />
                                    <span>KVB License Verified</span>
                                </div>
                                <div className="rounded-xl border border-white/15 bg-white/10 p-3.5 backdrop-blur-lg flex items-center gap-2.5">
                                    <Stethoscope size={18} className="text-emerald-300 shrink-0" />
                                    <span>Direct Herd Access</span>
                                </div>
                            </>
                        )}
                        {selectedRole === 'AGGREGATOR' && (
                            <>
                                <div className="rounded-xl border border-white/15 bg-white/10 p-3.5 backdrop-blur-lg flex items-center gap-2.5">
                                    <Truck size={18} className="text-emerald-300 shrink-0" />
                                    <span>Route Milk Logging</span>
                                </div>
                                <div className="rounded-xl border border-white/15 bg-white/10 p-3.5 backdrop-blur-lg flex items-center gap-2.5">
                                    <Building2 size={18} className="text-emerald-300 shrink-0" />
                                    <span>Direct Co-op Settlements</span>
                                </div>
                            </>
                        )}
                    </div>
                </section>

                {/* Glassmorphic Form Container */}
                <div className="flex items-center justify-center rounded-[1.75rem] border border-white/40 bg-white/95 p-6 sm:p-8 shadow-xl backdrop-blur-xl">
                    <div className="w-full max-w-md">
                        <div className="mb-5">
                            <div className="mb-2 flex items-center justify-between">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/80 px-3 py-1 text-xs font-bold text-emerald-800">
                                    Step 1 of 2
                                </span>
                                <span className="text-xs text-slate-500">Profile & Credentials</span>
                            </div>
                            <h2 className="font-heading text-2xl font-extrabold text-slate-900 tracking-tight">Create Account</h2>
                            <p className="mt-1 text-xs text-slate-600">Choose your account type to set up your tailored workspace.</p>
                        </div>

                        {/* Role Selector Tabs */}
                        <div className="mb-5 grid grid-cols-3 gap-2 rounded-2xl bg-slate-100/80 p-1.5 border border-slate-200/80">
                            <button
                                type="button"
                                onClick={() => handleRoleChange('FARMER')}
                                className={`flex flex-col items-center justify-center gap-1 rounded-xl py-2 px-1 text-xs font-bold transition-all duration-200 ${
                                    selectedRole === 'FARMER'
                                        ? 'bg-emerald-700 text-white shadow-md shadow-emerald-900/20'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                                }`}
                            >
                                <Cow size={18} />
                                <span>Farmer</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleRoleChange('VETERINARIAN')}
                                className={`flex flex-col items-center justify-center gap-1 rounded-xl py-2 px-1 text-xs font-bold transition-all duration-200 ${
                                    selectedRole === 'VETERINARIAN'
                                        ? 'bg-emerald-700 text-white shadow-md shadow-emerald-900/20'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                                }`}
                            >
                                <Stethoscope size={18} />
                                <span>Vet</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleRoleChange('AGGREGATOR')}
                                className={`flex flex-col items-center justify-center gap-1 rounded-xl py-2 px-1 text-xs font-bold transition-all duration-200 ${
                                    selectedRole === 'AGGREGATOR'
                                        ? 'bg-emerald-700 text-white shadow-md shadow-emerald-900/20'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                                }`}
                            >
                                <Truck size={18} />
                                <span>Milk Buyer</span>
                            </button>
                        </div>

                        {serverError && (
                            <div className="mb-4 rounded-xl border border-red-200/80 bg-red-50/90 p-3 text-xs text-red-700 backdrop-blur-sm">
                                {serverError}
                            </div>
                        )}

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
                            {/* Universal Fields */}
                            <div>
                                <Input 
                                    label={selectedRole === 'AGGREGATOR' ? 'Contact Person Name' : t('full_name')} 
                                    placeholder={
                                        selectedRole === 'FARMER' 
                                            ? 'e.g. Grace Wanjiku' 
                                            : selectedRole === 'VETERINARIAN' 
                                                ? 'e.g. Dr. Kamau Njoroge' 
                                                : 'e.g. David Mwangi'
                                    }
                                    {...register('full_name')} 
                                    error={errors.full_name} 
                                />
                            </div>

                            <div>
                                <Input 
                                    label={t('phone_number')} 
                                    type="tel" 
                                    prefix="+254"
                                    placeholder="712 345 678" 
                                    {...register('phone_number')} 
                                    error={errors.phone_number} 
                                />
                            </div>

                            {/* Veterinarian Specific Fields */}
                            {selectedRole === 'VETERINARIAN' && (
                                <div className="space-y-3 pt-1 border-t border-slate-200/60">
                                    <div>
                                        <Input 
                                            label="KVB License Number *" 
                                            placeholder="e.g. KVB/2026/092"
                                            {...register('license_number')} 
                                            error={errors.license_number} 
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-2.5">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                                County of Practice *
                                            </label>
                                            <select
                                                {...register('county')}
                                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                            >
                                                {KENYAN_COUNTIES.map(c => (
                                                    <option key={c} value={c}>{c}</option>
                                                ))}
                                            </select>
                                            {errors.county && (
                                                <p className="mt-1 text-xs text-red-600">{errors.county.message}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                                Specialization
                                            </label>
                                            <select
                                                {...register('specialization')}
                                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                            >
                                                <option value="Dairy">Dairy Herd Health</option>
                                                <option value="General">General Practice</option>
                                                <option value="Surgery">Surgery & Obstetrics</option>
                                                <option value="Nutrition">Dairy Nutrition</option>
                                                <option value="All">All Livestock</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2.5">
                                        <div>
                                            <Input 
                                                label="Experience (Years)" 
                                                type="number"
                                                min="0"
                                                placeholder="e.g. 5"
                                                {...register('years_experience')} 
                                                error={errors.years_experience} 
                                            />
                                        </div>
                                        <div>
                                            <Input 
                                                label="Clinic / Practice Name" 
                                                placeholder="e.g. Highland Vet"
                                                {...register('clinic_name')} 
                                                error={errors.clinic_name} 
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Aggregator / Buyer Specific Fields */}
                            {selectedRole === 'AGGREGATOR' && (
                                <div className="space-y-3 pt-1 border-t border-slate-200/60">
                                    <div>
                                        <Input 
                                            label="Organization / Business Name *" 
                                            placeholder="e.g. Limuru Dairy Farmers Co-op"
                                            {...register('organization_name')} 
                                            error={errors.organization_name} 
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-2.5">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                                Primary County *
                                            </label>
                                            <select
                                                {...register('operating_county')}
                                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                            >
                                                {KENYAN_COUNTIES.map(c => (
                                                    <option key={c} value={c}>{c}</option>
                                                ))}
                                            </select>
                                            {errors.operating_county && (
                                                <p className="mt-1 text-xs text-red-600">{errors.operating_county.message}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                                Payment Terms
                                            </label>
                                            <select
                                                {...register('payment_terms')}
                                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                            >
                                                <option value="Daily">Daily Payout</option>
                                                <option value="Weekly">Weekly (Standard)</option>
                                                <option value="Bi-weekly">Bi-weekly</option>
                                                <option value="Monthly">Monthly</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2.5">
                                        <div>
                                            <Input 
                                                label="Capacity (Litres)" 
                                                type="number"
                                                min="0"
                                                placeholder="e.g. 5000"
                                                {...register('vehicle_capacity_litres')} 
                                                error={errors.vehicle_capacity_litres} 
                                            />
                                        </div>
                                        <div>
                                            <Input 
                                                label="Reg No / KRA PIN" 
                                                placeholder="e.g. P051888291X"
                                                {...register('business_reg_no')} 
                                                error={errors.business_reg_no} 
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Informative Security Notice */}
                            <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/70 p-3 text-xs text-emerald-900 backdrop-blur-sm flex items-start gap-2.5">
                                <ShieldCheck size={16} className="text-emerald-700 shrink-0 mt-0.5" />
                                <div>
                                    <strong className="block font-semibold">2-Step Verification & Password Setup</strong>
                                    A 6-digit code will be sent to your mobile phone. You will create your password and review terms on the next step.
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                disabled={isSubmitting}
                                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 py-3 font-bold text-white shadow-lg shadow-emerald-900/25 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 text-sm"
                            >
                                <span>{isSubmitting ? 'Sending Code...' : 'Send Verification Code'}</span>
                                <ArrowRight size={16} />
                            </button>
                        </form>

                        <p className="mt-4 text-center text-xs text-slate-600">
                            Already have an account?{' '}
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
