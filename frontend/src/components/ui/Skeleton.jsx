import React from 'react';
import { cn } from './Button';

export const Skeleton = ({ className = '', ...props }) => {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-slate-200/80',
        className
      )}
      {...props}
    />
  );
};

export const SkeletonText = ({ lines = 3, className = '' }) => (
  <div className={cn('space-y-2', className)}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        className={cn(
          'h-4',
          i === lines - 1 ? 'w-2/3' : 'w-full'
        )}
      />
    ))}
  </div>
);

export const SkeletonCircle = ({ size = 40, className = '' }) => (
  <Skeleton
    className={cn('rounded-full shrink-0', className)}
    style={{ width: size, height: size }}
  />
);

export const SkeletonCard = ({ className = '' }) => (
  <div className={cn('rounded-card border border-surface-border bg-surface p-5 shadow-card space-y-4', className)}>
    <div className="flex items-center justify-between">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-8 w-8 rounded-lg" />
    </div>
    <Skeleton className="h-8 w-24" />
    <Skeleton className="h-3 w-40" />
  </div>
);

export const SkeletonStatGrid = ({ count = 4, className = '' }) => (
  <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4', className)}>
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);

export const SkeletonTable = ({ rows = 5, cols = 4, className = '' }) => (
  <div className={cn('rounded-card border border-surface-border bg-surface p-4 shadow-card space-y-3', className)}>
    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
      <Skeleton className="h-5 w-36" />
      <Skeleton className="h-8 w-24 rounded-lg" />
    </div>
    <div className="space-y-2.5 pt-2">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-3">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton
              key={c}
              className={cn(
                'h-4',
                c === 0 ? 'w-1/3' : 'flex-1'
              )}
            />
          ))}
        </div>
      ))}
    </div>
  </div>
);

export default Skeleton;
