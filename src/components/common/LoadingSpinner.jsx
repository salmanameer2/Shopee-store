import React from 'react';

/**
 * Clean accessible LoadingSpinner component
 */
export default function LoadingSpinner({
  size = 'md',
  message = 'Loading...',
  fullPage = false,
  className = '',
}) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  const spinner = (
    <div
      className={`inline-flex flex-col items-center justify-center gap-3 ${className}`}
      role="status"
      aria-label={message}
    >
      <div
        className={`${
          sizeClasses[size] || sizeClasses.md
        } rounded-full border-neutral-200 border-t-[#FF5722] animate-spin`}
      />
      {message && (
        <p className="text-xs font-medium text-neutral-500 tracking-wide">
          {message}
        </p>
      )}
      <span className="sr-only">{message}</span>
    </div>
  );

  if (fullPage) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center p-8">
        {spinner}
      </div>
    );
  }

  return spinner;
}
