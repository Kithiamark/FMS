import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
    useAggregatorProfile, 
    useAggregatorConnections, 
    useMilkCollections, 
    useLogCollectionMutation,
    useUpdateAggregatorProfileMutation,
    useConnectionMessages,
    useSendMessageMutation
} from '../../hooks/useAggregator';
import { AggregatorLayout } from '../../components/Layout/AggregatorLayout';
import { 
    Droplets, TrendingUp, Users, CheckCircle, Plus, MessageSquare, 
    FileText, ArrowRight, Send, ShieldCheck, Building2, Save, 
    Truck, Sparkles, AlertTriangle, XCircle, Thermometer, 
    FlaskConical, ChevronRight, Check, Info
} from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const MetricCard = ({ title, value, icon, trend }) => {
    const IconComponent = icon;
    return (
        <div className="backdrop-blur-xl bg-white/80 border border-white/60 shadow-lg shadow-slate-200/50 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:bg-white/95 relative overflow-hidden group">
            <div className="flex justify-between items-start relative z-10">
                <div>
                    <p className="text-slate-500 text-xs font-bold tracking-wider uppercase mb-1.5">{title}</p>
                    <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{value}</h3>
                    {trend && (
                        <div className="mt-2.5 inline-flex items-center gap-1.5">
                            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${trend.positive ? 'text-emerald-700 bg-emerald-500/10 border-emerald-500/20' : 'text-rose-700 bg-rose-500/10 border-rose-500/20'}`}>
                                {trend.positive ? '↑' : '↓'} {trend.value}
                            </span>
                        </div>
                    )}
                </div>
                <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-3.5 rounded-2xl shadow-md shadow-blue-500/20 text-white group-hover:scale-110 transition-transform">
                    <IconComponent className="w-6 h-6 text-white" />
                </div>
            </div>
        </div>
    );
};

// Intelligence bulletins dataset
const PAST_BULLETINS = [
    {
        id: 1,
        title: 'Market Prices hit KES 50/L average in Nairobi',
        date: 'Oct 1, 2026',
        category: 'Pricing Dynamics',
        impact: 'High Margin Opportunity',
        summary: 'Farmgate vs processor spread widening as school term opening spikes institutional consumption.',
        details: 'Nairobi processors have raised intake contracts to KES 50-53/L amidst school reopening demand. Aggregators securing milk at KES 42-45/L from Kiambu and Nyandarua are capturing gross spreads of KES 7-8/L. Recommendation: Lock in 30-day volume commitments with commercial cooperatives before processor quotas saturate.'
    },
    {
        id: 2,
        title: 'Feed shortages predicted for Q4',
        date: 'Sep 24, 2026',
        category: 'Supply Risk',
        impact: 'Medium Production Risk',
        summary: 'Maize silage reserves down 22% in Rift Valley; concentrate prices up 14%.',
        details: 'Poor distribution of short rains has curtailed green fodder yields across the central rift. Commercial dairy farmers are rationing concentrates. Aggregators should expect morning milk volumes to decline by 10% through November unless fodder supplements (Boma Rhodes hay) are co-financed.'
    },
    {
        id: 3,
        title: 'National Cold-Chain Clean Energy Grants',
        date: 'Sep 12, 2026',
        category: 'Capital Subsidies',
        impact: '30% Matching Co-financing',
        summary: 'Ministry of Agriculture matching grants announced for solarized bulk milk coolers.',
        details: 'Eligible licensed aggregators and dairy hubs can apply for 30% capital expenditure co-financing for 1,000L to 5,000L solar-assisted direct expansion milk tanks. Applications open until November 30, 2026 via the Dairy Board procurement portal.'
    }
];

const AggregatorDashboard = () => {
    const { addToast } = useToast();
    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const activeTab = queryParams.get('tab') || 'overview';
    
    const { data: profile, isLoading: profileLoading } = useAggregatorProfile();
    const updateProfileMutation = useUpdateAggregatorProfileMutation();
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [profileFormDraft, setProfileFormDraft] = useState(null);

    const profileForm = useMemo(() => profileFormDraft || {
        organization_name: profile?.organization_name || '',
        business_reg_no: profile?.business_reg_no || '',
        kra_pin: profile?.kra_pin || '',
        contact_person: profile?.contact_person || '',
        office_address: profile?.office_address || '',
        payment_terms: profile?.payment_terms || 'Weekly',
        vehicle_capacity_litres: profile?.vehicle_capacity_litres || 5000,
        indemnity_agreed: profile?.indemnity_agreed || false
    }, [profileFormDraft, profile]);

    const setProfileForm = (updater) => {
        setProfileFormDraft(prev => typeof updater === 'function' ? updater(prev || profileForm) : updater);
    };

    const handleSaveProfile = (e) => {
        e.preventDefault();
        if (!profile?.id) return;
        updateProfileMutation.mutate({ id: profile.id, ...profileForm }, {
            onSuccess: () => {
                setIsProfileModalOpen(false);
                addToast('Aggregator business profile & indemnity saved!', 'success');
            },
            onError: () => addToast('Failed to update business profile', 'error')
        });
    };

    const { data: connections = [], isLoading: connectionsLoading } = useAggregatorConnections();
    const { data: collections = [], isLoading: collectionsLoading } = useMilkCollections();
    const logCollectionMutation = useLogCollectionMutation();

    // Collection logging form state
    const [isLogging, setIsLogging] = useState(false);
    const [selectedConnection, setSelectedConnection] = useState('');
    const [litres, setLitres] = useState('');
    const [price, setPrice] = useState('45');
    const [lactometer, setLactometer] = useState('1.029');
    const [temperature, setTemperature] = useState('4.5');
    const [alcoholPassed, setAlcoholPassed] = useState(true);
    const [qualityGrade, setQualityGrade] = useState('GRADE_A');
    const [rejectionReason, setRejectionReason] = useState('');

    // Chat state
    const [selectedChatId, setSelectedChatId] = useState(null);
    const [chatMessage, setChatMessage] = useState('');
    const messagesEndRef = useRef(null);

    // Active connections
    const activeConnections = useMemo(() => connections.filter(c => c.status === 'ACCEPTED'), [connections]);

    const activeChat = useMemo(() => {
        if (selectedChatId) {
            const found = activeConnections.find(c => c.id === selectedChatId);
            if (found) return found;
        }
        return activeConnections.length > 0 ? activeConnections[0] : null;
    }, [selectedChatId, activeConnections]);

    const { data: messages = [], isLoading: messagesLoading } = useConnectionMessages(activeChat?.id);
    const sendMessageMutation = useSendMessageMutation(activeChat?.id);

    // Intelligence state
    const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
    const [selectedBulletin, setSelectedBulletin] = useState(null);

    // Scroll chat to bottom when messages update
    useEffect(() => {
        if (activeTab === 'messages') {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, activeTab]);

    // Analytics calculations
    const totalLitres = collections.reduce((acc, curr) => acc + parseFloat(curr.litres_collected || 0), 0);
    const totalPaid = collections.filter(c => c.payment_status === 'PAID').reduce((acc, curr) => acc + parseFloat(curr.total_price || 0), 0);
    const vehicleCapacity = Number(profile?.vehicle_capacity_litres) || 5000;
    const capacityPercent = Math.min(Math.round((totalLitres / vehicleCapacity) * 100), 100);

    // QA Calculations
    const totalCollectionsCount = collections.length;
    const gradeACount = collections.filter(c => c.quality_grade === 'GRADE_A').length;
    const gradeAPercent = totalCollectionsCount > 0 ? Math.round((gradeACount / totalCollectionsCount) * 100) : 100;
    const validLactometerCollections = collections.filter(c => c.lactometer_reading != null);
    const avgLactometer = validLactometerCollections.length > 0
        ? (validLactometerCollections.reduce((acc, c) => acc + parseFloat(c.lactometer_reading), 0) / validLactometerCollections.length).toFixed(3)
        : '1.029';

    // Chart intake trend
    const chartData = collections.slice(0, 7).map(c => ({
        name: c.date.slice(5),
        volume: parseFloat(c.litres_collected)
    })).reverse();
    if (chartData.length === 0) {
        chartData.push({name: 'Mon', volume: 120}, {name: 'Tue', volume: 150}, {name: 'Wed', volume: 180}, {name: 'Thu', volume: 140}, {name: 'Fri', volume: 200});
    }

    const calculatedPayout = useMemo(() => {
        if (qualityGrade === 'REJECTED') return 0;
        const l = parseFloat(litres) || 0;
        const p = parseFloat(price) || 0;
        return l * p;
    }, [qualityGrade, litres, price]);

    const handleLogCollection = async (e) => {
        e.preventDefault();
        const parsedLitres = parseFloat(litres);
        const parsedPrice = parseFloat(price);
        const parsedLactometer = parseFloat(lactometer);
        const parsedTemp = parseFloat(temperature);

        if (!selectedConnection) {
            addToast('Please select a connected dairy farm.', 'error');
            return;
        }
        if (isNaN(parsedLitres) || parsedLitres <= 0) {
            addToast('Litres collected must be greater than zero.', 'error');
            return;
        }
        if (isNaN(parsedPrice) || parsedPrice <= 0) {
            addToast('Price per litre must be greater than zero.', 'error');
            return;
        }
        if (isNaN(parsedLactometer) || parsedLactometer < 1.015 || parsedLactometer > 1.045) {
            addToast('Lactometer reading must be between 1.015 and 1.045.', 'error');
            return;
        }
        if (isNaN(parsedTemp) || parsedTemp < -5.0 || parsedTemp > 50.0) {
            addToast('Temperature must be between -5.0°C and 50.0°C.', 'error');
            return;
        }
        if (qualityGrade === 'REJECTED' && !rejectionReason.trim()) {
            addToast('Please specify a rejection reason for non-compliant milk.', 'error');
            return;
        }

        try {
            await logCollectionMutation.mutateAsync({
                connection: selectedConnection,
                date: new Date().toISOString().split('T')[0],
                litres_collected: parsedLitres,
                price_per_litre: parsedPrice,
                payment_status: 'PAID',
                lactometer_reading: parsedLactometer,
                temperature_celsius: parsedTemp,
                alcohol_test_passed: alcoholPassed,
                quality_grade: qualityGrade,
                rejection_reason: qualityGrade === 'REJECTED' ? rejectionReason : ''
            });
            addToast('Milk collection & quality verification logged successfully.', 'success');
            setIsLogging(false);
            setLitres('');
            setRejectionReason('');
            setQualityGrade('GRADE_A');
            setAlcoholPassed(true);
            setLactometer('1.029');
            setTemperature('4.5');
        } catch (err) {
            const errData = err.response?.data;
            const msg = errData?.detail || errData?.connection?.[0] || errData?.non_field_errors?.[0] || 'Failed to log collection.';
            addToast(typeof msg === 'string' ? msg : 'Failed to log collection.', 'error');
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!chatMessage.trim() || !activeChat?.id) return;
        try {
            await sendMessageMutation.mutateAsync(chatMessage);
            setChatMessage('');
            addToast('Message sent to farmer!', 'success');
        } catch {
            addToast('Failed to send message. Please try again.', 'error');
        }
    };

    const handleOpenChatWithFarm = (conn) => {
        setSelectedChatId(conn.id);
        navigate('/aggregator/dashboard?tab=messages');
    };

    if (profileLoading || connectionsLoading || collectionsLoading) {
        return (
            <AggregatorLayout>
                <div className="flex h-full items-center justify-center">
                    <div className="flex items-center gap-3 text-slate-500 font-semibold">
                        <Droplets className="w-6 h-6 animate-pulse text-blue-600" />
                        Loading logistics data...
                    </div>
                </div>
            </AggregatorLayout>
        );
    }

    return (
        <AggregatorLayout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                
                {/* Logistics Hero Banner */}
                <div className="relative overflow-hidden rounded-3xl border border-white/60 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 sm:p-8 text-white shadow-xl shadow-blue-950/20 mb-8 backdrop-blur-xl">
                    <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
                    <div className="pointer-events-none absolute bottom-0 left-1/3 h-48 w-48 rounded-full bg-cyan-400/15 blur-2xl" />

                    <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
                        <div className="lg:col-span-2 space-y-3">
                            <div className="flex flex-wrap items-center gap-2.5">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 px-3 py-1 text-xs font-bold text-blue-200 backdrop-blur-md">
                                    <Truck size={14} className="text-cyan-300" />
                                    Procurement & Route Fleet
                                </span>
                                {profile?.indemnity_agreed ? (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 px-2.5 py-0.5 text-xs font-bold text-emerald-300">
                                        <CheckCircle size={13} /> KYC Verified
                                    </span>
                                ) : (
                                    <button 
                                        type="button"
                                        onClick={() => setIsProfileModalOpen(true)}
                                        className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 border border-amber-400/30 px-2.5 py-0.5 text-xs font-bold text-amber-300 hover:bg-amber-500/30 transition"
                                    >
                                        Pending KYC Indemnity
                                    </button>
                                )}
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                                {profile?.organization_name || 'Commercial Dairy Hub'}
                            </h1>
                            <p className="text-sm text-blue-100/90 max-w-xl font-normal leading-relaxed">
                                Managing cold-chain milk intake, lactometer density quality verification, and transparent farmer settlements across Kiambu and surrounding collection hubs.
                            </p>
                        </div>

                        {/* Route Capacity Gauge */}
                        <div className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-xl shadow-inner space-y-3">
                            <div className="flex justify-between items-baseline">
                                <span className="text-xs font-bold uppercase tracking-wider text-blue-200">Route Intake Capacity</span>
                                <span className="text-xs font-bold text-cyan-300">{capacityPercent}% Utilized</span>
                            </div>
                            <div>
                                <div className="h-3 w-full bg-black/30 rounded-full overflow-hidden p-0.5 border border-white/10">
                                    <div 
                                        className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-700 shadow-sm"
                                        style={{ width: `${capacityPercent}%` }}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-between text-xs text-blue-200/90 pt-1">
                                <span>Logged: <strong className="text-white font-bold">{totalLitres.toLocaleString()} L</strong></span>
                                <span>Fleet Max: <strong className="text-white font-bold">{vehicleCapacity.toLocaleString()} L</strong></span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Subheader and Controls */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                            {activeTab === 'overview' && 'Procurement Overview'}
                            {activeTab === 'intelligence' && 'Market Intelligence'}
                            {activeTab === 'messages' && 'Communications'}
                            {activeTab === 'alerts' && 'System Alerts'}
                        </h2>
                        <p className="text-slate-500 text-sm font-medium">Real-time telemetry and ledger across your contracted farm network.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            type="button"
                            onClick={() => setIsProfileModalOpen(true)}
                            className="flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white/80 backdrop-blur-md px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-white transition"
                        >
                            <Building2 size={16} className="text-blue-600" />
                            Business KYC & Indemnity
                        </button>
                        {activeTab === 'overview' && (
                            <button 
                                onClick={() => setIsLogging(true)}
                                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-md shadow-blue-500/20 transition-all hover:-translate-y-0.5 flex items-center gap-2 whitespace-nowrap text-sm"
                            >
                                <Plus className="w-4 h-4" />
                                Log Collection
                            </button>
                        )}
                    </div>
                </div>

                {/* TAB: OVERVIEW */}
                {activeTab === 'overview' && (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        {/* 4 Metric Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            <MetricCard title="Total Volume (L)" value={totalLitres.toLocaleString()} icon={Droplets} trend={{ positive: true, value: "12% vs last week" }} />
                            <MetricCard title="Total Payouts" value={`KES ${totalPaid.toLocaleString()}`} icon={TrendingUp} trend={{ positive: true, value: "On budget" }} />
                            <MetricCard 
                                title="Quality Standard (QA)" 
                                value={`${gradeAPercent}% Grade A`} 
                                icon={FlaskConical} 
                                trend={{ positive: gradeAPercent >= 85, value: `Avg ${avgLactometer} sp.gr` }} 
                            />
                            <MetricCard title="Contracted Farms" value={activeConnections.length} icon={Users} trend={{ positive: true, value: `${connections.length} total registered` }} />
                        </div>

                        {/* Intake Chart & Supply Network */}
                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                            <div className="xl:col-span-2 backdrop-blur-xl bg-white/80 border border-white/60 shadow-lg shadow-slate-200/50 rounded-2xl p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-900">Volume Intake Trends</h2>
                                        <p className="text-xs text-slate-500">Last 7 recorded daily procurement volumes</p>
                                    </div>
                                    <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full">
                                        Litres (L)
                                    </span>
                                </div>
                                <div className="h-72 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData}>
                                            <defs>
                                                <linearGradient id="colorVol" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.35}/>
                                                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.02}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12, fontWeight: 600}} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12, fontWeight: 600}} dx={-10} />
                                            <Tooltip contentStyle={{borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(8px)'}} cursor={{stroke: '#94A3B8', strokeWidth: 1, strokeDasharray: '4 4'}} />
                                            <Area type="monotone" dataKey="volume" stroke="#2563EB" strokeWidth={3} fillOpacity={1} fill="url(#colorVol)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="backdrop-blur-xl bg-white/80 border border-white/60 shadow-lg shadow-slate-200/50 rounded-2xl p-6 flex flex-col h-[400px]">
                                <div className="flex justify-between items-center mb-4">
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-900">Supply Network</h2>
                                        <p className="text-xs text-slate-500">{activeConnections.length} connected dairy farms</p>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                                    {activeConnections.length === 0 ? (
                                        <div className="text-center py-10 text-slate-500 text-sm font-medium">No active farms yet.</div>
                                    ) : (
                                        activeConnections.map(conn => (
                                            <div key={conn.id} className="group flex items-center justify-between p-3.5 rounded-xl border border-slate-200/60 bg-white/70 hover:bg-blue-50/60 hover:border-blue-200 transition-all shadow-xs">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-100 to-indigo-100 border border-blue-200/60 flex items-center justify-center shadow-xs">
                                                        <span className="font-bold text-blue-700">{conn.farm_name.charAt(0)}</span>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-slate-900 text-sm group-hover:text-blue-700 transition-colors">{conn.farm_name}</h4>
                                                        <span className="inline-flex items-center text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60 mt-0.5">
                                                            {conn.status}
                                                        </span>
                                                    </div>
                                                </div>
                                                <button 
                                                    type="button"
                                                    onClick={() => handleOpenChatWithFarm(conn)}
                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-xl transition-colors shadow-xs cursor-pointer border border-transparent hover:border-slate-200"
                                                    title={`Chat with ${conn.farm_name}`}
                                                >
                                                    <MessageSquare className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Recent Collections & Quality Ledger */}
                        <div className="backdrop-blur-xl bg-white/80 border border-white/60 shadow-lg shadow-slate-200/50 rounded-2xl p-6">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                        <FlaskConical className="w-5 h-5 text-blue-600" />
                                        Recent Procurement Records & Quality Ledger
                                    </h2>
                                    <p className="text-xs text-slate-500">Live intake audit trail with lactometer density and platform testing verification</p>
                                </div>
                                <span className="text-xs font-semibold px-3 py-1 bg-slate-100 text-slate-600 rounded-full border border-slate-200">
                                    {collections.length} Total Collections Recorded
                                </span>
                            </div>

                            {collections.length === 0 ? (
                                <div className="text-center py-12 text-slate-400 text-sm font-medium">
                                    No milk collections logged yet. Click "Log Collection" to record your first pickup.
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead>
                                            <tr className="border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider">
                                                <th className="py-3 px-3">Date</th>
                                                <th className="py-3 px-3">Farm</th>
                                                <th className="py-3 px-3">Volume</th>
                                                <th className="py-3 px-3">Quality Grade</th>
                                                <th className="py-3 px-3">Density & Temp</th>
                                                <th className="py-3 px-3">Alcohol Test</th>
                                                <th className="py-3 px-3 text-right">Unit Price</th>
                                                <th className="py-3 px-3 text-right">Settlement</th>
                                                <th className="py-3 px-3 text-center">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 font-medium">
                                            {collections.map(col => {
                                                const isRejected = col.quality_grade === 'REJECTED';
                                                const isGradeB = col.quality_grade === 'GRADE_B';
                                                return (
                                                    <tr key={col.id} className="hover:bg-blue-50/40 transition-colors">
                                                        <td className="py-3.5 px-3 whitespace-nowrap text-slate-600 font-semibold">{col.date}</td>
                                                        <td className="py-3.5 px-3 whitespace-nowrap font-bold text-slate-900">{col.farm_name || 'Contract Farm'}</td>
                                                        <td className="py-3.5 px-3 whitespace-nowrap font-bold text-slate-800">{parseFloat(col.litres_collected).toLocaleString()} L</td>
                                                        <td className="py-3.5 px-3 whitespace-nowrap">
                                                            {isRejected ? (
                                                                <div>
                                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                                                        <XCircle size={12} /> Rejected
                                                                    </span>
                                                                    {col.rejection_reason && (
                                                                        <p className="text-[10px] text-rose-500 mt-0.5 max-w-[140px] truncate" title={col.rejection_reason}>
                                                                            {col.rejection_reason}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            ) : isGradeB ? (
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                                                    <Check size={12} /> Grade B
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                                    <CheckCircle size={12} /> Grade A
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="py-3.5 px-3 whitespace-nowrap text-slate-600">
                                                            <span>{col.lactometer_reading ? `${parseFloat(col.lactometer_reading).toFixed(3)} sp.gr` : '—'}</span>
                                                            <span className="text-slate-400 mx-1">|</span>
                                                            <span>{col.temperature_celsius ? `${col.temperature_celsius}°C` : '—'}</span>
                                                        </td>
                                                        <td className="py-3.5 px-3 whitespace-nowrap">
                                                            {col.alcohol_test_passed ? (
                                                                <span className="text-emerald-700 font-bold text-[11px]">Passed</span>
                                                            ) : (
                                                                <span className="text-rose-600 font-bold text-[11px]">Failed</span>
                                                            )}
                                                        </td>
                                                        <td className="py-3.5 px-3 whitespace-nowrap text-right text-slate-600">KES {parseFloat(col.price_per_litre).toLocaleString()}</td>
                                                        <td className="py-3.5 px-3 whitespace-nowrap text-right font-bold text-slate-900">
                                                            {isRejected ? (
                                                                <span className="text-rose-600 line-through">KES 0.00</span>
                                                            ) : (
                                                                `KES ${parseFloat(col.total_price || 0).toLocaleString()}`
                                                            )}
                                                        </td>
                                                        <td className="py-3.5 px-3 whitespace-nowrap text-center">
                                                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-100 text-emerald-800">
                                                                {col.payment_status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* TAB: MARKET INTELLIGENCE */}
                {activeTab === 'intelligence' && (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        <div className="backdrop-blur-xl bg-white/80 border border-white/60 rounded-2xl p-8 shadow-lg shadow-slate-200/50">
                            <span className="bg-purple-100/80 border border-purple-200 text-purple-700 text-xs font-bold px-3 py-1 rounded-full mb-4 inline-flex items-center gap-1.5 tracking-wider uppercase">
                                <Sparkles size={13} /> AI Generated Report
                            </span>
                            <h2 className="text-2xl font-black text-slate-900 mb-4">Central Region Supply Risk:<br/>Expect 15% drop next week.</h2>
                            <p className="text-slate-600 max-w-2xl text-base leading-relaxed mb-6">
                                Our models detect a combination of rising local temperatures (heat stress) and a cluster of reported mastitis cases in Kiambu county. We recommend securing alternative surplus sources from Muranga.
                            </p>
                            <button 
                                onClick={() => setIsAnalysisModalOpen(true)}
                                className="bg-slate-900 text-white font-bold px-5 py-2.5 rounded-xl hover:bg-slate-800 transition-colors text-sm shadow-md flex items-center gap-2"
                            >
                                Read Full Analysis <ArrowRight size={14} />
                            </button>
                        </div>
                        
                        <h3 className="text-lg font-bold text-slate-900 mt-8 mb-4">Past Intelligence Bulletins</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {PAST_BULLETINS.map((b) => (
                                <div 
                                    key={b.id} 
                                    onClick={() => setSelectedBulletin(b)} 
                                    className="backdrop-blur-xl bg-white/80 border border-white/60 p-5 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="p-2 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <span className="text-xs font-semibold text-slate-400">{b.date}</span>
                                    </div>
                                    <div className="mb-2">
                                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider bg-blue-50/80 px-2 py-0.5 rounded-md border border-blue-100">
                                            {b.category}
                                        </span>
                                    </div>
                                    <h4 className="font-bold text-slate-900 text-sm mb-1 group-hover:text-blue-700 transition-colors">{b.title}</h4>
                                    <p className="text-slate-500 text-xs font-medium line-clamp-2">{b.summary}</p>
                                    <div className="mt-3 text-xs font-bold text-blue-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                        Read breakdown <ChevronRight size={13} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* TAB: COMMUNICATIONS (CHAT) */}
                {activeTab === 'messages' && (
                    <div className="backdrop-blur-xl bg-white/80 border border-white/60 shadow-lg shadow-slate-200/50 rounded-2xl overflow-hidden flex flex-col md:flex-row h-[650px] animate-in fade-in duration-500">
                        {/* Conversations list sidebar */}
                        <div className="w-full md:w-1/3 border-r border-slate-200/70 bg-slate-50/70 flex flex-col">
                            <div className="p-4 border-b border-slate-200/70 bg-white/60 flex justify-between items-center">
                                <h3 className="font-bold text-slate-900">Contracted Farm Chats</h3>
                                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                                    {activeConnections.length} Active
                                </span>
                            </div>
                            <div className="overflow-y-auto flex-1">
                                {activeConnections.length === 0 ? (
                                    <div className="p-8 text-slate-500 text-sm text-center">No connected farms found.</div>
                                ) : (
                                    activeConnections.map(conn => (
                                        <button 
                                            key={conn.id} 
                                            onClick={() => setSelectedChatId(conn.id)}
                                            className={`w-full text-left p-4 border-b border-slate-200/50 transition-colors flex items-center gap-3 ${activeChat?.id === conn.id ? 'bg-blue-50/90 border-l-4 border-l-blue-600' : 'hover:bg-slate-100/80 border-l-4 border-l-transparent bg-white/50'}`}
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-xs flex-shrink-0">
                                                {conn.farm_name.charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-baseline">
                                                    <h4 className="font-bold text-slate-900 text-sm truncate">{conn.farm_name}</h4>
                                                    <span className="text-[10px] text-emerald-600 font-bold uppercase">Connected</span>
                                                </div>
                                                <p className="text-xs text-slate-500 truncate mt-0.5">Click to view direct conversation</p>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                        
                        {/* Conversation main area */}
                        <div className="w-full md:w-2/3 bg-white/80 flex flex-col flex-1">
                            {!activeChat ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                                    <div className="bg-blue-50 border border-blue-100 w-16 h-16 rounded-2xl flex items-center justify-center mb-4 text-blue-600 shadow-sm">
                                        <MessageSquare className="w-8 h-8" />
                                    </div>
                                    <h2 className="text-lg font-bold text-slate-900 mb-2">Communications Hub</h2>
                                    <p className="text-slate-500 max-w-sm text-sm">Select a farm from the left to coordinate milk collections and quality specifications.</p>
                                </div>
                            ) : (
                                <>
                                    {/* Chat Header */}
                                    <div className="p-4 border-b border-slate-200/70 flex justify-between items-center bg-white/70">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-sm">
                                                {activeChat.farm_name.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900 text-sm">{activeChat.farm_name}</h3>
                                                <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                                                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                                                    Direct Encrypted Channel
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Messages list */}
                                    <div className="flex-1 p-4 overflow-y-auto bg-slate-50/50 space-y-4">
                                        {messagesLoading ? (
                                            <div className="flex items-center justify-center h-full text-slate-400 text-sm font-semibold">
                                                <Droplets className="w-5 h-5 animate-spin mr-2 text-blue-600" />
                                                Loading conversation history...
                                            </div>
                                        ) : messages.length === 0 ? (
                                            <div className="text-center my-auto py-16 text-slate-400 text-xs font-medium">
                                                No messages in this conversation yet. Send the first message to schedule pickup or provide quality guidance.
                                            </div>
                                        ) : (
                                            messages.map((msg) => {
                                                const isAggregator = msg.is_me;
                                                const timeFormatted = msg.created_at 
                                                    ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                                                    : '';
                                                return (
                                                    <div 
                                                        key={msg.id} 
                                                        className={`flex gap-2.5 max-w-[85%] ${isAggregator ? 'ml-auto flex-row-reverse' : ''}`}
                                                    >
                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${isAggregator ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                                                            {isAggregator ? 'You' : msg.sender_name?.charAt(0) || 'F'}
                                                        </div>
                                                        <div className={`p-3.5 rounded-2xl shadow-xs text-sm ${isAggregator ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'}`}>
                                                            {!isAggregator && (
                                                                <p className="text-[11px] font-bold text-blue-600 mb-1">{msg.sender_name || 'Farmer'}</p>
                                                            )}
                                                            <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                                            <p className={`text-[10px] mt-1 text-right ${isAggregator ? 'text-blue-100' : 'text-slate-400'}`}>
                                                                {timeFormatted}
                                                            </p>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                        <div ref={messagesEndRef} />
                                    </div>

                                    {/* Send message form */}
                                    <div className="p-4 border-t border-slate-200/70 bg-white/70">
                                        <form onSubmit={handleSendMessage} className="flex gap-2">
                                            <input 
                                                type="text" 
                                                value={chatMessage}
                                                onChange={e => setChatMessage(e.target.value)}
                                                placeholder={`Message ${activeChat.farm_name}...`}
                                                className="flex-1 bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-500 shadow-inner"
                                            />
                                            <button 
                                                type="submit" 
                                                disabled={sendMessageMutation.isPending || !chatMessage.trim()}
                                                className="bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-md flex items-center justify-center"
                                            >
                                                <Send className="w-4 h-4" />
                                            </button>
                                        </form>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}
                
                {/* TAB: ALERTS */}
                {activeTab === 'alerts' && (
                    <div className="backdrop-blur-xl bg-white/80 border border-white/60 shadow-lg shadow-slate-200/50 rounded-2xl p-8 animate-in fade-in duration-500">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">System & Logistics Alerts</h2>
                                <p className="text-xs text-slate-500">Operational flags regarding milk quality thresholds and route scheduling</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            {[
                                {
                                    title: 'Quality Flag: Density Anomaly Detected',
                                    desc: 'Collection on Mary Wanjiku farm logged lactometer reading below standard (1.022 sp.gr) resulting in batch rejection and KES 0 total payout.',
                                    time: 'Yesterday',
                                    type: 'error',
                                    actionLabel: 'Inspect Quality Ledger',
                                    onAction: () => navigate('/aggregator/dashboard?tab=overview')
                                },
                                {
                                    title: 'Route Optimization Opportunity',
                                    desc: 'New surplus available on your standard collection route in Limuru (+350L morning capacity).',
                                    time: '5 hours ago',
                                    type: 'info',
                                    actionLabel: 'View Supply Network',
                                    onAction: () => navigate('/aggregator/dashboard?tab=overview')
                                },
                                {
                                    title: 'Cold-Chain Chiller Calibration Due',
                                    desc: 'Vehicle intake tank thermometer calibration audit due in 5 days to preserve Grade A milk collection warranty.',
                                    time: '2 days ago',
                                    type: 'info',
                                    actionLabel: 'Update KYC & Fleet Specs',
                                    onAction: () => setIsProfileModalOpen(true)
                                },
                            ].map((alert, i) => (
                                <div key={i} className={`p-4 rounded-xl border-l-4 shadow-sm bg-white/90 border border-slate-200/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${alert.type === 'error' ? 'border-l-rose-500' : 'border-l-blue-500'}`}>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            {alert.type === 'error' ? (
                                                <AlertTriangle size={16} className="text-rose-500" />
                                            ) : (
                                                <Info size={16} className="text-blue-500" />
                                            )}
                                            <h4 className="font-bold text-slate-900 text-sm">{alert.title}</h4>
                                            <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{alert.time}</span>
                                        </div>
                                        <p className="text-slate-600 text-xs font-medium leading-relaxed max-w-2xl">{alert.desc}</p>
                                    </div>
                                    <button 
                                        type="button"
                                        onClick={alert.onAction}
                                        className="whitespace-nowrap px-3.5 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-xs hover:border-blue-400 transition"
                                    >
                                        {alert.actionLabel}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </div>

            {/* MODAL: LOG MILK PICKUP WITH FULL QUALITY CONTROL */}
            {isLogging && (
                <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="backdrop-blur-2xl bg-white/95 border border-white/80 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
                        <div className="px-6 py-4 border-b border-slate-200/80 flex justify-between items-center bg-slate-50/70">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <FlaskConical className="w-5 h-5 text-blue-600" />
                                    Log Milk Pickup & Quality Verification
                                </h3>
                                <p className="text-xs text-slate-500">Record intake volume, platform density testing, and payout</p>
                            </div>
                            <button onClick={() => setIsLogging(false)} className="text-slate-400 hover:text-slate-700 text-lg font-bold p-1">&times;</button>
                        </div>
                        <form onSubmit={handleLogCollection} className="p-6 overflow-y-auto space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">Select Contracted Farm</label>
                                <select 
                                    className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 font-medium"
                                    value={selectedConnection}
                                    onChange={(e) => setSelectedConnection(e.target.value)}
                                    required
                                >
                                    <option value="">-- Choose Farm --</option>
                                    {activeConnections.map(c => (
                                        <option key={c.id} value={c.id}>{c.farm_name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Intake Volume (L)</label>
                                    <input 
                                        type="number" 
                                        min="1" step="0.1" 
                                        className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 font-medium"
                                        value={litres}
                                        onChange={(e) => setLitres(e.target.value)}
                                        required 
                                        placeholder="150.0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Agreed Price / L (KES)</label>
                                    <input 
                                        type="number" 
                                        min="1" 
                                        className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 font-medium"
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                        required 
                                    />
                                </div>
                            </div>

                            {/* Quality Verification Group */}
                            <div className="rounded-xl border border-blue-200/80 bg-blue-50/50 p-4 space-y-3.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                                        <FlaskConical size={14} className="text-blue-600" /> Platform Quality Testing
                                    </span>
                                    <span className="text-[11px] text-blue-700 font-semibold">Standard: Pure Milk QA</span>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Lactometer Reading (sp.gr)</label>
                                        <input 
                                            type="number" 
                                            step="0.001" 
                                            min="1.015" 
                                            max="1.045"
                                            value={lactometer}
                                            onChange={(e) => setLactometer(e.target.value)}
                                            className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-3 py-1.5 text-xs font-bold focus:ring-blue-500"
                                            required
                                        />
                                        <p className="text-[10px] text-slate-500 mt-1">Std: 1.028 – 1.032. &lt;1.026 implies dilution.</p>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Milk Temperature (°C)</label>
                                        <input 
                                            type="number" 
                                            step="0.1" 
                                            min="-5.0" 
                                            max="50.0"
                                            value={temperature}
                                            onChange={(e) => setTemperature(e.target.value)}
                                            className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-3 py-1.5 text-xs font-bold focus:ring-blue-500"
                                            required
                                        />
                                        <p className="text-[10px] text-slate-500 mt-1">Cold-chain intake std: ≤ 4.5°C.</p>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Alcohol Platform Test (68% Ethanol)</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button 
                                            type="button"
                                            onClick={() => setAlcoholPassed(true)}
                                            className={`py-1.5 px-3 rounded-lg text-xs font-bold border transition ${alcoholPassed ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
                                        >
                                            Passed (Homogeneous)
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => {
                                                setAlcoholPassed(false);
                                                setQualityGrade('REJECTED');
                                                if (!rejectionReason) setRejectionReason('Failed alcohol platform test (acid curdling / high titratable acidity)');
                                            }}
                                            className={`py-1.5 px-3 rounded-lg text-xs font-bold border transition ${!alcoholPassed ? 'bg-rose-600 text-white border-rose-600 shadow-xs' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
                                        >
                                            Failed (Curdled / Sour)
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Assigned Quality Grade</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        <button 
                                            type="button"
                                            onClick={() => setQualityGrade('GRADE_A')}
                                            className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition ${qualityGrade === 'GRADE_A' ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' : 'bg-white text-slate-700 border-slate-200'}`}
                                        >
                                            Grade A (Premium)
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => setQualityGrade('GRADE_B')}
                                            className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition ${qualityGrade === 'GRADE_B' ? 'bg-amber-600 text-white border-amber-600 shadow-xs' : 'bg-white text-slate-700 border-slate-200'}`}
                                        >
                                            Grade B (Standard)
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => {
                                                setQualityGrade('REJECTED');
                                                if (!rejectionReason) setRejectionReason('Lactometer density below standard (< 1.026 - suspected water addition)');
                                            }}
                                            className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition ${qualityGrade === 'REJECTED' ? 'bg-rose-600 text-white border-rose-600 shadow-xs' : 'bg-white text-slate-700 border-slate-200'}`}
                                        >
                                            Rejected
                                        </button>
                                    </div>
                                </div>

                                {qualityGrade === 'REJECTED' && (
                                    <div className="space-y-1.5 bg-rose-50 border border-rose-200 p-3 rounded-xl animate-in fade-in duration-200">
                                        <label className="block text-[11px] font-bold text-rose-800">Reason for Batch Rejection</label>
                                        <select 
                                            value={rejectionReason}
                                            onChange={(e) => setRejectionReason(e.target.value)}
                                            className="w-full bg-white border border-rose-300 text-rose-900 rounded-lg p-2 text-xs font-medium focus:ring-rose-500"
                                            required
                                        >
                                            <option value="">-- Choose Rejection Reason --</option>
                                            <option value="Lactometer density below standard (< 1.026 - suspected water addition)">Lactometer density below standard (&lt; 1.026 - suspected water dilution)</option>
                                            <option value="Failed alcohol platform test (acid curdling / high titratable acidity)">Failed alcohol platform test (acid curdling / high acidity)</option>
                                            <option value="Temperature exceeds safe cold-chain preservation limit (> 10°C)">Temperature exceeds preservation limit (&gt; 10°C)</option>
                                            <option value="Visual flakes, clots or blood observed (mastitis symptoms)">Visual flakes, clots or blood observed (mastitis risk)</option>
                                        </select>
                                        <p className="text-[10px] text-rose-600 font-semibold pt-1">
                                            Notice: Per QA standards, rejected milk batches are logged with KES 0 total settlement.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Settlement Summary */}
                            <div className="bg-slate-100/80 border border-slate-200 p-4 rounded-xl flex justify-between items-center">
                                <div>
                                    <span className="font-bold text-slate-700 text-xs block">Farmer Settlement Payout</span>
                                    {qualityGrade === 'REJECTED' ? (
                                        <span className="text-[11px] font-semibold text-rose-600">Zero Payout (Batch Rejected)</span>
                                    ) : (
                                        <span className="text-[11px] text-slate-500">{litres || 0} L @ KES {price || 0}/L</span>
                                    )}
                                </div>
                                <span className={`text-xl font-black ${qualityGrade === 'REJECTED' ? 'text-rose-600' : 'text-slate-900'}`}>
                                    KES {calculatedPayout.toLocaleString()}
                                </span>
                            </div>

                            <div className="pt-2 flex gap-3">
                                <button type="button" onClick={() => setIsLogging(false)} className="flex-1 bg-white border border-slate-300 text-slate-700 font-bold py-2.5 rounded-xl hover:bg-slate-50 text-xs">
                                    Cancel
                                </button>
                                <button type="submit" disabled={logCollectionMutation.isPending} className="flex-1 bg-blue-600 text-white font-bold py-2.5 rounded-xl shadow-md hover:bg-blue-700 disabled:opacity-70 flex items-center justify-center gap-2 text-xs">
                                    {logCollectionMutation.isPending ? 'Logging Collection...' : 'Confirm & Log Intake'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: FULL REGIONAL ANALYSIS */}
            <Modal isOpen={isAnalysisModalOpen} onClose={() => setIsAnalysisModalOpen(false)} title="Central Region Milk Supply & Risk Intelligence">
                <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
                    <div className="flex items-center gap-2 bg-purple-50 border border-purple-200 text-purple-900 p-3 rounded-xl">
                        <Sparkles size={16} className="text-purple-600 flex-shrink-0" />
                        <div>
                            <span className="font-bold block">Predictive Risk Forecast (Kiambu & Central Region)</span>
                            <span className="text-[11px] text-purple-700">Confidence Score: 94% based on 18 weather telemetry stations and 42 local herd reports</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h4 className="font-bold text-slate-900 text-sm">Key Risk Drivers:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-1">
                                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                                    <Thermometer size={14} className="text-rose-500" /> Heat Stress Index: +2.8°C
                                </span>
                                <p className="text-slate-600 text-[11px]">
                                    Daytime peak temperatures in Kiambu are projected to reach 28.5°C over the next 10 days, reducing cow dry matter intake by 9-12%.
                                </p>
                            </div>
                            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-1">
                                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                                    <AlertTriangle size={14} className="text-amber-500" /> Mastitis Cluster Signals
                                </span>
                                <p className="text-slate-600 text-[11px]">
                                    14 subclinical mastitis notifications logged by registered veterinarians in Limuru and Kikuyu sub-counties during the past week.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2 pt-2">
                        <h4 className="font-bold text-slate-900 text-sm">Recommended Aggregator Mitigation Strategy:</h4>
                        <ol className="list-decimal pl-4 space-y-1.5 text-slate-600 text-[11px]">
                            <li><strong>Reroute Fleet Surplus:</strong> Dispatch 2 collection tankers towards Muranga South & Nyandarua high-altitude co-ops (+4% surplus buffer available).</li>
                            <li><strong>Enforce Alcohol Testing:</strong> Mandate 68% ethanol platform testing on all morning collections to reject milk with elevated titratable acidity before bulk tank blending.</li>
                            <li><strong>Cold-Chain Preservation:</strong> Maintain depot chilling storage at 3.8°C or below prior to processor transfer to prevent bacterial proliferation.</li>
                        </ol>
                    </div>

                    <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                        <button 
                            type="button" 
                            onClick={() => {
                                setIsAnalysisModalOpen(false);
                                addToast('Intelligence brief printed to logs.', 'info');
                            }} 
                            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                        >
                            Close
                        </button>
                        <button 
                            type="button" 
                            onClick={() => {
                                setIsAnalysisModalOpen(false);
                                navigate('/aggregator/dashboard?tab=overview');
                            }} 
                            className="bg-blue-600 text-white px-4 py-2 text-xs font-bold rounded-xl hover:bg-blue-700 shadow-xs"
                        >
                            View Collection Ledger
                        </button>
                    </div>
                </div>
            </Modal>

            {/* MODAL: BULLETIN VIEWER */}
            <Modal isOpen={!!selectedBulletin} onClose={() => setSelectedBulletin(null)} title={selectedBulletin?.title || 'Intelligence Bulletin'}>
                {selectedBulletin && (
                    <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
                        <div className="flex justify-between items-center bg-slate-50 border border-slate-200 p-3 rounded-xl">
                            <div>
                                <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">{selectedBulletin.category}</span>
                                <p className="text-xs font-bold text-slate-800">{selectedBulletin.impact}</p>
                            </div>
                            <span className="text-xs font-semibold text-slate-400">{selectedBulletin.date}</span>
                        </div>

                        <div>
                            <h4 className="font-bold text-slate-900 text-sm mb-1.5">Executive Summary</h4>
                            <p className="text-slate-600 leading-relaxed">{selectedBulletin.summary}</p>
                        </div>

                        <div className="bg-blue-50/60 border border-blue-200 p-4 rounded-xl space-y-1.5">
                            <h4 className="font-bold text-blue-950 text-xs flex items-center gap-1.5">
                                <Info size={14} className="text-blue-600" /> Operational Assessment & Pricing Outlook
                            </h4>
                            <p className="text-blue-900 text-[11px] leading-relaxed">{selectedBulletin.details}</p>
                        </div>

                        <div className="flex justify-end pt-2">
                            <button 
                                type="button" 
                                onClick={() => setSelectedBulletin(null)}
                                className="bg-slate-900 text-white px-4 py-2 text-xs font-bold rounded-xl hover:bg-slate-800 shadow-xs"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Aggregator KYC & Indemnity Modal */}
            <Modal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} title="Aggregator Business KYC & Trade Indemnity">
                <form onSubmit={handleSaveProfile} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Company / Organization Name</label>
                            <input 
                                required
                                value={profileForm.organization_name}
                                onChange={e => setProfileForm({...profileForm, organization_name: e.target.value})}
                                placeholder="e.g. Brookside Dairy Ltd"
                                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Business Reg. / Certificate No.</label>
                            <input 
                                value={profileForm.business_reg_no}
                                onChange={e => setProfileForm({...profileForm, business_reg_no: e.target.value})}
                                placeholder="CPR/202X/XXXXX"
                                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">KRA Tax PIN</label>
                            <input 
                                value={profileForm.kra_pin}
                                onChange={e => setProfileForm({...profileForm, kra_pin: e.target.value})}
                                placeholder="P051XXXXXXZ"
                                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium uppercase"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Contact Officer Name</label>
                            <input 
                                value={profileForm.contact_person}
                                onChange={e => setProfileForm({...profileForm, contact_person: e.target.value})}
                                placeholder="Full name of operations manager"
                                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Payout Terms</label>
                            <select 
                                value={profileForm.payment_terms}
                                onChange={e => setProfileForm({...profileForm, payment_terms: e.target.value})}
                                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium"
                            >
                                <option value="Daily">Daily Settlement</option>
                                <option value="Weekly">Weekly (Every Monday)</option>
                                <option value="Bi-Weekly">Bi-Weekly (1st & 15th)</option>
                                <option value="Monthly">Monthly Cycle</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Daily Intake Capacity (L)</label>
                            <input 
                                type="number" 
                                value={profileForm.vehicle_capacity_litres}
                                onChange={e => setProfileForm({...profileForm, vehicle_capacity_litres: Number(e.target.value)})}
                                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Main Depot / Dispatch Physical Address</label>
                        <input 
                            value={profileForm.office_address}
                            onChange={e => setProfileForm({...profileForm, office_address: e.target.value})}
                            placeholder="Industrial Area, Road C, Depot 4..."
                            className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium"
                        />
                    </div>

                    {/* Indemnity Section */}
                    <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4 text-xs text-blue-900 space-y-2">
                        <p className="font-bold flex items-center gap-1.5"><ShieldCheck size={16} className="text-blue-600" /> Milk Collection & Trade Settlement Agreement</p>
                        <p className="leading-relaxed text-blue-800">
                            The aggregator confirms adherence to official lactometer density testing, cold chain preservation, and timely payment disbursement according to the declared settlement schedule. The FMS platform functions as an independent verification ledger and does not assume financial underwriting liability for buyer settlement defaults.
                        </p>
                        <label className="flex items-center gap-2 font-bold cursor-pointer pt-1 text-slate-900">
                            <input 
                                type="checkbox"
                                checked={profileForm.indemnity_agreed}
                                onChange={e => setProfileForm({...profileForm, indemnity_agreed: e.target.checked})}
                                className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
                            />
                            <span>I agree to the Commercial Milk Collection & Trade Indemnity Terms</span>
                        </label>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={() => setIsProfileModalOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-500">Cancel</button>
                        <button type="submit" disabled={updateProfileMutation.isPending} className="bg-blue-600 text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5">
                            <Save size={14} /> Save Business Profile
                        </button>
                    </div>
                </form>
            </Modal>
        </AggregatorLayout>
    );
};

export default AggregatorDashboard;
