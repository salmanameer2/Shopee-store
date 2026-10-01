import React from 'react';

/**
 * Standard content container wrapper for consistent horizontal constraints
 */
export default function Container({ children, className = '', fluid = false }) {
  return (
    <div
      className={`mx-auto px-4 sm:px-6 lg:px-8 ${
        fluid ? 'w-full' : 'max-w-7xl'
      } ${className}`}
    >
      {children}
    </div>
  );
}
