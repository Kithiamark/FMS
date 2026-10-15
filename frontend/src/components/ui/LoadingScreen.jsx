import React from 'react';
import Cow from './CowIcon';

export const LoadingScreen = ({ message = 'Loading your farm portal...' }) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-emerald-950 via-slate-950 to-slate-900 text-white px-4">
      {/* Background radial glow */}
      <div className="absolute w-96 h-96 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
      
      <div className="relative flex flex-col items-center space-y-6 text-center max-w-sm">
        {/* Animated Brand Emblem */}
        <div className="relative flex items-center justify-center">
          <div className="absolute w-20 h-20 rounded-3xl bg-emerald-500/20 animate-ping duration-1000" />
          <div className="relative flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-700 to-teal-600 border border-emerald-400/30 shadow-xl shadow-emerald-900/40">
            <Cow className="w-10 h-10 text-emerald-100 animate-pulse" />
          </div>
        </div>

        {/* Text and Indicator */}
        <div className="space-y-2">
          <h2 className="font-heading text-xl font-bold tracking-tight text-white">
            Farm Management System
          </h2>
          <p className="text-sm font-medium text-emerald-300/80">
            {message}
          </p>
        </div>

        {/* Progress Bar Loader */}
        <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden border border-white/5">
          <div className="w-full h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400 animate-pulse rounded-full" />
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
