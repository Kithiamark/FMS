import React, { useState } from 'react';
import { useAnimals } from '../hooks/useAnimals';
import { Link } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import AddAnimalModal from '../components/AddAnimalModal';

const HerdOverview = () => {
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState({ health_status: '', breed: '' });
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // search could be added here
    
    const { data: animals, isLoading } = useAnimals({ search, ...filter });

    const stats = {
        total: animals?.length || 0,
        healthy: animals?.filter(a => a.health_status === 'Healthy').length || 0,
        sick: animals?.filter(a => a.health_status === 'Sick').length || 0,
        pregnant: animals?.filter(a => a.health_status === 'Pregnant').length || 0,
    };

    return (
        <div className="p-4 md:p-8 bg-cream-bg min-h-screen">
            {/* Header & Stats */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-forest-green">Herd Overview</h1>
                <div className="flex gap-4 mt-4 md:mt-0">
                    <div className="bg-white p-3 rounded shadow text-center">
                        <p className="text-sm text-gray-500">Total</p>
                        <p className="text-xl font-bold">{stats.total}</p>
                    </div>
                    <div className="bg-green-100 p-3 rounded shadow text-center text-green-800">
                        <p className="text-sm">Healthy</p>
                        <p className="text-xl font-bold">{stats.healthy}</p>
                    </div>
                    <div className="bg-red-100 p-3 rounded shadow text-center text-red-800">
                        <p className="text-sm">Sick</p>
                        <p className="text-xl font-bold">{stats.sick}</p>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                    <input 
                        type="text" 
                        placeholder="Search by name or ear tag..." 
                        className="w-full pl-10 p-3 rounded border border-gray-300 focus:outline-none focus:border-amber-accent"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <select 
                    className="p-3 rounded border border-gray-300 bg-white"
                    value={filter.health_status}
                    onChange={(e) => setFilter({ ...filter, health_status: e.target.value })}
                >
                    <option value="">All Health Status</option>
                    <option value="Healthy">Healthy</option>
                    <option value="Sick">Sick</option>
                    <option value="Pregnant">Pregnant</option>
                    <option value="Dry">Dry</option>
                </select>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="bg-amber-accent text-white px-6 py-3 rounded font-bold flex items-center gap-2 hover:bg-yellow-600 transition"
                >
                    <Plus size={20} /> Add Animal
                </button>
            </div>

            {/* Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => <div key={i} className="h-64 bg-gray-200 rounded animate-pulse"></div>)}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {animals?.map(animal => (
                        <Link to={`/animals/${animal.id}`} key={animal.id} className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden">
                            <div className="h-48 bg-gray-300 relative">
                                {animal.photo ? (
                                    <img src={animal.photo} alt={animal.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-500">No Photo</div>
                                )}
                                <span className={`absolute top-2 right-2 px-3 py-1 rounded-full text-xs font-bold text-white
                                    ${animal.health_status === 'Healthy' ? 'bg-green-500' : 
                                      animal.health_status === 'Sick' ? 'bg-red-500' : 
                                      animal.health_status === 'Pregnant' ? 'bg-blue-500' : 'bg-gray-500'}`
                                }>
                                    {animal.health_status}
                                </span>
                            </div>
                            <div className="p-4">
                                <h3 className="text-xl font-bold text-forest-green">{animal.name}</h3>
                                <p className="text-gray-600 text-sm">Tag: {animal.ear_tag}</p>
                                <p className="text-gray-600 text-sm">Breed: {animal.breed}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {isModalOpen && <AddAnimalModal onClose={() => setIsModalOpen(false)} />}
        </div>
    );
};

export default HerdOverview;
