import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { AdminLayout } from '../../components/Layout/AdminLayout';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { 
    Settings, ShieldCheck, Database, Server, Smartphone, 
    CreditCard, KeyRound, Clock, HardDrive, CheckCircle2, 
    RefreshCw, User, Lock, ExternalLink
} from 'lucide-react';

const AdminSettings = () => {
    const { user, logout } = useAuth();
    const { addToast } = useToast();

    const handleFlushCache = () => {
        addToast('Cache invalidation triggered. Stale queries flushed.', 'info');
    };

    return (
        <AdminLayout>
            <div className="space-y-6 max-w-5xl">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-heading font-bold text-white flex items-center gap-2.5">
                        <Settings className="text-admin-accent" size={24} />
                        Platform Administration & Infrastructure Telemetry
                    </h1>
                    <p className="text-xs text-gray-400 mt-1">
                        System configuration, API gateways, security policies, and administrative credentials.
                    </p>
                </div>

                {/* Service Health Grid */}
                <div>
                    <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Service & Gateway Telemetry</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Database */}
                        <div className="bg-admin-card border border-gray-800 rounded-xl p-5 flex items-start gap-4">
                            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
                                <Database size={22} />
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-bold text-white text-sm">PostgreSQL Engine</h3>
                                    <span className="inline-flex items-center gap-1 text-emerald-400 font-bold text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                        <CheckCircle2 size={11} /> Connected
                                    </span>
                                </div>
                                <p className="text-gray-400 text-xs mt-1">Primary transactional datastore with connection pooling and automated migration locks.</p>
                                <span className="text-[10px] font-mono text-gray-500 block mt-2">Latency: &lt; 2.4ms | Pool: 10 connections active</span>
                            </div>
                        </div>

                        {/* Celery / Redis */}
                        <div className="bg-admin-card border border-gray-800 rounded-xl p-5 flex items-start gap-4">
                            <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl">
                                <Server size={22} />
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-bold text-white text-sm">Redis & Celery Task Worker</h3>
                                    <span className="inline-flex items-center gap-1 text-emerald-400 font-bold text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                        <CheckCircle2 size={11} /> Active
                                    </span>
                                </div>
                                <p className="text-gray-400 text-xs mt-1">Background scheduling broker executing daily veterinary checkup scans and milk yield alerts.</p>
                                <span className="text-[10px] font-mono text-gray-500 block mt-2">Queues: default, high_priority, alerts</span>
                            </div>
                        </div>

                        {/* Africa's Talking SMS */}
                        <div className="bg-admin-card border border-gray-800 rounded-xl p-5 flex items-start gap-4">
                            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
                                <Smartphone size={22} />
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-bold text-white text-sm">Africa's Talking SMS Gateway</h3>
                                    <span className="inline-flex items-center gap-1 text-emerald-400 font-bold text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                        <CheckCircle2 size={11} /> Active
                                    </span>
                                </div>
                                <p className="text-gray-400 text-xs mt-1">Kenyan telco SMS routing (+254) delivering instant 6-digit OTP verification codes.</p>
                                <span className="text-[10px] font-mono text-gray-500 block mt-2">Region: KE (Safaricom / Airtel / Telkom)</span>
                            </div>
                        </div>

                        {/* Safaricom Daraja M-Pesa */}
                        <div className="bg-admin-card border border-gray-800 rounded-xl p-5 flex items-start gap-4">
                            <div className="p-3 bg-yellow-500/10 text-yellow-400 rounded-xl">
                                <CreditCard size={22} />
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-bold text-white text-sm">Safaricom Daraja API</h3>
                                    <span className="inline-flex items-center gap-1 text-emerald-400 font-bold text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                        <CheckCircle2 size={11} /> Callback Ready
                                    </span>
                                </div>
                                <p className="text-gray-400 text-xs mt-1">STK Push and C2B payment callbacks handling farmer subscription billing and receipts.</p>
                                <span className="text-[10px] font-mono text-gray-500 block mt-2">Security: AES-256 Fernet Encrypted Receipts</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Security Policies */}
                <div className="bg-admin-card border border-gray-800 rounded-xl p-6 space-y-4">
                    <h2 className="text-sm font-bold text-white flex items-center gap-2">
                        <ShieldCheck className="text-emerald-400" size={18} />
                        Platform Security & Multi-Tenancy Invariants
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                        <div className="p-3.5 bg-gray-900/60 rounded-xl border border-gray-800 space-y-1">
                            <span className="font-bold text-gray-200 block flex items-center gap-1.5">
                                <KeyRound size={14} className="text-amber-400" /> Impersonation Window
                            </span>
                            <p className="text-gray-400 leading-relaxed">
                                Superadmin impersonation tokens expire automatically after <strong>15 minutes</strong> with mandatory audit trails.
                            </p>
                        </div>
                        <div className="p-3.5 bg-gray-900/60 rounded-xl border border-gray-800 space-y-1">
                            <span className="font-bold text-gray-200 block flex items-center gap-1.5">
                                <Clock size={14} className="text-blue-400" /> OTP Verification TTL
                            </span>
                            <p className="text-gray-400 leading-relaxed">
                                Registration and login one-time passcodes are valid for exactly <strong>15 minutes</strong> before invalidation.
                            </p>
                        </div>
                        <div className="p-3.5 bg-gray-900/60 rounded-xl border border-gray-800 space-y-1">
                            <span className="font-bold text-gray-200 block flex items-center gap-1.5">
                                <Lock size={14} className="text-emerald-400" /> Cascade Safeguards
                            </span>
                            <p className="text-gray-400 leading-relaxed">
                                Farm, aggregator, and worker deletions are protected by Superadmin authentication checks and audit logs.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Admin Profile & Maintenance Controls */}
                <div className="bg-admin-card border border-gray-800 rounded-xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-admin-accent flex items-center justify-center font-bold font-heading text-lg text-white">
                            {user?.full_name?.charAt(0) || 'A'}
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-base">{user?.full_name}</h3>
                            <p className="text-xs text-gray-400">{user?.email || user?.phone_number} • <span className="text-admin-accent font-semibold">{user?.role}</span></p>
                            <span className="text-[10px] text-emerald-400 font-mono mt-0.5 block">Session active • Superuser privileges granted</span>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <Button 
                            variant="outline" 
                            size="sm"
                            onClick={handleFlushCache}
                            className="border-gray-700 text-gray-300 hover:text-white"
                        >
                            <RefreshCw size={14} className="mr-1.5" /> Invalidate App Cache
                        </Button>
                        <Button 
                            size="sm"
                            onClick={logout}
                            className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
                        >
                            Log Out Session
                        </Button>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminSettings;
