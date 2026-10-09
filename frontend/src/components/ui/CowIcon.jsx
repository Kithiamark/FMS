import React from 'react';

export const Cow = ({ size = 20, className = '', strokeWidth = 2, ...props }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Horns and Crown */}
      <path d="M4 6c0 2 2 3 4 3 0 0 1-3 4-3s4 3 4 3c2 0 4-1 4-3" />
      {/* Head contour */}
      <path d="M6 9v3.5a6 6 0 0 0 12 0V9" />
      {/* Ears */}
      <path d="M6 10C3.5 10 2.5 9 2.5 7.5S4 6 6 7.5" />
      <path d="M18 10c2.5 0 3.5-1 3.5-2.5S20 6 18 7.5" />
      {/* Muzzle / Snout */}
      <rect x="7" y="14" width="10" height="6.5" rx="3" />
      {/* Nostrils */}
      <circle cx="9.8" cy="17.2" r="0.8" fill="currentColor" />
      <circle cx="14.2" cy="17.2" r="0.8" fill="currentColor" />
      {/* Eyes */}
      <circle cx="8.8" cy="11.5" r="0.8" fill="currentColor" />
      <circle cx="15.2" cy="11.5" r="0.8" fill="currentColor" />
    </svg>
  );
};

export default Cow;
