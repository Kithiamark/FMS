import React from 'react';
import { Link } from 'react-router-dom';
import { useAlerts, useMarkAlertRead } from '../../hooks/useAlerts';
import { Bell, CheckCircle2, AlertTriangle, Info, CalendarClock, ExternalLink, X } from 'lucide-react';

export const NotificationModal = ({ isOpen, onClose }) => {
  const { data: alerts = [], isLoading } = useAlerts();
  const markRead = useMarkAlertRead();

  if (!isOpen) return null;

  const unreadAlerts = alerts.filter(a => !a.read);
  const displayAlerts = alerts.slice(0, 8); // Top 8 most recent

  const getAlertIcon = (type) => {
    switch (type) {
      case 'AI_DISEASE_RISK':
      case 'LOW_YIELD_WARNING':
        return <AlertTriangle size={16} className="text-amber-500" />;
      case 'VACCINATION_DUE':
      case 'BREEDING_DUE':
        return <CalendarClock size={16} className="text-emerald-500" />;
      default:
        return <Info size={16} className="text-blue-500" />;
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]" 
        onClick={onClose} 
      />

      {/* Popover / Dropdown Container */}
      <div className="absolute right-4 top-16 md:right-8 md:top-20 z-50 w-full max-w-sm sm:max-w-md rounded-2xl border border-slate-200/90 bg-white/95 p-4 shadow-2xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/95 animate-in fade-in slide-in-from-top-2 duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl text-emerald-700 dark:text-emerald-400">
              <Bell size={18} />
            </div>
            <div>
              <h3 className="font-heading font-bold text-slate-900 dark:text-slate-100 text-base">
                Notifications
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {unreadAlerts.length} unread {unreadAlerts.length === 1 ? 'alert' : 'alerts'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Alerts List */}
        <div className="my-3 max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 pr-1">
          {isLoading ? (
            <div className="p-6 text-center text-sm text-slate-500">Loading alerts...</div>
          ) : displayAlerts.length > 0 ? (
            displayAlerts.map(alert => (
              <div 
                key={alert.id} 
                className={`py-3 px-2 rounded-xl transition ${
                  alert.read 
                    ? 'hover:bg-slate-50 dark:hover:bg-slate-800/40 opacity-75' 
                    : 'bg-emerald-50/50 hover:bg-emerald-50 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/30'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 shrink-0">
                    {getAlertIcon(alert.alert_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate">
                        {alert.alert_type.replaceAll('_', ' ')}
                      </p>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap">
                        {alert.scheduled_at ? new Date(alert.scheduled_at).toLocaleDateString() : ''}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                      {alert.message}
                    </p>
                    <div className="mt-1.5 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-medium">
                        {alert.animal_name ? `Tag: ${alert.animal_name}` : 'Farm alert'}
                      </span>
                      {!alert.read && (
                        <button
                          type="button"
                          onClick={() => markRead.mutate(alert.id)}
                          className="inline-flex items-center gap-1 font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                        >
                          <CheckCircle2 size={12} /> Mark read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-xs text-slate-500">
              No notifications at this time. All caught up!
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-2.5 flex items-center justify-between text-xs">
          <Link 
            to="/alerts" 
            onClick={onClose} 
            className="font-bold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 flex items-center gap-1"
          >
            <span>View all alerts</span>
            <ExternalLink size={13} />
          </Link>
          <span className="text-slate-400 text-[11px]">Arvion Alert Center</span>
        </div>
      </div>
    </>
  );
};
