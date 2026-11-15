import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { cn } from './Button';

export const PageHeader = ({
  title,
  subtitle,
  badge,
  backTo,
  actions,
  className = '',
}) => {
  const navigate = useNavigate();

  return (
    <div className={cn('mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between', className)}>
      <div className="min-w-0 flex-1">
        {backTo && (
          <button
            type="button"
            onClick={() => (typeof backTo === 'string' ? navigate(backTo) : navigate(-1))}
            className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors touch-target"
            aria-label="Go back"
          >
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>
        )}
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl truncate">
            {title}
          </h1>
          {badge && <div>{badge}</div>}
        </div>
        {subtitle && (
          <p className="mt-1 text-sm text-slate-500 max-w-3xl">
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
