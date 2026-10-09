import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import MainLayout from '../components/Layout/MainLayout';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../context/AuthContext';
import { 
  Building2, MapPin, Truck, ShieldCheck, CheckCircle2, Clock, 
  Search, MessageSquare, CreditCard, Droplets, RefreshCw
} from 'lucide-react';

const COUNTIES = [
  'All Counties', 'Kiambu', 'Murang\'a', 'Nyeri', 'Nyandarua', 
  'Nakuru', 'Meru', 'Embu', 'Kirinyaga', 'Uasin Gishu'
];

const FindBuyer = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const [selectedCounty, setSelectedCounty] = useState('All Counties');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBuyer, setSelectedBuyer] = useState(null);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);

  // Fetch verified aggregators
  const { data: buyers = [], isLoading: buyersLoading, refetch } = useQuery({
    queryKey: ['aggregatorsList', selectedCounty],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCounty && selectedCounty !== 'All Counties') {
        params.append('county', selectedCounty);
      }
      const { data } = await api.get(`/aggregators/?${params.toString()}`);
      return Array.isArray(data) ? data : (data?.results || []);
    }
  });

  // Fetch farmer's active connections
  const { data: connections = [], isLoading: connectionsLoading } = useQuery({
    queryKey: ['farmerAggregatorConnections'],
    queryFn: async () => {
      const { data } = await api.get('/aggregators/connections/');
      return Array.isArray(data) ? data : (data?.results || []);
    }
  });

  // Map of aggregator ID to connection status
  const connectionMap = React.useMemo(() => {
    const map = {};
    connections.forEach((conn) => {
      if (conn.aggregator) {
        map[conn.aggregator] = conn;
      }
    });
    return map;
  }, [connections]);

  // Connect mutation
  const connectMutation = useMutation({
    mutationFn: async (aggregatorId) => {
      const farmId = user?.farm?.id;
      if (!farmId) {
        throw new Error('Your user account is not associated with an active farm.');
      }
      const { data } = await api.post('/aggregators/connections/', {
        aggregator: aggregatorId,
        farm: farmId
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['farmerAggregatorConnections']);
      setIsConnectModalOpen(false);
      setSelectedBuyer(null);
      addToast('Connection request sent to buyer! They will review your farm.', 'success');
    },
    onError: (err) => {
      const errMsg = err?.response?.data?.detail || err?.response?.data?.aggregator || err?.message || 'Failed to send request';
      addToast(typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg), 'error');
    }
  });

  const filteredBuyers = buyers.filter((buyer) => {
    const nameMatch = (buyer.organization_name || buyer.contact_person || '')
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return nameMatch;
  });

  const handleOpenConnect = (buyer) => {
    setSelectedBuyer(buyer);
    setIsConnectModalOpen(true);
  };

  const handleConfirmConnect = () => {
    if (selectedBuyer) {
      connectMutation.mutate(selectedBuyer.id);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-black text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
              <Building2 className="text-blue-600" size={28} />
              Verified Milk Buyers & Aggregators
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Discover verified dairy cooperatives, chilled offtakers, and logistics buyers in your county.
            </p>
          </div>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()} 
            className="self-start md:self-auto border-slate-200 dark:border-slate-800"
          >
            <RefreshCw size={14} className="mr-1.5" /> Refresh Directory
          </Button>
        </div>

        {/* Filters & Search */}
        <div className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
              <input 
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by buyer name, cooperative, or brand..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* County Select */}
            <div className="sm:w-64">
              <select 
                value={selectedCounty}
                onChange={(e) => setSelectedCounty(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                {COUNTIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Buyers Grid */}
        {buyersLoading || connectionsLoading ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">
            <RefreshCw className="animate-spin mx-auto mb-2 text-blue-600" size={24} />
            Loading verified buyer directory...
          </div>
        ) : filteredBuyers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-12 text-center bg-white/50 dark:bg-slate-900/50">
            <Building2 className="mx-auto text-slate-400 mb-3" size={36} />
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">No buyers found in this county</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Try selecting "All Counties" or check back as more verified cooperatives and middlemen join the network.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredBuyers.map((buyer) => {
              const existingConn = connectionMap[buyer.id];
              const isAccepted = existingConn?.status === 'ACCEPTED';
              const isPending = existingConn?.status === 'PENDING';

              const countiesList = Array.isArray(buyer.operating_counties) 
                ? buyer.operating_counties.join(', ')
                : (buyer.operating_counties || 'Nationwide');

              return (
                <div 
                  key={buyer.id} 
                  className="backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black font-heading text-lg shadow-sm shadow-blue-500/20">
                          {(buyer.organization_name || buyer.contact_person || 'B').charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base leading-snug">
                            {buyer.organization_name || 'Independent Dairy Offtaker'}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {buyer.contact_person ? `Rep: ${buyer.contact_person}` : 'Registered Buyer'}
                          </p>
                        </div>
                      </div>

                      {buyer.is_verified && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/20 px-2 py-0.5 rounded-full">
                          <ShieldCheck size={12} /> Verified
                        </span>
                      )}
                    </div>

                    {/* Logistics / Terms Metadata */}
                    <div className="space-y-2 py-3 border-y border-slate-100 dark:border-slate-800/80 text-xs text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-blue-600 shrink-0" />
                        <span className="truncate"><strong>Coverage:</strong> {countiesList}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Truck size={14} className="text-indigo-600 shrink-0" />
                        <span><strong>Intake Capacity:</strong> {buyer.vehicle_capacity_litres ? `${buyer.vehicle_capacity_litres.toLocaleString()} L/day` : 'Flexible Volume'}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <CreditCard size={14} className="text-emerald-600 shrink-0" />
                        <span><strong>Payment Terms:</strong> {buyer.payment_terms || 'Weekly Settlements'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 mt-2">
                    {isAccepted ? (
                      <div className="flex items-center gap-2">
                        <span className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold">
                          <CheckCircle2 size={14} /> Connected Supplier
                        </span>
                        <Button 
                          size="sm" 
                          onClick={() => navigate(`/messages?connection_id=${existingConn?.id}`)} 
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <MessageSquare size={14} />
                        </Button>
                      </div>
                    ) : isPending ? (
                      <button 
                        disabled 
                        className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-bold cursor-not-allowed"
                      >
                        <Clock size={14} /> Connection Request Pending
                      </button>
                    ) : (
                      <Button 
                        size="sm" 
                        onClick={() => handleOpenConnect(buyer)} 
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl shadow-sm shadow-blue-500/20"
                      >
                        <Droplets size={14} className="mr-1.5" /> Request Milk Offtake Connection
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal: Confirm Connection */}
        <Modal 
          isOpen={isConnectModalOpen} 
          onClose={() => setIsConnectModalOpen(false)} 
          title="Connect with Milk Buyer"
          size="md"
        >
          <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300">
            <p className="leading-relaxed">
              You are requesting to supply milk to <strong>{selectedBuyer?.organization_name || 'this buyer'}</strong>.
            </p>

            <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
              <p><strong>Your Farm:</strong> {user?.farm?.name || 'My Farm'}</p>
              <p><strong>Payment Terms:</strong> {selectedBuyer?.payment_terms || 'Weekly'}</p>
              <p className="text-[11px] text-slate-500">
                Once the buyer approves, your milk collections will be digitally recorded and automatically credited to your farm's income ledger.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setIsConnectModalOpen(false)}>
                Cancel
              </Button>
              <Button 
                size="sm" 
                onClick={handleConfirmConnect}
                disabled={connectMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
              >
                {connectMutation.isPending ? 'Sending...' : 'Confirm Connection Request'}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </MainLayout>
  );
};

export default FindBuyer;
