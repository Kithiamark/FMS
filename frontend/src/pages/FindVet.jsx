import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import MainLayout from '../components/Layout/MainLayout';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { 
  MapPin, Star, UserPlus, ShieldCheck, CheckCircle2, Clock, 
  MessageSquare, Phone, Building, Stethoscope 
} from 'lucide-react';

const fetchVets = async (filters) => {
    const params = new URLSearchParams();
    if (filters.county) params.append('county', filters.county);
    if (filters.specialization && filters.specialization !== 'All') {
        params.append('specialization', filters.specialization);
    }
    const { data } = await api.get(`/vets/?${params.toString()}`);
    return data;
};

const fetchConnections = async () => {
    const { data } = await api.get('/connections/');
    return data.results || data || [];
};

const FindVet = () => {
    const queryClient = useQueryClient();
    const { addToast } = useToast();
    const [filters, setFilters] = useState({ county: '', specialization: 'All' });
    const [selectedVet, setSelectedVet] = useState(null);
    const [connectMessage, setConnectMessage] = useState('');

    const { data: vets = [], isLoading: vetsLoading } = useQuery({ 
        queryKey: ['vets', filters], 
        queryFn: () => fetchVets(filters) 
    });

    // fetch connections query
    useQuery({ queryKey: ['farmerVetConnections'], queryFn: fetchConnections });

    const connectMutation = useMutation({
        mutationFn: async ({ vetId, message }) => {
            return await api.post(`/vets/${vetId}/connect/`, { message });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vets'] });
            queryClient.invalidateQueries({ queryKey: ['farmerVetConnections'] });
            addToast('Connection request sent to veterinary doctor!', 'success');
            setSelectedVet(null);
            setConnectMessage('');
        },
        onError: (err) => {
            addToast(err.response?.data?.error || err.response?.data?.message || 'Failed to send request', 'error');
        }
    });

    const handleConnect = (e) => {
        e.preventDefault();
        if (!selectedVet) return;
        connectMutation.mutate({ vetId: selectedVet.id, message: connectMessage });
    };

    // Separate connected and pending vets
    const connectedVets = vets.filter(v => v.connection_status === 'ACTIVE');
    const pendingVets = vets.filter(v => v.connection_status === 'PENDING');
    const availableVets = vets.filter(v => v.connection_status !== 'ACTIVE');

    return (
        <MainLayout>
            <div className="space-y-8 pb-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold font-heading text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            <Stethoscope className="text-emerald-600" /> Veterinary Care & Clinic Directory
                        </h1>
                        <p className="text-sm text-slate-500">
                            Connect your dairy farm with certified veterinary officers for herd treatments, AI inseminations, and digital checkups
                        </p>
                    </div>

                    {/* Filter Pills */}
                    <div className="flex gap-2 overflow-x-auto pb-1">
                        {['All', 'Dairy', 'General', 'Surgery', 'Nutrition'].map(spec => (
                            <button
                                key={spec}
                                type="button"
                                onClick={() => setFilters({...filters, specialization: spec})}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${
                                    filters.specialization === spec 
                                        ? 'bg-emerald-600 text-white shadow-sm' 
                                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
                                }`}
                            >
                                {spec}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Section 1: Connected Vets */}
                {connectedVets.length > 0 && (
                    <section className="space-y-4">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 size={18} className="text-emerald-600" />
                            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                                My Connected Veterinarians ({connectedVets.length})
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {connectedVets.map(vet => (
                                <div key={vet.id} className="rounded-2xl border-2 border-emerald-500/30 bg-emerald-50/20 p-5 shadow-sm dark:bg-emerald-950/10">
                                    <div className="flex items-start justify-between">
                                        <div className="flex gap-3">
                                            <div className="h-12 w-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg">
                                                {vet.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-1.5">
                                                    <h3 className="font-bold text-slate-900 dark:text-slate-100">{vet.name}</h3>
                                                    <ShieldCheck size={16} className="text-emerald-600" />
                                                </div>
                                                <p className="text-xs text-slate-500">{vet.specialization} Specialist</p>
                                                {vet.clinic_name && (
                                                    <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                                        <Building size={12} /> {vet.clinic_name}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                                            Connected
                                        </span>
                                    </div>

                                    <div className="mt-4 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 border-t border-emerald-100/60 pt-3 dark:border-emerald-900/40">
                                        <span className="flex items-center gap-1"><MapPin size={13} /> {vet.county}</span>
                                        <span className="font-bold text-emerald-700 dark:text-emerald-400">KES {vet.consultation_fee_kes || '1500'} / visit</span>
                                    </div>

                                    <div className="mt-4 flex gap-2">
                                        <Link to={`/messages?vet_id=${vet.id}`} className="flex-1">
                                            <Button variant="ghost" className="w-full text-xs flex items-center justify-center gap-1.5 border border-emerald-200 hover:bg-emerald-100/50">
                                                <MessageSquare size={14} /> Message
                                            </Button>
                                        </Link>
                                        <a href={`tel:${vet.phone_number}`} className="flex-1">
                                            <Button className="w-full text-xs flex items-center justify-center gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700">
                                                <Phone size={14} /> Call Vet
                                            </Button>
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Section 2: Pending Approval */}
                {pendingVets.length > 0 && (
                    <section className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Clock size={16} className="text-amber-500" />
                            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                Awaiting Doctor Acceptance ({pendingVets.length})
                            </h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {pendingVets.map(vet => (
                                <div key={vet.id} className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50/40 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold">
                                            {vet.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{vet.name}</h4>
                                            <p className="text-xs text-slate-500">{vet.specialization} • {vet.county}</p>
                                        </div>
                                    </div>
                                    <span className="flex items-center gap-1 text-xs font-bold text-amber-700 dark:text-amber-300">
                                        <Clock size={14} /> Pending Approval
                                    </span>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Section 3: Available Directory */}
                <section className="space-y-4">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                        Available Veterinarians in District ({availableVets.length})
                    </h2>

                    {vetsLoading ? (
                        <div className="p-8 text-center text-slate-400">Loading licensed veterinarians...</div>
                    ) : availableVets.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-400">
                            No veterinarians found matching your filter criteria.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {availableVets.map(vet => (
                                <div key={vet.id} className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition dark:border-slate-800 dark:bg-slate-900">
                                    <div>
                                        <div className="flex justify-between items-start">
                                            <div className="flex gap-3">
                                                <div className="h-12 w-12 rounded-xl bg-forest-green text-white flex items-center justify-center font-bold text-lg font-heading">
                                                    {vet.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-1.5">
                                                        <h3 className="font-bold text-slate-900 dark:text-slate-100">{vet.name}</h3>
                                                        {vet.is_verified && <ShieldCheck size={16} className="text-emerald-600" />}
                                                    </div>
                                                    <p className="text-xs text-slate-500">{vet.specialization} Specialist</p>
                                                    {vet.clinic_name && (
                                                        <p className="text-[11px] text-slate-400 mt-0.5 truncate">{vet.clinic_name}</p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                                                <Star size={12} className="fill-amber-500 text-amber-500" />
                                                <span>{vet.average_rating || '4.8'}</span>
                                            </div>
                                        </div>

                                        <div className="mt-4 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                                            <div className="flex items-center gap-2">
                                                <MapPin size={14} className="text-slate-400" />
                                                <span>{vet.county || 'Central Region'}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                                                    KES {vet.consultation_fee_kes || '1500'}
                                                </span>
                                                <span>•</span>
                                                <span>{vet.years_experience} yrs clinical experience</span>
                                            </div>
                                            {vet.kvb_reg_no && (
                                                <p className="text-[10px] text-slate-400 font-mono">KVB: {vet.kvb_reg_no}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-800">
                                        {vet.connection_status === 'PENDING' ? (
                                            <Button disabled className="w-full text-xs bg-slate-100 text-slate-400">
                                                <Clock size={14} className="mr-1" /> Request Sent
                                            </Button>
                                        ) : (
                                            <Button 
                                                onClick={() => setSelectedVet(vet)}
                                                className="w-full text-xs flex items-center justify-center gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700"
                                            >
                                                <UserPlus size={15} /> Connect with Vet
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>

            {/* Connect Modal */}
            <Modal isOpen={!!selectedVet} onClose={() => setSelectedVet(null)} title="Connect with Veterinarian">
                <form onSubmit={handleConnect} className="space-y-4">
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                        Send a connection request to <strong>{selectedVet?.name}</strong>. 
                        Once accepted, the doctor will be able to review your herd medical records, schedule herd checkups, and log clinical treatments.
                    </p>
                    <textarea 
                        className="w-full rounded-xl border border-slate-200 p-3 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950"
                        placeholder="Optional intro message (e.g. 'We operate a 20-cow Friesian dairy farm in Limuru and need routine herd health monitoring...')"
                        rows={3}
                        value={connectMessage}
                        onChange={e => setConnectMessage(e.target.value)}
                    />
                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="ghost" onClick={() => setSelectedVet(null)} className="text-xs">Cancel</Button>
                        <Button type="submit" disabled={connectMutation.isPending} className="text-xs bg-emerald-600 text-white">
                            Send Request
                        </Button>
                    </div>
                </form>
            </Modal>
        </MainLayout>
    );
};

export default FindVet;
