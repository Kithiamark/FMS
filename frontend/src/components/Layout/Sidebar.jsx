import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  LayoutDashboard, Milk, PiggyBank, Brain, Bell, Settings, LogOut, Menu, X, ChevronLeft, Beef, MessageCircle, Stethoscope, Leaf, UsersRound
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../ui/Button';

const Sidebar = ({ isOpen, toggle, isMobile }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const { logout, user } = useAuth();
  const [collapsed, setCollapsed] = React.useState(false);

  const primaryNavItems = [
    { icon: LayoutDashboard, label: t('dashboard'), path: '/dashboard' },
    { icon: Milk, label: t('dairy'), path: '/dairy' },
    { icon: PiggyBank, label: t('financials'), path: '/finance' },
    { icon: Brain, label: t('insights'), path: '/insights' },
  ];

  const secondaryNavItems = [
    { icon: Beef, label: 'Herd', path: '/animals' },
    { icon: Stethoscope, label: 'Find Vet', path: '/find-vet' },
    { icon: UsersRound, label: 'Community', path: '/community' },
    { icon: MessageCircle, label: 'Messages', path: '/messages' },
    { icon: Bell, label: t('alerts'), path: '/alerts' },
    { icon: Settings, label: t('settings'), path: '/settings' },
  ];

  const navItems = isMobile ? secondaryNavItems : [...primaryNavItems, ...secondaryNavItems];

  const sidebarWidth = collapsed ? "w-20" : "w-72";
  const mobileClasses = isMobile 
    ? `fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} w-72`
    : `hidden md:flex flex-col h-screen sticky top-0 transition-all duration-300 ${sidebarWidth}`;

  return (
    <>
      {isMobile && isOpen && (
        <div className="fixed inset-0 bg-black/50 z-30" onClick={toggle} />
      )}
      
      <aside className={cn("flex flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900", mobileClasses)}>
        <div className="flex h-20 items-center justify-between px-5">
          {!collapsed && (
            <Link to="/dashboard" className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-sm">
                <Leaf size={22} />
              </span>
              <span>
                <span className="block font-heading text-xl font-bold leading-tight text-slate-950 dark:text-slate-100">Arvion</span>
                <span className="block text-xs font-medium text-slate-400">Dairy operations</span>
              </span>
            </Link>
          )}
          {!isMobile && (
            <button onClick={() => setCollapsed(!collapsed)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
              {collapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
            </button>
          )}
          {isMobile && (
            <button onClick={toggle}><X size={24} /></button>
          )}
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {isMobile && (
            <div className="px-3 pb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
              More tools
            </div>
          )}
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link 
                key={item.path} 
                to={item.path}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                  isActive 
                    ? "bg-emerald-50 text-emerald-800 shadow-sm dark:bg-emerald-500/10 dark:text-emerald-300" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                )}
              >
                <span className={cn("grid h-9 w-9 place-items-center rounded-lg", isActive ? "bg-emerald-700 text-white" : "bg-transparent text-slate-400 group-hover:text-slate-700")}>
                  <item.icon size={20} />
                </span>
                {(!collapsed || isMobile) && <span className="font-semibold">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-100 p-4 dark:border-slate-800">
          <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 dark:bg-slate-950">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-700 font-bold text-white">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            {(!collapsed || isMobile) && (
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">{user?.full_name}</p>
                <p className="truncate text-xs text-slate-500">{user?.farm?.name}</p>
              </div>
            )}
            {(!collapsed || isMobile) && (
              <button onClick={logout} className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white hover:text-red-500">
                <LogOut size={20} />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
