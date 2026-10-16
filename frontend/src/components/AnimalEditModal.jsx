import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useUpdateAnimal } from '../hooks/useAnimals';
import { useAuth } from '../context/AuthContext';
import { useToast } from './ui/Toast';
import { CustomDatePicker } from './ui/CustomDatePicker';
import { VerifyOTPModal } from './ui/VerifyOTPModal';
import Input from './Input';
import { X, KeyRound, AlertCircle, PenLine } from 'lucide-react';

const schema = z.object({
  name: z.string().min(1, 'Name is required').trim(),
  ear_tag: z.string().min(1, 'Ear tag is required').trim(),
  breed: z.string().min(1, 'Breed is required'),
  sex: z.enum(['Bull', 'Heifer', 'Cow']),
  date_of_birth: z.string().refine(val => !val || new Date(val) <= new Date(), 'Date of birth cannot be in the future'),
  weight_kg: z.coerce.number().positive('Weight must be greater than zero').max(2500, 'Weight exceeds biological limit (2,500 kg)'),
  health_status: z.string(),
});

export const AnimalEditModal = ({ isOpen, onClose, animal }) => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const updateAnimal = useUpdateAnimal();

  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [formError, setFormError] = useState('');

  const { register, handleSubmit, control, setError, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: animal?.name || '',
      ear_tag: animal?.ear_tag || '',
      breed: animal?.breed || 'Friesian',
      sex: animal?.sex || 'Cow',
      date_of_birth: animal?.date_of_birth || new Date().toISOString().split('T')[0],
      weight_kg: animal?.weight_kg || '',
      health_status: animal?.health_status || 'Healthy',
    }
  });

  if (!isOpen) return null;

  const handleClose = () => {
    setIsOtpVerified(false);
    onClose();
  };

  const onSubmit = (formData) => {
    setFormError('');
    updateAnimal.mutate({
      id: animal.id,
      data: formData
    }, {
      onSuccess: () => {
        addToast(`Animal "${formData.name}" updated successfully.`, 'success');
        handleClose();
      },
      onError: (err) => {
        const data = err.response?.data;
        let summary = 'Could not update animal record.';
        if (data && typeof data === 'object') {
          Object.keys(data).forEach(field => {
            const msgs = Array.isArray(data[field]) ? data[field] : [data[field]];
            if (['name', 'ear_tag', 'breed', 'sex', 'date_of_birth', 'weight_kg', 'health_status'].includes(field)) {
              setError(field, { type: 'server', message: msgs.join(' ') });
            }
          });
          summary = data.detail || data.ear_tag?.[0] || Object.values(data).flat().join(' ');
        }
        setFormError(summary);
        addToast(summary, 'error');
      }
    });
  };

  // If OTP not yet verified, display dedicated VerifyOTPModal
  if (!isOtpVerified) {
    return (
      <VerifyOTPModal
        isOpen={isOpen}
        onClose={handleClose}
        phoneNumber={user?.phone_number}
        onVerified={() => {
          setIsOtpVerified(true);
          addToast('Identity verified. Record unlocked for editing.', 'success');
        }}
        title="Authorize Animal Edit"
        subtitle={`Verify SMS code sent to ${user?.phone_number || 'your phone'} to unlock editing`}
      />
    );
  }

  // Once OTP is verified, display the animal edit form
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700">
              <PenLine size={22} />
            </div>
            <div>
              <h3 className="font-heading text-xl font-bold text-gray-900">
                Edit {animal?.name || 'Animal'}
              </h3>
              <p className="text-xs text-gray-500">
                Verified with SMS OTP • Update animal records
              </p>
            </div>
          </div>
          <button onClick={handleClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="my-5 space-y-4">
          {formError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input label="Name" {...register('name')} error={errors.name} />
            <Input label="Ear Tag" {...register('ear_tag')} error={errors.ear_tag} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-forest-green font-bold mb-2 text-sm">Breed</label>
              <select {...register('breed')} className="w-full p-2.5 rounded-lg border border-gray-300 bg-white text-sm">
                <option value="Friesian">Friesian</option>
                <option value="Ayrshire">Ayrshire</option>
                <option value="Jersey">Jersey</option>
                <option value="Guernsey">Guernsey</option>
                <option value="Mixed">Mixed</option>
                <option value="Other">Other</option>
              </select>
              {errors.breed && <p className="text-red-500 text-xs mt-1">{errors.breed.message}</p>}
            </div>
            <div>
              <label className="block text-forest-green font-bold mb-2 text-sm">Sex</label>
              <select {...register('sex')} className="w-full p-2.5 rounded-lg border border-gray-300 bg-white text-sm">
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
              {errors.date_of_birth && <p className="text-red-500 text-xs mt-1">{errors.date_of_birth.message}</p>}
            </div>
            <Input label="Weight (kg)" type="number" step="0.01" {...register('weight_kg')} error={errors.weight_kg} />
          </div>

          <div>
            <label className="block text-forest-green font-bold mb-2 text-sm">Health Status</label>
            <select {...register('health_status')} className="w-full p-2.5 rounded-lg border border-gray-300 bg-white text-sm">
              <option value="Healthy">Healthy</option>
              <option value="Sick">Sick</option>
              <option value="Pregnant">Pregnant</option>
              <option value="Dry">Dry</option>
            </select>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateAnimal.isPending}
              className="rounded-xl bg-amber-accent px-5 py-2.5 text-sm font-bold text-white hover:bg-yellow-600 transition disabled:opacity-50"
            >
              {updateAnimal.isPending ? 'Saving Updates...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
