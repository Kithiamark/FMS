import React from 'react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { cn } from './Button';

const ACCENT_STYLES = {
  farmer: {
    iconBg: 'bg-emerald-50 text-emerald-800',
    border: 'border-l-4 border-l-emerald-700',
  },
  vet: {
    iconBg: 'bg-teal-50 text-vet-teal',
    border: 'border-l-4 border-l-vet-teal',
  },
  aggregator: {
    iconBg: 'bg-blue-50 text-blue-600',
    border: 'border-l-4 border-l-blue-600',
  },
  admin: {
    iconBg: 'bg-slate-100 text-slate-800',
    border: 'border-l-4 border-l-slate-800',
  },
  emerald: {
    iconBg: 'bg-emerald-50 text-emerald-700',
    border: 'border-l-4 border-l-emerald-600',
  },
  amber: {
    iconBg: 'bg-amber-50 text-amber-700',
    border: 'border-l-4 border-l-amber-500',
  },
  red: {
    iconBg: 'bg-red-50 text-red-700',
    border: 'border-l-4 border-l-red-500',
  },
  blue: {
    iconBg: 'bg-blue-50 text-blue-700',
    border: 'border-l-4 border-l-blue-600',
  },
};

export const StatCard = ({
  title,
  value,
  unit,
  icon: Icon,
  trend,
  trendUp,
  subtitle,
  subtext,
  accent,
  badge,
  glossy = true,
  loading = false,
  onClick,
  className = '',
}) => {
  const resolvedSubtitle = subtitle || subtext;
  const isNumericTrend = typeof trend === 'number';
  const resolvedTrendUp = trendUp !== undefined ? trendUp : (isNumericTrend ? trend >= 0 : undefined);
  const resolvedTrend = isNumericTrend ? `${trend > 0 ? '+' : ''}${trend}%` : trend;
  const accentConfig = accent ? ACCENT_STYLES[accent] || ACCENT_STYLES.farmer : null;

  if (loading) {
    return (
      <div className={cn('rounded-card border border-surface-border bg-surface p-5 shadow-card animate-pulse', className)}>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="h-4 w-24 bg-slate-200 rounded" />
            <div className="h-7 w-32 bg-slate-200 rounded" />
          </div>
          <div className="h-10 w-10 bg-slate-200 rounded-xl" />
        </div>
        <div className="mt-4 h-3.5 w-20 bg-slate-200 rounded" />
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        glossy
          ? 'rounded-card glossy-card p-5 transition-all duration-200'
          : 'rounded-card border border-surface-border bg-surface p-5 shadow-card transition-all duration-200',
        accentConfig?.border,
        onClick && 'cursor-pointer hover:shadow-card-hover active:scale-[0.99]',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 truncate">{title}</p>
            {badge && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                {badge}
              </span>
            )}
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="font-heading text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              {value ?? 0}
            </span>
            {unit && <span className="text-xs font-semibold text-slate-500">{unit}</span>}
          </div>
        </div>

        {Icon && (
          <div
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors',
              accentConfig?.iconBg || 'bg-slate-100 text-slate-700'
            )}
          >
            <Icon size={22} />
          </div>
        )}
      </div>

      {(resolvedTrend !== undefined || resolvedSubtitle) && (
        <div className="mt-3.5 flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 text-xs">
          {resolvedTrend !== undefined && (
            <span
              className={cn(
                'inline-flex items-center font-bold',
                resolvedTrendUp === true && 'text-emerald-700',
                resolvedTrendUp === false && 'text-red-600',
                resolvedTrendUp === undefined && 'text-slate-600'
              )}
            >
              {resolvedTrendUp === true && <ArrowUpRight size={14} className="mr-0.5" />}
              {resolvedTrendUp === false && <ArrowDownRight size={14} className="mr-0.5" />}
              {resolvedTrend}
            </span>
          )}
          {resolvedSubtitle && (
            <span className="text-slate-500 truncate">
              {resolvedSubtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default StatCard;
