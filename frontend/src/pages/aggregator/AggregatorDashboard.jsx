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
    Droplets, CheckCircle, Plus, Building2, Truck, Info
} from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';

import { AggregatorOverviewTab } from './components/AggregatorOverviewTab';
import { AggregatorIntelligenceTab } from './components/AggregatorIntelligenceTab';
import { AggregatorChatTab } from './components/AggregatorChatTab';
import { AggregatorAlertsTab } from './components/AggregatorAlertsTab';
import { LogCollectionModal } from './components/LogCollectionModal';
import { AggregatorProfileModal } from './components/AggregatorProfileModal';

const fetchAnnouncements = async () => {
    try {
        const { data } = await api.get('/admin/announcements/');
        return data;
    } catch {
        return [];
    }
};

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

    const { data: rawAnnouncements = [] } = useQuery({
        queryKey: ['marketAnnouncements'],
        queryFn: fetchAnnouncements
    });

    const bulletins = useMemo(() => {
        return (rawAnnouncements || []).map(a => ({
            id: a.id,
            title: a.title,
            date: a.created_at ? new Date(a.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent',
            category: a.target_audience || 'Market Intelligence',
            impact: 'Industry Advisory',
            summary: a.body ? (a.body.length > 140 ? a.body.slice(0, 140) + '...' : a.body) : '',
            details: a.body || ''
        }));
    }, [rawAnnouncements]);

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
                <div className="flex h-full items-center justify-center py-24">
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
                                {profile?.is_verified ? (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 px-2.5 py-0.5 text-xs font-bold text-emerald-300">
                                        <CheckCircle size={13} /> Verified Off-Taker
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 border border-amber-400/30 px-2.5 py-0.5 text-xs font-bold text-amber-300">
                                        Verification Pending
                                    </span>
                                )}
                                {profile?.indemnity_agreed ? (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 px-2.5 py-0.5 text-xs font-bold text-emerald-300">
                                        <CheckCircle size={13} /> KYC Verified
                                    </span>
                                ) : (
                                    <button 
                                        type="button"
                                        onClick={() => setIsProfileModalOpen(true)}
                                        className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 border border-amber-400/30 px-2.5 py-0.5 text-xs font-bold text-amber-300 hover:bg-amber-500/30 transition touch-target"
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
                            className="flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white/80 backdrop-blur-md px-4 py-2.5 text-xs font-bold text-slate-700 shadow-xs hover:bg-white transition touch-target"
                        >
                            <Building2 size={16} className="text-blue-600" />
                            Business KYC & Indemnity
                        </button>
                        {activeTab === 'overview' && (
                            <button 
                                onClick={() => setIsLogging(true)}
                                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-md shadow-blue-500/20 transition-all hover:-translate-y-0.5 flex items-center gap-2 whitespace-nowrap text-sm touch-target"
                            >
                                <Plus className="w-4 h-4" />
                                Log Collection
                            </button>
                        )}
                    </div>
                </div>

                {/* TAB: OVERVIEW */}
                {activeTab === 'overview' && (
                    <AggregatorOverviewTab
                        totalLitres={totalLitres}
                        totalPaid={totalPaid}
                        gradeAPercent={gradeAPercent}
                        avgLactometer={avgLactometer}
                        activeConnections={activeConnections}
                        connections={connections}
                        chartData={chartData}
                        collections={collections}
                        handleOpenChatWithFarm={handleOpenChatWithFarm}
                        onOpenLogModal={() => setIsLogging(true)}
                    />
                )}

                {/* TAB: INTELLIGENCE */}
                {activeTab === 'intelligence' && (
                    <AggregatorIntelligenceTab
                        bulletins={bulletins}
                        setSelectedBulletin={setSelectedBulletin}
                    />
                )}

                {/* TAB: COMMUNICATIONS / CHAT */}
                {activeTab === 'messages' && (
                    <AggregatorChatTab
                        activeConnections={activeConnections}
                        selectedChatId={selectedChatId}
                        setSelectedChatId={setSelectedChatId}
                        activeChat={activeChat}
                        messages={messages}
                        messagesLoading={messagesLoading}
                        chatMessage={chatMessage}
                        setChatMessage={setChatMessage}
                        handleSendMessage={handleSendMessage}
                        isSending={sendMessageMutation.isPending}
                        messagesEndRef={messagesEndRef}
                    />
                )}
                
                {/* TAB: ALERTS */}
                {activeTab === 'alerts' && (
                    <AggregatorAlertsTab
                        onNavigateOverview={() => navigate('/aggregator/dashboard?tab=overview')}
                        onOpenProfile={() => setIsProfileModalOpen(true)}
                    />
                )}

            </div>

            {/* MODAL: LOG MILK PICKUP WITH FULL QUALITY CONTROL */}
            <LogCollectionModal
                isOpen={isLogging}
                onClose={() => setIsLogging(false)}
                onSubmit={handleLogCollection}
                isSubmitting={logCollectionMutation.isPending}
                activeConnections={activeConnections}
                selectedConnection={selectedConnection}
                setSelectedConnection={setSelectedConnection}
                litres={litres}
                setLitres={setLitres}
                price={price}
                setPrice={setPrice}
                lactometer={lactometer}
                setLactometer={setLactometer}
                temperature={temperature}
                setTemperature={setTemperature}
                alcoholPassed={alcoholPassed}
                setAlcoholPassed={setAlcoholPassed}
                qualityGrade={qualityGrade}
                setQualityGrade={setQualityGrade}
                rejectionReason={rejectionReason}
                setRejectionReason={setRejectionReason}
                calculatedPayout={calculatedPayout}
            />

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
                                className="bg-slate-900 text-white px-4 py-2 text-xs font-bold rounded-xl hover:bg-slate-800 shadow-xs touch-target"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Aggregator KYC & Indemnity Modal */}
            <AggregatorProfileModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
                onSubmit={handleSaveProfile}
                isSubmitting={updateProfileMutation.isPending}
                profileForm={profileForm}
                setProfileForm={setProfileForm}
            />
        </AggregatorLayout>
    );
};

export default AggregatorDashboard;
