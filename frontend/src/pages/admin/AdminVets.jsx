import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { AdminLayout } from '../../components/Layout/AdminLayout';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Check, X, Search, Shield, MapPin } from 'lucide-react';

const fetchPendingVets = async () => {
    const { data } = await api.get('/admin/vets/pending/');
    return data;
};

const fetchAllVets = async () => {
    const { data } = await api.get('/admin/vets/');
    return data;
};

const AdminVets = () => {
    const queryClient = useQueryClient();
    const { data: pendingVets, isLoading: pendingLoading } = useQuery({ queryKey: ['pendingVets'], queryFn: fetchPendingVets });
    const { data: allVets, isLoading: allLoading } = useQuery({ queryKey: ['allVets'], queryFn: fetchAllVets });
    
    const [selectedVet, setSelectedVet] = useState(null);
    const [actionType, setActionType] = useState(null); // 'approve' | 'reject'
    const [rejectReason, setRejectReason] = useState('');

    const verifyMutation = useMutation({
        mutationFn: async ({ id, action, reason }) => {
            return await api.patch(`/admin/vets/${id}/verify/`, { action, reason });
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['pendingVets']);
            queryClient.invalidateQueries(['allVets']);
            setSelectedVet(null);
            setActionType(null);
            setRejectReason('');
        }
    });

    const handleAction = () => {
        if (!selectedVet || !actionType) return;
        verifyMutation.mutate({ id: selectedVet.id, action: actionType, reason: rejectReason });
    };

    return (
        <AdminLayout>
            <div className="space-y-8">
                {/* Pending Verification Section */}
                {pendingLoading ? (
                    <div className="p-4 bg-admin-card border border-gray-800 rounded-lg text-gray-400">Loading pending verifications...</div>
                ) : pendingVets?.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-500">
                            <Shield size={20} />
                            <span className="font-bold">Action Required: {pendingVets.length} Veterinarians awaiting verification</span>
                        </div>
                        
                        <div className="bg-admin-card border border-gray-800 rounded-xl overflow-hidden">
                            <table className="w-full text-sm text-left text-gray-400">
                                <thead className="bg-gray-900 text-xs uppercase font-medium text-gray-500">
                                    <tr>
                                        <th className="px-6 py-3">Name</th>
                                        <th className="px-6 py-3">License No.</th>
                                        <th className="px-6 py-3">Specialization</th>
                                        <th className="px-6 py-3">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    {pendingVets.map(vet => (
                                        <tr key={vet.id} className="hover:bg-gray-800/50">
                                            <td className="px-6 py-4 font-medium text-white">{vet.name || vet.user_name}</td>
                                            <td className="px-6 py-4 font-mono text-admin-accent">{vet.license || vet.license_number}</td>
                                            <td className="px-6 py-4">{vet.specialization || 'General'}</td>
                                            <td className="px-6 py-4 flex gap-2">
                                                <Button 
                                                    size="sm" 
                                                    className="bg-green-600 hover:bg-green-700 text-white"
                                                    onClick={() => { setSelectedVet(vet); setActionType('approve'); }}
                                                >
                                                    <Check size={16} className="mr-1" /> Approve
                                                </Button>
                                                <Button 
                                                    size="sm" 
                                                    variant="outline" 
                                                    className="border-red-500 text-red-500 hover:bg-red-500/10"
                                                    onClick={() => { setSelectedVet(vet); setActionType('reject'); }}
                                                >
                                                    <X size={16} className="mr-1" /> Reject
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* All Vets Section */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-white">Veterinarian Directory</h2>
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 text-gray-500" size={16} />
                            <input 
                                type="text" 
                                placeholder="Search by name or license..." 
                                className="pl-10 pr-4 py-2 bg-admin-card border border-gray-800 rounded-lg text-sm text-white focus:ring-1 focus:ring-admin-accent focus:outline-none w-64"
                            />
                        </div>
                    </div>

                    <div className="bg-admin-card border border-gray-800 rounded-xl overflow-hidden">
                        <table className="w-full text-sm text-left text-gray-400">
                            <thead className="bg-gray-900 text-xs uppercase font-medium text-gray-500">
                                <tr>
                                    <th className="px-6 py-3">Name</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3">County</th>
                                    <th className="px-6 py-3">Exp (Yrs)</th>
                                    <th className="px-6 py-3"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {allLoading ? (
                                    <tr><td colSpan="5" className="p-8 text-center">Loading...</td></tr>
                                ) : allVets?.map(vet => (
                                    <tr key={vet.id} className="hover:bg-gray-800/50">
                                        <td className="px-6 py-4 font-medium text-white">
                                            {vet.user_name}
                                            <div className="text-xs text-gray-500">{vet.license_number}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {vet.is_verified ? (
                                                <span className="px-2 py-1 rounded-full bg-green-500/10 text-green-500 text-xs border border-green-500/20">Verified</span>
                                            ) : (
                                                <span className="px-2 py-1 rounded-full bg-amber-500/10 text-amber-500 text-xs border border-amber-500/20">Pending</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 flex items-center gap-1">
                                            <MapPin size={14} /> {vet.county}
                                        </td>
                                        <td className="px-6 py-4">{vet.years_experience}</td>
                                        <td className="px-6 py-4 text-right">
                                            <Button variant="ghost" className="text-admin-accent hover:text-white hover:bg-admin-accent/10">View Details</Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Confirmation Modal */}
            <Modal 
                isOpen={!!selectedVet} 
                onClose={() => { setSelectedVet(null); setActionType(null); }} 
                title={actionType === 'approve' ? 'Approve Veterinarian' : 'Reject Application'}
            >
                <div className="space-y-4">
                    <p className="text-gray-600">
                        Are you sure you want to <strong>{actionType}</strong> {selectedVet?.name || selectedVet?.user_name}?
                        {actionType === 'approve' && " They will be granted access to the platform immediately."}
                    </p>
                    
                    {actionType === 'reject' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Rejection</label>
                            <textarea 
                                className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-red-500 focus:outline-none"
                                rows="3"
                                placeholder="e.g. Invalid license number..."
                                value={rejectReason}
                                onChange={e => setRejectReason(e.target.value)}
                            />
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="ghost" onClick={() => setSelectedVet(null)}>Cancel</Button>
                        <Button 
                            className={actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                            onClick={handleAction}
                        >
                            Confirm {actionType === 'approve' ? 'Approval' : 'Rejection'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </AdminLayout>
    );
};

export default AdminVets;
