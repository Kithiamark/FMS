import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button, cn } from './Button';

export const ErrorState = ({
  title = 'Failed to load data',
  message = 'An unexpected error occurred while communicating with the server.',
  onRetry,
  retryLabel = 'Try again',
  className = '',
}) => {
  return (
    <div
      className={cn(
        'rounded-card border border-red-200 bg-red-50/50 p-6 sm:p-10 text-center transition-all',
        className
      )}
    >
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600 mb-3.5">
        <AlertTriangle size={24} />
      </div>

      <h3 className="font-heading text-base font-bold text-slate-900">
        {title}
      </h3>

      <p className="mx-auto mt-1 max-w-md text-xs sm:text-sm text-slate-600">
        {message}
      </p>

      {onRetry && (
        <div className="mt-5 flex justify-center">
          <Button
            variant="outline"
            onClick={onRetry}
            className="border-red-300 text-red-700 hover:bg-red-100/60 touch-target"
          >
            <RotateCcw size={16} className="mr-2" />
            {retryLabel}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ErrorState;
