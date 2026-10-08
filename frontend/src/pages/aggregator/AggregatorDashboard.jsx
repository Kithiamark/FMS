import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { 
    useAggregatorProfile, 
    useAggregatorConnections, 
    useMilkCollections, 
    useLogCollectionMutation,
    useUpdateAggregatorProfileMutation 
} from '../../hooks/useAggregator';
import { AggregatorLayout } from '../../components/Layout/AggregatorLayout';
import { Droplets, TrendingUp, Users, CheckCircle, Plus, MessageSquare, FileText, BrainCircuit, ArrowRight, Send, ShieldCheck, Building2, Save } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const MetricCard = ({ title, value, icon, trend }) => {
    const IconComponent = icon;
    return (
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 relative overflow-hidden group">
            <div className="flex justify-between items-start relative z-10">
                <div>
                    <p className="text-slate-500 text-xs font-bold tracking-wider uppercase mb-1">{title}</p>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">{value}</h3>
                    {trend && (
                        <p className={`text-sm mt-2 font-semibold flex items-center gap-1 ${trend.positive ? 'text-emerald-600' : 'text-rose-500'}`}>
                            {trend.positive ? '↑' : '↓'} {trend.value}
                        </p>
                    )}
                </div>
                <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 group-hover:scale-110 transition-transform">
                    <IconComponent className="w-6 h-6 text-blue-600" />
                </div>
            </div>
        </div>
    );
};

const AggregatorDashboard = () => {
    const { addToast } = useToast();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const activeTab = queryParams.get('tab') || 'overview';
    
    const { data: profile, isLoading: profileLoading } = useAggregatorProfile();
    const updateProfileMutation = useUpdateAggregatorProfileMutation();
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [profileFormDraft, setProfileFormDraft] = useState(null);

    const profileForm = React.useMemo(() => profileFormDraft || {
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

    const [isLogging, setIsLogging] = useState(false);
    const [selectedConnection, setSelectedConnection] = useState('');
    const [litres, setLitres] = useState('');
    const [price, setPrice] = useState('45');
    
    const [activeChat, setActiveChat] = useState(null);
    const [chatMessage, setChatMessage] = useState('');

    const totalLitres = collections.reduce((acc, curr) => acc + parseFloat(curr.litres_collected || 0), 0);
    const totalPaid = collections.filter(c => c.payment_status === 'PAID').reduce((acc, curr) => acc + parseFloat(curr.total_price || 0), 0);
    const activeConnections = connections.filter(c => c.status === 'ACCEPTED');

    const chartData = collections.slice(0, 7).map(c => ({
        name: c.date.slice(5),
        volume: parseFloat(c.litres_collected)
    })).reverse();
    if(chartData.length === 0) {
        chartData.push({name: 'Mon', volume: 120}, {name: 'Tue', volume: 150}, {name: 'Wed', volume: 180}, {name: 'Thu', volume: 140}, {name: 'Fri', volume: 200});
    }

    const handleLogCollection = async (e) => {
        e.preventDefault();
        const parsedLitres = parseFloat(litres);
        const parsedPrice = parseFloat(price);
        if (!selectedConnection) {
            addToast('error', 'Please select a connected dairy farm.');
            return;
        }
        if (isNaN(parsedLitres) || parsedLitres <= 0) {
            addToast('error', 'Litres collected must be greater than zero.');
            return;
        }
        if (isNaN(parsedPrice) || parsedPrice <= 0) {
            addToast('error', 'Price per litre must be greater than zero.');
            return;
        }
        try {
            await logCollectionMutation.mutateAsync({
                connection: selectedConnection,
                date: new Date().toISOString().split('T')[0],
                litres_collected: parsedLitres,
                price_per_litre: parsedPrice,
                payment_status: 'PAID'
            });
            addToast('success', 'Collection logged successfully.');
            setIsLogging(false);
            setLitres('');
        } catch (err) {
            const errData = err.response?.data;
            const msg = errData?.detail || errData?.connection?.[0] || errData?.non_field_errors?.[0] || 'Failed to log collection.';
            addToast('error', typeof msg === 'string' ? msg : 'Failed to log collection.');
        }
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if(!chatMessage.trim()) return;
        addToast('success', 'Message sent to farmer!');
        setChatMessage('');
    };

    if (profileLoading || connectionsLoading || collectionsLoading) {
        return <AggregatorLayout><div className="flex h-full items-center justify-center">Loading...</div></AggregatorLayout>;
    }

    return (
        <AggregatorLayout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
                            {activeTab === 'overview' && 'Procurement Overview'}
                            {activeTab === 'intelligence' && 'Market Intelligence'}
                            {activeTab === 'messages' && 'Communications'}
                            {activeTab === 'alerts' && 'System Alerts'}
                        </h1>
                        <p className="text-slate-500 font-medium">Real-time insights across your supply network.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            type="button"
                            onClick={() => setIsProfileModalOpen(true)}
                            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition"
                        >
                            <Building2 size={16} className="text-blue-600" />
                            Business KYC & Indemnity
                        </button>
                    {activeTab === 'overview' && (
                        <button 
                            onClick={() => setIsLogging(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-sm shadow-blue-200 transition-all hover:-translate-y-0.5 flex items-center gap-2 whitespace-nowrap"
                        >
                            <Plus className="w-5 h-5" />
                            Log Collection
                        </button>
                    )}
                    </div>
                </div>

                {activeTab === 'overview' && (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <MetricCard title="Total Volume (L)" value={totalLitres.toLocaleString()} icon={Droplets} trend={{ positive: true, value: "12% vs last week" }} />
                            <MetricCard title="Total Payouts" value={`KES ${totalPaid.toLocaleString()}`} icon={TrendingUp} trend={{ positive: true, value: "On budget" }} />
                            <MetricCard title="Active Farms" value={activeConnections.length} icon={Users} trend={{ positive: true, value: "+2 this month" }} />
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                            <div className="xl:col-span-2 bg-white border border-slate-200 shadow-sm rounded-2xl p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-lg font-bold text-slate-900">Volume Trends</h2>
                                </div>
                                <div className="h-72 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData}>
                                            <defs>
                                                <linearGradient id="colorVol" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                                                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12, fontWeight: 600}} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12, fontWeight: 600}} dx={-10} />
                                            <Tooltip contentStyle={{borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} cursor={{stroke: '#94A3B8', strokeWidth: 1, strokeDasharray: '4 4'}} />
                                            <Area type="monotone" dataKey="volume" stroke="#2563EB" strokeWidth={3} fillOpacity={1} fill="url(#colorVol)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 flex flex-col h-[400px]">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-lg font-bold text-slate-900">Supply Network</h2>
                                </div>
                                <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                                    {activeConnections.length === 0 ? (
                                        <div className="text-center py-10 text-slate-500 text-sm font-medium">No active farms yet.</div>
                                    ) : (
                                        activeConnections.map(conn => (
                                            <div key={conn.id} className="group flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50 hover:border-blue-200 hover:bg-blue-50/50 transition-all">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                                                        <span className="font-bold text-blue-700">{conn.farm_name.charAt(0)}</span>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-slate-900 text-sm group-hover:text-blue-700 transition-colors">{conn.farm_name}</h4>
                                                        <p className="text-xs text-slate-500 font-medium">{conn.status}</p>
                                                    </div>
                                                </div>
                                                <a href="?tab=messages" className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg transition-colors shadow-sm cursor-pointer border border-transparent hover:border-slate-200">
                                                    <MessageSquare className="w-4 h-4" />
                                                </a>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'intelligence' && (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                            <span className="bg-purple-100 text-purple-700 text-xs font-bold px-3 py-1 rounded-full mb-4 inline-block tracking-wider uppercase">AI Generated Report</span>
                            <h2 className="text-2xl font-black text-slate-900 mb-4">Central Region Supply Risk:<br/>Expect 15% drop next week.</h2>
                            <p className="text-slate-600 max-w-2xl text-base leading-relaxed mb-6">
                                Our models detect a combination of rising local temperatures (heat stress) and a cluster of reported mastitis cases in Kiambu county. We recommend securing alternative surplus sources from Muranga.
                            </p>
                            <button 
                                onClick={() => addToast('info', 'AI Newsletter Generation coming soon!')}
                                className="bg-slate-900 text-white font-bold px-5 py-2.5 rounded-xl hover:bg-slate-800 transition-colors"
                            >
                                Read Full Analysis
                            </button>
                        </div>
                        
                        <h3 className="text-lg font-bold text-slate-900 mt-8 mb-4">Past Newsletters</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                {title: 'Market Prices hit KES 50/L average in Nairobi', date: 'Oct 1, 2026'},
                                {title: 'Feed shortages predicted for Q4', date: 'Sep 24, 2026'}
                            ].map((n, i) => (
                                <div key={i} onClick={() => addToast('info', 'Archived report unavailable.')} className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm hover:border-blue-300 transition-all cursor-pointer">
                                    <div className="flex justify-between items-start mb-3">
                                        <FileText className="w-5 h-5 text-slate-400" />
                                        <span className="text-xs font-semibold text-slate-400">{n.date}</span>
                                    </div>
                                    <h4 className="font-bold text-slate-900 text-sm mb-1">{n.title}</h4>
                                    <p className="text-slate-500 text-xs font-medium">Click to read automated breakdown.</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'messages' && (
                    <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden flex h-[600px]">
                        <div className="w-1/3 border-r border-slate-200 bg-slate-50 flex flex-col">
                            <div className="p-4 border-b border-slate-200 bg-white">
                                <h3 className="font-bold text-slate-900">Conversations</h3>
                            </div>
                            <div className="overflow-y-auto flex-1">
                                {activeConnections.length === 0 ? (
                                    <div className="p-4 text-slate-500 text-sm text-center">No active connections.</div>
                                ) : (
                                    activeConnections.map(conn => (
                                        <button 
                                            key={conn.id} 
                                            onClick={() => setActiveChat(conn)}
                                            className={`w-full text-left p-4 border-b border-slate-200/50 transition-colors ${activeChat?.id === conn.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : 'hover:bg-slate-100 border-l-4 border-l-transparent bg-white'}`}
                                        >
                                            <h4 className="font-bold text-slate-900 text-sm">{conn.farm_name}</h4>
                                            <p className="text-xs text-slate-500 truncate mt-1">Tap to open chat</p>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                        
                        <div className="w-2/3 bg-white flex flex-col">
                            {!activeChat ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                                    <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                                        <MessageSquare className="w-8 h-8 text-slate-400" />
                                    </div>
                                    <h2 className="text-lg font-bold text-slate-900 mb-2">Communications Hub</h2>
                                    <p className="text-slate-500 max-w-sm text-sm">Select a farm from the left to send a message.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-white">
                                        <div>
                                            <h3 className="font-bold text-slate-900 text-sm">{activeChat.farm_name}</h3>
                                            <p className="text-xs text-emerald-600 font-medium flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span> Online</p>
                                        </div>
                                    </div>
                                    <div className="flex-1 p-4 overflow-y-auto bg-slate-50">
                                        <div className="text-center my-4">
                                            <span className="text-xs text-slate-400 font-medium bg-white border border-slate-200 px-2 py-1 rounded-md">Today</span>
                                        </div>
                                        <div className="flex flex-col gap-4">
                                            <div className="flex gap-3 max-w-[80%]">
                                                <div className="w-8 h-8 rounded-lg bg-blue-100 flex-shrink-0 flex items-center justify-center">
                                                    <span className="text-xs font-bold text-blue-700">{activeChat.farm_name.charAt(0)}</span>
                                                </div>
                                                <div className="bg-white border border-slate-200 p-3 rounded-xl rounded-tl-none shadow-sm">
                                                    <p className="text-sm text-slate-800">Hello, we have about 150L of surplus milk today. Can you pick it up?</p>
                                                    <p className="text-[10px] text-slate-400 mt-1 text-right">09:00 AM</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-4 border-t border-slate-200 bg-white">
                                        <form onSubmit={handleSendMessage} className="flex gap-2">
                                            <input 
                                                type="text" 
                                                value={chatMessage}
                                                onChange={e => setChatMessage(e.target.value)}
                                                placeholder="Type a message..." 
                                                className="flex-1 bg-slate-50 border-slate-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                                            />
                                            <button type="submit" className="bg-blue-600 text-white p-2.5 rounded-lg hover:bg-blue-700 transition-colors">
                                                <Send className="w-4 h-4" />
                                            </button>
                                        </form>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}
                
                {activeTab === 'alerts' && (
                    <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-8 animate-in fade-in duration-500">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-bold text-slate-900">System Alerts</h2>
                        </div>
                        <div className="space-y-3">
                            {[
                                {title: 'Joe Dairy - Quality Flag', desc: 'Milk temperature logged above threshold upon pickup yesterday.', time: '2 hours ago', type: 'error'},
                                {title: 'Route Optimization', desc: 'New surplus available on your standard route in Kiambu.', time: '5 hours ago', type: 'info'},
                            ].map((alert, i) => (
                                <div key={i} className={`p-4 rounded-xl border-l-4 shadow-sm bg-slate-50 border border-slate-200 ${alert.type === 'error' ? 'border-l-rose-500' : 'border-l-blue-500'}`}>
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className="font-bold text-slate-900 text-sm">{alert.title}</h4>
                                        <span className="text-xs font-semibold text-slate-400">{alert.time}</span>
                                    </div>
                                    <p className="text-slate-600 text-sm font-medium">{alert.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </div>

            {isLogging && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                            <h3 className="text-lg font-bold text-slate-900">Log Pickup</h3>
                            <button onClick={() => setIsLogging(false)} className="text-slate-400 hover:text-slate-700">&times;</button>
                        </div>
                        <form onSubmit={handleLogCollection} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Select Farm</label>
                                <select 
                                    className="w-full bg-white border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
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
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Volume (L)</label>
                                    <input 
                                        type="number" 
                                        min="1" step="0.1" 
                                        className="w-full bg-white border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                                        value={litres}
                                        onChange={(e) => setLitres(e.target.value)}
                                        required 
                                        placeholder="0.0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Price / L (KES)</label>
                                    <input 
                                        type="number" 
                                        min="1" 
                                        className="w-full bg-white border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                        required 
                                    />
                                </div>
                            </div>
                            
                            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex justify-between items-center mt-6">
                                <span className="font-semibold text-blue-800 text-sm">Farmer Payout</span>
                                <span className="text-xl font-bold text-blue-900">
                                    KES {((parseFloat(litres) || 0) * (parseFloat(price) || 0)).toLocaleString()}
                                </span>
                            </div>
                            
                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setIsLogging(false)} className="flex-1 bg-white border border-slate-300 text-slate-700 font-bold py-2 rounded-lg hover:bg-slate-50 text-sm">
                                    Cancel
                                </button>
                                <button type="submit" disabled={logCollectionMutation.isPending} className="flex-1 bg-blue-600 text-white font-bold py-2 rounded-lg shadow-sm hover:bg-blue-700 disabled:opacity-70 flex items-center justify-center gap-2 text-sm">
                                    {logCollectionMutation.isPending ? 'Saving...' : 'Confirm'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

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
