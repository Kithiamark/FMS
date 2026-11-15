import React from 'react';
import { Inbox } from 'lucide-react';
import { Button, cn } from './Button';

export const EmptyState = ({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className = '',
}) => {
  const IconComponent = icon || Inbox;

  return (
    <div
      className={cn(
        'rounded-card border border-dashed border-slate-300 bg-surface/50 p-8 sm:p-12 text-center transition-all',
        className
      )}
    >
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 shadow-xs mb-4">
        <IconComponent size={28} />
      </div>

      <h3 className="font-heading text-base font-bold text-slate-900 sm:text-lg">
        {title}
      </h3>

      {description && (
        <p className="mx-auto mt-1.5 max-w-sm text-sm text-slate-500">
          {description}
        </p>
      )}

      {(action || secondaryAction) && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {React.isValidElement(action) ? (
            action
          ) : action ? (
            <Button
              variant={action.variant || 'primary'}
              onClick={action.onClick}
              className="touch-target"
            >
              {action.icon && <action.icon size={16} className="mr-2" />}
              {action.label}
            </Button>
          ) : null}

          {React.isValidElement(secondaryAction) ? (
            secondaryAction
          ) : secondaryAction ? (
            <Button
              variant="outline"
              onClick={secondaryAction.onClick}
              className="touch-target"
            >
              {secondaryAction.label}
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
