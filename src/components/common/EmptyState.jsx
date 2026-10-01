import React from 'react';
import { Link } from 'react-router-dom';
import Button from './Button.jsx';

/**
 * Reusable EmptyState placeholder component
 */
export default function EmptyState({
  icon: Icon,
  title = 'No items found',
  description = 'There is nothing to display here right now.',
  actionText,
  actionLink,
  onAction,
  className = '',
}) {
  return (
    <div
      className={`text-center py-16 px-4 max-w-md mx-auto flex flex-col items-center justify-center ${className}`}
    >
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center text-neutral-400 mb-4">
          <Icon className="w-8 h-8" />
        </div>
      )}
      <h3 className="text-lg font-bold text-neutral-900 mb-2">{title}</h3>
      <p className="text-sm text-neutral-500 mb-6 leading-relaxed">
        {description}
      </p>

      {actionText && actionLink && (
        <Link to={actionLink}>
          <Button variant="primary">{actionText}</Button>
        </Link>
      )}

      {actionText && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
}
