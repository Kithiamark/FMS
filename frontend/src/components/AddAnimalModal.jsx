import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCreateAnimal } from '../hooks/useAnimals';
import { X, AlertCircle } from 'lucide-react';
import Input from './Input';
import { CustomDatePicker } from './ui/CustomDatePicker';
import { useToast } from './ui/Toast';

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
    const { addToast } = useToast();
    const [serverError, setServerError] = useState('');
    const { register, handleSubmit, control, setError, formState: { errors } } = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            health_status: 'Healthy',
            sex: 'Cow',
            date_of_birth: new Date().toISOString().split('T')[0]
        }
    });

    const onSubmit = (data) => {
        setServerError('');
        mutate(data, {
            onSuccess: () => {
                addToast('Animal registered successfully.', 'success');
                onClose();
            },
            onError: (err) => {
                const data = err.response?.data;
                let summary = 'Could not save animal record.';
                if (data) {
                    if (typeof data === 'object') {
                        Object.keys(data).forEach(field => {
                            const msgs = Array.isArray(data[field]) ? data[field] : [data[field]];
                            if (['name', 'ear_tag', 'breed', 'sex', 'date_of_birth', 'weight_kg', 'health_status'].includes(field)) {
                                setError(field, { type: 'server', message: msgs.join(' ') });
                            }
                        });
                        summary = data.detail || data.ear_tag?.[0] || data.error || Object.values(data).flat().join(' ');
                    } else if (typeof data === 'string') {
                        summary = data;
                    }
                }
                setServerError(summary);
                addToast(summary, 'error');
            }
        });
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-gray-100">
                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                    <h2 className="text-2xl font-bold font-heading text-forest-green">Add New Animal</h2>
                    <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition">
                        <X size={20} />
                    </button>
                </div>
                
                {serverError && (
                    <div className="mx-6 mt-4 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-2.5">
                        <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-600" />
                        <span className="leading-snug font-medium">{serverError}</span>
                    </div>
                )}
                
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
                        <div>
                            <Controller
                                control={control}
                                name="date_of_birth"
                                render={({ field }) => (
                                    <CustomDatePicker
                                        label="Date of Birth"
                                        value={field.value}
                                        onChange={field.onChange}
                                        placeholder="Select birth date"
                                    />
                                )}
                            />
                            {errors.date_of_birth && (
                                <p className="text-red-500 text-sm mt-1">{errors.date_of_birth.message}</p>
                            )}
                        </div>
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
