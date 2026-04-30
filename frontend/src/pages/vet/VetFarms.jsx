import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import { VetLayout } from '../../components/Layout/VetLayout';
import { Button } from '../../components/ui/Button';
import { Building, MapPin, Phone, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const fetchVetFarms = async () => {
    const { data } = await api.get('/vet/data/farms/');
    return data;
};

const VetFarms = () => {
    const { data: farms, isLoading } = useQuery({ queryKey: ['vetFarms'], queryFn: fetchVetFarms });

    return (
        <VetLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-heading font-bold text-vet-navy">My Farms</h1>
                    <div className="relative">
                        <input 
                            type="text" 
                            placeholder="Search farms..." 
                            className="pl-4 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-vet-teal focus:outline-none"
                        />
                    </div>
                </div>

                {isLoading ? (
                    <div>Loading farms...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {farms?.map((farm) => (
                            <div key={farm.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-900">{farm.name}</h3>
                                        <p className="text-sm text-gray-500">{farm.owner}</p>
                                    </div>
                                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600">
                                        <Building size={20} />
                                    </div>
                                </div>
                                
                                <div className="space-y-2 mb-6">
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <MapPin size={16} />
                                        <span>{farm.county || 'Location N/A'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Phone size={16} />
                                        <span>Click to call</span>
                                    </div>
                                </div>

                                <Link to={`/vet/farms/${farm.id}`}>
                                    <Button className="w-full flex items-center justify-center gap-2 bg-vet-teal hover:bg-vet-teal-dark text-white">
                                        View Animals <ChevronRight size={16} />
                                    </Button>
                                </Link>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </VetLayout>
    );
};

export default VetFarms;
