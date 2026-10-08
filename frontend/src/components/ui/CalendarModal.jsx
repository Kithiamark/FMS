import React, { useState } from 'react';
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Check, X 
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { Button } from './Button';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const CalendarModal = ({
  isOpen,
  onClose,
  initialDate,
  onSelectDate,
  title = "Select Date & Time",
  includeTime = true,
  events = [] // Array of { date: 'YYYY-MM-DD', label: '...', color: 'emerald|blue|amber|red' }
}) => {
  const today = new Date();
  const init = initialDate ? new Date(initialDate) : today;
  
  const [currentYear, setCurrentYear] = useState(init.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(init.getMonth());
  const [selectedDate, setSelectedDate] = useState(
    init.toISOString().split('T')[0]
  );
  const [selectedTime, setSelectedTime] = useState(
    initialDate && initialDate.includes('T') ? initialDate.split('T')[1].substring(0, 5) : '09:00'
  );

  if (!isOpen) return null;

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const jumpToToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDate(today.toISOString().split('T')[0]);
  };

  // Calculate days in month
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
  // Adjust so Monday is 0, Sunday is 6
  const adjustedFirstDay = (firstDayIndex + 6) % 7;
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

  const calendarDays = [];

  // Previous month trailing days
  for (let i = adjustedFirstDay - 1; i >= 0; i--) {
    const dayNum = daysInPrevMonth - i;
    const m = currentMonth === 0 ? 12 : currentMonth;
    const y = currentMonth === 0 ? currentYear - 1 : currentYear;
    const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    calendarDays.push({ day: dayNum, dateStr, isCurrentMonth: false });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarDays.push({ day: d, dateStr, isCurrentMonth: true });
  }

  // Next month leading days to complete 35 or 42 cells
  const remaining = (7 - (calendarDays.length % 7)) % 7;
  for (let d = 1; d <= remaining; d++) {
    const m = currentMonth === 11 ? 1 : currentMonth + 2;
    const y = currentMonth === 11 ? currentYear + 1 : currentYear;
    const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarDays.push({ day: d, dateStr, isCurrentMonth: false });
  }

  const handleConfirm = () => {
    if (includeTime) {
      onSelectDate(`${selectedDate}T${selectedTime}:00`);
    } else {
      onSelectDate(selectedDate);
    }
    onClose();
  };

  const todayStr = today.toISOString().split('T')[0];

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/70 px-5 py-4 dark:border-slate-800 dark:bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
              <CalendarIcon size={18} />
            </div>
            <div>
              <h3 className="font-heading font-bold text-slate-900 dark:text-slate-100">{title}</h3>
              <p className="text-xs text-slate-500">
                {selectedDate ? new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : 'Choose a date'}
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <div className="flex items-center gap-1">
            <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {MONTH_NAMES[currentMonth]} {currentYear}
            </h4>
            <button 
              type="button"
              onClick={jumpToToday} 
              className="ml-2 rounded-lg bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300"
            >
              Today
            </button>
          </div>
          <div className="flex items-center gap-1">
            <button 
              type="button"
              onClick={prevMonth} 
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Previous month"
            >
              <ChevronLeft size={18} />
            </button>
            <button 
              type="button"
              onClick={nextMonth} 
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Next month"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Day Name Headers */}
        <div className="grid grid-cols-7 gap-1 px-4 text-center text-xs font-semibold text-slate-400">
          {DAY_NAMES.map(name => (
            <div key={name} className="py-1.5">{name}</div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 px-4 pb-3">
          {calendarDays.map((cell, idx) => {
            const isSelected = selectedDate === cell.dateStr;
            const isToday = todayStr === cell.dateStr;
            const dayEvents = events.filter(e => e.date === cell.dateStr);

            return (
              <button
                key={`${cell.dateStr}-${idx}`}
                type="button"
                onClick={() => setSelectedDate(cell.dateStr)}
                className={`group relative flex h-10 w-full flex-col items-center justify-center rounded-xl text-xs font-medium transition-all ${
                  isSelected 
                    ? 'bg-emerald-600 font-bold text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-600 ring-offset-2 dark:ring-offset-slate-900' 
                    : isToday 
                      ? 'border border-emerald-500 font-bold text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30' 
                      : cell.isCurrentMonth 
                        ? 'text-slate-800 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800' 
                        : 'text-slate-300 hover:bg-slate-50 dark:text-slate-600 dark:hover:bg-slate-800/50'
                }`}
              >
                <span>{cell.day}</span>
                {dayEvents.length > 0 && (
                  <span className="absolute bottom-1 flex gap-0.5">
                    {dayEvents.slice(0, 3).map((ev, i) => (
                      <span 
                        key={i} 
                        className={`h-1 w-1 rounded-full ${isSelected ? 'bg-white' : 'bg-emerald-500'}`} 
                      />
                    ))}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Time Selection */}
        {includeTime && (
          <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-3 dark:border-slate-800 dark:bg-slate-950/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                <Clock size={15} className="text-emerald-600" />
                <span>Time:</span>
              </div>
              <div className="flex items-center gap-2">
                {['08:00', '11:00', '14:00', '17:00'].map(slot => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedTime(slot)}
                    className={`rounded-lg px-2 py-1 text-xs font-semibold transition ${
                      selectedTime === slot
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
                <input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                />
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-white px-5 py-3.5 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs text-slate-500">
            <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedDate}</span>
            {includeTime && <span> at {selectedTime}</span>}
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" onClick={onClose} className="px-3 py-1.5 text-xs">
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={handleConfirm}
              className="flex items-center gap-1.5 bg-emerald-600 px-4 py-1.5 text-xs text-white hover:bg-emerald-700 shadow-sm"
            >
              <Check size={14} /> Confirm
            </Button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
};
