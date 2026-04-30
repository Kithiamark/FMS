import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Input from '../components/Input';
import api from '../api/axios';

const schema = z.object({
    otp: z.string().length(6, "OTP must be 6 digits"),
});

const OTPVerification = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [timer, setTimer] = useState(60);
    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(schema)
    });

    useEffect(() => {
        const interval = setInterval(() => {
            setTimer((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const onSubmit = async (data) => {
        try {

            await api.post('/auth/verify-otp/', { otp: data.otp, phone_number: '+254700000000' });
            navigate('/farm-setup');
        } catch (error) {
            console.error("Verification failed", error);
            alert("Invalid OTP");
        }
    };

    const handleResend = async () => {
        setTimer(60);
        // Calling resend API
        try {
            await api.post('/auth/resend-otp/', { phone_number: '+254700000000' });
        } catch (error) {
            console.error("Failed to resend OTP", error);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-forest-green">
            <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
                <h2 className="text-2xl font-bold text-center mb-6 text-forest-green">{t('otp_verify')}</h2>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <Input 
                        label="OTP" 
                        placeholder="123456" 
                        {...register('otp')} 
                        error={errors.otp} 
                    />
                    <button type="submit" className="w-full bg-amber-accent text-white font-bold py-3 rounded hover:bg-yellow-600 transition mb-4">
                        {t('submit')}
                    </button>
                </form>
                <div className="text-center">
                    {timer > 0 ? (
                        <p>Resend in {timer}s</p>
                    ) : (
                        <button onClick={handleResend} className="text-amber-accent font-bold">
                            {t('resend_otp')}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OTPVerification;
