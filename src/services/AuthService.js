import { ROLE_PERMISSIONS, PERMISSIONS } from '../types/auth.js';

/**
 * AuthService - Handles user authentication and authorization logic
 * 
 * This service provides methods for user login, logout, permission checking,
 * and role-based access control for the Invoice Validation System.
 */
class AuthService {
  constructor() {
    this.storageKey = 'invoice_validation_auth';
    this.tokenKey = 'invoice_validation_token';
  }

  /**
   * Authenticate user with credentials
   * @param {import('../types/auth.js').LoginCredentials} credentials 
   * @returns {Promise<import('../types/auth.js').LoginResponse>}
   */
  async login(credentials) {
    try {
      // Simulate API call delay
      const user = credentials.user
      const token = credentials.token
      const expiresIn = Date.now() + (60 * 60 * 1000) // expires in 1 hour
      await new Promise(resolve => setTimeout(resolve, 1000));
      const permissions = this.getUserPermissions(user);

      this.storeAuthData({ user, token, expiresIn }); 
      
      return {
        user: this.sanitizeUser(user),
        token,
        expiresIn, 
        permissions
      };
    } catch (error) {
      throw new Error(`${error.message}`);
    }
  }

  /**
   * Logout current user
   * @returns {Promise<void>}
   */
  async logout() {
    try {
      // Clear stored authentication data
      this.clearAuthData();
      
      // In real implementation, would call API to invalidate token
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local data even if API call fails
      this.clearAuthData();
    }
  }

  /**
   * Get current authenticated user from storage
   * @returns {import('../types/auth.js').LoginCredentials | null}
   */
  getCurrentUser() {
    try {
      const authData = localStorage.getItem(this.storageKey);
      const token = localStorage.getItem(this.tokenKey);

      if (!authData || !token) return null;

      const { user, expiresIn } = JSON.parse(authData);
      
      // Check if token is expired
      if (expiresIn && Date.now() > expiresIn) {
        console.log('Token expired, clearing auth data');
        this.clearAuthData();
        return null;
      }

      return { user, token, expiresIn };
    } catch (error) {
      console.error('Error getting current user:', error);
      this.clearAuthData(); // Clear corrupted data
      return null;
    }
  }

  /**
   * Check if token is expired
   * @returns {boolean}
   */
  isTokenExpired() {
    try {
      const authData = localStorage.getItem(this.storageKey);
      if (!authData) return true;

      const { expiresIn } = JSON.parse(authData);
      return expiresIn && Date.now() > expiresIn;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true;
    }
  }

  /**
   * Get time until token expires (in milliseconds)
   * @returns {number} - Milliseconds until expiration, 0 if expired or no token
   */
  getTimeUntilExpiry() {
    try {
      const authData = localStorage.getItem(this.storageKey);
      if (!authData) return 0;

      const { expiresIn } = JSON.parse(authData);
      if (!expiresIn) return 0;

      const timeUntil = expiresIn - Date.now();
      return Math.max(0, timeUntil);
    } catch (error) {
      console.error('Error getting time until expiry:', error);
      return 0;
    }
  }

  /**
   * Clear authentication data from storage
   * @private
   */
  clearAuthData() {
    localStorage.removeItem(this.storageKey);
    localStorage.removeItem(this.tokenKey);
  }

  /**
   * Check if user is authenticated
   * @returns {boolean}
   */
  isAuthenticated() {
    return this.getCurrentUser() !== null;
  }

  /**
   * Get user permissions based on role and individual permissions
   * @param {import('../types/auth.js').User} user 
   * @returns {import('../types/auth.js').Permission[]}
   */
  getUserPermissions(user) {
    const rolePermissions = ROLE_PERMISSIONS[user.role] || [];
    // ADDIF : If the system want to add permisson in each users
    const allPermissions = [...new Set([...rolePermissions])];
    return allPermissions.map(permType => PERMISSIONS[permType]).filter(Boolean);
  }

  /**
   * Check if user has specific permission
   * @param {import('../types/auth.js').User} user 
   * @param {import('../types/auth.js').PermissionType} permission 
   * @returns {boolean}
   */
  hasPermission(user, permission) {
    if (!user) return false;
    
    const userPermissions = this.getUserPermissions(user);
    return userPermissions.some(p => p.type === permission);
  }

  /**
   * Check if user has any of the specified permissions
   * @param {import('../types/auth.js').User} user 
   * @param {import('../types/auth.js').PermissionType[]} permissions 
   * @returns {boolean}
   */
  hasAnyPermission(user, permissions) {
    return permissions.some(permission => this.hasPermission(user, permission));
  }

  /**
   * Check if user has all specified permissions
   * @param {import('../types/auth.js').User} user 
   * @param {import('../types/auth.js').PermissionType[]} permissions 
   * @returns {boolean}
   */
  hasAllPermissions(user, permissions) {
    return permissions.every(permission => this.hasPermission(user, permission));
  }

  /**
   * Check if user has specific role
   * @param {import('../types/auth.js').User} user 
   * @param {import('../types/auth.js').UserRole} role 
   * @returns {boolean}
   */
  hasRole(user, role) {
    return user && user.role === role;
  }

  /**
   * Check if user has any of the specified roles
   * @param {import('../types/auth.js').User} user 
   * @param {import('../types/auth.js').UserRole[]} roles 
   * @returns {boolean}
   */
  hasAnyRole(user, roles) {
    return user && roles.includes(user.role);
  }

  /**
   * Validate route access for user
   * @param {import('../types/auth.js').User} user 
   * @param {import('../types/auth.js').RouteProtection} routeConfig 
   * @returns {boolean}
   */
  canAccessRoute(user, routeConfig) {
    // If route doesn't require auth, allow access
    if (!routeConfig.requiresAuth) {
      return true;
    }

    // If route requires auth but user is not authenticated
    if (!user) {
      return false;
    }

    // Check role requirements
    if (routeConfig.allowedRoles && routeConfig.allowedRoles.length > 0) {
      if (!this.hasAnyRole(user, routeConfig.allowedRoles)) {
        return false;
      }
    }

    // Check permission requirements
    if (routeConfig.requiredPermissions && routeConfig.requiredPermissions.length > 0) {
      if (!this.hasAllPermissions(user, routeConfig.requiredPermissions)) {
        return false;
      }
    }

    return true;
  }

  // Private helper methods

  /**
   * Store authentication data in localStorage
   * @private
   */
  storeAuthData(authData) {
    localStorage.setItem(this.storageKey, JSON.stringify(authData));
    localStorage.setItem(this.tokenKey, authData.token);
  }

  /**
   * Remove sensitive data from user object
   * @private
   */
  sanitizeUser(user) {
    const { password, ...sanitizedUser } = user;
    return sanitizedUser;
  }
}

// Export singleton instance
export default new AuthService();