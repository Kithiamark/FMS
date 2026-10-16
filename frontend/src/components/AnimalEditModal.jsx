import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useUpdateAnimal } from '../hooks/useAnimals';
import { useAuth } from '../context/AuthContext';
import { useToast } from './ui/Toast';
import { CustomDatePicker } from './ui/CustomDatePicker';
import Input from './Input';
import api from '../api/axios';
import { normalizeKenyanPhone } from '../utils/phone';
import { X, ShieldCheck, KeyRound, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';

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

  const [step, setStep] = useState(1); // 1: OTP Challenge, 2: Edit Form
  const [otp, setOtp] = useState('');
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpSuccess, setOtpSuccess] = useState('');
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

  const handleRequestOtp = async () => {
    setOtpError('');
    setOtpSuccess('');
    setOtpSending(true);
    try {
      const res = await api.post('/auth/request-otp/', {
        phone_number: normalizeKenyanPhone(user?.phone_number || '')
      });
      if (res.data?.test_mode_otp) {
        setOtp(res.data.test_mode_otp);
        setOtpSuccess(`Test OTP generated: ${res.data.test_mode_otp}`);
      } else {
        setOtpSuccess('Security OTP code sent to your registered phone.');
      }
    } catch (err) {
      setOtpError(err.response?.data?.error || err.response?.data?.detail || 'Failed to dispatch verification code.');
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.trim().length !== 6) {
      setOtpError('Please enter a valid 6-digit OTP.');
      return;
    }
    setOtpError('');
    setOtpVerifying(true);
    try {
      await api.post('/auth/verify-otp/', {
        phone_number: normalizeKenyanPhone(user?.phone_number || ''),
        otp: otp.trim()
      });
      setStep(2);
      addToast('Identity verified. Record unlocked for edit.', 'success');
    } catch (err) {
      setOtpError(err.response?.data?.error || err.response?.data?.detail || 'Invalid or expired OTP code.');
    } finally {
      setOtpVerifying(false);
    }
  };

  const onSubmit = (formData) => {
    setFormError('');
    updateAnimal.mutate({
      id: animal.id,
      data: formData
    }, {
      onSuccess: () => {
        addToast(`Animal "${formData.name}" updated successfully.`, 'success');
        onClose();
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
              {step === 1 ? <ShieldCheck size={22} /> : <KeyRound size={22} />}
            </div>
            <div>
              <h3 className="font-heading text-xl font-bold text-gray-900">
                {step === 1 ? 'Authorize Record Edit' : `Edit ${animal?.name || 'Animal'}`}
              </h3>
              <p className="text-xs text-gray-500">
                {step === 1 ? 'Step 1: Verify identity via SMS OTP' : 'Step 2: Update livestock information'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition">
            <X size={20} />
          </button>
        </div>

        {step === 1 && (
          <form onSubmit={handleVerifyOtp} className="my-5 space-y-4">
            <div className="rounded-xl border border-blue-200/80 bg-blue-50/70 p-3.5 text-xs text-blue-900">
              Editing livestock records requires OTP authorization sent to your phone <strong className="font-mono">{user?.phone_number}</strong>.
            </div>

            {otpError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 flex items-start gap-2">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{otpError}</span>
              </div>
            )}

            {otpSuccess && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
                {otpSuccess}
              </div>
            )}

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleRequestOtp}
                disabled={otpSending}
                className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition disabled:opacity-60"
              >
                {otpSending ? 'Sending OTP...' : 'Send OTP to My Phone'}
              </button>
              {otpSuccess && <span className="text-[11px] text-gray-400">Code active for 10 min</span>}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">6-Digit OTP</label>
              <input
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.trim())}
                placeholder="······"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-center font-mono text-2xl tracking-[0.4em] font-bold text-gray-900 focus:border-forest-green focus:outline-none focus:ring-2 focus:ring-forest-green/20"
              />
              <p className="mt-1.5 text-xs text-gray-400 flex items-center gap-1">
                <Sparkles size={13} className="text-emerald-600" />
                <span>Enter the OTP code sent to your mobile phone</span>
              </p>
            </div>

            <button
              type="submit"
              disabled={otpVerifying || !otp}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-forest-green py-3 font-bold text-white shadow-lg shadow-forest-green/20 hover:bg-emerald-800 transition disabled:opacity-50"
            >
              <span>{otpVerifying ? 'Verifying...' : 'Authorize & Unlock Edit'}</span>
              <ArrowRight size={18} />
            </button>
          </form>
        )}

        {step === 2 && (
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
                onClick={onClose}
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
        )}
      </div>
    </div>
  );
};
