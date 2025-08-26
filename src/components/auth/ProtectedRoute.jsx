import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { selectUser, selectIsAuthenticated, selectIsInitialized } from '../../redux/slices/authSlice.js';
import AuthService from '../../services/AuthService.js';
import LoadingSpinner from '../ui/LoadingSpinner.jsx';

/**
 * ProtectedRoute Component
 * 
 * Provides role-based route protection for the Invoice Validation System.
 * Redirects unauthenticated users to login and unauthorized users to access denied page.
 */
const ProtectedRoute = ({ 
  children, 
  requiresAuth = true,
  allowedRoles = [],
  requiredPermissions = [],
  redirectTo = '/login',
  fallback = null
}) => {
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isInitialized = useSelector(selectIsInitialized);
  const location = useLocation();

  // Show loading while auth is initializing
  if (!isInitialized) {
    return <LoadingSpinner />;
  }

  // If route doesn't require authentication, render children
  if (!requiresAuth) {
    return children;
  }

  // If authentication is required but user is not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate 
      to={redirectTo} 
      state={{ from: location }} 
      replace 
    />;
  }

  // Check role-based access
  if (allowedRoles.length > 0 && !AuthService.hasAnyRole(user, allowedRoles)) {
    return fallback || <Navigate to="/access-denied" replace />;
  }

  // Check permission-based access
  if (requiredPermissions.length > 0 && !AuthService.hasAllPermissions(user, requiredPermissions)) {
    return fallback || <Navigate to="/access-denied" replace />;
  }

  // User has access, render children
  return children;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  requiresAuth: PropTypes.bool,
  allowedRoles: PropTypes.arrayOf(PropTypes.string),
  requiredPermissions: PropTypes.arrayOf(PropTypes.string),
  redirectTo: PropTypes.string,
  fallback: PropTypes.node
};

export default ProtectedRoute;