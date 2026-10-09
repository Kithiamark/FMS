import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { AdminLayout } from '../../components/Layout/AdminLayout';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { 
    CreditCard, Search, Sliders, CheckCircle, XCircle, 
    Clock, RefreshCw, Calendar, ArrowUpRight, ShieldCheck, Sparkles 
} from 'lucide-react';

const fetchSubscriptions = async () => {
    const { data } = await api.get('/admin/subscriptions/');
    return Array.isArray(data) ? data : (data?.results || []);
};

const AdminSubscriptions = () => {
    const { addToast } = useToast();
    const queryClient = useQueryClient();
    const { data: subscriptions = [], isLoading, refetch, isFetching } = useQuery({
        queryKey: ['adminSubscriptions'],
        queryFn: fetchSubscriptions
    });

    const [planFilter, setPlanFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');

    // Override modal state
    const [selectedSub, setSelectedSub] = useState(null);
    const [overridePlan, setOverridePlan] = useState('');
    const [overrideStatus, setOverrideStatus] = useState('');
    const [extendDays, setExtendDays] = useState('');

    const overrideMutation = useMutation({
        mutationFn: async ({ id, plan, status, extend_days }) => {
            const payload = {};
            if (plan) payload.plan = plan;
            if (status) payload.status = status;
            if (extend_days) payload.extend_days = parseInt(extend_days, 10);
            const { data } = await api.patch(`/admin/subscriptions/${id}/override/`, payload);
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries(['adminSubscriptions']);
            queryClient.invalidateQueries(['adminStats']);
            addToast(`Subscription for ${data.farm_name} updated successfully.`, 'success');
            setSelectedSub(null);
        },
        onError: (err) => {
            const msg = err.response?.data?.error || 'Failed to update subscription.';
            addToast(msg, 'error');
        }
    });

    const handleOpenOverride = (sub) => {
        setSelectedSub(sub);
        setOverridePlan(sub.plan || 'Trial');
        setOverrideStatus(sub.status || 'Active');
        setExtendDays('');
    };

    const handleSaveOverride = (e) => {
        e.preventDefault();
        if (!selectedSub?.id) return;
        overrideMutation.mutate({
            id: selectedSub.id,
            plan: overridePlan,
            status: overrideStatus,
            extend_days: extendDays ? parseInt(extendDays, 10) : undefined
        });
    };

    // Filtered subscriptions
    const filteredSubs = useMemo(() => {
        return subscriptions.filter(sub => {
            if (planFilter !== 'ALL' && sub.plan !== planFilter) return false;
            if (statusFilter !== 'ALL' && sub.status !== statusFilter) return false;
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                const farm = (sub.farm_name || '').toLowerCase();
                const owner = (sub.owner_name || '').toLowerCase();
                const phone = (sub.owner_phone || '').toLowerCase();
                const county = (sub.farm_county || '').toLowerCase();
                return farm.includes(q) || owner.includes(q) || phone.includes(q) || county.includes(q);
            }
            return true;
        });
    }, [subscriptions, planFilter, statusFilter, searchQuery]);

    // Financial KPI stats
    const activeSubs = subscriptions.filter(s => s.status === 'Active');
    const totalMRR = activeSubs.reduce((acc, s) => {
        if (s.plan === 'Basic') return acc + 1500;
        if (s.plan === 'Premium') return acc + 3500;
        if (s.plan === 'Enterprise') return acc + 7500;
        return acc;
    }, 0);
    const trialCount = subscriptions.filter(s => s.plan === 'Trial').length;
    const expiredCount = subscriptions.filter(s => s.status === 'Expired').length;

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-heading font-bold text-white flex items-center gap-2.5">
                            <CreditCard className="text-admin-accent" size={24} />
                            Subscription Ledger & Billing Governance
                        </h1>
                        <p className="text-xs text-gray-400 mt-1">
                            Live tier entitlement tracking, M-Pesa automated renewals, and administrative overrides.
                        </p>
                    </div>
                    <button 
                        onClick={() => refetch()}
                        disabled={isFetching}
                        className="flex items-center gap-2 text-xs px-3.5 py-2 rounded-xl bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700 transition"
                    >
                        <RefreshCw size={13} className={isFetching ? 'animate-spin' : ''} />
                        Refresh Ledger
                    </button>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-admin-card border border-gray-800 rounded-xl p-5">
                        <p className="text-xs text-gray-500 uppercase font-medium">Active Subscriptions</p>
                        <h3 className="text-2xl font-bold text-emerald-400 mt-1">{activeSubs.length}</h3>
                        <p className="text-[11px] text-gray-400 mt-1">Paid & authorized farms</p>
                    </div>
                    <div className="bg-admin-card border border-gray-800 rounded-xl p-5">
                        <p className="text-xs text-gray-500 uppercase font-medium">Estimated MRR</p>
                        <h3 className="text-2xl font-bold text-white mt-1">KES {totalMRR.toLocaleString()}</h3>
                        <p className="text-[11px] text-emerald-400 mt-1">Monthly platform recurring run rate</p>
                    </div>
                    <div className="bg-admin-card border border-gray-800 rounded-xl p-5">
                        <p className="text-xs text-gray-500 uppercase font-medium">Active Free Trials</p>
                        <h3 className="text-2xl font-bold text-blue-400 mt-1">{trialCount}</h3>
                        <p className="text-[11px] text-gray-400 mt-1">30-day onboarding accounts</p>
                    </div>
                    <div className="bg-admin-card border border-gray-800 rounded-xl p-5">
                        <p className="text-xs text-gray-500 uppercase font-medium">Expired / Overdue</p>
                        <h3 className="text-2xl font-bold text-rose-400 mt-1">{expiredCount}</h3>
                        <p className="text-[11px] text-gray-400 mt-1">Awaiting M-Pesa renewal</p>
                    </div>
                </div>

                {/* Filter Controls */}
                <div className="bg-admin-card border border-gray-800 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input 
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Search farm, phone, county..."
                                className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl pl-9 pr-3 py-1.5 text-xs focus:ring-1 focus:ring-admin-accent focus:border-admin-accent"
                            />
                        </div>

                        <select
                            value={planFilter}
                            onChange={e => setPlanFilter(e.target.value)}
                            className="bg-gray-900 border border-gray-800 text-gray-300 rounded-xl px-3 py-1.5 text-xs focus:ring-1 focus:ring-admin-accent font-medium"
                        >
                            <option value="ALL">All Plans</option>
                            <option value="Trial">Trial</option>
                            <option value="Basic">Basic</option>
                            <option value="Premium">Premium</option>
                            <option value="Enterprise">Enterprise</option>
                        </select>

                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            className="bg-gray-900 border border-gray-800 text-gray-300 rounded-xl px-3 py-1.5 text-xs focus:ring-1 focus:ring-admin-accent font-medium"
                        >
                            <option value="ALL">All Statuses</option>
                            <option value="Active">Active</option>
                            <option value="Pending">Pending</option>
                            <option value="Expired">Expired</option>
                            <option value="Cancelled">Cancelled</option>
                        </select>
                    </div>

                    <span className="text-xs font-mono text-gray-500">
                        {filteredSubs.length} Records Showing
                    </span>
                </div>

                {/* Subscriptions Table */}
                <div className="bg-admin-card border border-gray-800 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-gray-900 text-gray-400 font-semibold uppercase tracking-wider border-b border-gray-800">
                                <tr>
                                    <th className="py-3.5 px-4">Farm & Location</th>
                                    <th className="py-3.5 px-4">Owner</th>
                                    <th className="py-3.5 px-4">Plan Tier</th>
                                    <th className="py-3.5 px-4">Status</th>
                                    <th className="py-3.5 px-4">Start Date</th>
                                    <th className="py-3.5 px-4">Expiry Date</th>
                                    <th className="py-3.5 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800 text-gray-300">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan="7" className="py-12 text-center text-gray-500 font-medium">
                                            Loading subscriptions...
                                        </td>
                                    </tr>
                                ) : filteredSubs.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="py-12 text-center text-gray-500 font-medium">
                                            No subscriptions match the current filter criteria.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredSubs.map(sub => {
                                        const isExpired = sub.status === 'Expired';
                                        const isActive = sub.status === 'Active';
                                        return (
                                            <tr key={sub.id} className="hover:bg-gray-800/40 transition-colors">
                                                <td className="py-3.5 px-4">
                                                    <span className="font-bold text-white block">{sub.farm_name || 'Unnamed Farm'}</span>
                                                    <span className="text-[11px] text-gray-500">{sub.farm_county || 'County not set'}</span>
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <span className="font-medium text-gray-200 block">{sub.owner_name}</span>
                                                    <span className="text-[11px] font-mono text-gray-400">{sub.owner_phone}</span>
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                                        sub.plan === 'Enterprise' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                                        sub.plan === 'Premium' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                                                        sub.plan === 'Basic' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                        'bg-gray-500/10 text-gray-400 border-gray-500/20'
                                                    }`}>
                                                        {sub.plan}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    {isActive ? (
                                                        <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
                                                            <CheckCircle size={12} /> Active
                                                        </span>
                                                    ) : isExpired ? (
                                                        <span className="inline-flex items-center gap-1 text-rose-400 font-semibold text-[11px]">
                                                            <XCircle size={12} /> Expired
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-amber-400 font-semibold text-[11px]">
                                                            <Clock size={12} /> {sub.status}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-3.5 px-4 font-mono text-gray-400">
                                                    {sub.start_date || '—'}
                                                </td>
                                                <td className="py-3.5 px-4 font-mono">
                                                    <span className={isExpired ? "text-rose-400 font-semibold" : "text-gray-300"}>
                                                        {sub.end_date || sub.trial_ends_at || 'Never'}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4 text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenOverride(sub)}
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700 transition font-medium"
                                                    >
                                                        <Sliders size={13} className="text-admin-accent" /> Override
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* MODAL: EDIT / OVERRIDE SUBSCRIPTION */}
            <Modal isOpen={!!selectedSub} onClose={() => setSelectedSub(null)} title="Administrative Subscription Override">
                {selectedSub && (
                    <form onSubmit={handleSaveOverride} className="space-y-4 text-xs text-gray-300">
                        <div className="p-3 bg-gray-900/80 rounded-xl border border-gray-800 flex justify-between items-center">
                            <div>
                                <span className="font-bold text-white text-sm block">{selectedSub.farm_name}</span>
                                <span className="text-[11px] text-gray-400">{selectedSub.owner_name} ({selectedSub.owner_phone})</span>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                Current: {selectedSub.plan}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[11px] font-bold text-gray-400 mb-1">Entitlement Tier</label>
                                <select 
                                    value={overridePlan}
                                    onChange={e => setOverridePlan(e.target.value)}
                                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white font-medium focus:ring-1 focus:ring-admin-accent"
                                >
                                    <option value="Trial">Free Trial</option>
                                    <option value="Basic">Basic (KES 1,500/mo)</option>
                                    <option value="Premium">Premium (KES 3,500/mo)</option>
                                    <option value="Enterprise">Enterprise (KES 7,500/mo)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-gray-400 mb-1">Subscription Status</label>
                                <select 
                                    value={overrideStatus}
                                    onChange={e => setOverrideStatus(e.target.value)}
                                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white font-medium focus:ring-1 focus:ring-admin-accent"
                                >
                                    <option value="Active">Active</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Expired">Expired</option>
                                    <option value="Cancelled">Cancelled</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold text-gray-400 mb-1">Extend Access Duration (Days)</label>
                            <div className="flex gap-2">
                                <input 
                                    type="number"
                                    min="1"
                                    value={extendDays}
                                    onChange={e => setExtendDays(e.target.value)}
                                    placeholder="Enter additional days..."
                                    className="flex-1 bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white font-medium focus:ring-1 focus:ring-admin-accent"
                                />
                                {[30, 60, 90].map(days => (
                                    <button
                                        key={days}
                                        type="button"
                                        onClick={() => setExtendDays(days.toString())}
                                        className="px-3 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold hover:text-white transition"
                                    >
                                        +{days}d
                                    </button>
                                ))}
                            </div>
                            <p className="text-[10px] text-gray-500 mt-1">
                                Extending automatically advances the end date from current expiration or today.
                            </p>
                        </div>

                        <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-300 rounded-xl flex items-center gap-2">
                            <ShieldCheck size={16} className="text-blue-400 flex-shrink-0" />
                            <span className="text-[11px]">
                                Manual adjustments are recorded to the platform audit log with your admin identity.
                            </span>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <Button variant="outline" size="sm" type="button" onClick={() => setSelectedSub(null)}>
                                Cancel
                            </Button>
                            <Button size="sm" type="submit" disabled={overrideMutation.isPending} className="bg-admin-accent text-white">
                                {overrideMutation.isPending ? 'Applying...' : 'Apply Override'}
                            </Button>
                        </div>
                    </form>
                )}
            </Modal>
        </AdminLayout>
    );
};

export default AdminSubscriptions;
