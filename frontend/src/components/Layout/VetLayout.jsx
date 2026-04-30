import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Building, Stethoscope, Calendar, MessageSquare, 
  Users, User, LogOut, ToggleLeft, ToggleRight, Menu, X 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../ui/Button';

const VetSidebar = ({ isOpen, toggle, isMobile }) => {
  const location = useLocation();
  const { logout, user } = useAuth();
  const [isAvailable, setIsAvailable] = useState(true); // Should fetch from API

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/vet/dashboard' },
    { icon: Building, label: 'My Farms', path: '/vet/farms' },
    { icon: Stethoscope, label: 'Animal Records', path: '/vet/records' },
    { icon: Calendar, label: 'Visits', path: '/vet/visits' },
    { icon: MessageSquare, label: 'Messages', path: '/vet/messages' },
    { icon: Users, label: 'Connections', path: '/vet/connections', badge: true },
    { icon: User, label: 'Profile', path: '/vet/profile' },
  ];

  const mobileClasses = isMobile 
    ? `fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} w-64`
    : `hidden md:flex flex-col w-64 h-screen sticky top-0`;

  return (
    <>
      {isMobile && isOpen && (
        <div className="fixed inset-0 bg-black/50 z-30" onClick={toggle} />
      )}
      
      <aside className={cn("bg-vet-navy text-white flex flex-col shadow-xl", mobileClasses)}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-vet-navy-light">
          <div className="flex items-center gap-2">
            <Stethoscope className="text-vet-teal" size={24} />
            <span className="font-heading font-bold text-xl tracking-tight">Vet Portal</span>
          </div>
          {isMobile && <button onClick={toggle}><X size={24} /></button>}
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link 
                key={item.path} 
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium",
                  isActive 
                    ? "bg-vet-teal text-white shadow-md" 
                    : "text-gray-300 hover:bg-vet-navy-light hover:text-white"
                )}
              >
                <item.icon size={20} />
                <span className="flex-1">{item.label}</span>
                {item.badge && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-vet-navy-light bg-vet-navy-light/30">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-400">Status</span>
            <button 
              onClick={() => setIsAvailable(!isAvailable)} 
              className={cn("flex items-center gap-2 text-sm font-medium transition-colors", isAvailable ? "text-vet-teal" : "text-gray-500")}
            >
              {isAvailable ? 'Available' : 'Away'}
              {isAvailable ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
            </button>
          </div>
          
          <div className="flex items-center gap-3 pt-2">
            <div className="w-10 h-10 rounded-full bg-vet-teal text-white flex items-center justify-center font-bold font-heading">
              {user?.full_name?.charAt(0) || 'D'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">Dr. {user?.full_name?.split(' ')[0]}</p>
              <p className="text-xs text-gray-400 truncate">Veterinarian</p>
            </div>
            <button onClick={logout} className="text-gray-400 hover:text-red-400 transition-colors">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export const VetLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      <VetSidebar isOpen={sidebarOpen} toggle={() => setSidebarOpen(false)} isMobile={true} />
      <VetSidebar isOpen={true} toggle={() => {}} isMobile={false} />

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 bg-white border-b flex items-center justify-between px-4 md:hidden">
          <span className="font-bold text-lg text-vet-navy">Vet Portal</span>
          <button onClick={() => setSidebarOpen(true)} className="p-2 text-gray-600">
            <Menu size={24} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
            {children}
        </div>
      </main>
    </div>
  );
};
