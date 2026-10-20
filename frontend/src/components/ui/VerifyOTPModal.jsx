import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, KeyRound, ArrowRight, AlertCircle, Sparkles, X, RefreshCw } from 'lucide-react';
import api from '../../api/axios';
import { normalizeKenyanPhone } from '../../utils/phone';

export const VerifyOTPModal = ({
  isOpen,
  onClose,
  phoneNumber,
  onVerified,
  title = "Verify Identity",
  subtitle = "Enter the 6-digit verification code sent to your phone"
}) => {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [timer, setTimer] = useState(60);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (isOpen) {
      setDigits(['', '', '', '', '', '']);
      setErrorMsg('');
      setSuccessMsg('');
      setTimer(60);
      handleSendOtp();
      setTimeout(() => inputRefs.current[0]?.focus(), 150);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || timer <= 0) return;
    const interval = setInterval(() => setTimer(t => t - 1), 1000);
    return () => clearInterval(interval);
  }, [isOpen, timer]);

  if (!isOpen) return null;

  const handleSendOtp = async () => {
    const normalized = normalizeKenyanPhone(phoneNumber || '');
    if (!normalized) {
      setErrorMsg('No valid phone number linked to this account.');
      return;
    }
    setErrorMsg('');
    setSending(true);
    try {
      const res = await api.post('/auth/request-otp/', { phone_number: normalized });
      if (res.data?.test_mode_otp) {
        const testCode = String(res.data.test_mode_otp);
        setDigits(testCode.split('').slice(0, 6));
        setSuccessMsg(`Test OTP code generated: ${testCode}`);
      } else {
        setSuccessMsg(`Security code dispatched to ${normalized}`);
      }
      setTimer(60);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || err.response?.data?.detail || 'Failed to dispatch verification code.');
    } finally {
      setSending(false);
    }
  };

  const handleChange = (index, value) => {
    const clean = value.replace(/[^0-9]/g, '');
    if (!clean) {
      const newDigits = [...digits];
      newDigits[index] = '';
      setDigits(newDigits);
      return;
    }

    // Support paste of entire 6-digit code
    if (clean.length > 1) {
      const pasted = clean.slice(0, 6).split('');
      const newDigits = [...digits];
      pasted.forEach((char, i) => {
        if (i < 6) newDigits[i] = char;
      });
      setDigits(newDigits);
      const nextIndex = Math.min(pasted.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    const newDigits = [...digits];
    newDigits[index] = clean[0];
    setDigits(newDigits);

    // Auto-advance
    if (index < 5 && clean[0]) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    const fullCode = digits.join('');
    if (fullCode.length !== 6) {
      setErrorMsg('Please enter all 6 digits of the verification code.');
      return;
    }

    setErrorMsg('');
    setLoading(true);
    try {
      const normalized = normalizeKenyanPhone(phoneNumber || '');
      const response = await api.post('/auth/verify-otp/', {
        phone_number: normalized,
        otp: fullCode
      });
      onVerified(response.data);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || err.response?.data?.detail || 'Invalid or expired OTP code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 sm:p-7 shadow-2xl border border-gray-100 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h3 className="font-heading text-lg font-bold text-gray-900 dark:text-slate-100">{title}</h3>
              <p className="text-xs text-gray-500 dark:text-slate-400">{subtitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleVerify} className="my-5 space-y-4">
          <div className="rounded-xl border border-blue-200/80 bg-blue-50/70 p-3 text-xs text-blue-900 dark:border-blue-900/40 dark:bg-blue-950/40 dark:text-blue-300 flex items-center justify-between">
            <span>Code sent to <strong className="font-mono">{phoneNumber || 'your registered phone'}</strong></span>
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={sending || timer > 0}
              className="font-bold text-blue-700 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1 disabled:opacity-50"
            >
              <RefreshCw size={12} className={sending ? 'animate-spin' : ''} />
              {sending ? 'Sending...' : timer > 0 ? `${timer}s` : 'Resend'}
            </button>
          </div>

          {errorMsg && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400 flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
              {successMsg}
            </div>
          )}

          {/* 6 Digit Boxes */}
          <div className="flex justify-between gap-2 py-2">
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={el => inputRefs.current[idx] = el}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={digit}
                onChange={e => handleChange(idx, e.target.value)}
                onKeyDown={e => handleKeyDown(idx, e)}
                className="h-12 w-12 rounded-xl border-2 border-gray-200 bg-slate-50 text-center font-mono text-xl font-bold text-gray-900 shadow-inner transition focus:border-forest-green focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest-green/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-emerald-500 dark:focus:bg-slate-900"
              />
            ))}
          </div>

          <p className="text-center text-xs text-gray-400 dark:text-slate-500 flex items-center justify-center gap-1">
            <Sparkles size={13} className="text-emerald-600 dark:text-emerald-400" />
            <span>Enter the 6-digit SMS verification code</span>
          </p>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-gray-300 py-3 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || digits.join('').length !== 6}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-forest-green py-3 text-xs font-bold text-white shadow-lg shadow-forest-green/20 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 transition disabled:opacity-50"
            >
              <span>{loading ? 'Verifying...' : 'Verify OTP'}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
