import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { VetLayout } from '../../components/Layout/VetLayout';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { UserCircle, Save, ShieldCheck, Stethoscope, Building, FileCheck } from 'lucide-react';

const fetchVetProfile = async () => {
    const { data } = await api.get('/vets/my-profile/');
    return data;
};

const VetProfile = () => {
    const { user, refreshUser } = useAuth();
    const { addToast } = useToast();
    const queryClient = useQueryClient();

    const { data: vetData, isLoading } = useQuery({
        queryKey: ['vetMyProfile'],
        queryFn: fetchVetProfile
    });

    const [formDraft, setFormDraft] = useState(null);

    const form = React.useMemo(() => formDraft || {
        full_name: vetData?.name || user?.full_name || '',
        email: vetData?.email || user?.email || '',
        national_id: vetData?.national_id || '',
        license_number: vetData?.license_number || '',
        kvb_reg_no: vetData?.kvb_reg_no || '',
        qualifications: vetData?.qualifications || 'BVM',
        specialization: vetData?.specialization || 'Dairy',
        years_experience: vetData?.years_experience || 5,
        consultation_fee_kes: vetData?.consultation_fee_kes || 1500,
        county: vetData?.county || 'Kiambu',
        clinic_name: vetData?.clinic_name || '',
        clinic_address: vetData?.clinic_address || '',
        bio: vetData?.bio || '',
        emergency_available: vetData?.emergency_available ?? true,
        indemnity_agreed: vetData?.indemnity_agreed || false
    }, [formDraft, vetData, user]);

    const setForm = (updater) => {
        setFormDraft(prev => typeof updater === 'function' ? updater(prev || form) : updater);
    };

    const updateProfile = useMutation({
        mutationFn: async (payload) => {
            // Update auth user names
            if (payload.full_name !== user?.full_name || payload.email !== user?.email) {
                await api.patch('/auth/me/', { full_name: payload.full_name, email: payload.email });
            }
            // Update vet profile details
            const { data } = await api.patch('/vets/my-profile/', payload);
            return data;
        },
        onSuccess: async () => {
            await refreshUser();
            queryClient.invalidateQueries({ queryKey: ['vetMyProfile'] });
            addToast('Veterinary profile & credentials saved successfully!', 'success');
        },
        onError: () => addToast('Failed to save profile. Please check all fields.', 'error')
    });

    if (isLoading) {
        return (
            <VetLayout>
                <div className="p-8 text-center text-gray-500">Loading professional profile...</div>
            </VetLayout>
        );
    }

    return (
        <VetLayout>
            <div className="max-w-4xl mx-auto space-y-6 pb-12">
                {/* Header Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-vet-teal shadow-sm">
                            <UserCircle size={40} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold font-heading text-vet-navy">Veterinary Credentials & Practice</h1>
                                {vetData?.is_verified && (
                                    <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                                        <ShieldCheck size={14} /> Verified Practitioner
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-gray-500">{user?.phone_number} • License: {form.license_number || 'Pending'}</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); updateProfile.mutate(form); }} className="space-y-6">
                    {/* Professional Identity Card */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4">
                        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                            <Stethoscope size={18} className="text-vet-teal" /> Practitioner Identity
                        </h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Full Legal Name</label>
                                <input 
                                    required 
                                    value={form.full_name} 
                                    onChange={e => setForm({...form, full_name: e.target.value})} 
                                    className="w-full rounded-xl border border-gray-200 p-2.5 text-sm" 
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">National ID / Passport Number</label>
                                <input 
                                    value={form.national_id} 
                                    onChange={e => setForm({...form, national_id: e.target.value})} 
                                    placeholder="e.g. 28941235"
                                    className="w-full rounded-xl border border-gray-200 p-2.5 text-sm" 
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">KVB Board Reg. No.</label>
                                <input 
                                    value={form.kvb_reg_no} 
                                    onChange={e => setForm({...form, kvb_reg_no: e.target.value})} 
                                    placeholder="KVB-202X-XXX"
                                    className="w-full rounded-xl border border-gray-200 p-2.5 text-sm" 
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Specialization</label>
                                <select 
                                    value={form.specialization} 
                                    onChange={e => setForm({...form, specialization: e.target.value})} 
                                    className="w-full rounded-xl border border-gray-200 p-2.5 text-sm"
                                >
                                    <option value="Dairy">Dairy Cattle Specialist</option>
                                    <option value="General">General Large Animal</option>
                                    <option value="Surgery">Livestock Surgery</option>
                                    <option value="Nutrition">Ruminant Nutrition</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Years Experience</label>
                                <input 
                                    type="number"
                                    value={form.years_experience} 
                                    onChange={e => setForm({...form, years_experience: Number(e.target.value)})} 
                                    className="w-full rounded-xl border border-gray-200 p-2.5 text-sm" 
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Academic Qualifications</label>
                                <input 
                                    value={form.qualifications} 
                                    onChange={e => setForm({...form, qualifications: e.target.value})} 
                                    placeholder="e.g. BVM (University of Nairobi)"
                                    className="w-full rounded-xl border border-gray-200 p-2.5 text-sm" 
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Standard Consultation Fee (KES)</label>
                                <input 
                                    type="number"
                                    value={form.consultation_fee_kes} 
                                    onChange={e => setForm({...form, consultation_fee_kes: Number(e.target.value)})} 
                                    className="w-full rounded-xl border border-gray-200 p-2.5 text-sm" 
                                />
                            </div>
                        </div>
                    </div>

                    {/* Practice & Clinic Details */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4">
                        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                            <Building size={18} className="text-vet-teal" /> Practice & Clinic Details
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Practice / Clinic Name</label>
                                <input 
                                    value={form.clinic_name} 
                                    onChange={e => setForm({...form, clinic_name: e.target.value})} 
                                    placeholder="e.g. Limuru Veterinary Agro-Services"
                                    className="w-full rounded-xl border border-gray-200 p-2.5 text-sm" 
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Primary Operating County</label>
                                <input 
                                    value={form.county} 
                                    onChange={e => setForm({...form, county: e.target.value})} 
                                    placeholder="e.g. Kiambu"
                                    className="w-full rounded-xl border border-gray-200 p-2.5 text-sm" 
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Physical Clinic / Dispatch Address</label>
                            <input 
                                value={form.clinic_address} 
                                onChange={e => setForm({...form, clinic_address: e.target.value})} 
                                placeholder="Town, building, or road"
                                className="w-full rounded-xl border border-gray-200 p-2.5 text-sm" 
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Professional Bio & Specialties</label>
                            <textarea 
                                rows={3}
                                value={form.bio} 
                                onChange={e => setForm({...form, bio: e.target.value})} 
                                placeholder="Brief summary of your veterinary expertise and services offered..."
                                className="w-full rounded-xl border border-gray-200 p-2.5 text-sm" 
                            />
                        </div>

                        <label className="flex items-center gap-3 cursor-pointer pt-2">
                            <input 
                                type="checkbox"
                                checked={form.emergency_available}
                                onChange={e => setForm({...form, emergency_available: e.target.checked})}
                                className="h-4 w-4 rounded text-vet-teal focus:ring-vet-teal"
                            />
                            <span className="text-sm font-semibold text-gray-800">Available for 24/7 Emergency Dairy Callouts</span>
                        </label>
                    </div>

                    {/* Veterinary Professional Indemnity Agreement */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4">
                        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                            <FileCheck size={18} className="text-vet-teal" /> Statutory Compliance & Clinical Indemnity Agreement
                        </h2>

                        <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4 text-xs text-blue-900 space-y-2">
                            <p className="font-bold">Veterinary Surgeon Clinical Practice Disclaimer</p>
                            <p className="leading-relaxed text-blue-800">
                                As a registered veterinary practitioner on the FMS platform, I certify that all animal clinical diagnoses, pharmaceutical treatments, drug administrations, and vaccination records logged through this portal comply with Kenya Veterinary Board (KVB) regulations, Veterinary Surgeons and Veterinary Para-Professionals Act, and statutory animal welfare protocols.
                            </p>
                            <p className="leading-relaxed text-blue-800">
                                I acknowledge that FMS operates strictly as a digital record-keeping and advisory management software. The platform does not prescribe treatments, diagnose conditions autonomously, or underwrite clinical veterinary outcomes.
                            </p>
                            <label className="flex items-center gap-2.5 font-bold text-gray-900 cursor-pointer pt-2">
                                <input 
                                    type="checkbox"
                                    checked={form.indemnity_agreed}
                                    onChange={e => setForm({...form, indemnity_agreed: e.target.checked})}
                                    className="h-4 w-4 rounded text-vet-teal focus:ring-vet-teal"
                                />
                                <span>I agree to the Veterinary Professional Practice & Clinical Indemnity Agreement</span>
                            </label>
                            {vetData?.indemnity_agreed_at && (
                                <p className="text-[11px] text-emerald-700 font-semibold pt-1">
                                    ✓ Signed and recorded on {new Date(vetData.indemnity_agreed_at).toLocaleDateString()}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <Button 
                            type="submit" 
                            disabled={updateProfile.isPending}
                            className="bg-vet-teal hover:bg-opacity-90 text-white flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm shadow-sm"
                        >
                            <Save size={18} /> Save Credentials & Indemnity
                        </Button>
                    </div>
                </form>
            </div>
        </VetLayout>
    );
};

export default VetProfile;
