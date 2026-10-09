import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../api/axios';
import MainLayout from '../components/Layout/MainLayout';
import { ChatInterface } from '../components/Chat/ChatInterface';
import { Search, Stethoscope, Building2, PlusCircle, ArrowUpRight } from 'lucide-react';

const fetchVetConversations = async () => {
    const { data } = await api.get('/chat/conversations/');
    return Array.isArray(data) ? data : (data?.results || []);
};

const fetchBuyerConnections = async () => {
    const { data } = await api.get('/aggregators/connections/');
    return Array.isArray(data) ? data : (data?.results || []);
};

const Messages = () => {
    const [searchParams] = useSearchParams();
    const vetIdParam = searchParams.get('vet_id');
    const connectionIdParam = searchParams.get('connection_id') || searchParams.get('buyer_id');

    const [activeTab, setActiveTab] = useState(connectionIdParam ? 'buyers' : 'vets');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedConv, setSelectedConv] = useState(() => {
        if (connectionIdParam) {
            return {
                id: connectionIdParam,
                partner_name: 'Milk Buyer',
                type: 'buyer',
            };
        }
        return null;
    });

    const { data: vetConversations = [], isLoading: isVetsLoading } = useQuery({
        queryKey: ['farmerConversations'],
        queryFn: fetchVetConversations,
    });

    const { data: buyerConnections = [], isLoading: isBuyersLoading } = useQuery({
        queryKey: ['farmerBuyerConnections'],
        queryFn: fetchBuyerConnections,
    });

    // Auto-select or create conversation when navigated with vet_id
    useEffect(() => {
        if (!vetIdParam) return;
        let isMounted = true;
        api.post('/chat/conversations/get-or-create/', { vet_id: vetIdParam })
            .then(({ data }) => {
                if (isMounted) {
                    setSelectedConv({
                        id: data.id,
                        partner_name: data.partner_name,
                        type: 'vet',
                    });
                }
            })
            .catch(err => {
                console.error('Failed to get or create conversation with vet:', err);
            });
        return () => {
            isMounted = false;
        };
    }, [vetIdParam]);

    // Filter lists
    const filteredVets = vetConversations.filter(c =>
        c.partner_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredBuyers = buyerConnections.filter(c =>
        (c.aggregator_name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <MainLayout>
            <div className="h-[calc(100vh-140px)] flex gap-6">
                {/* Conversations Sidebar */}
                <div className="w-80 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col hidden md:flex overflow-hidden">
                    {/* Header & Tabs */}
                    <div className="p-4 border-b space-y-3 bg-gray-50/70">
                        <div className="flex items-center justify-between">
                            <h2 className="font-bold text-lg text-gray-900">Direct Messages</h2>
                        </div>

                        {/* Stakeholder Category Tabs */}
                        <div className="grid grid-cols-2 p-1 bg-gray-200/70 rounded-lg text-xs font-semibold">
                            <button
                                onClick={() => {
                                    setActiveTab('vets');
                                    setSelectedConv(null);
                                }}
                                className={`py-1.5 px-2 rounded-md flex items-center justify-center gap-1.5 transition-all ${
                                    activeTab === 'vets'
                                        ? 'bg-white text-forest-green shadow-xs'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                <Stethoscope size={13} />
                                <span>Veterinarians</span>
                            </button>
                            <button
                                onClick={() => {
                                    setActiveTab('buyers');
                                    setSelectedConv(null);
                                }}
                                className={`py-1.5 px-2 rounded-md flex items-center justify-center gap-1.5 transition-all ${
                                    activeTab === 'buyers'
                                        ? 'bg-white text-forest-green shadow-xs'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                <Building2 size={13} />
                                <span>Milk Buyers</span>
                            </button>
                        </div>

                        {/* Search Box */}
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder={`Search ${activeTab === 'vets' ? 'vets' : 'buyers'}...`}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-forest-green focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Contacts List */}
                    <div className="flex-1 overflow-y-auto">
                        {activeTab === 'vets' ? (
                            isVetsLoading ? (
                                <div className="p-4 text-center text-xs text-gray-500">Loading vet chats...</div>
                            ) : filteredVets.length === 0 ? (
                                <div className="p-6 text-center text-xs text-gray-500 space-y-3">
                                    <p>No active veterinary conversations found.</p>
                                    <Link
                                        to="/find-vet"
                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-forest-green/10 text-forest-green font-semibold hover:bg-forest-green/20"
                                    >
                                        <PlusCircle size={14} /> Find a Vet
                                    </Link>
                                </div>
                            ) : (
                                filteredVets.map(conv => (
                                    <button
                                        key={conv.id}
                                        onClick={() => setSelectedConv({
                                            id: conv.id,
                                            partner_name: conv.partner_name,
                                            type: 'vet',
                                        })}
                                        className={`w-full p-3.5 flex items-start gap-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-100 ${
                                            selectedConv?.id === conv.id ? 'bg-emerald-50/70 border-l-4 border-l-forest-green' : ''
                                        }`}
                                    >
                                        <div className="w-9 h-9 rounded-full bg-forest-green text-white flex-shrink-0 flex items-center justify-center font-bold text-xs shadow-xs">
                                            {conv.partner_name?.charAt(0) || 'D'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-baseline mb-0.5">
                                                <h4 className="font-semibold text-gray-900 text-xs truncate">{conv.partner_name}</h4>
                                                {conv.last_message_at && (
                                                    <span className="text-[10px] text-gray-400">
                                                        {new Date(conv.last_message_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 truncate">{conv.last_message || 'Consultation chat ready'}</p>
                                        </div>
                                        {conv.unread_count > 0 && (
                                            <span className="w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                                                {conv.unread_count}
                                            </span>
                                        )}
                                    </button>
                                ))
                            )
                        ) : (
                            isBuyersLoading ? (
                                <div className="p-4 text-center text-xs text-gray-500">Loading buyer connections...</div>
                            ) : filteredBuyers.length === 0 ? (
                                <div className="p-6 text-center text-xs text-gray-500 space-y-3">
                                    <p>No active milk buyer connections.</p>
                                    <Link
                                        to="/find-buyer"
                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-forest-green/10 text-forest-green font-semibold hover:bg-forest-green/20"
                                    >
                                        <PlusCircle size={14} /> Find Buyers
                                    </Link>
                                </div>
                            ) : (
                                filteredBuyers.map(conn => (
                                    <button
                                        key={conn.id}
                                        onClick={() => setSelectedConv({
                                            id: conn.id,
                                            partner_name: conn.aggregator_name || 'Milk Buyer',
                                            type: 'buyer',
                                        })}
                                        className={`w-full p-3.5 flex items-start gap-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-100 ${
                                            selectedConv?.id === conn.id ? 'bg-emerald-50/70 border-l-4 border-l-forest-green' : ''
                                        }`}
                                    >
                                        <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex-shrink-0 flex items-center justify-center font-bold text-xs shadow-xs">
                                            {conn.aggregator_name?.charAt(0) || 'B'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-baseline mb-0.5">
                                                <h4 className="font-semibold text-gray-900 text-xs truncate">{conn.aggregator_name || 'Milk Buyer'}</h4>
                                                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                                                    {conn.status || 'Active'}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 truncate">Supply offtake & logistics chat</p>
                                        </div>
                                    </button>
                                ))
                            )
                        )}
                    </div>
                </div>

                {/* Chat Panel */}
                <div className="flex-1 flex flex-col h-full">
                    <ChatInterface
                        conversationId={selectedConv?.id}
                        partnerName={selectedConv?.partner_name}
                        theme="farmer"
                        conversationType={selectedConv?.type || (activeTab === 'buyers' ? 'buyer' : 'vet')}
                    />
                </div>
            </div>
        </MainLayout>
    );
};

export default Messages;
