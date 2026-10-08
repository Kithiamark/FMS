import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { VetLayout } from '../../components/Layout/VetLayout';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';

const VetConnections = () => {
    const queryClient = useQueryClient();
    const { addToast } = useToast();

    const { data: connections, isLoading } = useQuery({ 
        queryKey: ['vetConnections'], 
        queryFn: async () => {
            const { data } = await api.get('/vet/data/connections/');
            return data;
        } 
    });

    const updateConnection = useMutation({
        mutationFn: async ({ id, action }) => {
            await api.post('/vet/data/connections/', { id, action });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vetConnections'] });
            addToast('Connection updated', 'success');
        },
        onError: () => addToast('Failed to update connection', 'error')
    });

    return (
        <VetLayout>
            <div className="space-y-6">
                <h1 className="text-2xl font-bold font-heading text-vet-navy">Farm Connections</h1>
                
                {isLoading ? (
                    <div>Loading connections...</div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="space-y-4">
                            {connections?.map(conn => (
                                <div key={conn.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                                    <div>
                                        <h3 className="font-bold text-gray-900">{conn.farm}</h3>
                                        <p className="text-sm text-gray-500">Farmer: {conn.owner}</p>
                                        <p className="text-xs text-gray-400 mt-1">Requested on: {new Date(conn.date).toLocaleDateString()}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                                            conn.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                                            conn.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                            {conn.status}
                                        </span>
                                        {conn.status === 'PENDING' && (
                                            <>
                                                <Button onClick={() => updateConnection.mutate({ id: conn.id, action: 'accept' })} className="bg-vet-teal text-white py-1 px-3 text-sm">Accept</Button>
                                                <Button onClick={() => updateConnection.mutate({ id: conn.id, action: 'reject' })} variant="ghost" className="text-red-500 py-1 px-3 text-sm hover:bg-red-50">Reject</Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {connections?.length === 0 && <p className="text-center text-gray-500 py-8">No farm connections yet.</p>}
                        </div>
                    </div>
                )}
            </div>
        </VetLayout>
    );
};

export default VetConnections;
