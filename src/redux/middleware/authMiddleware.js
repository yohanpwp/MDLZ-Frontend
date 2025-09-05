import { clearAuth, handleTokenExpiration } from '../slices/authSlice';
import AuthService from '../../services/AuthService';

/**
 * Auth Middleware
 * 
 * Intercepts Redux actions and checks for token expiration
 * Automatically clears auth state when token is expired
 */
export const authMiddleware = (store) => (next) => (action) => {
  // Check token expiration before processing any action
  const state = store.getState();
  const { auth } = state;

  // Only check if user is currently authenticated
  if (auth.isAuthenticated && auth.isInitialized) {
    const currentUser = AuthService.getCurrentUser();
    
    // If AuthService says user is not authenticated (token expired)
    // but Redux state says they are, clear the auth state
    if (!currentUser) {
      console.log('Token expired detected in middleware, clearing auth state');
      store.dispatch(handleTokenExpiration());
    }
  }

  // Continue with the original action
  return next(action);
};

/**
 * API Response Middleware
 * 
 * Handles 401 responses from API calls and automatically logs out user
 */
export const apiResponseMiddleware = (store) => (next) => (action) => {
  // Check if this is a rejected async thunk with 401 status
  if (action.type.endsWith('/rejected') && action.payload) {
    const { status, message } = action.payload;
    
    if (status === 401 || message === 'Unauthorized' || message === 'Token expired') {
      console.log('401 Unauthorized response detected, clearing auth state');
      store.dispatch(handleTokenExpiration());
    }
  }

  return next(action);
};