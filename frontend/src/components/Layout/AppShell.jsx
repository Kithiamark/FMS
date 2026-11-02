import React, { useMemo, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Menu,
  X,
  ChevronLeft,
  ChevronDown,
  Bell,
  Search,
  LogOut,
  WifiOff,
  CloudUpload,
  CheckCircle2,
  Globe,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAlerts } from '../../hooks/useAlerts';
import { NotificationModal } from '../ui/NotificationModal';
import { AIAssistantWidget } from '../ai/AIAssistantWidget';
import { getRoleConfig } from './shellConfig';
import { getOfflineQueue, syncOfflineQueue } from '../../utils/offlineQueue';
import { cn } from '../ui/Button';

export const AppShell = ({ children, roleOverride }) => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const { user, logout } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));
  const [queuedCount, setQueuedCount] = useState(() => getOfflineQueue().length);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  const effectiveRole = roleOverride || user?.role || 'FARMER';
  const config = useMemo(() => getRoleConfig(effectiveRole), [effectiveRole]);
  const { data: alerts = [] } = useAlerts();
  const unreadCount = alerts.filter(a => !a.read).length;

  const initials = useMemo(() => {
    const names = user?.full_name?.trim().split(/\s+/) || [];
    return (names[0]?.[0] || 'U') + (names[1]?.[0] || '');
  }, [user]);

  // Online / Offline synchronization listeners
  useEffect(() => {
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

    const handleOffline = () => setIsOnline(false);
    const handleQueueChange = (e) => setQueuedCount(e.detail?.count ?? getOfflineQueue().length);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('fms:offline-queue-changed', handleQueueChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('fms:offline-queue-changed', handleQueueChange);
    };
  }, []);

  const navItems = useMemo(() => {
    const filterItem = (item) => {
      if (user?.role !== 'FARM_WORKER') return true;
      const accessibleModules = user?.accessible_modules || [];
      const moduleId = item.path.split('/')[1]?.split('?')[0];
      if (moduleId === 'dashboard' || moduleId === 'settings' || !moduleId) return true;
      return accessibleModules.includes(moduleId);
    };

    const primary = (config.primaryNav || []).filter(filterItem);
    const secondary = (config.secondaryNav || []).filter(filterItem);
    return { primary, secondary, all: [...primary, ...secondary] };
  }, [config, user]);

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    setLangMenuOpen(false);
  };

  const isNavActive = (itemPath) => {
    if (itemPath === '/community') {
      return location.pathname === '/community';
    }
    if (itemPath.includes('?')) {
      const [path, query] = itemPath.split('?');
      return location.pathname === path && location.search.includes(query);
    }
    if (itemPath === '/dashboard' || itemPath === '/vet/dashboard' || itemPath === '/aggregator/dashboard' || itemPath === '/admin/dashboard') {
      return location.pathname === itemPath && !location.search;
    }
    return location.pathname.startsWith(itemPath);
  };

  const BrandIcon = config.portalIcon;

  return (
    <div
      data-role={config.roleId}
      className="flex h-screen overflow-hidden bg-slate-50 font-sans text-slate-900 selection:bg-slate-200"
    >
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs transition-opacity md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Unified Sidebar (Desktop & Mobile Drawer) */}
      <aside
        className={cn(
          'flex flex-col border-r border-slate-200 bg-white transition-all duration-300 ease-in-out shrink-0 z-50',
          // Desktop styles
          'hidden md:flex md:h-screen md:sticky md:top-0',
          collapsed ? 'md:w-20' : 'md:w-68',
          // Mobile drawer styles
          sidebarOpen && '!flex fixed inset-y-0 left-0 w-72 shadow-2xl'
        )}
      >
        {/* Brand / Logo Header */}
        <div className="flex h-16 md:h-20 items-center justify-between px-5 border-b border-slate-100">
          <Link
            to={config.primaryNav[0]?.path || '/'}
            className="flex items-center gap-3 min-w-0"
            onClick={() => setSidebarOpen(false)}
          >
            <div
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-xs',
                config.accentBg
              )}
            >
              <BrandIcon size={22} />
            </div>
            {(!collapsed || sidebarOpen) && (
              <div className="min-w-0">
                <span className="block font-heading text-xl font-bold leading-tight tracking-tight text-slate-950 truncate">
                  {config.portalTitle}
                </span>
                <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider truncate">
                  {config.portalSubtitle}
                </span>
              </div>
            )}
          </Link>

          {/* Desktop collapse button */}
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:inline-flex rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            aria-label="Toggle sidebar collapse"
          >
            {collapsed ? <Menu size={18} /> : <ChevronLeft size={18} />}
          </button>

          {/* Mobile close button */}
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="md:hidden rounded-lg p-2 text-slate-400 hover:bg-slate-100"
            aria-label="Close menu"
          >
            <X size={22} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.all.map((item) => {
            const active = isNavActive(item.path);
            const Icon = item.icon;
            const label = item.labelKey ? t(item.labelKey, item.fallbackLabel) : item.fallbackLabel;

            return (
              <Link
                key={item.key || item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all touch-target',
                  active
                    ? cn('shadow-xs font-bold', config.accentLight, config.accentText, 'border-l-4', config.accentBorder)
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )}
                title={collapsed && !sidebarOpen ? label : undefined}
              >
                <span
                  className={cn(
                    'grid h-8 w-8 shrink-0 place-items-center rounded-lg transition-colors',
                    active ? cn(config.accentBg, 'text-white') : 'text-slate-400 group-hover:text-slate-700'
                  )}
                >
                  <Icon size={18} />
                </span>

                {(!collapsed || sidebarOpen) && (
                  <div className="flex flex-1 items-center justify-between min-w-0">
                    <span className="truncate">{label}</span>
                    {item.badge && (
                      <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Card & Logout Footer */}
        <div className="border-t border-slate-100 p-3">
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-2.5">
            <div
              className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-bold text-white text-sm shadow-xs',
                config.accentBg
              )}
            >
              {initials}
            </div>

            {(!collapsed || sidebarOpen) && (
              <div className="flex-1 min-w-0">
                <p className="truncate text-xs font-bold text-slate-900">
                  {user?.full_name || 'Arvion User'}
                </p>
                <p className="truncate text-[11px] font-medium text-slate-500">
                  {user?.farm?.name || config.portalSubtitle}
                </p>
              </div>
            )}

            {(!collapsed || sidebarOpen) && (
              <button
                type="button"
                onClick={logout}
                title="Log out"
                className="rounded-lg p-2 text-slate-400 hover:bg-white hover:text-red-600 transition-colors touch-target flex items-center justify-center"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="relative flex flex-1 flex-col overflow-hidden">
        {/* Top App Header */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/85 backdrop-blur-xl px-4 md:h-20 md:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 md:hidden touch-target flex items-center justify-center"
              aria-label="Open navigation menu"
            >
              <Menu size={20} />
            </button>

            {/* Role Header Indicator */}
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'hidden sm:inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider',
                  config.accentLight,
                  config.accentText
                )}
              >
                {effectiveRole.replace('_', ' ')}
              </span>
              <div className="md:hidden">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  {config.portalTitle}
                </p>
                <p className="max-w-[180px] truncate text-sm font-bold text-slate-900">
                  {user?.farm?.name || config.portalSubtitle}
                </p>
              </div>
            </div>

            {/* Search Input (Desktop) */}
            <div className="hidden w-[min(32vw,440px)] items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2 text-sm text-slate-500 lg:flex">
              <Search size={16} className="text-slate-400 shrink-0" />
              <span className="truncate">Search records, health data, alerts...</span>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Switcher */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition touch-target"
                aria-label="Select language"
              >
                <Globe size={16} className="text-slate-500" />
                <span className="uppercase">{i18n.language?.startsWith('sw') ? 'SW' : 'EN'}</span>
                <ChevronDown size={14} className="text-slate-400" />
              </button>

              {langMenuOpen && (
                <div className="absolute right-0 mt-1 w-32 rounded-xl border border-slate-200 bg-white py-1 shadow-lg z-50 animate-in fade-in zoom-in-95 duration-150">
                  <button
                    type="button"
                    onClick={() => changeLanguage('en')}
                    className={cn(
                      'w-full px-3 py-2 text-left text-xs font-semibold flex items-center justify-between hover:bg-slate-50',
                      !i18n.language?.startsWith('sw') ? 'text-emerald-700 font-bold bg-emerald-50/50' : 'text-slate-700'
                    )}
                  >
                    <span>English</span>
                    {!i18n.language?.startsWith('sw') && <CheckCircle2 size={14} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => changeLanguage('sw')}
                    className={cn(
                      'w-full px-3 py-2 text-left text-xs font-semibold flex items-center justify-between hover:bg-slate-50',
                      i18n.language?.startsWith('sw') ? 'text-emerald-700 font-bold bg-emerald-50/50' : 'text-slate-700'
                    )}
                  >
                    <span>Kiswahili</span>
                    {i18n.language?.startsWith('sw') && <CheckCircle2 size={14} />}
                  </button>
                </div>
              )}
            </div>

            {/* Arvion AI Assistant Trigger Button */}
            <button
              type="button"
              onClick={() => setAiDrawerOpen(!aiDrawerOpen)}
              className="flex items-center gap-1.5 rounded-xl border border-blue-200/80 bg-blue-50/80 px-3 py-2 text-xs font-bold text-blue-700 shadow-xs hover:bg-blue-100/80 transition touch-target"
              aria-label="Open Arvion AI Assistant"
            >
              <Sparkles size={16} className="text-blue-600 animate-pulse" />
              <span className="hidden sm:inline">Arvion AI</span>
            </button>

            {/* Notification Bell */}
            <button
              type="button"
              onClick={() => setNotificationOpen(!notificationOpen)}
              className="relative rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 shadow-xs transition hover:bg-slate-50 touch-target flex items-center justify-center"
              aria-label="Open notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white shadow-xs">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <NotificationModal
              isOpen={notificationOpen}
              onClose={() => setNotificationOpen(false)}
            />

            {/* User Profile Pill */}
            <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 shadow-xs">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-white shadow-xs',
                  config.accentBg
                )}
              >
                {initials}
              </div>
              <div className="hidden leading-tight sm:block min-w-0">
                <p className="max-w-[130px] truncate text-xs font-bold text-slate-900">
                  {user?.full_name || 'User'}
                </p>
                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">
                  {effectiveRole.replace('_', ' ')}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Offline Banner & Sync Notification */}
        {!isOnline && (
          <div className="bg-amber-600 px-4 py-2 text-white shadow-xs flex items-center justify-between text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <WifiOff size={16} className="animate-pulse shrink-0" />
              <span>
                <strong>Offline Mode Active:</strong> You can continue logging records. Changes will be saved locally and synced once reconnected.
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
          <div className="bg-emerald-700 px-4 py-2 text-white shadow-xs flex items-center gap-2 text-xs sm:text-sm">
            {isSyncing ? (
              <CloudUpload size={16} className="animate-bounce shrink-0" />
            ) : (
              <CheckCircle2 size={16} className="shrink-0" />
            )}
            <span>{syncMessage}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto px-4 py-5 pb-24 md:px-8 md:py-7 md:pb-8">
          {children}
        </div>

        {/* Global Role-Aware Arvion AI Drawer */}
        <AIAssistantWidget
          isOpen={aiDrawerOpen}
          onClose={() => setAiDrawerOpen(false)}
          roleOverride={effectiveRole}
        />

        {/* Role Adaptive Mobile Nav (Bottom bar for phones) */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 glossy-nav px-2 py-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom,0px))]">
          <div className="flex items-center justify-around">
            {navItems.primary.slice(0, 4).map((item) => {
              const active = isNavActive(item.path);
              const Icon = item.icon;
              const label = item.labelKey ? t(item.labelKey, item.fallbackLabel) : item.fallbackLabel;

              return (
                <Link
                  key={item.key || item.path}
                  to={item.path}
                  className={cn(
                    'flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all touch-target min-w-[64px]',
                    active
                      ? cn(config.accentLight, config.accentText, 'font-bold shadow-xs')
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/60'
                  )}
                >
                  <div
                    className={cn(
                      'flex items-center justify-center w-7 h-7 rounded-lg transition-colors',
                      active ? cn(config.accentBg, 'text-white shadow-xs') : 'text-slate-400'
                    )}
                  >
                    <Icon size={18} />
                  </div>
                  <span className="text-[10px] mt-0.5 truncate max-w-[64px]">{label}</span>
                </Link>
              );
            })}
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100/60 transition-all touch-target min-w-[64px]"
            >
              <div className="flex items-center justify-center w-7 h-7 rounded-lg text-slate-400">
                <Menu size={18} />
              </div>
              <span className="text-[10px] mt-0.5">{t('more', 'More')}</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AppShell;
