import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import { VetLayout } from '../../components/Layout/VetLayout';
import { DataCard } from '../../components/ui/DataCard';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Building, AlertTriangle, Calendar, MessageSquare, Clock, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

const fetchVetDashboard = async () => {
    const { data } = await api.get('/vet/data/dashboard/');
    return data;
};

const VetDashboard = () => {
    const { data, isLoading } = useQuery({ queryKey: ['vetDashboard'], queryFn: fetchVetDashboard });

    if (isLoading) return <VetLayout><div className="p-8">Loading dashboard...</div></VetLayout>;

    return (
        <VetLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-2xl font-heading font-bold text-vet-navy">Good morning, Doctor</h1>
                        <p className="text-gray-500">{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <DataCard title="Active Farms" value={data?.active_farms} icon={Building} className="border-l-4 border-l-vet-teal" />
                    <DataCard title="At-Risk Animals" value={data?.animals_at_risk?.length || 0} icon={AlertTriangle} className="border-l-4 border-l-red-500" />
                    <DataCard title="Upcoming Visits" value={data?.upcoming_visits?.length || 0} icon={Calendar} className="border-l-4 border-l-blue-500" />
                    <DataCard title="Unread Messages" value={data?.unread_messages} icon={MessageSquare} className="border-l-4 border-l-amber-500" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content - 2 cols */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* At-Risk Animals */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                                <h3 className="font-bold text-vet-navy">At-Risk Animals</h3>
                                <Button variant="ghost" className="text-vet-teal text-sm">View All</Button>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {data?.animals_at_risk?.length === 0 ? (
                                    <div className="p-6 text-center text-gray-500">No high-risk animals detected.</div>
                                ) : (
                                    data?.animals_at_risk?.map((animal, i) => (
                                        <div key={i} className="p-4 flex items-center justify-between hover:bg-gray-50">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold">
                                                    {animal.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{animal.name}</p>
                                                    <p className="text-xs text-gray-500">{animal.farm_name}</p>
                                                </div>
                                            </div>
                                            <Badge status={animal.risk_level} className="bg-red-100 text-red-800" />
                                            <Button variant="ghost" className="text-vet-teal text-sm">Review</Button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Recent Activity / Health Records */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100">
                                <h3 className="font-bold text-vet-navy">Recent Health Records</h3>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {data?.recent_health_records?.map((record, i) => (
                                    <div key={i} className="p-4 flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-gray-900">{record.animal}</p>
                                            <p className="text-sm text-gray-500">{record.diagnosis}</p>
                                        </div>
                                        <span className="text-xs text-gray-400">{record.date}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar - 1 col */}
                    <div className="space-y-6">
                        {/* Today's Schedule */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="font-bold text-vet-navy mb-4">Upcoming Schedule</h3>
                            <div className="space-y-4">
                                {data?.upcoming_visits?.length === 0 ? (
                                    <p className="text-sm text-gray-500">No visits scheduled.</p>
                                ) : (
                                    data?.upcoming_visits?.map((visit, i) => (
                                        <div key={i} className="flex gap-3 items-start">
                                            <div className="mt-1"><Clock size={16} className="text-vet-teal" /></div>
                                            <div>
                                                <p className="font-medium text-sm">{visit.farm}</p>
                                                <p className="text-xs text-gray-500">{new Date(visit.date).toLocaleDateString()} • {visit.type}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            <Button className="w-full mt-4 bg-vet-navy hover:bg-vet-navy-light text-white">Schedule Visit</Button>
                        </div>

                        {/* Pending Connections */}
                        {data?.pending_connections > 0 && (
                            <div className="bg-amber-50 rounded-xl border border-amber-200 p-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <Users className="text-amber-600" size={20} />
                                    <h3 className="font-bold text-amber-800">Pending Requests</h3>
                                </div>
                                <p className="text-sm text-amber-700 mb-4">You have {data.pending_connections} farm connection requests.</p>
                                <Link to="/vet/connections">
                                    <Button variant="ghost" className="w-full bg-white border border-amber-300 text-amber-800 hover:bg-amber-100">Manage Requests</Button>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </VetLayout>
    );
};

export default VetDashboard;
