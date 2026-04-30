import React from 'react';
import { twMerge } from 'tailwind-merge';
import clsx from 'clsx';

export const cn = (...inputs) => twMerge(clsx(inputs));

const variants = {
  primary: 'bg-forest-green text-white hover:bg-green-800 border-transparent',
  secondary: 'bg-amber-accent text-white hover:bg-yellow-600 border-transparent',
  ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 border-transparent',
  outline: 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-3 text-base',
};

export const Button = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  type = 'button',
  ...props
}) => (
  <button
    type={type}
    className={cn(
      'inline-flex items-center justify-center rounded-lg border font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
      variants[variant] || variants.primary,
      sizes[size] || sizes.md,
      className
    )}
    {...props}
  >
    {children}
  </button>
);
