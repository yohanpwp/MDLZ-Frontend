import { useState, useCallback } from 'react';

/**
 * Custom hook for handling errors with user-friendly messages and recovery options
 */
export const useErrorHandler = () => {
  const [error, setError] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const handleError = useCallback((error, context = {}) => {
    console.error('Error occurred:', error, context);
    
    // Transform technical errors into user-friendly messages
    const userFriendlyError = transformError(error, context);
    
    setError({
      ...userFriendlyError,
      originalError: error,
      context,
      timestamp: new Date().toISOString(),
      id: Date.now().toString(36) + Math.random().toString(36).substr(2)
    });
  }, []);

  const clearError = useCallback(() => {
    setError(null);
    setIsRetrying(false);
  }, []);

  const retry = useCallback(async (retryFn) => {
    if (!retryFn) return;
    
    setIsRetrying(true);
    try {
      await retryFn();
      clearError();
    } catch (retryError) {
      handleError(retryError, { isRetry: true });
    } finally {
      setIsRetrying(false);
    }
  }, [handleError, clearError]);

  return {
    error,
    isRetrying,
    handleError,
    clearError,
    retry
  };
};

/**
 * Transform technical errors into user-friendly messages
 */
const transformError = (error, context = {}) => {
  // Network errors
  if (error.name === 'NetworkError' || error.message?.includes('fetch')) {
    return {
      title: 'Connection Problem',
      message: 'Unable to connect to the server. Please check your internet connection and try again.',
      type: 'network',
      recoverable: true
    };
  }

  // File processing errors
  if (context.operation === 'file-upload' || error.message?.includes('file')) {
    return {
      title: 'File Processing Error',
      message: 'There was a problem processing your file. Please check the file format and try again.',
      type: 'file',
      recoverable: true
    };
  }

  // Validation errors
  if (context.operation === 'validation' || error.message?.includes('validation')) {
    return {
      title: 'Validation Error',
      message: 'Unable to validate the data. Please check your input and try again.',
      type: 'validation',
      recoverable: true
    };
  }

  // Permission errors
  if (error.status === 403 || error.message?.includes('permission')) {
    return {
      title: 'Access Denied',
      message: 'You don\'t have permission to perform this action. Please contact your administrator.',
      type: 'permission',
      recoverable: false
    };
  }

  // Server errors
  if (error.status >= 500) {
    return {
      title: 'Server Error',
      message: 'Our servers are experiencing issues. Please try again in a few minutes.',
      type: 'server',
      recoverable: true
    };
  }

  // Generic error
  return {
    title: 'Unexpected Error',
    message: error.message || 'Something went wrong. Please try again.',
    type: 'generic',
    recoverable: true
  };
};

/**
 * Hook for handling async operations with error handling
 */
export const useAsyncOperation = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { error, handleError, clearError, retry } = useErrorHandler();

  const execute = useCallback(async (asyncFn, context = {}) => {
    setIsLoading(true);
    clearError();
    
    try {
      const result = await asyncFn();
      return result;
    } catch (error) {
      handleError(error, context);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [handleError, clearError]);

  return {
    isLoading,
    error,
    execute,
    retry: (retryFn) => retry(retryFn),
    clearError
  };
};