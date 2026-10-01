import React from 'react';

/**
 * Reusable Button component with multiple variants
 */
export default function Button({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  className = '',
  ...props
}) {
  const baseStyles =
    'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 rounded-lg gap-1.5',
    md: 'text-sm px-4 py-2.5 rounded-xl gap-2',
    lg: 'text-base px-6 py-3 rounded-xl gap-2.5',
  };

  const variantStyles = {
    primary:
      'bg-[#FF5722] text-white hover:bg-[#E64A19] active:scale-[0.98] focus-visible:ring-[#FF5722] shadow-sm',
    secondary:
      'bg-neutral-900 text-white hover:bg-neutral-800 active:scale-[0.98] focus-visible:ring-neutral-900 shadow-sm',
    outline:
      'border border-neutral-300 text-neutral-800 bg-white hover:bg-neutral-50 active:scale-[0.98] focus-visible:ring-neutral-400',
    ghost:
      'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 focus-visible:ring-neutral-300',
    danger:
      'bg-rose-600 text-white hover:bg-rose-700 active:scale-[0.98] focus-visible:ring-rose-500 shadow-sm',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${sizeStyles[size] || sizeStyles.md} ${
        variantStyles[variant] || variantStyles.primary
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
