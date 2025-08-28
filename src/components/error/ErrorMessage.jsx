import React from 'react';
import PropTypes from 'prop-types';
import { AlertTriangle, AlertCircle, Info, CheckCircle, RefreshCw, X } from 'lucide-react';
import Button from '../ui/Button';

const ErrorMessage = ({ 
  error, 
  onRetry, 
  onDismiss, 
  showRetry = true, 
  showDismiss = true,
  className = '' 
}) => {
  if (!error) return null;

  const getIcon = () => {
    switch (error.type) {
      case 'network':
        return <AlertTriangle className="h-5 w-5" />;
      case 'validation':
        return <AlertCircle className="h-5 w-5" />;
      case 'permission':
        return <AlertTriangle className="h-5 w-5" />;
      case 'server':
        return <AlertTriangle className="h-5 w-5" />;
      case 'info':
        return <Info className="h-5 w-5" />;
      case 'success':
        return <CheckCircle className="h-5 w-5" />;
      default:
        return <AlertCircle className="h-5 w-5" />;
    }
  };

  const getColorClasses = () => {
    switch (error.type) {
      case 'network':
      case 'server':
      case 'permission':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'validation':
      case 'file':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      default:
        return 'bg-red-50 border-red-200 text-red-800';
    }
  };

  const getIconColorClass = () => {
    switch (error.type) {
      case 'network':
      case 'server':
      case 'permission':
        return 'text-red-500';
      case 'validation':
      case 'file':
        return 'text-yellow-500';
      case 'info':
        return 'text-blue-500';
      case 'success':
        return 'text-green-500';
      default:
        return 'text-red-500';
    }
  };

  return (
    <div className={`border rounded-md p-4 ${getColorClasses()} ${className}`}>
      <div className="flex items-start">
        <div className={`flex-shrink-0 ${getIconColorClass()}`}>
          {getIcon()}
        </div>
        
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium">
            {error.title}
          </h3>
          
          <div className="mt-1 text-sm">
            {error.message}
          </div>

          {(showRetry || showDismiss) && (
            <div className="mt-4 flex space-x-2">
              {showRetry && error.recoverable && onRetry && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onRetry}
                  className="text-xs"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Try Again
                </Button>
              )}
              
              {showDismiss && onDismiss && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onDismiss}
                  className="text-xs"
                >
                  <X className="h-3 w-3 mr-1" />
                  Dismiss
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

ErrorMessage.propTypes = {
  error: PropTypes.shape({
    title: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    type: PropTypes.oneOf(['network', 'validation', 'permission', 'server', 'file', 'info', 'success', 'generic']),
    recoverable: PropTypes.bool
  }),
  onRetry: PropTypes.func,
  onDismiss: PropTypes.func,
  showRetry: PropTypes.bool,
  showDismiss: PropTypes.bool,
  className: PropTypes.string
};

export default ErrorMessage;