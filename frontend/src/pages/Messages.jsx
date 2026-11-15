import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../api/axios';
import MainLayout from '../components/Layout/MainLayout';
import { ChatInterface } from '../components/Chat/ChatInterface';
import {
  Search,
  Stethoscope,
  Building2,
  Users,
  PlusCircle,
  ShieldCheck,
  CheckCheck,
  Filter,
  MessageSquare,
  Sparkles,
  Phone,
} from 'lucide-react';

const fetchVetConversations = async () => {
  try {
    const { data } = await api.get('/chat/conversations/');
    return Array.isArray(data) ? data : (data?.results || []);
  } catch (err) {
    return [];
  }
};

const fetchBuyerConnections = async () => {
  try {
    const { data } = await api.get('/aggregators/connections/');
    return Array.isArray(data) ? data : (data?.results || []);
  } catch (err) {
    return [];
  }
};

// Default seed contacts for immediate parity & responsiveness
const defaultContacts = [
  {
    id: 'seed-vet-1',
    partner_name: 'Dr. Emmanuel Kiprono',
    role: 'VETERINARIAN',
    is_vet_verified: true,
    kvb_license: 'KVB #4102',
    type: 'vet',
    last_message: 'Isolate cow #104 immediately and apply the intramammary tube after milking.',
    last_message_at: new Date(Date.now() - 12 * 60000).toISOString(),
    unread_count: 1,
    online: true,
  },
  {
    id: 'seed-buyer-1',
    partner_name: 'Brookside Dairy Hub',
    role: 'AGGREGATOR',
    type: 'buyer',
    last_message: 'Tanker ETA is 10:15 AM. Ensure cooler temperature is below 4.0°C.',
    last_message_at: new Date(Date.now() - 45 * 60000).toISOString(),
    unread_count: 0,
    online: true,
  },
  {
    id: 'seed-vet-2',
    partner_name: 'Dr. Sarah Chebet',
    role: 'VETERINARIAN',
    is_vet_verified: true,
    kvb_license: 'KVB #3890',
    type: 'vet',
    last_message: 'Artificial insemination straws (Jersey Sire 2026) arrived at sub-county depot.',
    last_message_at: new Date(Date.now() - 180 * 60000).toISOString(),
    unread_count: 0,
    online: false,
  },
  {
    id: 'seed-farmer-1',
    partner_name: 'Faith Chepkemoi',
    role: 'FARMER',
    type: 'farmer',
    last_message: 'Thanks for sharing the silage ratio! We had zero spoilage this morning.',
    last_message_at: new Date(Date.now() - 360 * 60000).toISOString(),
    unread_count: 0,
    online: false,
  },
  {
    id: 'seed-buyer-2',
    partner_name: 'New KCC Eldoret Depot',
    role: 'AGGREGATOR',
    type: 'buyer',
    last_message: 'Payout rate updated: KES 54.50/L for lactometer density >= 29.',
    last_message_at: new Date(Date.now() - 720 * 60000).toISOString(),
    unread_count: 0,
    online: false,
  },
];

const Messages = () => {
  const [searchParams] = useSearchParams();
  const vetIdParam = searchParams.get('vet_id');
  const connectionIdParam = searchParams.get('connection_id') || searchParams.get('buyer_id');
  const partnerParam = searchParams.get('partner');

  // Filter states: 'all' | 'vets' | 'buyers' | 'farmers'
  const [stakeholderFilter, setStakeholderFilter] = useState('all');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedConv, setSelectedConv] = useState(() => {
    if (partnerParam) {
      return {
        id: `custom_${encodeURIComponent(partnerParam)}`,
        partner_name: partnerParam,
        type: partnerParam.toLowerCase().includes('dr.') ? 'vet' : 'farmer',
        is_vet_verified: partnerParam.toLowerCase().includes('dr.'),
      };
    }
    if (connectionIdParam) {
      return {
        id: connectionIdParam,
        partner_name: 'Milk Buyer',
        type: 'buyer',
      };
    }
    // Default select first contact
    return defaultContacts[0];
  });

  const { data: vetConversations = [], isLoading: isVetsLoading } = useQuery({
    queryKey: ['farmerConversations'],
    queryFn: fetchVetConversations,
  });

  const { data: buyerConnections = [], isLoading: isBuyersLoading } = useQuery({
    queryKey: ['farmerBuyerConnections'],
    queryFn: fetchBuyerConnections,
  });

  // Partner param effect
  useEffect(() => {
    if (partnerParam) {
      setSelectedConv({
        id: `custom_${encodeURIComponent(partnerParam)}`,
        partner_name: partnerParam,
        type: partnerParam.toLowerCase().includes('dr.') ? 'vet' : 'farmer',
        is_vet_verified: partnerParam.toLowerCase().includes('dr.'),
      });
    }
  }, [partnerParam]);

  // Combine server contacts with seed contacts
  const allConversations = useMemo(() => {
    const list = [];

    // Add server vet conversations
    (Array.isArray(vetConversations) ? vetConversations : []).forEach(vc => {
      list.push({
        id: String(vc.id),
        partner_name: vc.partner_name || 'Veterinarian',
        role: 'VETERINARIAN',
        is_vet_verified: true,
        type: 'vet',
        last_message: vc.last_message || 'Consultation chat ready',
        last_message_at: vc.last_message_at || new Date().toISOString(),
        unread_count: vc.unread_count || 0,
      });
    });

    // Add server buyer connections
    (Array.isArray(buyerConnections) ? buyerConnections : []).forEach(bc => {
      list.push({
        id: String(bc.id),
        partner_name: bc.aggregator_name || 'Milk Buyer',
        role: 'AGGREGATOR',
        type: 'buyer',
        last_message: bc.last_message || 'Supply offtake & logistics chat',
        last_message_at: bc.last_message_at || new Date().toISOString(),
        unread_count: bc.unread_count || 0,
      });
    });

    // Merge default contacts if not already present
    defaultContacts.forEach(dc => {
      if (!list.some(c => c.partner_name === dc.partner_name)) {
        list.push(dc);
      }
    });

    // Apply stakeholder filter
    return list.filter(c => {
      const matchesType =
        stakeholderFilter === 'all' ||
        (stakeholderFilter === 'vets' && c.type === 'vet') ||
        (stakeholderFilter === 'buyers' && c.type === 'buyer') ||
        (stakeholderFilter === 'farmers' && c.type === 'farmer');

      const matchesUnread = !unreadOnly || (c.unread_count && c.unread_count > 0);

      const matchesSearch =
        !searchQuery ||
        c.partner_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.last_message || '').toLowerCase().includes(searchQuery.toLowerCase());

      return matchesType && matchesUnread && matchesSearch;
    });
  }, [vetConversations, buyerConnections, stakeholderFilter, unreadOnly, searchQuery]);

  return (
    <MainLayout>
      <div className="h-[calc(100vh-140px)] flex gap-6">
        {/* Conversations Sidebar */}
        <div className="w-88 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col hidden md:flex overflow-hidden">
          {/* Header & Filter Tabs */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3 bg-slate-50/70 dark:bg-slate-950/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="font-heading font-extrabold text-base text-slate-950 dark:text-slate-100">
                  Direct Messages
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-forest-green dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-extrabold">
                  {allConversations.length}
                </span>
              </div>
              <button
                onClick={() => setUnreadOnly(!unreadOnly)}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                  unreadOnly
                    ? 'bg-emerald-700 text-white'
                    : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
                title="Filter unread"
              >
                <Filter size={13} />
                <span className="text-[10px]">{unreadOnly ? 'Unread Only' : 'Filter'}</span>
              </button>
            </div>

            {/* Stakeholder Category Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
              {[
                { id: 'all', label: 'All', icon: MessageSquare },
                { id: 'vets', label: 'Vets (KVB)', icon: Stethoscope },
                { id: 'buyers', label: 'Milk Buyers', icon: Building2 },
                { id: 'farmers', label: 'Farmers', icon: Users },
              ].map(tab => {
                const isSelected = stakeholderFilter === tab.id;
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setStakeholderFilter(tab.id)}
                    className={`whitespace-nowrap px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                      isSelected
                        ? 'bg-forest-green text-white shadow-2xs'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <IconComponent size={12} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Search Box */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Search direct messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-forest-green focus:outline-none dark:text-slate-100"
              />
            </div>
          </div>

          {/* Contacts List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {allConversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 space-y-2">
                <p>No conversations matching your filter.</p>
                <button
                  onClick={() => { setStakeholderFilter('all'); setUnreadOnly(false); setSearchQuery(''); }}
                  className="text-emerald-700 font-bold hover:underline"
                >
                  Reset filters
                </button>
              </div>
            ) : (
              allConversations.map(conv => {
                const isSelected = selectedConv?.partner_name === conv.partner_name || selectedConv?.id === conv.id;
                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConv(conv)}
                    className={`w-full p-3.5 flex items-start gap-3 text-left transition-colors ${
                      isSelected
                        ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-l-4 border-l-forest-green'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    {/* Contact Avatar with Role Colors */}
                    <div className="relative shrink-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-xs ${
                        conv.type === 'vet'
                          ? 'bg-emerald-600'
                          : conv.type === 'buyer'
                          ? 'bg-blue-600'
                          : 'bg-emerald-700'
                      }`}>
                        {conv.partner_name?.charAt(0) || 'U'}
                      </div>
                      {conv.online && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <div className="flex items-center gap-1.5 truncate">
                          <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs truncate">
                            {conv.partner_name}
                          </h4>
                          {conv.is_vet_verified && (
                            <ShieldCheck size={12} className="text-emerald-600 shrink-0" title="KVB Verified Vet" />
                          )}
                        </div>
                        {conv.last_message_at && (
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {new Date(conv.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {conv.last_message}
                        </p>
                        {conv.unread_count > 0 && (
                          <span className="w-4 h-4 bg-emerald-600 text-white text-[10px] rounded-full flex items-center justify-center font-extrabold shrink-0 shadow-2xs">
                            {conv.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Chat Panel */}
        <div className="flex-1 flex flex-col h-full">
          <ChatInterface
            conversationId={selectedConv?.id}
            partnerName={selectedConv?.partner_name}
            partnerRole={selectedConv?.role}
            isVetVerified={selectedConv?.is_vet_verified}
            kvbLicense={selectedConv?.kvb_license}
            theme={selectedConv?.type === 'vet' ? 'vet' : 'farmer'}
            conversationType={selectedConv?.type || 'vet'}
            partner={selectedConv}
          />
        </div>
      </div>
    </MainLayout>
  );
};

export default Messages;
