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
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock authentication - in real implementation, this would call an API
      const mockUsers = this.getMockUsers();
      const user = mockUsers.find(u => 
        (u.username === credentials.username || u.email === credentials.username) &&
        this.validatePassword(credentials.password, u.password)
      );

      if (!user) {
        throw new Error('Invalid username or password');
      }

      if (!user.isActive) {
        throw new Error('Account is deactivated. Please contact your administrator.');
      }

      // Generate mock token
      const token = this.generateMockToken(user);
      const expiresIn = 8 * 60 * 60; // 8 hours

      // Get user permissions
      const permissions = this.getUserPermissions(user);

      // Update last login
      user.lastLoginAt = new Date().toISOString();

      // Store authentication data
      if (credentials.rememberMe) {
        this.storeAuthData({ user, token, expiresIn: Date.now() + (expiresIn * 1000) });
      }

      return {
        user: this.sanitizeUser(user),
        token,
        expiresIn,
        permissions
      };
    } catch (error) {
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  /**
   * Logout current user
   * @returns {Promise<void>}
   */
  async logout() {
    try {
      // Clear stored authentication data
      localStorage.removeItem(this.storageKey);
      localStorage.removeItem(this.tokenKey);
      
      // In real implementation, would call API to invalidate token
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local data even if API call fails
      localStorage.removeItem(this.storageKey);
      localStorage.removeItem(this.tokenKey);
    }
  }

  /**
   * Get current authenticated user from storage
   * @returns {import('../types/auth.js').User | null}
   */
  getCurrentUser() {
    try {
      const authData = localStorage.getItem(this.storageKey);
      if (!authData) return null;

      const { user, expiresIn } = JSON.parse(authData);
      
      // Check if token is expired
      if (expiresIn && Date.now() > expiresIn) {
        this.logout();
        return null;
      }

      return user;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
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
    const allPermissions = [...new Set([...rolePermissions, ...user.permissions])];
    
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
   * Generate mock JWT token
   * @private
   */
  generateMockToken(user) {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
      sub: user.id,
      username: user.username,
      role: user.role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (8 * 60 * 60) // 8 hours
    }));
    const signature = btoa('mock-signature');
    
    return `${header}.${payload}.${signature}`;
  }

  /**
   * Validate password (mock implementation)
   * @private
   */
  validatePassword(inputPassword, storedPassword) {
    // In real implementation, this would use proper password hashing
    return inputPassword === storedPassword;
  }

  /**
   * Remove sensitive data from user object
   * @private
   */
  sanitizeUser(user) {
    const { password, ...sanitizedUser } = user;
    return sanitizedUser;
  }

  /**
   * Get mock users for development/testing
   * @private
   */
  getMockUsers() {
    return [
      {
        id: '1',
        username: 'admin',
        email: 'admin@company.com',
        password: 'admin123', // In real app, this would be hashed
        firstName: 'System',
        lastName: 'Administrator',
        role: 'admin',
        permissions: [],
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        lastLoginAt: null,
        preferences: {
          theme: 'light',
          language: 'en'
        }
      },
      {
        id: '2',
        username: 'fin_admin',
        email: 'finadmin@company.com',
        password: 'finadmin123',
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'financial_administrator',
        permissions: [],
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        lastLoginAt: null,
        preferences: {
          theme: 'light',
          language: 'en'
        }
      },
      {
        id: '3',
        username: 'auditor',
        email: 'auditor@company.com',
        password: 'auditor123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'financial_auditor',
        permissions: [],
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        lastLoginAt: null,
        preferences: {
          theme: 'dark',
          language: 'en'
        }
      },
      {
        id: '4',
        username: 'manager',
        email: 'manager@company.com',
        password: 'manager123',
        firstName: 'Sarah',
        lastName: 'Johnson',
        role: 'finance_manager',
        permissions: [],
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        lastLoginAt: null,
        preferences: {
          theme: 'light',
          language: 'en'
        }
      }
    ];
  }
}

// Export singleton instance
export default new AuthService();