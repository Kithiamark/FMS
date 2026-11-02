import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import { AdminLayout } from '../../components/Layout/AdminLayout';
import { 
  Users, CreditCard, TrendingUp, Activity, AlertCircle, 
  ArrowUpRight, ArrowDownRight, Stethoscope, KeyRound, Copy, Check, RefreshCw,
  Sparkles, Search
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { useAdminAnomalies, useAdminAskData } from '../../hooks/useAI';
import { StatCard } from '../../components/ui/StatCard';
import { Skeleton, SkeletonStatGrid } from '../../components/ui/Skeleton';
const fetchAdminStats = async () => {
    const { data } = await api.get('/admin/stats/');
    return data;
};

const fetchRecentOTPs = async () => {
    const { data } = await api.get('/admin/recent-otps/');
    return data;
};

const AdminDashboard = () => {
    const { data, isLoading } = useQuery({ queryKey: ['adminStats'], queryFn: fetchAdminStats });
    const { data: recentOTPs = [], refetch: refetchOTPs, isFetching: isFetchingOTPs } = useQuery({
        queryKey: ['recentOTPs'],
        queryFn: fetchRecentOTPs,
        refetchInterval: 10000 // Poll every 10s for live OTPs
    });
    const { data: anomalies = [] } = useAdminAnomalies();
    const askDataMutation = useAdminAskData();

    const [copiedOtpId, setCopiedOtpId] = useState(null);
    const [askDataQuery, setAskDataQuery] = useState('');
    const [askDataResult, setAskDataResult] = useState(null);

    const handleCopyOtp = (code, id) => {
        navigator.clipboard.writeText(code);
        setCopiedOtpId(id);
        setTimeout(() => setCopiedOtpId(null), 2500);
    };

    const revenueData = data?.revenue_trend || [];

    const pieData = [
        { name: 'Basic', value: data?.active_subscriptions?.basic || 0, color: '#52525b' },
        { name: 'Premium', value: data?.active_subscriptions?.premium || 0, color: '#2563eb' },
        { name: 'Enterprise', value: data?.active_subscriptions?.enterprise || 0, color: '#eab308' },
        { name: 'Buyer Route', value: (data?.active_subscriptions?.buyer_starter || 0) + (data?.active_subscriptions?.buyer_commercial || 0), color: '#10b981' },
    ];

    if (isLoading) {
        return (
            <AdminLayout>
                <div className="space-y-6">
                    <Skeleton className="h-10 w-64" />
                    <SkeletonStatGrid count={6} />
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Skeleton className="h-80 lg:col-span-2 rounded-2xl" />
                        <Skeleton className="h-80 rounded-2xl" />
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-2xl font-heading font-bold text-white">Platform Overview</h1>
                        <p className="text-xs text-slate-400 mt-1">Multi-tenant telemetry, subscription health, and security controls</p>
                    </div>
                    <span className="text-xs font-mono text-gray-500">LAST UPDATED: {new Date().toLocaleTimeString()}</span>
                </div>

                {/* Arvion AI Platform Anomaly Detection Banner */}
                {anomalies && anomalies.length > 0 && (
                    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-2.5">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                                <Sparkles size={14} className="text-amber-400" /> Arvion AI Anomaly Watchlist
                            </span>
                            <span className="text-[11px] text-amber-300 font-semibold">{anomalies.length} Flagged Pattern{anomalies.length > 1 ? 's' : ''}</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                            {anomalies.map((a, i) => (
                                <div key={i} className="bg-slate-900/80 border border-amber-500/20 rounded-xl p-3 text-xs space-y-1">
                                    <div className="flex justify-between items-baseline">
                                        <span className="font-bold text-amber-200">{a.title}</span>
                                        <span className="text-[10px] text-amber-400/90 font-mono uppercase">{a.severity}</span>
                                    </div>
                                    <p className="text-slate-300 text-[11px] leading-relaxed">{a.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Arvion AI "Ask the Data" Natural Language Query Box */}
                <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 p-4 shadow-lg space-y-3">
                    <div className="flex items-center gap-2">
                        <Sparkles size={16} className="text-blue-400" />
                        <span className="text-xs font-bold text-blue-200 uppercase tracking-wider">Arvion AI — Ask the Data</span>
                    </div>
                    <form 
                        onSubmit={(e) => {
                            e.preventDefault();
                            if (!askDataQuery.trim() || askDataMutation.isPending) return;
                            askDataMutation.mutate(askDataQuery, {
                                onSuccess: (res) => setAskDataResult(res)
                            });
                        }} 
                        className="flex gap-2"
                    >
                        <div className="relative flex-1">
                            <Search size={15} className="absolute left-3.5 top-3 text-slate-400" />
                            <input
                                type="text"
                                value={askDataQuery}
                                onChange={(e) => setAskDataQuery(e.target.value)}
                                placeholder="e.g. Which sub-counties had the highest milk churn this month?"
                                className="w-full pl-10 pr-4 py-2 bg-slate-950/70 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={!askDataQuery.trim() || askDataMutation.isPending}
                            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-xs touch-target shrink-0 flex items-center gap-1.5"
                        >
                            <Sparkles size={13} />
                            {askDataMutation.isPending ? 'Analyzing...' : 'Query'}
                        </button>
                    </form>

                    {askDataResult && (
                        <div className="bg-slate-950/90 border border-blue-500/30 rounded-xl p-3.5 text-xs space-y-2 animate-in fade-in duration-200">
                            <div className="flex justify-between items-baseline border-b border-slate-800 pb-1.5">
                                <span className="font-bold text-blue-300">Analysis Summary</span>
                                <button type="button" onClick={() => setAskDataResult(null)} className="text-[10px] text-slate-400 hover:text-white">&times; Close</button>
                            </div>
                            <p className="text-slate-200 text-xs leading-relaxed">{askDataResult.answer}</p>
                            {askDataResult.data_points && (
                                <div className="text-[11px] text-slate-400 pt-1 font-mono">
                                    Metrics: {JSON.stringify(askDataResult.data_points)}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* KPI Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                    <StatCard title="Total Farmers" value={data?.total_farmers ?? 0} trend={12} icon={Users} accent="blue" />
                    <StatCard title="Active Subs" value={Object.values(data?.active_subscriptions || {}).reduce((a, b) => a + b, 0)} trend={5} icon={CreditCard} accent="emerald" />
                    <StatCard title="MRR (KES)" value={`Ksh ${(data?.monthly_revenue_kes || 0).toLocaleString()}`} trend={8.2} icon={TrendingUp} accent="amber" />
                    <StatCard title="Total Vets" value={data?.total_vets ?? 0} subtext="Total registered" icon={Stethoscope} accent="vet" />
                    <StatCard title="System Errors" value={data?.system_errors_24h ?? 0} subtext="Last 24h" icon={AlertCircle} accent="red" />
                    <StatCard title="Churn Rate" value={`${data?.churn_rate ?? 0}%`} subtext="All-time churn" icon={Activity} accent="admin" />
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-admin-card border border-gray-800 rounded-xl p-6">
                        <h3 className="text-white font-bold mb-6">Revenue Trend</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={revenueData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                                    <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `K${value/1000}k`} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                                        itemStyle={{ color: '#e4e4e7' }}
                                    />
                                    <Bar dataKey="basic" stackId="a" fill="#52525b" />
                                    <Bar dataKey="premium" stackId="a" fill="#2563eb" />
                                    <Bar dataKey="enterprise" stackId="a" fill="#eab308" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div className="bg-admin-card border border-gray-800 rounded-xl p-6">
                        <h3 className="text-white font-bold mb-6">Plan Distribution</h3>
                        <div className="h-64 flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex justify-center gap-4 mt-4 text-xs text-gray-400">
                            {pieData.map(item => (
                                <div key={item.name} className="flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                    <span>{item.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Active OTP Feed for Platform Operators */}
                <div className="bg-admin-card border border-emerald-900/40 rounded-xl overflow-hidden shadow-lg">
                    <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-gray-900/40">
                        <div className="flex items-center gap-2.5">
                            <KeyRound className="text-emerald-400" size={18} />
                            <div>
                                <h3 className="text-white font-bold text-sm">Active Verification Codes (Live OTP Feed)</h3>
                                <p className="text-xs text-gray-400">Recent farmer and user registration OTPs (last 15 minutes)</p>
                            </div>
                        </div>
                        <button 
                            type="button"
                            onClick={() => refetchOTPs()} 
                            disabled={isFetchingOTPs}
                            className="flex items-center gap-1.5 text-xs text-admin-accent hover:text-white bg-gray-800/60 px-3 py-1.5 rounded-lg border border-gray-700/60 transition"
                        >
                            <RefreshCw size={12} className={isFetchingOTPs ? "animate-spin" : ""} />
                            <span>Refresh</span>
                        </button>
                    </div>

                    <div className="p-4">
                        {recentOTPs.length === 0 ? (
                            <p className="text-xs text-gray-500 py-4 text-center">No active OTP requests in the last 15 minutes.</p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {recentOTPs.map(item => (
                                    <div key={item.id} className="p-3.5 rounded-lg bg-gray-900/70 border border-gray-800 flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-gray-400">{item.phone_number}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="font-mono text-xl font-bold tracking-widest text-emerald-400">{item.otp_code}</span>
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded ${item.is_expired ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-300'}`}>
                                                    {item.is_expired ? 'Expired' : 'Active'}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-gray-500 mt-1">{new Date(item.created_at).toLocaleTimeString()}</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleCopyOtp(item.otp_code, item.id)}
                                            className="p-2 rounded-lg bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700 transition"
                                            title="Copy verification code"
                                        >
                                            {copiedOtpId === item.id ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Bottom Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Signups */}
                    <div className="bg-admin-card border border-gray-800 rounded-xl overflow-hidden">
                        <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                            <h3 className="text-white font-bold">Recent Signups</h3>
                            <Link to="/admin/farmers" className="text-xs text-admin-accent hover:text-white transition">View All</Link>
                        </div>
                        <table className="w-full text-sm text-left text-gray-400">
                            <thead className="bg-gray-900 text-xs uppercase font-medium">
                                <tr>
                                    <th className="px-6 py-3">User</th>
                                    <th className="px-6 py-3">Plan / Role</th>
                                    <th className="px-6 py-3">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {data?.recent_signups?.length > 0 ? (
                                    data.recent_signups.map((user) => (
                                        <tr key={user.id} className="hover:bg-gray-800/50">
                                            <td className="px-6 py-4 font-medium text-white">
                                                <div>{user.name}</div>
                                                <div className="text-[11px] text-gray-500 font-mono">{user.phone}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded text-xs ${
                                                    user.plan === 'Enterprise' || user.plan === 'BuyerCommercial' ? 'bg-amber-500/10 text-amber-400' :
                                                    user.plan === 'Premium' || user.plan === 'BuyerStarter' ? 'bg-blue-500/10 text-blue-400' :
                                                    'bg-gray-800 text-gray-300'
                                                }`}>
                                                    {user.plan}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-xs font-mono">{user.date}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="3" className="px-6 py-8 text-center text-gray-500 text-xs">
                                            No recent signups found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* System Logs Feed */}
                    <div className="bg-admin-card border border-gray-800 rounded-xl overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                            <h3 className="text-white font-bold flex items-center gap-2">
                                <AlertCircle size={16} className="text-red-500" /> System Alerts
                            </h3>
                            <Link to="/admin/logs" className="text-xs text-admin-accent hover:text-white transition">All Logs</Link>
                        </div>
                        <div className="p-4 space-y-2 font-mono text-xs overflow-y-auto max-h-[300px]">
                            {data?.recent_errors?.length > 0 ? (
                                data.recent_errors.map((err) => (
                                    <div 
                                        key={err.id} 
                                        className={`flex gap-3 p-2 rounded border-l-2 ${
                                            err.level === 'CRITICAL' ? 'text-red-400 bg-red-500/5 border-red-500' :
                                            err.level === 'ERROR' ? 'text-rose-400 bg-rose-500/5 border-rose-500' :
                                            'text-amber-400 bg-amber-500/5 border-amber-500'
                                        }`}
                                    >
                                        <span className="opacity-50 shrink-0">{err.timestamp}</span>
                                        <span className="font-bold shrink-0">[{err.level}]</span>
                                        <span className="truncate">{err.message}</span>
                                    </div>
                                ))
                            ) : (
                                <div className="text-gray-500 text-center py-8 font-sans text-xs">
                                    No system errors or alerts in the last 24 hours. Platform operating normally.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminDashboard;
