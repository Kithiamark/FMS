import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import api from '../../api/axios';
import { VetLayout } from '../../components/Layout/VetLayout';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { FileText, History } from 'lucide-react';

// Fetchers
const fetchFarmAnimals = async (farmId) => {
    const { data } = await api.get(`/vet/data/farms/${farmId}/animals/`);
    return data;
};

// Health Record Modal Form
const HealthRecordForm = ({ animalId, onClose }) => {
    const { addToast } = useToast();
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        diagnosis: '', treatment: '', cost_kes: '', notes: '', next_checkup: ''
    });

    const mutation = useMutation({
        mutationFn: async (data) => {
            return await api.post(`/vet/data/${animalId}/health/`, data);
        },
        onSuccess: () => {
            addToast('Health record saved successfully', 'success');
            queryClient.invalidateQueries(['vetFarmAnimals']);
            onClose();
        },
        onError: () => addToast('Failed to save record', 'error')
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        mutation.mutate(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Diagnosis</label>
                <textarea 
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-vet-teal focus:ring-vet-teal border p-2"
                    rows="2"
                    value={formData.diagnosis}
                    onChange={e => setFormData({...formData, diagnosis: e.target.value})}
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Treatment / Medication</label>
                <textarea 
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-vet-teal focus:ring-vet-teal border p-2"
                    rows="2"
                    value={formData.treatment}
                    onChange={e => setFormData({...formData, treatment: e.target.value})}
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Cost (KES)</label>
                    <input 
                        type="number"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-vet-teal focus:ring-vet-teal border p-2"
                        value={formData.cost_kes}
                        onChange={e => setFormData({...formData, cost_kes: e.target.value})}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Next Checkup</label>
                    <input 
                        type="date"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-vet-teal focus:ring-vet-teal border p-2"
                        value={formData.next_checkup}
                        onChange={e => setFormData({...formData, next_checkup: e.target.value})}
                    />
                </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                <Button type="submit" className="bg-vet-teal hover:bg-vet-teal-dark text-white">Save Record</Button>
            </div>
        </form>
    );
};

const VetFarmDetail = () => {
    const { farmId } = useParams();
    const { data: animals, isLoading } = useQuery({ queryKey: ['vetFarmAnimals', farmId], queryFn: () => fetchFarmAnimals(farmId) });
    const [selectedAnimal, setSelectedAnimal] = useState(null);

    return (
        <VetLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-heading font-bold text-vet-navy">Farm Animals</h1>
                    {/* Add back button or breadcrumbs here */}
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tag</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Health</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {isLoading ? (
                                <tr><td colSpan="5" className="p-4 text-center">Loading...</td></tr>
                            ) : (
                                animals?.map((animal) => (
                                    <tr key={animal.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{animal.tag}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{animal.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <Badge status={animal.status} />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <Badge status={animal.health} className={animal.health === 'Sick' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'} />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end gap-2">
                                            <Button 
                                                variant="ghost" 
                                                className="text-vet-teal hover:text-vet-teal-dark p-1"
                                                title="Log Health Record"
                                                onClick={() => setSelectedAnimal(animal)}
                                            >
                                                <FileText size={18} />
                                            </Button>
                                            <Button variant="ghost" className="text-gray-400 hover:text-gray-600 p-1" title="View History">
                                                <History size={18} />
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal 
                isOpen={!!selectedAnimal} 
                onClose={() => setSelectedAnimal(null)} 
                title={`Log Health Record: ${selectedAnimal?.name} (${selectedAnimal?.tag})`}
            >
                {selectedAnimal && (
                    <HealthRecordForm 
                        animalId={selectedAnimal.id} 
                        onClose={() => setSelectedAnimal(null)} 
                    />
                )}
            </Modal>
        </VetLayout>
    );
};

export default VetFarmDetail;
