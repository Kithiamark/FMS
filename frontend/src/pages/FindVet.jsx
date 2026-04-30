import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../api/axios';
import MainLayout from '../components/Layout/MainLayout';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { MapPin, Star, UserPlus } from 'lucide-react';

const fetchVets = async (filters) => {
    // Construct query string from filters
    const params = new URLSearchParams();
    if (filters.county) params.append('county', filters.county);
    if (filters.specialization && filters.specialization !== 'All') params.append('specialization', filters.specialization);
    // ... other filters
    const { data } = await api.get(`/vets/?${params.toString()}`);
    return data;
};

const VetCard = ({ vet, onConnect }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex gap-4">
                <div className="w-16 h-16 rounded-full bg-forest-green text-white flex items-center justify-center text-xl font-bold font-heading">
                    {vet.name.charAt(0)}
                </div>
                <div className="flex-1">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="font-bold text-lg text-gray-900">{vet.name}</h3>
                            <p className="text-sm text-gray-500">{vet.specialization}</p>
                        </div>
                        <div className="flex items-center gap-1 bg-cream-bg px-2 py-1 rounded-md">
                            <Star size={14} className="text-amber-500 fill-amber-500" />
                            <span className="text-sm font-bold">{vet.average_rating}</span>
                        </div>
                    </div>
                    
                    <div className="mt-3 space-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                            <MapPin size={14} />
                            <span>{vet.county}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-medium text-forest-green">KES {vet.consultation_fee_kes || 'Free'}</span>
                            <span className="text-gray-400">•</span>
                            <span>{vet.years_experience} yrs exp</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-6 flex gap-3">
                <Button variant="ghost" className="flex-1 border border-gray-200">View Profile</Button>
                <Button 
                    className="flex-1 flex items-center justify-center gap-2"
                    onClick={() => onConnect(vet)}
                    disabled={false} // Add logic for connected/pending
                >
                    <UserPlus size={18} /> Connect
                </Button>
            </div>
        </div>
    );
};

const FindVet = () => {
    const { addToast } = useToast();
    const [filters, setFilters] = useState({ county: '', specialization: 'All' });
    const { data: vets, isLoading } = useQuery({ 
        queryKey: ['vets', filters], 
        queryFn: () => fetchVets(filters) 
    });

    const connectMutation = useMutation({
        mutationFn: async ({ vetId, message }) => {
            return await api.post(`/vets/${vetId}/connect/`, { message });
        },
        onSuccess: () => {
            addToast('Connection request sent!', 'success');
        },
        onError: (err) => {
            addToast(err.response?.data?.error || 'Failed to send request', 'error');
        }
    });

    const [selectedVet, setSelectedVet] = useState(null);
    const [connectMessage, setConnectMessage] = useState('');

    const handleConnect = (e) => {
        e.preventDefault();
        if (!selectedVet) return;
        connectMutation.mutate({ vetId: selectedVet.id, message: connectMessage });
        setSelectedVet(null);
        setConnectMessage('');
    };

    return (
        <MainLayout>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h1 className="text-2xl font-bold text-gray-900">Find a Veterinarian</h1>
                    <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                        {['All', 'Dairy', 'General', 'Surgery'].map(spec => (
                            <button
                                key={spec}
                                onClick={() => setFilters({...filters, specialization: spec})}
                                className={`px-4 py-2 rounded-full text-sm whitespace-nowrap border transition-colors
                                    ${filters.specialization === spec 
                                        ? 'bg-forest-green text-white border-forest-green' 
                                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                            >
                                {spec}
                            </button>
                        ))}
                    </div>
                </div>

                {isLoading ? (
                    <div>Loading vets...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {vets?.map(vet => (
                            <VetCard key={vet.id} vet={vet} onConnect={() => setSelectedVet(vet)} />
                        ))}
                    </div>
                )}
            </div>

            <Modal isOpen={!!selectedVet} onClose={() => setSelectedVet(null)} title="Connect with Vet">
                <form onSubmit={handleConnect} className="space-y-4">
                    <p className="text-gray-600">
                        Send a connection request to <strong>{selectedVet?.name}</strong>. 
                        Once accepted, they will be able to view your farm records.
                    </p>
                <textarea 
                        className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-forest-green focus:outline-none"
                        placeholder="Optional message (e.g. 'I have a dairy farm in Kiambu...')"
                        rows="3"
                        value={connectMessage}
                        onChange={e => setConnectMessage(e.target.value)}
                    />
                    <div className="flex justify-end gap-3">
                        <Button type="button" variant="ghost" onClick={() => setSelectedVet(null)}>Cancel</Button>
                        <Button type="submit">Send Request</Button>
                    </div>
                </form>
            </Modal>
        </MainLayout>
    );
};

export default FindVet;
