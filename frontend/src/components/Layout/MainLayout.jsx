import React, { useMemo, useState } from 'react';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import { Bell, ChevronDown, Menu, Moon, Search, Sun, WifiOff, CloudUpload, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAlerts } from '../../hooks/useAlerts';
import { NotificationModal } from '../ui/NotificationModal';
import { getOfflineQueue, syncOfflineQueue } from '../../utils/offlineQueue';

const MainLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('arvion-theme') === 'dark');
  const [isOnline, setIsOnline] = useState(() => typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [queuedCount, setQueuedCount] = useState(() => getOfflineQueue().length);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const { user } = useAuth();
  const { data: alerts = [] } = useAlerts();
  const unreadCount = alerts.filter(a => !a.read).length;

  const initials = useMemo(() => {
    const names = user?.full_name?.trim().split(/\s+/) || [];
    return (names[0]?.[0] || 'F') + (names[1]?.[0] || '');
  }, [user]);

  React.useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('arvion-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  React.useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      const queue = getOfflineQueue();
      if (queue.length > 0) {
        setIsSyncing(true);
        setSyncMessage(`Reconnected! Syncing ${queue.length} offline records...`);
        const result = await syncOfflineQueue();
        setIsSyncing(false);
        setSyncMessage(`Synced ${result.synced} offline items.`);
        setTimeout(() => setSyncMessage(''), 4000);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    const handleQueueChange = (e) => {
      setQueuedCount(e.detail?.count ?? getOfflineQueue().length);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('fms:offline-queue-changed', handleQueueChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('fms:offline-queue-changed', handleQueueChange);
    };
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-[#f4f7f3] text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Sidebar isOpen={sidebarOpen} toggle={() => setSidebarOpen(false)} isMobile={true} />
      <Sidebar isOpen={true} toggle={() => {}} isMobile={false} />

      <main className="relative flex flex-1 flex-col overflow-hidden">
        {/* MainLayout is shared by farmer pages. Keep global chrome here and page-specific
            headings/actions inside each page so the layout stays reusable. */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 md:h-20 md:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg border border-slate-200 p-2 text-slate-600 md:hidden"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <div className="hidden w-[min(38vw,520px)] items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 md:flex">
              <Search size={18} />
              <span>Search animals, records, alerts...</span>
            </div>
            <div className="md:hidden">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">Arvion workspace</p>
              <p className="max-w-[180px] truncate text-sm font-bold text-slate-900 dark:text-slate-100">{user?.farm?.name || 'Arvion'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setDarkMode(!darkMode)} className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200" aria-label="Toggle dark mode">
              {darkMode ? <Sun size={19} /> : <Moon size={19} />}
            </button>
            <button 
              type="button" 
              onClick={() => setNotificationOpen(!notificationOpen)}
              className="relative rounded-xl border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
              aria-label="Open notifications"
            >
              <Bell size={19} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-bold text-white shadow">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <NotificationModal 
              isOpen={notificationOpen} 
              onClose={() => setNotificationOpen(false)} 
            />
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-2.5 py-2 shadow-sm dark:border-slate-800 dark:bg-slate-950">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-700 text-sm font-bold text-white">
                {initials}
              </div>
              <div className="hidden leading-tight sm:block">
                <p className="max-w-[150px] truncate text-sm font-bold text-slate-900 dark:text-slate-100">{user?.full_name || 'Farmer'}</p>
                <p className="text-xs text-slate-500">{user?.role || 'FARMER'}</p>
              </div>
              <ChevronDown size={16} className="hidden text-slate-400 sm:block" />
            </div>
          </div>
        </header>

        {/* Offline Status & Sync Banners */}
        {!isOnline && (
          <div className="bg-amber-600 px-4 py-2 text-white shadow-sm flex items-center justify-between text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <WifiOff size={16} className="animate-pulse shrink-0" />
              <span>
                <strong>Offline Mode Active:</strong> You can continue logging milk records and animal updates. Changes will be saved locally and synced once reconnected.
              </span>
            </div>
            {queuedCount > 0 && (
              <span className="ml-2 rounded-full bg-amber-800 px-2.5 py-0.5 text-xs font-bold shrink-0">
                {queuedCount} queued
              </span>
            )}
          </div>
        )}

        {syncMessage && (
          <div className="bg-emerald-700 px-4 py-2 text-white shadow-sm flex items-center gap-2 text-xs sm:text-sm">
            {isSyncing ? (
              <CloudUpload size={16} className="animate-bounce shrink-0" />
            ) : (
              <CheckCircle2 size={16} className="shrink-0" />
            )}
            <span>{syncMessage}</span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-4 py-5 pb-24 md:px-8 md:py-7 md:pb-8">
            {children}
        </div>

        <MobileNav onMenuClick={() => setSidebarOpen(true)} />
      </main>
    </div>
  );
};

export default MainLayout;
