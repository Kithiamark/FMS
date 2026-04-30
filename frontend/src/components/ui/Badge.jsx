import React from 'react';
import { cn } from './Button';

const statusClasses = {
  Healthy: 'bg-green-100 text-green-800',
  Active: 'bg-green-100 text-green-800',
  Verified: 'bg-green-100 text-green-800',
  Sick: 'bg-red-100 text-red-800',
  High: 'bg-red-100 text-red-800',
  Pending: 'bg-amber-100 text-amber-800',
  Pregnant: 'bg-blue-100 text-blue-800',
  Dry: 'bg-gray-100 text-gray-800',
};

export const Badge = ({ children, status, className }) => (
  <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold', statusClasses[status] || 'bg-gray-100 text-gray-800', className)}>
    {children || status}
  </span>
);
