import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import { VetLayout } from '../../components/Layout/VetLayout';
import { Activity, Syringe } from 'lucide-react';

const fetchRecords = async () => {
    const { data } = await api.get('/vet/data/records/');
    return data;
};

const VetRecords = () => {
    const { data, isLoading } = useQuery({ queryKey: ['vetRecords'], queryFn: fetchRecords });

    return (
        <VetLayout>
            <div className="space-y-6">
                <h1 className="text-2xl font-bold font-heading text-vet-navy">Global Animal Records</h1>
                
                {isLoading ? (
                    <div>Loading records...</div>
                ) : (
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Health Records */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Activity className="text-vet-teal" /> Health Checkups
                            </h2>
                            <div className="space-y-4">
                                {data?.health?.map(r => (
                                    <div key={`h-${r.id}`} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-bold text-gray-900">{r.animal} <span className="text-sm font-normal text-gray-500">({r.farm})</span></span>
                                            <span className="text-xs text-gray-500">{new Date(r.date).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-sm text-gray-700 font-medium">Diagnosis: {r.diagnosis}</p>
                                        <p className="text-sm text-gray-500">{r.treatment}</p>
                                    </div>
                                ))}
                                {data?.health?.length === 0 && <p className="text-sm text-gray-500">No health records found.</p>}
                            </div>
                        </div>

                        {/* Vaccinations */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Syringe className="text-blue-500" /> Vaccinations
                            </h2>
                            <div className="space-y-4">
                                {data?.vaccinations?.map(r => (
                                    <div key={`v-${r.id}`} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-bold text-gray-900">{r.animal} <span className="text-sm font-normal text-gray-500">({r.farm})</span></span>
                                            <span className="text-xs text-gray-500">{new Date(r.date).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-sm text-gray-700 font-medium">{r.vaccine}</p>
                                        {r.next_due && <p className="text-sm text-orange-600 mt-1">Next due: {new Date(r.next_due).toLocaleDateString()}</p>}
                                    </div>
                                ))}
                                {data?.vaccinations?.length === 0 && <p className="text-sm text-gray-500">No vaccination records found.</p>}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </VetLayout>
    );
};

export default VetRecords;
