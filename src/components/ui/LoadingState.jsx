import React from 'react';
import PropTypes from 'prop-types';
import { Loader2 } from 'lucide-react';

const LoadingState = ({ 
  message = 'Loading...', 
  size = 'default',
  variant = 'spinner',
  progress = null,
  className = ''
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-4 w-4';
      case 'lg':
        return 'h-8 w-8';
      case 'xl':
        return 'h-12 w-12';
      default:
        return 'h-6 w-6';
    }
  };

  const getTextSizeClass = () => {
    switch (size) {
      case 'sm':
        return 'text-sm';
      case 'lg':
        return 'text-lg';
      case 'xl':
        return 'text-xl';
      default:
        return 'text-base';
    }
  };

  if (variant === 'skeleton') {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  if (variant === 'dots') {
    return (
      <div className={`flex items-center justify-center space-x-1 ${className}`}>
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      </div>
    );
  }

  if (variant === 'progress' && progress !== null) {
    return (
      <div className={`w-full ${className}`}>
        <div className="flex justify-between items-center mb-2">
          <span className={`text-gray-700 ${getTextSizeClass()}`}>{message}</span>
          <span className={`text-gray-500 ${getTextSizeClass()}`}>{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          ></div>
        </div>
      </div>
    );
  }

  // Default spinner variant
  return (
    <div className={`flex items-center justify-center space-x-2 ${className}`}>
      <Loader2 className={`animate-spin text-blue-500 ${getSizeClasses()}`} />
      {message && (
        <span className={`text-gray-700 ${getTextSizeClass()}`}>
          {message}
        </span>
      )}
    </div>
  );
};

LoadingState.propTypes = {
  message: PropTypes.string,
  size: PropTypes.oneOf(['sm', 'default', 'lg', 'xl']),
  variant: PropTypes.oneOf(['spinner', 'dots', 'skeleton', 'progress']),
  progress: PropTypes.number,
  className: PropTypes.string
};

export default LoadingState;