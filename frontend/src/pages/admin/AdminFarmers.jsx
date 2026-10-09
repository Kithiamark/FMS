import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { AdminLayout } from '../../components/Layout/AdminLayout';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { 
    Users, Search, ShieldAlert, KeyRound, CheckCircle, 
    XCircle, Eye, Phone, Mail, MapPin, Building2, UserCheck, 
    RefreshCw, Filter, UserPlus, Stethoscope, Truck
} from 'lucide-react';

const KENYAN_COUNTIES = [
    'Kiambu', 'Murang\'a', 'Nyeri', 'Nyandarua', 'Nakuru', 'Meru', 
    'Embu', 'Kirinyaga', 'Uasin Gishu', 'Machakos', 'Kajiado', 'Laikipia', 
    'Bomet', 'Kericho', 'Nandi', 'Bungoma', 'Kakamega', 'Kisii', 
    'Kisumu', 'Narok', 'Trans Nzoia', 'Nairobi'
];

const fetchUsers = async () => {
    const { data } = await api.get('/admin/users/');
    return Array.isArray(data) ? data : (data?.results || []);
};

const AdminFarmers = () => {
    const { addToast } = useToast();
    const queryClient = useQueryClient();
    const { data: users = [], isLoading, refetch, isFetching } = useQuery({
        queryKey: ['adminUsers'],
        queryFn: fetchUsers
    });

    const [activeRoleTab, setActiveRoleTab] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');

    // Modal state
    const [selectedUser, setSelectedUser] = useState(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [impersonateTarget, setImpersonateTarget] = useState(null);
    const [impersonateToken, setImpersonateToken] = useState(null);
    const [isOnboardOpen, setIsOnboardOpen] = useState(false);
    const [onboardForm, setOnboardForm] = useState({
        role: 'FARMER',
        full_name: '',
        phone_number: '',
        license_number: '',
        county: 'Kiambu',
        specialization: 'Dairy',
        organization_name: '',
        operating_county: 'Kiambu',
    });

    const onboardMutation = useMutation({
        mutationFn: async (payload) => {
            const { data } = await api.post('/auth/register/', payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['adminUsers']);
            setIsOnboardOpen(false);
            setOnboardForm({
                role: 'FARMER',
                full_name: '',
                phone_number: '',
                license_number: '',
                county: 'Kiambu',
                specialization: 'Dairy',
                organization_name: '',
                operating_county: 'Kiambu',
            });
            addToast('Partner account provisioned successfully!', 'success');
        },
        onError: (err) => {
            const d = err.response?.data;
            const msg = d ? (typeof d === 'object' ? Object.values(d).flat().join(' ') : String(d)) : 'Failed to provision partner account.';
            addToast(msg, 'error');
        }
    });

    // Toggle active mutation
    const toggleActiveMutation = useMutation({
        mutationFn: async (userId) => {
            const { data } = await api.patch(`/admin/users/${userId}/toggle-active/`);
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries(['adminUsers']);
            addToast(data.message || 'User status updated successfully.', 'success');
        },
        onError: (err) => {
            const msg = err.response?.data?.error || 'Failed to update user status.';
            addToast(msg, 'error');
        }
    });

    // Impersonate mutation
    const impersonateMutation = useMutation({
        mutationFn: async (userId) => {
            const { data } = await api.post(`/admin/users/${userId}/impersonate/`);
            return data;
        },
        onSuccess: (data) => {
            setImpersonateToken(data);
            addToast('Impersonation session token generated (15 min expiry).', 'success');
        },
        onError: (err) => {
            const msg = err.response?.data?.error || 'Failed to generate impersonation session.';
            addToast(msg, 'error');
        }
    });

    // Filter users
    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            // Role filter
            if (activeRoleTab !== 'ALL' && user.role !== activeRoleTab) {
                return false;
            }
            // Status filter
            if (statusFilter === 'ACTIVE' && !user.is_active) return false;
            if (statusFilter === 'SUSPENDED' && user.is_active) return false;

            // Search query
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                const name = (user.full_name || '').toLowerCase();
                const phone = (user.phone_number || '').toLowerCase();
                const email = (user.email || '').toLowerCase();
                const farmName = (user.farm?.name || '').toLowerCase();
                const county = (user.farm?.county || '').toLowerCase();
                return name.includes(q) || phone.includes(q) || email.includes(q) || farmName.includes(q) || county.includes(q);
            }
            return true;
        });
    }, [users, activeRoleTab, statusFilter, searchQuery]);

    // Metric counts
    const totalFarmers = users.filter(u => u.role === 'FARMER').length;
    const totalAggregators = users.filter(u => u.role === 'AGGREGATOR').length;
    const totalVets = users.filter(u => u.role === 'VETERINARIAN').length;
    const totalWorkers = users.filter(u => u.role === 'FARM_WORKER').length;
    const totalSuspended = users.filter(u => !u.is_active).length;

    const handleImpersonateClick = (user) => {
        setImpersonateTarget(user);
        setImpersonateToken(null);
    };

    const handleConfirmImpersonate = () => {
        if (!impersonateTarget?.id) return;
        impersonateMutation.mutate(impersonateTarget.id);
    };

    const handleOpenDetails = (user) => {
        setSelectedUser(user);
        setIsDetailsOpen(true);
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-heading font-bold text-white flex items-center gap-2.5">
                            <Users className="text-admin-accent" size={24} />
                            Platform User Directory
                        </h1>
                        <p className="text-xs text-gray-400 mt-1">
                            Governance and administration across registered dairy farmers, veterinarians, aggregators, and workforce.
                        </p>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <button 
                            onClick={() => setIsOnboardOpen(true)}
                            className="flex items-center gap-2 text-xs px-3.5 py-2 rounded-xl bg-admin-accent text-white hover:bg-emerald-600 transition font-semibold shadow-xs"
                        >
                            <UserPlus size={14} />
                            Onboard Partner
                        </button>
                        <button 
                            onClick={() => refetch()}
                            disabled={isFetching}
                            className="flex items-center gap-2 text-xs px-3.5 py-2 rounded-xl bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700 transition"
                        >
                            <RefreshCw size={13} className={isFetching ? 'animate-spin' : ''} />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                    <div className="bg-admin-card border border-gray-800 rounded-xl p-4">
                        <p className="text-xs text-gray-500 uppercase font-medium">Farmers</p>
                        <h3 className="text-xl font-bold text-white mt-1">{totalFarmers}</h3>
                        <p className="text-[11px] text-blue-400 mt-1">Dairy herd owners</p>
                    </div>
                    <div className="bg-admin-card border border-gray-800 rounded-xl p-4">
                        <p className="text-xs text-gray-500 uppercase font-medium">Veterinarians</p>
                        <h3 className="text-xl font-bold text-white mt-1">{totalVets}</h3>
                        <p className="text-[11px] text-teal-400 mt-1">Licensed clinicians</p>
                    </div>
                    <div className="bg-admin-card border border-gray-800 rounded-xl p-4">
                        <p className="text-xs text-gray-500 uppercase font-medium">Aggregators</p>
                        <h3 className="text-xl font-bold text-white mt-1">{totalAggregators}</h3>
                        <p className="text-[11px] text-purple-400 mt-1">Milk off-takers</p>
                    </div>
                    <div className="bg-admin-card border border-gray-800 rounded-xl p-4">
                        <p className="text-xs text-gray-500 uppercase font-medium">Farm Workers</p>
                        <h3 className="text-xl font-bold text-white mt-1">{totalWorkers}</h3>
                        <p className="text-[11px] text-amber-400 mt-1">Delegated staff</p>
                    </div>
                    <div className="bg-admin-card border border-gray-800 rounded-xl p-4">
                        <p className="text-xs text-gray-500 uppercase font-medium">Suspended</p>
                        <h3 className="text-xl font-bold text-rose-500 mt-1">{totalSuspended}</h3>
                        <p className="text-[11px] text-gray-400 mt-1">Security restricted</p>
                    </div>
                </div>

                {/* Filters & Tabs */}
                <div className="bg-admin-card border border-gray-800 rounded-xl p-4 space-y-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        {/* Role Tabs */}
                        <div className="flex flex-wrap gap-1.5 bg-gray-900/80 p-1 rounded-xl border border-gray-800">
                            {[
                                { id: 'ALL', label: 'All Users' },
                                { id: 'FARMER', label: 'Farmers' },
                                { id: 'VETERINARIAN', label: 'Veterinarians' },
                                { id: 'AGGREGATOR', label: 'Aggregators' },
                                { id: 'FARM_WORKER', label: 'Workers' }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveRoleTab(tab.id)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${activeRoleTab === tab.id ? 'bg-admin-accent text-white shadow-xs' : 'text-gray-400 hover:text-white'}`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Search and Status Filter */}
                        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                            <div className="relative flex-1 md:w-64">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input 
                                    type="text"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="Search name, phone, county..."
                                    className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl pl-9 pr-3 py-1.5 text-xs focus:ring-1 focus:ring-admin-accent focus:border-admin-accent"
                                />
                            </div>

                            <select
                                value={statusFilter}
                                onChange={e => setStatusFilter(e.target.value)}
                                className="bg-gray-900 border border-gray-800 text-gray-300 rounded-xl px-3 py-1.5 text-xs focus:ring-1 focus:ring-admin-accent font-medium"
                            >
                                <option value="ALL">All Statuses</option>
                                <option value="ACTIVE">Active Only</option>
                                <option value="SUSPENDED">Suspended Only</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* User Table */}
                <div className="bg-admin-card border border-gray-800 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-gray-900 text-gray-400 font-semibold uppercase tracking-wider border-b border-gray-800">
                                <tr>
                                    <th className="py-3.5 px-4">User</th>
                                    <th className="py-3.5 px-4">Phone</th>
                                    <th className="py-3.5 px-4">Role</th>
                                    <th className="py-3.5 px-4">Farm / Organization</th>
                                    <th className="py-3.5 px-4">Subscription</th>
                                    <th className="py-3.5 px-4">Status</th>
                                    <th className="py-3.5 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800 text-gray-300">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan="7" className="py-12 text-center text-gray-500 font-medium">
                                            Loading users...
                                        </td>
                                    </tr>
                                ) : filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="py-12 text-center text-gray-500 font-medium">
                                            No users found matching current filters.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map(user => {
                                        const farm = user.farm;
                                        const sub = farm?.subscription;
                                        return (
                                            <tr key={user.id} className="hover:bg-gray-800/40 transition-colors">
                                                <td className="py-3.5 px-4">
                                                    <div>
                                                        <span className="font-bold text-white block">{user.full_name}</span>
                                                        <span className="text-[11px] text-gray-500">{user.email || 'No email registered'}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-4 font-mono text-gray-300">
                                                    {user.phone_number}
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                                        user.role === 'FARMER' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                        user.role === 'AGGREGATOR' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                                        user.role === 'FARM_WORKER' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                                        'bg-red-500/10 text-red-400 border-red-500/20'
                                                    }`}>
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <span className="font-medium text-gray-200 block">{farm?.name || '—'}</span>
                                                    <span className="text-[11px] text-gray-500">{farm?.county || farm?.location || ''}</span>
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    {sub ? (
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                            {sub.plan} ({sub.status})
                                                        </span>
                                                    ) : (
                                                        <span className="text-[11px] text-gray-500">Free Tier</span>
                                                    )}
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    {user.is_active ? (
                                                        <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
                                                            <CheckCircle size={12} /> Active
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-rose-400 font-semibold text-[11px]">
                                                            <XCircle size={12} /> Suspended
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-3.5 px-4 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <button 
                                                            type="button"
                                                            onClick={() => handleOpenDetails(user)}
                                                            className="p-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition"
                                                            title="View User Details"
                                                        >
                                                            <Eye size={14} />
                                                        </button>
                                                        <button 
                                                            type="button"
                                                            onClick={() => handleImpersonateClick(user)}
                                                            className="p-1.5 rounded-lg bg-gray-800 text-amber-400 hover:text-amber-300 hover:bg-gray-700 transition"
                                                            title="Generate Superadmin Impersonation Session"
                                                        >
                                                            <KeyRound size={14} />
                                                        </button>
                                                        <button 
                                                            type="button"
                                                            onClick={() => toggleActiveMutation.mutate(user.id)}
                                                            disabled={toggleActiveMutation.isPending}
                                                            className={`p-1.5 rounded-lg transition ${
                                                                user.is_active 
                                                                    ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20' 
                                                                    : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                                                            }`}
                                                            title={user.is_active ? "Suspend Account" : "Activate Account"}
                                                        >
                                                            {user.is_active ? <XCircle size={14} /> : <CheckCircle size={14} />}
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

            {/* MODAL: VIEW DETAILS */}
            <Modal isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} title="Platform User Profile & Governance Audit">
                {selectedUser && (
                    <div className="space-y-4 text-xs text-gray-300">
                        <div className="p-3.5 bg-gray-900/80 rounded-xl border border-gray-800 flex justify-between items-center">
                            <div>
                                <h4 className="text-sm font-bold text-white">{selectedUser.full_name}</h4>
                                <p className="text-[11px] text-gray-400 font-mono mt-0.5">{selectedUser.phone_number}</p>
                            </div>
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                {selectedUser.role}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-gray-900/50 rounded-xl border border-gray-800">
                                <span className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Email Address</span>
                                <span className="text-white font-medium">{selectedUser.email || 'Not provided'}</span>
                            </div>
                            <div className="p-3 bg-gray-900/50 rounded-xl border border-gray-800">
                                <span className="text-[10px] uppercase font-bold text-gray-500 block mb-1">National ID / Passport</span>
                                <span className="text-white font-medium">{selectedUser.national_id || 'Not verified'}</span>
                            </div>
                        </div>

                        {selectedUser.farm && (
                            <div className="p-3.5 bg-gray-900/50 rounded-xl border border-gray-800 space-y-1.5">
                                <span className="text-[10px] uppercase font-bold text-gray-500 block">Assigned Farm / Operation</span>
                                <p className="text-white font-bold">{selectedUser.farm.name}</p>
                                <p className="text-[11px] text-gray-400">County: {selectedUser.farm.county || 'Unspecified'}</p>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-gray-900/50 rounded-xl border border-gray-800">
                                <span className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Account State</span>
                                <span className={selectedUser.is_active ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                                    {selectedUser.is_active ? "Active & Verified" : "Suspended"}
                                </span>
                            </div>
                            <div className="p-3 bg-gray-900/50 rounded-xl border border-gray-800">
                                <span className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Indemnity Agreement</span>
                                <span className={selectedUser.indemnity_agreed ? "text-emerald-400 font-semibold" : "text-amber-400 font-semibold"}>
                                    {selectedUser.indemnity_agreed ? "Signed & Stored" : "Pending Signature"}
                                </span>
                            </div>
                        </div>

                        <div className="flex justify-end pt-2">
                            <Button variant="outline" size="sm" onClick={() => setIsDetailsOpen(false)}>
                                Close
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* MODAL: IMPERSONATION CONFIRMATION & TOKEN DISPLAY */}
            <Modal isOpen={!!impersonateTarget} onClose={() => { setImpersonateTarget(null); setImpersonateToken(null); }} title="Superadmin User Impersonation">
                {impersonateTarget && (
                    <div className="space-y-4 text-xs text-gray-300">
                        <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-xl flex items-start gap-2.5">
                            <ShieldAlert size={18} className="flex-shrink-0 mt-0.5 text-amber-400" />
                            <div>
                                <p className="font-bold text-amber-200">Security Warning</p>
                                <p className="text-[11px] text-amber-300/90 leading-relaxed mt-0.5">
                                    You are about to generate an impersonated session for <strong>{impersonateTarget.full_name}</strong> ({impersonateTarget.email || impersonateTarget.phone_number}). All actions taken during this session will be logged to the immutable security Audit Log.
                                </p>
                            </div>
                        </div>

                        {!impersonateToken ? (
                            <div className="flex justify-end gap-2 pt-2">
                                <Button variant="outline" size="sm" onClick={() => setImpersonateTarget(null)}>
                                    Cancel
                                </Button>
                                <Button 
                                    size="sm" 
                                    className="bg-amber-600 hover:bg-amber-700 text-white"
                                    onClick={handleConfirmImpersonate}
                                    disabled={impersonateMutation.isPending}
                                >
                                    {impersonateMutation.isPending ? 'Generating Session...' : 'Authorize Impersonation'}
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-3 pt-2">
                                <div className="p-3 bg-gray-900 border border-gray-800 rounded-xl space-y-1">
                                    <span className="text-[10px] uppercase font-bold text-emerald-400 block">Session Generated</span>
                                    <p className="text-[11px] text-gray-400 leading-relaxed">
                                        Token lifetime: 15 minutes. Financial and deletion operations remain restricted during impersonated sessions.
                                    </p>
                                </div>
                                <div className="flex justify-end pt-1">
                                    <Button size="sm" onClick={() => { setImpersonateTarget(null); setImpersonateToken(null); }}>
                                        Done
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            {/* MODAL: ONBOARD PARTNER (FARMER, VET, AGGREGATOR) */}
            <Modal isOpen={isOnboardOpen} onClose={() => setIsOnboardOpen(false)} title="Onboard Platform Partner">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        const payload = {
                            role: onboardForm.role,
                            full_name: onboardForm.full_name,
                            phone_number: onboardForm.phone_number,
                        };
                        if (onboardForm.role === 'VETERINARIAN') {
                            payload.license_number = onboardForm.license_number;
                            payload.county = onboardForm.county;
                            payload.specialization = onboardForm.specialization;
                        } else if (onboardForm.role === 'AGGREGATOR') {
                            payload.organization_name = onboardForm.organization_name;
                            payload.operating_counties = [onboardForm.operating_county];
                            payload.operating_county = onboardForm.operating_county;
                        }
                        onboardMutation.mutate(payload);
                    }}
                    className="space-y-4 text-xs text-gray-300"
                >
                    <div className="grid grid-cols-3 gap-2 bg-gray-900 p-1.5 rounded-xl border border-gray-800">
                        {[
                            { id: 'FARMER', label: 'Farmer' },
                            { id: 'VETERINARIAN', label: 'Veterinarian' },
                            { id: 'AGGREGATOR', label: 'Milk Buyer' },
                        ].map((r) => (
                            <button
                                key={r.id}
                                type="button"
                                onClick={() => setOnboardForm(prev => ({ ...prev, role: r.id }))}
                                className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition ${
                                    onboardForm.role === r.id ? 'bg-admin-accent text-white shadow-xs' : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                {r.label}
                            </button>
                        ))}
                    </div>

                    <div>
                        <label className="block text-[11px] font-semibold text-gray-400 mb-1">
                            {onboardForm.role === 'AGGREGATOR' ? 'Contact Person Name *' : 'Full Name *'}
                        </label>
                        <input
                            type="text"
                            required
                            value={onboardForm.full_name}
                            onChange={(e) => setOnboardForm(prev => ({ ...prev, full_name: e.target.value }))}
                            placeholder="e.g. Grace Wanjiku"
                            className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-admin-accent text-xs"
                        />
                    </div>

                    <div>
                        <label className="block text-[11px] font-semibold text-gray-400 mb-1">
                            Phone Number (+254...) *
                        </label>
                        <input
                            type="tel"
                            required
                            value={onboardForm.phone_number}
                            onChange={(e) => setOnboardForm(prev => ({ ...prev, phone_number: e.target.value }))}
                            placeholder="0712345678 or +254712345678"
                            className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-admin-accent text-xs"
                        />
                    </div>

                    {onboardForm.role === 'VETERINARIAN' && (
                        <div className="space-y-3 pt-2 border-t border-gray-800">
                            <div>
                                <label className="block text-[11px] font-semibold text-gray-400 mb-1">
                                    KVB License Number *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={onboardForm.license_number}
                                    onChange={(e) => setOnboardForm(prev => ({ ...prev, license_number: e.target.value }))}
                                    placeholder="e.g. KVB/2026/092"
                                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-admin-accent text-xs"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-semibold text-gray-400 mb-1">
                                        County *
                                    </label>
                                    <select
                                        value={onboardForm.county}
                                        onChange={(e) => setOnboardForm(prev => ({ ...prev, county: e.target.value }))}
                                        className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-admin-accent text-xs"
                                    >
                                        {KENYAN_COUNTIES.map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-semibold text-gray-400 mb-1">
                                        Specialization
                                    </label>
                                    <select
                                        value={onboardForm.specialization}
                                        onChange={(e) => setOnboardForm(prev => ({ ...prev, specialization: e.target.value }))}
                                        className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-admin-accent text-xs"
                                    >
                                        <option value="Dairy">Dairy</option>
                                        <option value="General">General</option>
                                        <option value="Surgery">Surgery</option>
                                        <option value="Nutrition">Nutrition</option>
                                        <option value="All">All</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {onboardForm.role === 'AGGREGATOR' && (
                        <div className="space-y-3 pt-2 border-t border-gray-800">
                            <div>
                                <label className="block text-[11px] font-semibold text-gray-400 mb-1">
                                    Organization / Cooperative Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={onboardForm.organization_name}
                                    onChange={(e) => setOnboardForm(prev => ({ ...prev, organization_name: e.target.value }))}
                                    placeholder="e.g. Limuru Dairy Farmers Co-op"
                                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-admin-accent text-xs"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-semibold text-gray-400 mb-1">
                                    Primary Operating County *
                                </label>
                                <select
                                    value={onboardForm.operating_county}
                                    onChange={(e) => setOnboardForm(prev => ({ ...prev, operating_county: e.target.value }))}
                                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-admin-accent text-xs"
                                >
                                    {KENYAN_COUNTIES.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-3 border-t border-gray-800">
                        <Button variant="outline" size="sm" type="button" onClick={() => setIsOnboardOpen(false)}>
                            Cancel
                        </Button>
                        <Button 
                            size="sm" 
                            type="submit"
                            className="bg-admin-accent hover:bg-emerald-600 text-white"
                            disabled={onboardMutation.isPending}
                        >
                            {onboardMutation.isPending ? 'Provisioning...' : 'Provision Account'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </AdminLayout>
    );
};

export default AdminFarmers;
