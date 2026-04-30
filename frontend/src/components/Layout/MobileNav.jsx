import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Milk, PiggyBank, Brain, Grid2X2 } from 'lucide-react';

const MobileNav = ({ onMenuClick }) => {
  const location = useLocation();
  const navItems = [
    { icon: LayoutDashboard, path: '/dashboard', label: 'Home' },
    { icon: Milk, path: '/dairy', label: 'Dairy' },
    { icon: PiggyBank, path: '/finance', label: 'Money' },
    { icon: Brain, path: '/insights', label: 'AI' },
    { icon: Grid2X2, action: onMenuClick, label: 'More' },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 pb-safe">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item, idx) => {
          const isActive = item.path && location.pathname.startsWith(item.path);
          const Icon = item.icon;
          
          if (item.action) {
            return (
              <button key={idx} onClick={item.action} className="flex flex-col items-center justify-center w-full h-full text-gray-500">
                <Icon size={24} />
                <span className="text-[10px] mt-1">{item.label}</span>
              </button>
            );
          }

          return (
            <Link 
              key={idx} 
              to={item.path}
              className={`flex flex-col items-center justify-center w-full h-full ${isActive ? 'text-forest-green' : 'text-gray-500'}`}
            >
              <Icon size={24} />
              <span className="text-[10px] mt-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default MobileNav;
