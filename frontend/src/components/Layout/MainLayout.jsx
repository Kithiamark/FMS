import React, { useMemo, useState } from 'react';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import { Bell, ChevronDown, Menu, Moon, Search, Sun } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const MainLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('arvion-theme') === 'dark');
  const { user } = useAuth();
  const initials = useMemo(() => {
    const names = user?.full_name?.trim().split(/\s+/) || [];
    return (names[0]?.[0] || 'F') + (names[1]?.[0] || '');
  }, [user]);

  React.useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('arvion-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

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
            <button type="button" className="relative rounded-xl border border-slate-200 bg-white p-2 text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
              <Bell size={19} />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-emerald-500" />
            </button>
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

        <div className="flex-1 overflow-y-auto px-4 py-5 pb-24 md:px-8 md:py-7 md:pb-8">
            {children}
        </div>

        <MobileNav onMenuClick={() => setSidebarOpen(true)} />
      </main>
    </div>
  );
};

export default MainLayout;
