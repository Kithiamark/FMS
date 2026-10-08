import React, { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const Input = forwardRef(({ label, error, type = 'text', prefix, helperText, className = '', ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const computedType = isPassword ? (showPassword ? 'text' : 'password') : type;

    return (
        <div className="mb-4">
            {label && (
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                    {label}
                </label>
            )}
            
            <div className={`flex w-full items-stretch rounded-xl border bg-white dark:bg-slate-950 shadow-sm transition overflow-hidden ${
                error 
                    ? 'border-red-500 focus-within:ring-2 focus-within:ring-red-500/20' 
                    : 'border-gray-300 dark:border-slate-800 focus-within:border-forest-green focus-within:ring-2 focus-within:ring-forest-green/20'
            }`}>
                {prefix && (
                    <span className="inline-flex items-center px-3.5 border-r border-gray-200 dark:border-slate-800 bg-gray-50/90 dark:bg-slate-900 text-gray-700 dark:text-slate-300 font-semibold text-sm select-none">
                        {prefix}
                    </span>
                )}
                
                <input 
                    ref={ref}
                    type={computedType}
                    className={`flex-1 min-w-0 bg-transparent px-3.5 py-3 text-sm text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-600 focus:outline-none ${className}`}
                    {...props}
                />

                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(prev => !prev)}
                        className="flex items-center px-3.5 text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 focus:outline-none transition-colors"
                        tabIndex={-1}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                )}
            </div>

            {error && <p className="text-red-600 text-xs mt-1.5 font-medium">{error.message}</p>}
            {helperText && !error && <p className="text-gray-500 text-xs mt-1">{helperText}</p>}
        </div>
    );
});

Input.displayName = 'Input';

export default Input;
