import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import { VetLayout } from '../../components/Layout/VetLayout';
import { Button } from '../../components/ui/Button';
import { Building, MapPin, ChevronRight, Users, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

const fetchVetFarms = async () => {
    const { data } = await api.get('/vet/data/farms/');
    return data;
};

const VetFarms = () => {
    const { data: farms = [], isLoading } = useQuery({ queryKey: ['vetFarms'], queryFn: fetchVetFarms });
    const [searchTerm, setSearchTerm] = useState('');

    const filteredFarms = farms.filter(f => 
        f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.owner.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <VetLayout>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-heading font-bold text-vet-navy">Connected Dairy Farms</h1>
                        <p className="text-sm text-gray-500">Farms under your veterinary care and clinical oversight ({farms.length})</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative flex-1 sm:w-64">
                            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                            <input 
                                type="text" 
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                placeholder="Search farm or owner..." 
                                className="w-full pl-9 pr-4 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-vet-teal focus:outline-none"
                            />
                        </div>
                        <Link to="/vet/connections">
                            <Button variant="ghost" className="border border-gray-200 text-xs flex items-center gap-1.5 whitespace-nowrap">
                                <Users size={15} /> Network Requests
                            </Button>
                        </Link>
                    </div>
                </div>

                {isLoading ? (
                    <div className="p-8 text-center text-gray-400">Loading client farms...</div>
                ) : filteredFarms.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center space-y-3">
                        <Building size={40} className="mx-auto text-gray-300" />
                        <h3 className="font-bold text-gray-700">No client farms found</h3>
                        <p className="text-sm text-gray-500 max-w-md mx-auto">
                            When dairy farmers send you connection requests and you approve them, their herds and milk records will appear here.
                        </p>
                        <Link to="/vet/connections">
                            <Button className="bg-vet-teal text-white text-xs">Review Pending Requests</Button>
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredFarms.map((farm) => (
                            <div key={farm.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition p-6 flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="font-bold text-lg text-gray-900">{farm.name}</h3>
                                            <p className="text-sm text-gray-500 font-medium">Farmer: {farm.owner}</p>
                                        </div>
                                        <div className="w-11 h-11 bg-teal-50 text-vet-teal rounded-xl flex items-center justify-center font-bold">
                                            <Building size={20} />
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2 mb-6 text-sm text-gray-600 border-t border-gray-100 pt-3">
                                        <div className="flex items-center gap-2">
                                            <MapPin size={15} className="text-gray-400" />
                                            <span>{farm.county || 'Kiambu County'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-emerald-700 text-xs font-semibold">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                            <span>Active Veterinary Care Client</span>
                                        </div>
                                    </div>
                                </div>

                                <Link to={`/vet/farms/${farm.id}`}>
                                    <Button className="w-full flex items-center justify-center gap-2 bg-vet-teal hover:bg-vet-teal-dark text-white rounded-xl text-sm font-semibold">
                                        View Herd & Records <ChevronRight size={16} />
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
