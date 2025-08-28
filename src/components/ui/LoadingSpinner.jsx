import React from 'react';
import { cn } from '../../utils/cn.js';

/**
 * LoadingSpinner component for displaying loading states
 */
export const LoadingSpinner = ({ 
  size = 'md', 
  className = '', 
  text = 'Loading...',
  showText = true 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  return (
    <div className={cn(
      'flex flex-col items-center justify-center space-y-2',
      className
    )}>
      <div 
        className={cn(
          'animate-spin rounded-full border-2 border-gray-300 border-t-blue-600',
          sizeClasses[size]
        )}
        role="status"
        aria-label="Loading"
      />
      {showText && (
        <span className="text-sm text-gray-600 font-medium">
          {text}
        </span>
      )}
    </div>
  );
};

/**
 * FullPageLoader for page-level loading states
 */
export const FullPageLoader = ({ text = 'Loading page...' }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <LoadingSpinner size="lg" text={text} />
    </div>
  );
};

/**
 * InlineLoader for inline loading states
 */
export const InlineLoader = ({ text = 'Loading...', className = '' }) => {
  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <LoadingSpinner size="sm" showText={false} />
      <span className="text-sm text-gray-600">{text}</span>
    </div>
  );
};

export default LoadingSpinner;