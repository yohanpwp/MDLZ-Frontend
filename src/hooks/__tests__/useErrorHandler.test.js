import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import { useErrorHandler, useAsyncOperation } from '../useErrorHandler';

describe('useErrorHandler', () => {
  it('should initialize with no error', () => {
    const { result } = renderHook(() => useErrorHandler());
    
    expect(result.current.error).toBeNull();
    expect(result.current.isRetrying).toBe(false);
  });

  it('should handle network errors', () => {
    const { result } = renderHook(() => useErrorHandler());
    
    act(() => {
      const networkError = new Error('Failed to fetch');
      networkError.name = 'NetworkError';
      result.current.handleError(networkError);
    });
    
    expect(result.current.error.type).toBe('network');
    expect(result.current.error.title).toBe('Connection Problem');
    expect(result.current.error.recoverable).toBe(true);
  });

  it('should handle validation errors', () => {
    const { result } = renderHook(() => useErrorHandler());
    
    act(() => {
      result.current.handleError(
        new Error('Invalid data'),
        { operation: 'validation' }
      );
    });
    
    expect(result.current.error.type).toBe('validation');
    expect(result.current.error.title).toBe('Validation Error');
  });

  it('should handle permission errors', () => {
    const { result } = renderHook(() => useErrorHandler());
    
    act(() => {
      const permError = new Error('Access denied');
      permError.status = 403;
      result.current.handleError(permError);
    });
    
    expect(result.current.error.type).toBe('permission');
    expect(result.current.error.recoverable).toBe(false);
  });

  it('should clear errors', () => {
    const { result } = renderHook(() => useErrorHandler());
    
    act(() => {
      result.current.handleError(new Error('Test error'));
    });
    
    expect(result.current.error).not.toBeNull();
    
    act(() => {
      result.current.clearError();
    });
    
    expect(result.current.error).toBeNull();
  });

  it('should handle retry operations', async () => {
    const { result } = renderHook(() => useErrorHandler());
    const retryFn = vi.fn().mockResolvedValue('success');
    
    act(() => {
      result.current.handleError(new Error('Test error'));
    });
    
    expect(result.current.error).not.toBeNull();
    
    await act(async () => {
      await result.current.retry(retryFn);
    });
    
    expect(retryFn).toHaveBeenCalled();
    expect(result.current.error).toBeNull();
  });
});

describe('useAsyncOperation', () => {
  it('should handle successful operations', async () => {
    const { result } = renderHook(() => useAsyncOperation());
    const asyncFn = vi.fn().mockResolvedValue('success');
    
    let returnValue;
    await act(async () => {
      returnValue = await result.current.execute(asyncFn);
    });
    
    expect(asyncFn).toHaveBeenCalled();
    expect(returnValue).toBe('success');
    expect(result.current.error).toBeNull();
  });

  it('should handle failed operations', async () => {
    const { result } = renderHook(() => useAsyncOperation());
    const asyncFn = vi.fn().mockRejectedValue(new Error('Test error'));
    
    await act(async () => {
      try {
        await result.current.execute(asyncFn);
      } catch (error) {
        // Expected to throw
      }
    });
    
    expect(result.current.error).not.toBeNull();
    expect(result.current.error.message).toBe('Test error');
  });

  it('should track loading state', async () => {
    const { result } = renderHook(() => useAsyncOperation());
    const asyncFn = vi.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve('success'), 100))
    );
    
    expect(result.current.isLoading).toBe(false);
    
    const promise = act(async () => {
      return result.current.execute(asyncFn);
    });
    
    expect(result.current.isLoading).toBe(true);
    
    await promise;
    
    expect(result.current.isLoading).toBe(false);
  });
});