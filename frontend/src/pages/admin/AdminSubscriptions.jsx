import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { AdminLayout } from '../../components/Layout/AdminLayout';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { 
    CreditCard, Search, Sliders, CheckCircle, XCircle, 
    Clock, RefreshCw, Calendar, ArrowUpRight, ShieldCheck, Sparkles,
    Snowflake, Zap, AlertTriangle, Check, ShieldAlert
} from 'lucide-react';

const PLAN_RATES = {
    'Trial': 0,
    'Basic': 750,
    'Premium': 1500,
    'Enterprise': 3000,
    'BuyerStarter': 3500,
    'BuyerCommercial': 7500,
};

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

    // Quick Activate modal state
    const [activateSub, setActivateSub] = useState(null);
    const [activatePlan, setActivatePlan] = useState('Basic');
    const [activateMpesaRef, setActivateMpesaRef] = useState('');
    const [activateAmount, setActivateAmount] = useState('750');
    const [activateDays, setActivateDays] = useState('30');

    // Override modal state
    const [selectedSub, setSelectedSub] = useState(null);
    const [overridePlan, setOverridePlan] = useState('');
    const [overrideStatus, setOverrideStatus] = useState('');
    const [overrideMpesaRef, setOverrideMpesaRef] = useState('');
    const [overrideAmount, setOverrideAmount] = useState('');
    const [extendDays, setExtendDays] = useState('');

    const overrideMutation = useMutation({
        mutationFn: async ({ id, ...payload }) => {
            const { data } = await api.patch(`/admin/subscriptions/${id}/override/`, payload);
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries(['adminSubscriptions']);
            queryClient.invalidateQueries(['adminStats']);
            addToast(`Subscription for ${data.farm_name} updated successfully.`, 'success');
            setSelectedSub(null);
            setActivateSub(null);
        },
        onError: (err) => {
            const msg = err.response?.data?.error || 'Failed to update subscription.';
            addToast(msg, 'error');
        }
    });

    const handleOpenActivate = (sub) => {
        setActivateSub(sub);
        const plan = sub.plan && sub.plan !== 'Trial' ? sub.plan : 'Basic';
        setActivatePlan(plan);
        setActivateAmount(PLAN_RATES[plan]?.toString() || '750');
        setActivateMpesaRef(sub.mpesa_ref || '');
        setActivateDays('30');
    };

    const handlePlanChangeInActivate = (newPlan) => {
        setActivatePlan(newPlan);
        setActivateAmount(PLAN_RATES[newPlan]?.toString() || '750');
    };

    const handleSaveActivate = (e) => {
        e.preventDefault();
        if (!activateSub?.id) return;
        overrideMutation.mutate({
            id: activateSub.id,
            action: 'activate',
            plan: activatePlan,
            mpesa_ref: activateMpesaRef.trim().toUpperCase(),
            amount_kes: parseInt(activateAmount, 10) || PLAN_RATES[activatePlan],
            days: parseInt(activateDays, 10) || 30,
        });
    };

    const handleQuickFreeze = (sub) => {
        const isFrozen = sub.status === 'Frozen';
        const action = isFrozen ? 'unfreeze' : 'freeze';
        overrideMutation.mutate({
            id: sub.id,
            action,
        });
    };

    const handleQuickExtend = (sub, days = 30) => {
        overrideMutation.mutate({
            id: sub.id,
            action: 'extend',
            days,
        });
    };

    const handleOpenOverride = (sub) => {
        setSelectedSub(sub);
        setOverridePlan(sub.plan || 'Trial');
        setOverrideStatus(sub.status || 'Active');
        setOverrideMpesaRef(sub.mpesa_ref || '');
        setOverrideAmount(sub.amount_kes ? sub.amount_kes.toString() : '');
        setExtendDays('');
    };

    const handleSaveOverride = (e) => {
        e.preventDefault();
        if (!selectedSub?.id) return;
        overrideMutation.mutate({
            id: selectedSub.id,
            plan: overridePlan,
            status: overrideStatus,
            mpesa_ref: overrideMpesaRef ? overrideMpesaRef.trim().toUpperCase() : undefined,
            amount_kes: overrideAmount ? parseInt(overrideAmount, 10) : undefined,
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
        return acc + (PLAN_RATES[s.plan] || 0);
    }, 0);
    const trialCount = subscriptions.filter(s => s.plan === 'Trial').length;
    const frozenCount = subscriptions.filter(s => s.status === 'Frozen').length;
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
                            Manual M-Pesa receipt verification, instant activations, freeze controls, and 7-day grace period monitoring.
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="bg-admin-card border border-gray-800 rounded-xl p-5">
                        <p className="text-xs text-gray-500 uppercase font-medium">Active Subscriptions</p>
                        <h3 className="text-2xl font-bold text-emerald-400 mt-1">{activeSubs.length}</h3>
                        <p className="text-[11px] text-gray-400 mt-1">Paid & authorized farms</p>
                    </div>
                    <div className="bg-admin-card border border-gray-800 rounded-xl p-5">
                        <p className="text-xs text-gray-500 uppercase font-medium">Estimated MRR</p>
                        <h3 className="text-2xl font-bold text-white mt-1">KES {totalMRR.toLocaleString()}</h3>
                        <p className="text-[11px] text-emerald-400 mt-1">Recalibrated (+50%) run rate</p>
                    </div>
                    <div className="bg-admin-card border border-gray-800 rounded-xl p-5">
                        <p className="text-xs text-gray-500 uppercase font-medium">Active Free Trials</p>
                        <h3 className="text-2xl font-bold text-blue-400 mt-1">{trialCount}</h3>
                        <p className="text-[11px] text-gray-400 mt-1">30-day onboarding accounts</p>
                    </div>
                    <div className="bg-admin-card border border-gray-800 rounded-xl p-5">
                        <p className="text-xs text-gray-500 uppercase font-medium">Frozen Accounts</p>
                        <h3 className="text-2xl font-bold text-cyan-400 mt-1">{frozenCount}</h3>
                        <p className="text-[11px] text-gray-400 mt-1">Data-logging only mode</p>
                    </div>
                    <div className="bg-admin-card border border-gray-800 rounded-xl p-5">
                        <p className="text-xs text-gray-500 uppercase font-medium">Expired / Overdue</p>
                        <h3 className="text-2xl font-bold text-rose-400 mt-1">{expiredCount}</h3>
                        <p className="text-[11px] text-gray-400 mt-1">7d grace or logging only</p>
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
                                placeholder="Search farm, phone, M-Pesa ref..."
                                className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl pl-9 pr-3 py-1.5 text-xs focus:ring-1 focus:ring-admin-accent focus:border-admin-accent"
                            />
                        </div>

                        <select
                            value={planFilter}
                            onChange={e => setPlanFilter(e.target.value)}
                            className="bg-gray-900 border border-gray-800 text-gray-300 rounded-xl px-3 py-1.5 text-xs focus:ring-1 focus:ring-admin-accent font-medium"
                        >
                            <option value="ALL">All Plans</option>
                            <option value="Trial">Trial (Free)</option>
                            <option value="Basic">Basic (KES 750)</option>
                            <option value="Premium">Premium (KES 1,500)</option>
                            <option value="Enterprise">Enterprise (KES 3,000)</option>
                            <option value="BuyerStarter">Buyer Starter (KES 3,500)</option>
                            <option value="BuyerCommercial">Buyer Commercial (KES 7,500)</option>
                        </select>

                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            className="bg-gray-900 border border-gray-800 text-gray-300 rounded-xl px-3 py-1.5 text-xs focus:ring-1 focus:ring-admin-accent font-medium"
                        >
                            <option value="ALL">All Statuses</option>
                            <option value="Active">Active</option>
                            <option value="Frozen">Frozen (Data-Only)</option>
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
                                    <th className="py-3.5 px-4">Owner & Phone</th>
                                    <th className="py-3.5 px-4">Plan Tier</th>
                                    <th className="py-3.5 px-4">Status & Policy</th>
                                    <th className="py-3.5 px-4">M-Pesa Ref / Amount</th>
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
                                        const isFrozen = sub.status === 'Frozen';
                                        const isInGrace = sub.is_in_grace_period;
                                        const isLoggingOnly = sub.is_data_logging_only;

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
                                                        sub.plan === 'BuyerCommercial' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                                        sub.plan === 'BuyerStarter' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' :
                                                        sub.plan === 'Enterprise' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                                        sub.plan === 'Premium' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                                                        sub.plan === 'Basic' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                        'bg-gray-500/10 text-gray-400 border-gray-500/20'
                                                    }`}>
                                                        {sub.plan}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    {isFrozen ? (
                                                        <span className="inline-flex items-center gap-1 text-cyan-400 font-semibold text-[11px] bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/50">
                                                            <Snowflake size={11} /> Frozen (Data Only)
                                                        </span>
                                                    ) : isInGrace ? (
                                                        <span className="inline-flex items-center gap-1 text-amber-400 font-semibold text-[11px] bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/50">
                                                            <AlertTriangle size={11} /> 7-Day Grace Period
                                                        </span>
                                                    ) : isActive ? (
                                                        <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
                                                            <CheckCircle size={12} /> Active Full
                                                        </span>
                                                    ) : isExpired ? (
                                                        <span className="inline-flex items-center gap-1 text-rose-400 font-semibold text-[11px] bg-rose-950/40 px-2 py-0.5 rounded border border-rose-800/50">
                                                            <XCircle size={11} /> Data Logging Only
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-amber-400 font-semibold text-[11px]">
                                                            <Clock size={12} /> {sub.status}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    {sub.mpesa_ref ? (
                                                        <div>
                                                            <span className="font-mono font-bold text-emerald-400 block">{sub.mpesa_ref}</span>
                                                            <span className="text-[10px] text-gray-500">KES {sub.amount_kes || PLAN_RATES[sub.plan] || 0}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-500 text-[11px]">—</span>
                                                    )}
                                                </td>
                                                <td className="py-3.5 px-4 font-mono">
                                                    <span className={isExpired ? "text-rose-400 font-semibold" : "text-gray-300"}>
                                                        {sub.end_date || sub.trial_ends_at || 'Never'}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        {sub.status !== 'Active' && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleOpenActivate(sub)}
                                                                title="Activate manually with M-Pesa receipt"
                                                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600 hover:text-white transition font-medium text-[11px] border border-emerald-500/30"
                                                            >
                                                                <Zap size={11} /> Activate
                                                            </button>
                                                        )}

                                                        <button
                                                            type="button"
                                                            onClick={() => handleQuickFreeze(sub)}
                                                            title={isFrozen ? 'Unfreeze account' : 'Freeze account to data-logging only'}
                                                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg transition font-medium text-[11px] border ${
                                                                isFrozen 
                                                                    ? 'bg-cyan-600/20 text-cyan-300 hover:bg-cyan-600 hover:text-white border-cyan-500/30' 
                                                                    : 'bg-gray-800 text-gray-400 hover:bg-cyan-950 hover:text-cyan-300 border-gray-700'
                                                            }`}
                                                        >
                                                            <Snowflake size={11} />
                                                            {isFrozen ? 'Unfreeze' : 'Freeze'}
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() => handleQuickExtend(sub, 30)}
                                                            title="Add 30 days to subscription"
                                                            className="inline-flex items-center px-2 py-1 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white transition font-medium text-[11px] border border-gray-700"
                                                        >
                                                            +30d
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() => handleOpenOverride(sub)}
                                                            title="Edit subscription details"
                                                            className="inline-flex items-center p-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition border border-gray-700"
                                                        >
                                                            <Sliders size={13} />
                                                        </button>
                                                    </div>
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

            {/* MODAL: QUICK ACTIVATE VIA M-PESA */}
            <Modal isOpen={!!activateSub} onClose={() => setActivateSub(null)} title="Manual M-Pesa Subscription Activation">
                {activateSub && (
                    <form onSubmit={handleSaveActivate} className="space-y-4 text-xs text-gray-300">
                        <div className="p-3 bg-gray-900/80 rounded-xl border border-gray-800 flex justify-between items-center">
                            <div>
                                <span className="font-bold text-white text-sm block">{activateSub.farm_name}</span>
                                <span className="text-[11px] text-gray-400">{activateSub.owner_name} ({activateSub.owner_phone})</span>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                Current Status: {activateSub.status}
                            </span>
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold text-gray-400 mb-1">Select Tier to Activate</label>
                            <select 
                                value={activatePlan}
                                onChange={e => handlePlanChangeInActivate(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white font-medium focus:ring-1 focus:ring-admin-accent"
                            >
                                <option value="Basic">Basic Plan (KES 750/mo)</option>
                                <option value="Premium">Premium Plan (KES 1,500/mo)</option>
                                <option value="Enterprise">Enterprise Plan (KES 3,000/mo)</option>
                                <option value="BuyerStarter">Milk Buyer Starter Route (KES 3,500/mo)</option>
                                <option value="BuyerCommercial">Milk Buyer Commercial Co-op (KES 7,500/mo)</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[11px] font-bold text-gray-400 mb-1">M-Pesa Transaction Code</label>
                                <input 
                                    type="text"
                                    required
                                    placeholder="e.g. QK87YTR45P"
                                    value={activateMpesaRef}
                                    onChange={e => setActivateMpesaRef(e.target.value)}
                                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white font-mono uppercase focus:ring-1 focus:ring-admin-accent"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-gray-400 mb-1">Amount Paid (KES)</label>
                                <input 
                                    type="number"
                                    required
                                    value={activateAmount}
                                    onChange={e => setActivateAmount(e.target.value)}
                                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white font-medium focus:ring-1 focus:ring-admin-accent"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold text-gray-400 mb-1">Duration</label>
                            <div className="grid grid-cols-4 gap-2">
                                {[
                                    { label: '1 Month (30d)', value: '30' },
                                    { label: '2 Months (60d)', value: '60' },
                                    { label: '3 Months (90d)', value: '90' },
                                    { label: '1 Year (365d)', value: '365' },
                                ].map(item => (
                                    <button
                                        key={item.value}
                                        type="button"
                                        onClick={() => setActivateDays(item.value)}
                                        className={`py-2 px-2 rounded-xl text-center font-bold text-[11px] border transition ${
                                            activateDays === item.value 
                                                ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500' 
                                                : 'bg-gray-900 text-gray-400 border-gray-800 hover:bg-gray-800'
                                        }`}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-xl flex items-center gap-2">
                            <ShieldCheck size={16} className="text-emerald-400 flex-shrink-0" />
                            <span className="text-[11px]">
                                Clicking "Activate Plan" will immediately set status to Active, issue the new expiration date, and store the M-Pesa receipt in the audit ledger.
                            </span>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <Button variant="outline" size="sm" type="button" onClick={() => setActivateSub(null)}>
                                Cancel
                            </Button>
                            <Button size="sm" type="submit" disabled={overrideMutation.isPending} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold">
                                {overrideMutation.isPending ? 'Activating...' : 'Activate Plan'}
                            </Button>
                        </div>
                    </form>
                )}
            </Modal>

            {/* MODAL: COMPREHENSIVE OVERRIDE */}
            <Modal isOpen={!!selectedSub} onClose={() => setSelectedSub(null)} title="Administrative Subscription Override">
                {selectedSub && (
                    <form onSubmit={handleSaveOverride} className="space-y-4 text-xs text-gray-300">
                        <div className="p-3 bg-gray-900/80 rounded-xl border border-gray-800 flex justify-between items-center">
                            <div>
                                <span className="font-bold text-white text-sm block">{selectedSub.farm_name}</span>
                                <span className="text-[11px] text-gray-400">{selectedSub.owner_name} ({selectedSub.owner_phone})</span>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                Current: {selectedSub.plan} ({selectedSub.status})
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
                                    <option value="Trial">Free Trial (KES 0)</option>
                                    <option value="Basic">Basic (KES 750/mo)</option>
                                    <option value="Premium">Premium (KES 1,500/mo)</option>
                                    <option value="Enterprise">Enterprise (KES 3,000/mo)</option>
                                    <option value="BuyerStarter">Buyer Starter Route (KES 3,500/mo)</option>
                                    <option value="BuyerCommercial">Buyer Commercial Co-op (KES 7,500/mo)</option>
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
                                    <option value="Frozen">Frozen (Data-Logging Only)</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Expired">Expired</option>
                                    <option value="Cancelled">Cancelled</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[11px] font-bold text-gray-400 mb-1">M-Pesa Reference</label>
                                <input 
                                    type="text"
                                    value={overrideMpesaRef}
                                    onChange={e => setOverrideMpesaRef(e.target.value)}
                                    placeholder="e.g. QK98TR56AA"
                                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white font-mono uppercase focus:ring-1 focus:ring-admin-accent"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-gray-400 mb-1">Recorded Amount (KES)</label>
                                <input 
                                    type="number"
                                    value={overrideAmount}
                                    onChange={e => setOverrideAmount(e.target.value)}
                                    placeholder="Amount KES"
                                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white font-medium focus:ring-1 focus:ring-admin-accent"
                                />
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
