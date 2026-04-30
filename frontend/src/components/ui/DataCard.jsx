import React from 'react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { cn } from './Button';

export const DataCard = ({ title, value, icon: Icon, trend, trendUp, className }) => (
  <div className={cn('rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/60', className)}>
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-semibold text-slate-500">{title}</p>
        <p className="mt-2 text-2xl font-bold text-slate-950">{value ?? 0}</p>
      </div>
      {Icon && (
        <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700">
          <Icon size={22} />
        </div>
      )}
    </div>
    {trend && (
      <div className={cn('mt-4 flex items-center gap-1 text-sm font-medium', trendUp ? 'text-green-600' : 'text-red-600')}>
        {trendUp ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
        <span>{trend}</span>
      </div>
    )}
  </div>
);
