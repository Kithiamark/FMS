import React from 'react';
import { cn } from './Button';

export const Card = ({ children, className = '', roleAccent = false, onClick, ...props }) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-card border border-surface-border bg-surface p-5 shadow-card transition-all duration-200',
        roleAccent && 'border-l-4 border-l-role-accent',
        onClick && 'cursor-pointer hover:shadow-card-hover active:scale-[0.99]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '', ...props }) => (
  <div className={cn('flex flex-col space-y-1.5 pb-4', className)} {...props}>
    {children}
  </div>
);

export const CardTitle = ({ children, className = '', ...props }) => (
  <h3 className={cn('font-heading text-lg font-bold tracking-tight text-slate-900', className)} {...props}>
    {children}
  </h3>
);

export const CardDescription = ({ children, className = '', ...props }) => (
  <p className={cn('text-xs text-slate-500', className)} {...props}>
    {children}
  </p>
);

export const CardContent = ({ children, className = '', ...props }) => (
  <div className={cn('pt-0', className)} {...props}>
    {children}
  </div>
);

export const CardFooter = ({ children, className = '', ...props }) => (
  <div className={cn('flex items-center pt-4 border-t border-slate-100', className)} {...props}>
    {children}
  </div>
);

export default Card;
