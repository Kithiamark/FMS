import React, { forwardRef } from 'react';

const Input = forwardRef(({ label, error, ...props }, ref) => {
    return (
        <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
            <input 
                ref={ref}
                className={`w-full rounded-lg border bg-white px-3 py-3 text-gray-900 shadow-sm transition placeholder:text-gray-400 ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-forest-green focus:ring-forest-green'} focus:outline-none focus:ring-2 focus:ring-opacity-20`}
                {...props}
            />
            {error && <p className="text-red-600 text-sm mt-1">{error.message}</p>}
        </div>
    );
});

export default Input;
