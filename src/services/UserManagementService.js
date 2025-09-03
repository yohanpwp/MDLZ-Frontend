import { ROLE_PERMISSIONS, PERMISSIONS } from '../types/auth.js';
import AuditService from './AuditService.js';

/**
 * UserManagementService - Handles user administration operations
 * 
 * This service provides methods for managing users, roles, permissions,
 * activity monitoring, and session management for the Invoice Validation System.
 */
class UserManagementService {
  constructor() {
    this.storageKey = 'invoice_validation_users';
    this.activityKey = 'invoice_validation_activity';
    this.sessionsKey = 'invoice_validation_sessions';
  }

  /**
   * Get all users with filtering and pagination
   * @param {Object} filters - Filter criteria
   * @returns {Promise<{users: Array, total: number, totalPages: number}>}
   */
  async getUsers(filters = {}) {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      let users = this.getMockUsers();

      // Apply filters
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        users = users.filter(user => 
          user.firstname.toLowerCase().includes(searchTerm) ||
          user.lastname.toLowerCase().includes(searchTerm) ||
          user.email.toLowerCase().includes(searchTerm) ||
          user.username.toLowerCase().includes(searchTerm)
        );
      }

      if (filters.role) {
        users = users.filter(user => user.role === filters.role);
      }

      if (filters.status) {
        const isActive = filters.status === 'active';
        users = users.filter(user => user.isActive === isActive);
      }

      // Apply sorting
      const sortBy = filters.sortBy || 'firstname';
      const sortOrder = filters.sortOrder || 'asc';
      
      users.sort((a, b) => {
        let aValue = a[sortBy];
        let bValue = b[sortBy];
        
        if (sortBy === 'name') {
          aValue = `${a.firstname} ${a.lastname}`;
          bValue = `${b.firstname} ${b.lastname}`;
        }
        
        if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }
        
        if (sortOrder === 'desc') {
          return bValue > aValue ? 1 : -1;
        }
        return aValue > bValue ? 1 : -1;
      });

      // Apply pagination
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      
      const paginatedUsers = users.slice(startIndex, endIndex);
      const total = users.length;
      const totalPages = Math.ceil(total / limit);

      return {
        users: paginatedUsers.map(user => this.sanitizeUser(user)),
        total,
        totalPages
      };
    } catch (error) {
      throw new Error(`Failed to fetch users: ${error.message}`);
    }
  }

  /**
   * Create a new user
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Created user
   */
  async createUser(userData) {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));

      // Validate required fields
      this.validateUserData(userData);

      // Check for duplicate username/email
      const existingUsers = this.getMockUsers();
      const duplicateUser = existingUsers.find(user => 
        user.username === userData.username || user.email === userData.email
      );

      if (duplicateUser) {
        throw new Error('Username or email already exists');
      }

      // Create new user
      const newUser = {
        id: Date.now().toString(),
        ...userData,
        isActive: userData.isActive !== undefined ? userData.isActive : true,
        createdAt: new Date().toISOString(),
        lastLoginAt: null,
        preferences: {
          theme: 'light',
          language: 'en',
          ...userData.preferences
        }
      };

      // Log activity
      await AuditService.logUserManagementEvent(
        'current_user', // In real app, get from auth context
        'CREATE_USER',
        newUser.id,
        { username: newUser.username, role: newUser.role }
      );

      return this.sanitizeUser(newUser);
    } catch (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  /**
   * Update user information
   * @param {string} userId - User ID
   * @param {Object} userData - Updated user data
   * @returns {Promise<Object>} Updated user
   */
  async updateUser(userId, userData) {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 600));

      const users = this.getMockUsers();
      const userIndex = users.findIndex(user => user.id === userId);

      if (userIndex === -1) {
        throw new Error('User not found');
      }

      // Validate updated data
      this.validateUserData(userData, true);

      // Check for duplicate username/email (excluding current user)
      const duplicateUser = users.find(user => 
        user.id !== userId && 
        (user.username === userData.username || user.email === userData.email)
      );

      if (duplicateUser) {
        throw new Error('Username or email already exists');
      }

      // Update user
      const updatedUser = {
        ...users[userIndex],
        ...userData,
        updatedAt: new Date().toISOString()
      };

      // Log activity
      await AuditService.logUserManagementEvent(
        'current_user',
        'UPDATE_USER',
        userId,
        { username: updatedUser.username, changes: Object.keys(userData) }
      );

      return this.sanitizeUser(updatedUser);
    } catch (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }

  /**
   * Delete a user
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async deleteUser(userId) {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      const users = this.getMockUsers();
      const user = users.find(user => user.id === userId);

      if (!user) {
        throw new Error('User not found');
      }

      // Prevent deletion of admin users in production
      if (user.role === 'admin') {
        throw new Error('Cannot delete admin users');
      }

      // Log activity
      await AuditService.logUserManagementEvent(
        'current_user',
        'DELETE_USER',
        userId,
        { username: user.username, role: user.role }
      );

      return true;
    } catch (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }

  /**
   * Update user role
   * @param {string} userId - User ID
   * @param {string} role - New role
   * @returns {Promise<Object>} Updated user
   */
  async updateUserRole(userId, role) {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 400));

      const users = this.getMockUsers();
      const userIndex = users.findIndex(user => user.id === userId);

      if (userIndex === -1) {
        throw new Error('User not found');
      }

      if (!ROLE_PERMISSIONS[role]) {
        throw new Error('Invalid role specified');
      }

      const oldRole = users[userIndex].role;
      users[userIndex].role = role;
      users[userIndex].updatedAt = new Date().toISOString();

      // Log activity
      await AuditService.logUserManagementEvent(
        'current_user',
        'UPDATE_USER_ROLE',
        userId,
        { oldRole, newRole: role, username: users[userIndex].username }
      );

      return this.sanitizeUser(users[userIndex]);
    } catch (error) {
      throw new Error(`Failed to update user role: ${error.message}`);
    }
  }

  /**
   * Update user permissions
   * @param {string} userId - User ID
   * @param {Array} permissions - New permissions array
   * @returns {Promise<Object>} Updated user
   */
  async updateUserPermissions(userId, permissions) {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 400));

      const users = this.getMockUsers();
      const userIndex = users.findIndex(user => user.id === userId);

      if (userIndex === -1) {
        throw new Error('User not found');
      }

      // Validate permissions
      const invalidPermissions = permissions.filter(perm => !PERMISSIONS[perm]);
      if (invalidPermissions.length > 0) {
        throw new Error(`Invalid permissions: ${invalidPermissions.join(', ')}`);
      }

      users[userIndex].permissions = permissions;
      users[userIndex].updatedAt = new Date().toISOString();

      // Log activity
      await AuditService.logUserManagementEvent(
        'current_user',
        'UPDATE_USER_PERMISSIONS',
        userId,
        { permissions, username: users[userIndex].username }
      );

      return this.sanitizeUser(users[userIndex]);
    } catch (error) {
      throw new Error(`Failed to update user permissions: ${error.message}`);
    }
  }

  /**
   * Get user activity logs
   * @param {Object} filters - Filter criteria
   * @returns {Promise<Array>} Activity logs
   */
  async getUserActivity(filters = {}) {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));

      let activities = this.getMockActivity();

      // Apply filters
      if (filters.userId) {
        activities = activities.filter(activity => 
          activity.userId === filters.userId || activity.targetUserId === filters.userId
        );
      }

      if (filters.action) {
        activities = activities.filter(activity => activity.action === filters.action);
      }

      if (filters.startDate) {
        activities = activities.filter(activity => 
          new Date(activity.timestamp) >= new Date(filters.startDate)
        );
      }

      if (filters.endDate) {
        activities = activities.filter(activity => 
          new Date(activity.timestamp) <= new Date(filters.endDate)
        );
      }

      // Sort by timestamp (newest first)
      activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      // Apply pagination
      const page = filters.page || 1;
      const limit = filters.limit || 50;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;

      return activities.slice(startIndex, endIndex);
    } catch (error) {
      throw new Error(`Failed to fetch user activity: ${error.message}`);
    }
  }

  /**
   * Get active user sessions
   * @returns {Promise<Array>} Active sessions
   */
  async getActiveSessions() {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));

      return this.getMockSessions();
    } catch (error) {
      throw new Error(`Failed to fetch active sessions: ${error.message}`);
    }
  }

  /**
   * Terminate a user session
   * @param {string} sessionId - Session ID
   * @returns {Promise<void>}
   */
  async terminateSession(sessionId) {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 400));

      const sessions = this.getMockSessions();
      const session = sessions.find(s => s.id === sessionId);

      if (!session) {
        throw new Error('Session not found');
      }

      // Log activity
      await AuditService.logUserManagementEvent(
        'current_user',
        'TERMINATE_SESSION',
        session.userId,
        { sessionId, username: session.username }
      );

      return true;
    } catch (error) {
      throw new Error(`Failed to terminate session: ${error.message}`);
    }
  }

  /**
   * Test user permissions
   * @param {string} userId - User ID
   * @param {Array} permissions - Permissions to test
   * @returns {Promise<Object>} Test results
   */
  async testPermissions(userId, permissions) {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 200));

      const users = this.getMockUsers();
      const user = users.find(u => u.id === userId);

      if (!user) {
        throw new Error('User not found');
      }

      const userPermissions = this.getUserPermissions(user);
      const results = permissions.map(permission => ({
        permission,
        hasPermission: userPermissions.some(p => p.type === permission),
        source: this.getPermissionSource(user, permission)
      }));

      return {
        userId,
        testResults: results,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to test permissions: ${error.message}`);
    }
  }

  // Private helper methods

  /**
   * Validate user data
   * @private
   */
  validateUserData(userData, isUpdate = false) {
    const requiredFields = isUpdate ? [] : ['username', 'email', 'firstname', 'lastname', 'role'];
    
    for (const field of requiredFields) {
      if (!userData[field]) {
        throw new Error(`${field} is required`);
      }
    }

    if (userData.email && !this.isValidEmail(userData.email)) {
      throw new Error('Invalid email format');
    }

    if (userData.role && !ROLE_PERMISSIONS[userData.role]) {
      throw new Error('Invalid role specified');
    }
  }

  /**
   * Validate email format
   * @private
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
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
   * Get user permissions based on role and individual permissions
   * @private
   */
  getUserPermissions(user) {
    const rolePermissions = ROLE_PERMISSIONS[user.role] || [];
    const allPermissions = [...new Set([...rolePermissions, ...user.permissions])];
    
    return allPermissions.map(permType => PERMISSIONS[permType]).filter(Boolean);
  }

  /**
   * Get permission source (role or individual)
   * @private
   */
  getPermissionSource(user, permission) {
    const rolePermissions = ROLE_PERMISSIONS[user.role] || [];
    
    if (rolePermissions.includes(permission)) {
      return 'role';
    } else if (user.permissions.includes(permission)) {
      return 'individual';
    }
    
    return 'none';
  }

  /**
   * Log user activity
   * @private
   */
  logActivity(activity) {
    try {
      const activities = JSON.parse(localStorage.getItem(this.activityKey) || '[]');
      activities.unshift({
        id: Date.now().toString(),
        ...activity
      });
      
      // Keep only last 1000 activities
      if (activities.length > 1000) {
        activities.splice(1000);
      }
      
      localStorage.setItem(this.activityKey, JSON.stringify(activities));
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  }

  /**
   * Get mock users for development
   * @private
   */
  getMockUsers() {
    return [
      {
        id: '1',
        username: 'admin',
        email: 'admin@company.com',
        password: 'admin123',
        firstname: 'System',
        lastname: 'Administrator',
        role: 'admin',
        permissions: [],
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        lastLoginAt: '2024-01-15T10:30:00Z',
        preferences: { theme: 'light', language: 'en' }
      },
      {
        id: '2',
        username: 'fin_admin',
        email: 'finadmin@company.com',
        password: 'finadmin123',
        firstname: 'Jane',
        lastname: 'Smith',
        role: 'financial_administrator',
        permissions: ['generate_reports'],
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        lastLoginAt: '2024-01-15T09:15:00Z',
        preferences: { theme: 'light', language: 'en' }
      },
      {
        id: '3',
        username: 'auditor',
        email: 'auditor@company.com',
        password: 'auditor123',
        firstname: 'John',
        lastname: 'Doe',
        role: 'financial_auditor',
        permissions: [],
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        lastLoginAt: '2024-01-14T16:45:00Z',
        preferences: { theme: 'dark', language: 'en' }
      },
      {
        id: '4',
        username: 'manager',
        email: 'manager@company.com',
        password: 'manager123',
        firstname: 'Sarah',
        lastname: 'Johnson',
        role: 'finance_manager',
        permissions: ['manage_master_data'],
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        lastLoginAt: '2024-01-15T08:20:00Z',
        preferences: { theme: 'light', language: 'en' }
      },
      {
        id: '5',
        username: 'analyst',
        email: 'analyst@company.com',
        password: 'analyst123',
        firstname: 'Mike',
        lastname: 'Wilson',
        role: 'financial_analyst',
        permissions: [],
        isActive: false,
        createdAt: '2024-01-01T00:00:00Z',
        lastLoginAt: '2024-01-10T14:22:00Z',
        preferences: { theme: 'light', language: 'en' }
      }
    ];
  }

  /**
   * Get mock activity logs
   * @private
   */
  getMockActivity() {
    return [
      {
        id: '1',
        userId: '1',
        action: 'LOGIN',
        targetUserId: null,
        details: 'User logged in successfully',
        timestamp: '2024-01-15T10:30:00Z',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      {
        id: '2',
        userId: '1',
        action: 'UPDATE_USER_ROLE',
        targetUserId: '5',
        details: 'Changed role from business_user to financial_analyst',
        timestamp: '2024-01-15T09:45:00Z',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      {
        id: '3',
        userId: '2',
        action: 'VALIDATE_INVOICES',
        targetUserId: null,
        details: 'Validated 150 invoice records',
        timestamp: '2024-01-15T09:15:00Z',
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      {
        id: '4',
        userId: '3',
        action: 'GENERATE_REPORT',
        targetUserId: null,
        details: 'Generated validation summary report',
        timestamp: '2024-01-14T16:45:00Z',
        ipAddress: '192.168.1.102',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    ];
  }

  /**
   * Get mock active sessions
   * @private
   */
  getMockSessions() {
    return [
      {
        id: 'session_1',
        userId: '1',
        username: 'admin',
        startTime: '2024-01-15T10:30:00Z',
        lastActivity: '2024-01-15T11:15:00Z',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        location: 'New York, NY'
      },
      {
        id: 'session_2',
        userId: '2',
        username: 'fin_admin',
        startTime: '2024-01-15T09:15:00Z',
        lastActivity: '2024-01-15T11:10:00Z',
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        location: 'San Francisco, CA'
      },
      {
        id: 'session_3',
        userId: '4',
        username: 'manager',
        startTime: '2024-01-15T08:20:00Z',
        lastActivity: '2024-01-15T11:05:00Z',
        ipAddress: '192.168.1.103',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        location: 'Chicago, IL'
      }
    ];
  }
}

// Export singleton instance
export default new UserManagementService();