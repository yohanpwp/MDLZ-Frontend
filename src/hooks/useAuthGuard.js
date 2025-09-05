import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { selectIsAuthenticated, selectIsInitialized, clearAuth, handleTokenExpiration } from '../redux/slices/authSlice';
import AuthService from '../services/AuthService';

/**
 * Auth Guard Hook
 * 
 * Monitors authentication state and automatically redirects users when:
 * - Token expires
 * - Authentication state becomes invalid
 * - User needs to be redirected to login
 */
export const useAuthGuard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isInitialized = useSelector(selectIsInitialized);

  useEffect(() => {
    // Only run after auth is initialized
    if (!isInitialized) return;

    const checkAuthStatus = () => {
      const currentUser = AuthService.getCurrentUser();
      
      // If Redux says authenticated but AuthService says not (token expired)
      if (isAuthenticated && !currentUser) {
        console.log('Token expired, clearing auth state and redirecting to login');
        dispatch(handleTokenExpiration());
        
        // Don't redirect if already on login or public pages
        const publicPaths = ['/login', '/access-denied'];
        if (!publicPaths.includes(location.pathname)) {
          navigate('/login', { 
            state: { from: location, reason: 'token_expired' },
            replace: true 
          });
        }
      }
    };

    // Check immediately
    checkAuthStatus();

    // Set up interval to check token expiration every minute
    const interval = setInterval(checkAuthStatus, 60000);

    return () => clearInterval(interval);
  }, [isAuthenticated, isInitialized, dispatch, navigate, location]);

  return {
    isAuthenticated,
    isInitialized
  };
};

/**
 * Token Expiration Monitor Hook
 * 
 * Specifically monitors token expiration and provides warnings
 */
export const useTokenExpirationMonitor = () => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;

    const checkTokenExpiration = () => {
      try {
        const authData = localStorage.getItem('invoice_validation_auth');
        if (!authData) return;

        const { expiresIn } = JSON.parse(authData);
        if (!expiresIn) return;

        const now = Date.now();
        const timeUntilExpiry = expiresIn - now;

        // If token expires in less than 5 minutes, show warning
        if (timeUntilExpiry > 0 && timeUntilExpiry < 5 * 60 * 1000) {
          console.warn('Token expires in less than 5 minutes');
          // You could dispatch an action to show a warning notification here
        }

        // If token is expired, clear auth
        if (timeUntilExpiry <= 0) {
          console.log('Token has expired');
          dispatch(handleTokenExpiration());
        }
      } catch (error) {
        console.error('Error checking token expiration:', error);
      }
    };

    // Check every 30 seconds
    const interval = setInterval(checkTokenExpiration, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated, dispatch]);
};