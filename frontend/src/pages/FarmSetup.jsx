import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useToast } from '../components/ui/Toast';
import Input from '../components/Input';
import api from '../api/axios';

const schema = z.object({
    name: z.string().min(3, "Farm name is required"),
    county: z.string().min(1, "County is required"),
    sub_county: z.string().min(1, "Sub-county is required"),
    animals: z.coerce.number().min(0, "Invalid number"),
});

const FarmSetup = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [submitting, setSubmitting] = React.useState(false);
    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(schema)
    });

    const onSubmit = async (data) => {
        setSubmitting(true);
        try {
            await api.post('/farms/', {
                ...data,
                estimated_herd_size: data.animals
            });
            addToast('Farm details configured successfully.', 'success');
            navigate('/dashboard');
        } catch (error) {
            const msg = error.response?.data?.detail 
                || error.response?.data?.name?.[0]
                || error.response?.data?.county?.[0]
                || error.response?.data?.sub_county?.[0]
                || error.response?.data?.animals?.[0]
                || 'Farm setup failed. Please check the entered details.';
            addToast(msg, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-forest-green">
            <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
                <h2 className="text-2xl font-bold text-center mb-6 text-forest-green">{t('farm_setup')}</h2>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <Input 
                        label={t('farm_name')} 
                        {...register('name')} 
                        error={errors.name} 
                    />
                    <div className="mb-4">
                        <label className="block text-forest-green font-bold mb-2">{t('county')}</label>
                        <select {...register('county')} className="w-full p-3 rounded bg-cream-bg border border-gray-300">
                            <option value="">Select County</option>
                            <option value="Nairobi">Nairobi</option>
                            <option value="Kiambu">Kiambu</option>
                            <option value="Nakuru">Nakuru</option>
                            {/* Add more counties */}
                        </select>
                        {errors.county && <p className="text-red-500 text-sm mt-1">{errors.county.message}</p>}
                    </div>
                    <Input 
                        label={t('sub_county')} 
                        {...register('sub_county')} 
                        error={errors.sub_county} 
                    />
                    <Input 
                        label={t('animals')} 
                        type="number" 
                        {...register('animals')} 
                        error={errors.animals} 
                    />
                    <button type="submit" disabled={submitting} className="w-full bg-amber-accent text-white font-bold py-3 rounded hover:bg-yellow-600 transition disabled:opacity-50">
                        {submitting ? 'Setting up...' : t('submit')}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default FarmSetup;
