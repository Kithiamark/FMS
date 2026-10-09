import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

export const Modal = ({ isOpen, onClose, title, children, size = 'md', className = '' }) => {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-5xl',
    full: 'max-w-7xl',
  };
  const maxWidthClass = sizeClasses[size] || sizeClasses.md;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
      <div className={`w-full ${maxWidthClass} overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl animate-in fade-in zoom-in duration-200 dark:border-slate-800 dark:bg-slate-900 ${className}`}>
        <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{title}</h3>
          <button onClick={onClose} className="rounded-full p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X size={20} />
          </button>
        </div>
        <div className="p-4 md:p-6 max-h-[85vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};
