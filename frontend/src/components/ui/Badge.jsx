import React from 'react';
import { cn } from './Button';

const statusClasses = {
  // Positive / Healthy / Active
  Healthy: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Active: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Verified: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Approved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Resolved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Paid: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Delivered: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Low: 'bg-emerald-100 text-emerald-800 border-emerald-200',

  // Caution / In Progress / Pending
  Pending: 'bg-amber-100 text-amber-800 border-amber-200',
  'In Progress': 'bg-amber-100 text-amber-800 border-amber-200',
  'In Heat': 'bg-amber-100 text-amber-800 border-amber-200',
  Medium: 'bg-amber-100 text-amber-800 border-amber-200',
  Warning: 'bg-amber-100 text-amber-800 border-amber-200',
  'Grace Period': 'bg-amber-100 text-amber-800 border-amber-200',
  'In Transit': 'bg-amber-100 text-amber-800 border-amber-200',
  Observing: 'bg-amber-100 text-amber-800 border-amber-200',
  'Action Required': 'bg-amber-100 text-amber-800 border-amber-200',

  // Danger / High / Sick / Critical
  Sick: 'bg-red-100 text-red-800 border-red-200',
  High: 'bg-red-100 text-red-800 border-red-200',
  Critical: 'bg-red-100 text-red-800 border-red-200',
  Rejected: 'bg-red-100 text-red-800 border-red-200',
  Overdue: 'bg-red-100 text-red-800 border-red-200',
  Suspended: 'bg-red-100 text-red-800 border-red-200',
  Expired: 'bg-red-100 text-red-800 border-red-200',
  Unpaid: 'bg-red-100 text-red-800 border-red-200',
  Quarantined: 'bg-red-100 text-red-800 border-red-200',

  // Informational / State
  Pregnant: 'bg-blue-100 text-blue-800 border-blue-200',
  Scheduled: 'bg-blue-100 text-blue-800 border-blue-200',
  'Follow-up': 'bg-blue-100 text-blue-800 border-blue-200',
  Chilled: 'bg-cyan-100 text-cyan-800 border-cyan-200',

  // Neutral / Inactive
  Dry: 'bg-slate-100 text-slate-700 border-slate-200',
  Inactive: 'bg-slate-100 text-slate-700 border-slate-200',
  Cancelled: 'bg-slate-100 text-slate-700 border-slate-200',
  Culled: 'bg-slate-100 text-slate-700 border-slate-200',
  Standard: 'bg-slate-100 text-slate-700 border-slate-200',
  Enterprise: 'bg-indigo-100 text-indigo-800 border-indigo-200',
};

export const Badge = ({
  children,
  status,
  variant,
  className = '',
}) => {
  const resolvedStatus = status || children;
  const statusClass = (variant && statusClasses[variant]) || (resolvedStatus && statusClasses[resolvedStatus]) || 'bg-slate-100 text-slate-700 border-slate-200';

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors',
        statusClass,
        className
      )}
    >
      {children || status}
    </span>
  );
};

export default Badge;
