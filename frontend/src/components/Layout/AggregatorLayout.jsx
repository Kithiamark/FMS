import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, BrainCircuit, MessageSquare, Bell, 
  LogOut, Menu, X, Droplets
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
      
      <aside className={cn("bg-white border-r border-slate-200 flex flex-col", mobileClasses)}>
        <div className="h-20 flex items-center justify-between px-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl">
              <Droplets className="text-white" size={20} />
            </div>
            <span className="font-black text-xl text-slate-900 tracking-tight">Arvion</span>
          </div>
          {isMobile && <button onClick={toggle} className="text-slate-500"><X size={24} /></button>}
        </div>

        <nav className="flex-1 py-6 px-4 space-y-2">
          {navItems.map((item) => {
            const isActive = location.search.includes(item.path.split('?')[1]) || (item.path === '/aggregator/dashboard' && !location.search);
            return (
              <Link 
                key={item.label} 
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-sm",
                  isActive 
                    ? "bg-blue-50 text-blue-700 shadow-sm border border-blue-100/50" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                )}
                onClick={() => { if(isMobile) toggle(); }}
              >
                <item.icon size={20} className={isActive ? "text-blue-600" : "text-slate-400"} />
                <span className="flex-1">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              {user?.full_name?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">{user?.full_name}</p>
              <p className="text-xs text-slate-500 truncate">Aggregator</p>
            </div>
            <button onClick={logout} className="text-slate-400 hover:text-red-500 transition-colors bg-white p-2 rounded-lg border border-slate-200">
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
    <div className="flex h-screen bg-[#F4F7F3] font-sans text-slate-900">
      <AggregatorSidebar isOpen={sidebarOpen} toggle={() => setSidebarOpen(false)} isMobile={true} />
      <AggregatorSidebar isOpen={true} toggle={() => {}} isMobile={false} />

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/50 flex items-center justify-between px-4 md:hidden">
          <div className="flex items-center gap-2">
            <Droplets className="text-blue-600" size={20} />
            <span className="font-bold text-lg text-slate-900">Arvion</span>
          </div>
          <button onClick={() => setSidebarOpen(true)} className="p-2 text-slate-600 border border-slate-200 rounded-lg bg-white">
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
