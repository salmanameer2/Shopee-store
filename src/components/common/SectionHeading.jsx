import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Reusable SectionHeading with optional title, subtitle, and action link
 */
export default function SectionHeading({
  title,
  subtitle,
  actionText,
  actionLink,
  align = 'left',
  className = '',
}) {
  const isCenter = align === 'center';

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 ${className}`}
    >
      <div className={isCenter ? 'text-center w-full' : ''}>
        {subtitle && (
          <p className="text-xs font-semibold tracking-wider text-[#FF5722] uppercase mb-1.5">
            {subtitle}
          </p>
        )}
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 text-balance">
          {title}
        </h2>
      </div>

      {actionText && actionLink && (
        <Link
          to={actionLink}
          className="text-sm font-semibold text-neutral-700 hover:text-[#FF5722] transition-colors flex items-center gap-1 group whitespace-nowrap self-start sm:self-auto"
        >
          {actionText}
          <span className="transition-transform duration-200 group-hover:translate-x-1">
            &rarr;
          </span>
        </Link>
      )}
    </div>
  );
}
