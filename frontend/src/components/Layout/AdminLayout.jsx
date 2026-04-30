import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Stethoscope, CreditCard, Ticket, Megaphone, 
  Terminal, Settings, LogOut, Menu, X 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../ui/Button';

const AdminSidebar = ({ isOpen, toggle, isMobile }) => {
  const location = useLocation();
  const { logout, user } = useAuth();

  const navItems = [
    { icon: LayoutDashboard, label: 'Overview', path: '/admin/dashboard' },
    { icon: Users, label: 'Farmers', path: '/admin/farmers' },
    { icon: Stethoscope, label: 'Veterinarians', path: '/admin/vets' },
    { icon: CreditCard, label: 'Subscriptions', path: '/admin/subscriptions' },
    { icon: Ticket, label: 'Support Tickets', path: '/admin/tickets' },
    { icon: Megaphone, label: 'Announcements', path: '/admin/announcements' },
    { icon: Terminal, label: 'System Logs', path: '/admin/logs' },
    { icon: Settings, label: 'Settings', path: '/admin/settings' },
  ];

  const mobileClasses = isMobile 
    ? `fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} w-64`
    : `hidden md:flex flex-col w-64 h-screen sticky top-0`;

  return (
    <>
      {isMobile && isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40" onClick={toggle} />
      )}
      
      <aside className={cn("bg-admin-card border-r border-gray-800 text-admin-text-main flex flex-col shadow-xl", mobileClasses)}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-admin-accent rounded-lg flex items-center justify-center font-bold font-heading text-white">A</div>
            <span className="font-heading font-bold text-lg tracking-tight">ADMIN PANEL</span>
          </div>
          {isMobile && <button onClick={toggle} className="text-gray-400"><X size={24} /></button>}
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link 
                key={item.path} 
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium text-sm",
                  isActive 
                    ? "bg-admin-accent/10 text-admin-accent border border-admin-accent/20" 
                    : "text-admin-text-muted hover:bg-gray-800 hover:text-white"
                )}
              >
                <item.icon size={18} />
                <span className="flex-1">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-800 bg-black/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-admin-text-muted font-bold font-heading border border-gray-700">
              {user?.full_name?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-white">{user?.full_name}</p>
              <p className="text-xs text-admin-text-muted truncate">Super Admin</p>
            </div>
            <button onClick={logout} className="text-gray-500 hover:text-red-400 transition-colors">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-admin-dark font-sans text-admin-text-main selection:bg-admin-accent selection:text-white">
      <AdminSidebar isOpen={sidebarOpen} toggle={() => setSidebarOpen(false)} isMobile={true} />
      <AdminSidebar isOpen={true} toggle={() => {}} isMobile={false} />

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 bg-admin-card border-b border-gray-800 flex items-center justify-between px-4 md:hidden">
          <span className="font-bold text-lg text-white">Admin Panel</span>
          <button onClick={() => setSidebarOpen(true)} className="p-2 text-gray-400">
            <Menu size={24} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
            {children}
        </div>
      </main>
    </div>
  );
};
