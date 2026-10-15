import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, ArrowLeft, ShieldAlert, Compass } from 'lucide-react';
import Cow from '../components/ui/CowIcon';

export const NotFound = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const getDashboardPath = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'ADMIN':
        return '/admin/dashboard';
      case 'VETERINARIAN':
        return '/vet/dashboard';
      case 'AGGREGATOR':
        return '/aggregator/dashboard';
      default:
        return '/dashboard';
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-emerald-950/80 to-slate-900 text-white px-4 py-12 overflow-hidden">
      {/* Decorative ambient blurred orbs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-teal-500/15 blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-lg w-full text-center space-y-8 p-8 sm:p-10 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-2xl shadow-2xl">
        {/* Visual 404 Illustration Badge */}
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-inner">
          <Cow className="w-14 h-14" />
        </div>

        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold uppercase tracking-wider">
            <ShieldAlert size={14} /> Page Not Found (404)
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Off the Pasture!
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            The farm records, paddock, or route you are looking for does not exist or has been relocated.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm transition-all border border-white/10"
          >
            <ArrowLeft size={16} /> Go Back
          </button>
          <Link
            to={getDashboardPath()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-900/30 transition-all hover:scale-[1.02]"
          >
            <Home size={16} /> Return to Dashboard
          </Link>
        </div>

        <div className="pt-4 border-t border-white/5 flex items-center justify-center gap-2 text-xs text-slate-400">
          <Compass size={14} className="text-emerald-400" />
          <span>FMS Dairy Platform Navigation Guidance</span>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
