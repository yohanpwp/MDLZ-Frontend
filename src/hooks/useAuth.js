import { useSelector } from 'react-redux';
import {
  selectUser,
  selectIsAuthenticated,
  selectPermissions,
  selectIsLoading,
  selectError,
  selectIsInitialized,
  selectHasPermission,
  selectHasAnyPermission,
  selectHasAllPermissions,
  selectHasRole,
  selectHasAnyRole,
  selectCanAccessRoute
} from '../redux/slices/authSlice.js';

/**
 * Custom hook for authentication state and permission checking
 * 
 * Provides convenient access to authentication state and permission
 * checking functions for the Invoice Validation System.
 * 
 * @returns {Object} Authentication state and helper functions
 */
export const useAuth = () => {
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const permissions = useSelector(selectPermissions);
  const isLoading = useSelector(selectIsLoading);
  const error = useSelector(selectError);
  const isInitialized = useSelector(selectIsInitialized);

  return {
    // State
    user,
    isAuthenticated,
    permissions,
    isLoading,
    error,
    isInitialized,
    
    // Helper functions
    hasPermission: (permission) => useSelector(selectHasPermission(permission)),
    hasAnyPermission: (permissionList) => useSelector(selectHasAnyPermission(permissionList)),
    hasAllPermissions: (permissionList) => useSelector(selectHasAllPermissions(permissionList)),
    hasRole: (role) => useSelector(selectHasRole(role)),
    hasAnyRole: (roleList) => useSelector(selectHasAnyRole(roleList)),
    canAccessRoute: (routeConfig) => useSelector(selectCanAccessRoute(routeConfig))
  };
};

/**
 * Hook for checking specific permission
 * 
 * @param {string} permission - Permission to check
 * @returns {boolean} Whether user has the permission
 */
export const usePermission = (permission) => {
  return useSelector(selectHasPermission(permission));
};

/**
 * Hook for checking multiple permissions (any)
 * 
 * @param {string[]} permissions - Permissions to check
 * @returns {boolean} Whether user has any of the permissions
 */
export const useAnyPermission = (permissions) => {
  return useSelector(selectHasAnyPermission(permissions));
};

/**
 * Hook for checking multiple permissions (all)
 * 
 * @param {string[]} permissions - Permissions to check
 * @returns {boolean} Whether user has all of the permissions
 */
export const useAllPermissions = (permissions) => {
  return useSelector(selectHasAllPermissions(permissions));
};

/**
 * Hook for checking user role
 * 
 * @param {string} role - Role to check
 * @returns {boolean} Whether user has the role
 */
export const useRole = (role) => {
  return useSelector(selectHasRole(role));
};

/**
 * Hook for checking multiple roles
 * 
 * @param {string[]} roles - Roles to check
 * @returns {boolean} Whether user has any of the roles
 */
export const useAnyRole = (roles) => {
  return useSelector(selectHasAnyRole(roles));
};

/**
 * Hook for checking route access
 * 
 * @param {Object} routeConfig - Route configuration object
 * @returns {boolean} Whether user can access the route
 */
export const useRouteAccess = (routeConfig) => {
  return useSelector(selectCanAccessRoute(routeConfig));
};