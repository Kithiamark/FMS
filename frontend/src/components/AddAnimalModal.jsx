import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCreateAnimal } from '../hooks/useAnimals';
import { X } from 'lucide-react';
import Input from './Input';

const schema = z.object({
    name: z.string().min(1, "Name is required").trim(),
    ear_tag: z.string().min(1, "Ear tag is required").trim(),
    breed: z.string().min(1, "Breed is required"),
    sex: z.enum(['Bull', 'Heifer', 'Cow']),
    date_of_birth: z.string().refine(val => !val || new Date(val) <= new Date(), "Date of birth cannot be in the future"),
    weight_kg: z.coerce.number().positive("Weight must be greater than zero").max(2500, "Weight exceeds biological limit (2,500 kg)"),
    health_status: z.string(),
});

const AddAnimalModal = ({ onClose }) => {
    const { mutate, isPending } = useCreateAnimal();
    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            health_status: 'Healthy',
            sex: 'Cow'
        }
    });

    const onSubmit = (data) => {
        mutate(data, {
            onSuccess: () => {
                onClose();
            }
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-6 border-b">
                    <h2 className="text-2xl font-bold text-forest-green">Add New Animal</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X size={24} />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Name" {...register('name')} error={errors.name} />
                        <Input label="Ear Tag" {...register('ear_tag')} error={errors.ear_tag} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-forest-green font-bold mb-2">Breed</label>
                            <select {...register('breed')} className="w-full p-3 rounded bg-cream-bg border border-gray-300">
                                <option value="">Select Breed</option>
                                <option value="Friesian">Friesian</option>
                                <option value="Ayrshire">Ayrshire</option>
                                <option value="Jersey">Jersey</option>
                                <option value="Guernsey">Guernsey</option>
                                <option value="Mixed">Mixed</option>
                            </select>
                            {errors.breed && <p className="text-red-500 text-sm">{errors.breed.message}</p>}
                        </div>
                        <div>
                            <label className="block text-forest-green font-bold mb-2">Sex</label>
                            <select {...register('sex')} className="w-full p-3 rounded bg-cream-bg border border-gray-300">
                                <option value="Cow">Cow</option>
                                <option value="Bull">Bull</option>
                                <option value="Heifer">Heifer</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Date of Birth" type="date" {...register('date_of_birth')} error={errors.date_of_birth} />
                        <Input label="Weight (kg)" type="number" step="0.01" {...register('weight_kg')} error={errors.weight_kg} />
                    </div>

                    <div>
                        <label className="block text-forest-green font-bold mb-2">Health Status</label>
                        <select {...register('health_status')} className="w-full p-3 rounded bg-cream-bg border border-gray-300">
                            <option value="Healthy">Healthy</option>
                            <option value="Sick">Sick</option>
                            <option value="Pregnant">Pregnant</option>
                            <option value="Dry">Dry</option>
                        </select>
                    </div>

                    <div className="pt-4">
                        <button 
                            type="submit" 
                            disabled={isPending}
                            className="w-full bg-amber-accent text-white font-bold py-3 rounded hover:bg-yellow-600 transition disabled:opacity-50"
                        >
                            {isPending ? 'Saving...' : 'Save Animal'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddAnimalModal;
