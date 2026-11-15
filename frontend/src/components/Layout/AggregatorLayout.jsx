import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, BrainCircuit, MessageSquare, Bell, 
  LogOut, Menu, X, Droplets, Users
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../ui/Button';

const AggregatorSidebar = ({ isOpen, toggle, isMobile }) => {
  const location = useLocation();
  const { logout, user } = useAuth();
  
  // For MVP we can just use hash routing or state if we don't have separate pages.
  // Assuming the user wants separate pages eventually, we'll setup standard links.
  const navItems = [
    { icon: LayoutDashboard, label: 'Overview', path: '/aggregator/dashboard' },
    { icon: BrainCircuit, label: 'Intelligence', path: '/aggregator/dashboard?tab=intelligence' },
    { icon: MessageSquare, label: 'Chat', path: '/aggregator/dashboard?tab=messages' },
    { icon: Users, label: 'Community', path: '/community' },
    { icon: Bell, label: 'Alerts', path: '/aggregator/dashboard?tab=alerts' },
  ];

  const mobileClasses = isMobile 
    ? `fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} w-64`
    : `hidden md:flex flex-col w-64 h-screen sticky top-0`;

  return (
    <>
      {isMobile && isOpen && (
        <div className="fixed inset-0 bg-black/50 z-30" onClick={toggle} />
      )}
      
      <aside className={cn("backdrop-blur-xl bg-white/80 border-r border-slate-200/60 shadow-sm flex flex-col", mobileClasses)}>
        <div className="h-20 flex items-center justify-between px-6 border-b border-slate-100/80">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-2.5 rounded-2xl shadow-md shadow-blue-500/20 text-white">
              <Droplets className="text-white" size={20} />
            </div>
            <div>
              <span className="font-black text-xl text-slate-900 tracking-tight block leading-none">Arvion</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Logistics Hub</span>
            </div>
          </div>
          {isMobile && <button onClick={toggle} className="text-slate-500 hover:text-slate-800"><X size={24} /></button>}
        </div>

        <nav className="flex-1 py-6 px-4 space-y-2">
          {navItems.map((item) => {
            const isCommunity = item.path === '/community';
            const isActive = isCommunity
              ? location.pathname === '/community'
              : (item.path.includes('?') 
                  ? location.search.includes(item.path.split('?')[1]) 
                  : (location.pathname === '/aggregator/dashboard' && !location.search));
            return (
              <Link 
                key={item.label} 
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-sm",
                  isActive 
                    ? "bg-blue-600/10 text-blue-700 shadow-sm border border-blue-500/20 backdrop-blur-md font-bold" 
                    : "text-slate-600 hover:bg-white/60 hover:text-slate-900 hover:shadow-xs"
                )}
                onClick={() => { if(isMobile) toggle(); }}
              >
                <item.icon size={20} className={isActive ? "text-blue-600" : "text-slate-400"} />
                <span className="flex-1">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200/60 bg-white/50 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold shadow-sm shadow-blue-500/20">
              {user?.full_name?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">{user?.full_name}</p>
              <p className="text-xs text-blue-600 font-semibold truncate">Dairy Aggregator</p>
            </div>
            <button onClick={logout} title="Log out" className="text-slate-400 hover:text-red-500 transition-colors bg-white/80 hover:bg-white p-2 rounded-xl border border-slate-200/80 shadow-xs">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export const AggregatorLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="relative flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* Soft Ambient Background Orbs */}
      <div className="pointer-events-none absolute -top-40 -right-40 h-96 w-96 rounded-full bg-blue-300/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-indigo-300/15 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -left-32 h-80 w-80 rounded-full bg-cyan-200/20 blur-3xl" />

      <AggregatorSidebar isOpen={sidebarOpen} toggle={() => setSidebarOpen(false)} isMobile={true} />
      <AggregatorSidebar isOpen={true} toggle={() => {}} isMobile={false} />

      <main className="flex-1 flex flex-col overflow-hidden relative z-10">
        <header className="h-16 bg-white/70 backdrop-blur-xl border-b border-slate-200/60 flex items-center justify-between px-4 md:hidden">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-1.5 rounded-lg text-white">
              <Droplets size={16} />
            </div>
            <span className="font-black text-lg text-slate-900">Arvion</span>
          </div>
          <button onClick={() => setSidebarOpen(true)} className="p-2 text-slate-600 border border-slate-200/80 rounded-xl bg-white/80 backdrop-blur-md">
            <Menu size={20} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto">
            {children}
        </div>
      </main>
    </div>
  );
};
