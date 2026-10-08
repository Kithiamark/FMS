import React, { useState } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { CalendarModal } from './CalendarModal';

export const CustomDatePicker = ({
  value,
  onChange,
  label,
  placeholder = "Select date",
  includeTime = false,
  className = "",
  events = []
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const displayValue = value 
    ? (includeTime ? value.replace('T', ' at ') : value)
    : '';

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-900 shadow-sm transition hover:border-emerald-300 hover:bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
      >
        <span className={displayValue ? "font-medium" : "text-slate-400"}>
          {displayValue || placeholder}
        </span>
        <CalendarIcon size={16} className="text-emerald-600 dark:text-emerald-400" />
      </button>

      <CalendarModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        initialDate={value}
        onSelectDate={(newDate) => {
          onChange(newDate);
          setIsOpen(false);
        }}
        includeTime={includeTime}
        events={events}
      />
    </div>
  );
};
