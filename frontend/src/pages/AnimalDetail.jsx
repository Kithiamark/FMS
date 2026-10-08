import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAnimal, useDeleteAnimal } from '../hooks/useAnimals';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Download, Trash2, Edit } from 'lucide-react';

const AnimalDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { data: animal, isLoading } = useAnimal(id);
    const { mutate: deleteAnimal } = useDeleteAnimal();
    const [activeTab, setActiveTab] = useState('overview');
    
    if (isLoading) return <div className="p-8">Loading...</div>;
    if (!animal) return <div className="p-8">Animal not found</div>;

    const handleDelete = () => {
        if (confirm('Are you sure you want to archive this animal?')) {
            deleteAnimal(id, { onSuccess: () => navigate('/animals') });
        }
    };

    return (
        <div className="p-4 md:p-8 bg-cream-bg min-h-screen">
            <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 mb-4 hover:text-forest-green">
                <ArrowLeft size={20} className="mr-2" /> Back to Herd
            </button>

            {/* Header Card */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
                <div className="md:flex">
                    <div className="md:w-1/3 h-64 bg-gray-200">
                        {animal.photo ? (
                            <img src={animal.photo} alt={animal.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500">No Photo</div>
                        )}
                    </div>
                    <div className="p-6 md:w-2/3">
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-3xl font-bold text-forest-green mb-2">{animal.name}</h1>
                                <p className="text-gray-600 mb-1">Tag: <span className="font-mono font-bold">{animal.ear_tag}</span></p>
                                <p className="text-gray-600">Breed: {animal.breed}</p>
                            </div>
                            <div className="flex gap-2">
                                <button className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Edit size={20} /></button>
                                {user?.role !== 'FARM_WORKER' && (
                                    <button onClick={handleDelete} className="p-2 text-red-600 hover:bg-red-50 rounded" title="Archive animal">
                                        <Trash2 size={20} />
                                    </button>
                                )}
                            </div>
                        </div>
                        
                        <div className="mt-4 flex flex-wrap gap-2">
                            <span className={`px-3 py-1 rounded-full text-sm font-bold text-white
                                ${animal.health_status === 'Healthy' ? 'bg-green-500' : 
                                  animal.health_status === 'Sick' ? 'bg-red-500' : 
                                  animal.health_status === 'Pregnant' ? 'bg-blue-500' : 'bg-gray-500'}`
                            }>
                                {animal.health_status}
                            </span>
                            <span className="px-3 py-1 rounded-full bg-gray-200 text-sm font-bold text-gray-700">
                                {animal.sex}
                            </span>
                        </div>

                        {/* QR Code */}
                        <div className="mt-6 flex items-center gap-4">
                            {animal.qr_code && (
                                <>
                                    <img src={animal.qr_code} alt="QR Code" className="w-24 h-24 border" />
                                    <a href={animal.qr_code} download={`qr_${animal.ear_tag}.png`} className="flex items-center gap-2 text-amber-accent font-bold hover:underline">
                                        <Download size={16} /> Download QR
                                    </a>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="flex border-b">
                    {['Overview', 'Health', 'Vaccinations'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab.toLowerCase())}
                            className={`flex-1 py-4 font-bold text-center transition
                                ${activeTab === tab.toLowerCase() 
                                    ? 'text-forest-green border-b-4 border-amber-accent bg-green-50' 
                                    : 'text-gray-500 hover:text-forest-green'}`
                            }
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="p-6">
                    {activeTab === 'overview' && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div>
                                <p className="text-sm text-gray-500">Date of Birth</p>
                                <p className="font-bold">{animal.date_of_birth}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Weight</p>
                                <p className="font-bold">{animal.weight_kg} kg</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Age</p>
                                <p className="font-bold">--</p> {/* Calculate age */}
                            </div>
                        </div>
                    )}

                    {activeTab === 'health' && (
                        <div className="space-y-4">
                            <h3 className="font-bold text-lg mb-4">Health History</h3>
                            {animal.health_records?.length === 0 ? (
                                <p className="text-gray-500">No health records found.</p>
                            ) : (
                                animal.health_records?.map(record => (
                                    <div key={record.id} className="border-l-4 border-amber-accent pl-4 py-2 bg-gray-50 rounded-r">
                                        <div className="flex justify-between">
                                            <p className="font-bold">{record.diagnosis}</p>
                                            <span className="text-sm text-gray-500">{record.date}</span>
                                        </div>
                                        <p className="text-sm text-gray-600">{record.treatment}</p>
                                        <p className="text-xs text-gray-400 mt-1">Vet: {record.vet_name || 'N/A'}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {activeTab === 'vaccinations' && (
                        <div className="space-y-4">
                             <h3 className="font-bold text-lg mb-4">Vaccination Records</h3>
                            {animal.vaccinations?.length === 0 ? (
                                <p className="text-gray-500">No vaccinations found.</p>
                            ) : (
                                animal.vaccinations?.map(v => (
                                    <div key={v.id} className="flex justify-between items-center border-b py-3 last:border-0">
                                        <div>
                                            <p className="font-bold">{v.vaccine_name}</p>
                                            <p className="text-sm text-gray-500">Batch: {v.batch_number}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-forest-green">{v.date_given}</p>
                                            <p className="text-xs text-red-500">Next Due: {v.next_due_date || 'N/A'}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AnimalDetail;
