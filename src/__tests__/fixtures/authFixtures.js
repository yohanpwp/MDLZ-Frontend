/**
 * Authentication Test Fixtures
 * 
 * Provides mock data and utilities for authentication and authorization testing
 */

import { ROLE_PERMISSIONS, PERMISSIONS } from '../../types/auth.js';

/**
 * Mock users for testing different roles and permissions
 */
export const mockUsers = {
  admin: {
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
    lastLoginAt: null,
    preferences: {
      theme: 'light',
      language: 'en'
    }
  },
  
  financialAdmin: {
    id: '2',
    username: 'fin_admin',
    email: 'finadmin@company.com',
    password: 'finadmin123',
    firstname: 'Jane',
    lastname: 'Smith',
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
  
  auditor: {
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
    lastLoginAt: null,
    preferences: {
      theme: 'dark',
      language: 'en'
    }
  },
  
  manager: {
    id: '4',
    username: 'manager',
    email: 'manager@company.com',
    password: 'manager123',
    firstname: 'Sarah',
    lastname: 'Johnson',
    role: 'finance_manager',
    permissions: [],
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    lastLoginAt: null,
    preferences: {
      theme: 'light',
      language: 'en'
    }
  },
  
  inactiveUser: {
    id: '5',
    username: 'inactive',
    email: 'inactive@company.com',
    password: 'inactive123',
    firstname: 'Inactive',
    lastname: 'User',
    role: 'business_user',
    permissions: [],
    isActive: false,
    createdAt: '2024-01-01T00:00:00Z',
    lastLoginAt: null,
    preferences: {
      theme: 'light',
      language: 'en'
    }
  },
  
  customPermissionUser: {
    id: '6',
    username: 'custom_user',
    email: 'custom@company.com',
    password: 'custom123',
    firstname: 'Custom',
    lastname: 'User',
    role: 'business_user',
    permissions: ['generate_reports', 'export_data'], // Additional permissions beyond role
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    lastLoginAt: null,
    preferences: {
      theme: 'light',
      language: 'en'
    }
  }
};

/**
 * Mock authentication responses
 */
export const mockAuthResponses = {
  successfulLogin: (user) => ({
    user: { ...user, password: undefined }, // Remove password from response
    token: `mock-jwt-token-${user.id}`,
    expiresIn: 8 * 60 * 60, // 8 hours
    permissions: getUserPermissions(user)
  }),
  
  invalidCredentials: {
    error: 'Invalid username or password'
  },
  
  inactiveAccount: {
    error: 'Account is deactivated. Please contact your administrator.'
  },
  
  networkError: {
    error: 'Network timeout'
  }
};

/**
 * Route protection test scenarios
 */
export const routeProtectionScenarios = [
  {
    name: 'Dashboard - Basic Auth Required',
    path: '/',
    config: { requiresAuth: true },
    testCases: [
      { user: null, shouldAccess: false, redirectTo: '/login' },
      { user: mockUsers.admin, shouldAccess: true },
      { user: mockUsers.auditor, shouldAccess: true },
      { user: mockUsers.inactiveUser, shouldAccess: false }
    ]
  },
  
  {
    name: 'Admin Panel - Admin Role Only',
    path: '/admin',
    config: { 
      requiresAuth: true, 
      allowedRoles: ['admin'] 
    },
    testCases: [
      { user: null, shouldAccess: false, redirectTo: '/login' },
      { user: mockUsers.admin, shouldAccess: true },
      { user: mockUsers.auditor, shouldAccess: false, redirectTo: '/access-denied' },
      { user: mockUsers.manager, shouldAccess: false, redirectTo: '/access-denied' }
    ]
  },
  
  {
    name: 'User Management - Manage Users Permission',
    path: '/users',
    config: { 
      requiresAuth: true, 
      requiredPermissions: ['manage_users'] 
    },
    testCases: [
      { user: null, shouldAccess: false, redirectTo: '/login' },
      { user: mockUsers.admin, shouldAccess: true },
      { user: mockUsers.auditor, shouldAccess: false, redirectTo: '/access-denied' },
      { user: mockUsers.financialAdmin, shouldAccess: false, redirectTo: '/access-denied' }
    ]
  },
  
  {
    name: 'Reports - Generate Reports Permission',
    path: '/reports',
    config: { 
      requiresAuth: true, 
      requiredPermissions: ['generate_reports'] 
    },
    testCases: [
      { user: null, shouldAccess: false, redirectTo: '/login' },
      { user: mockUsers.admin, shouldAccess: true },
      { user: mockUsers.auditor, shouldAccess: true },
      { user: mockUsers.manager, shouldAccess: true },
      { user: mockUsers.financialAdmin, shouldAccess: false, redirectTo: '/access-denied' },
      { user: mockUsers.customPermissionUser, shouldAccess: true }
    ]
  },
  
  {
    name: 'Multi-Role Access',
    path: '/validation',
    config: { 
      requiresAuth: true, 
      allowedRoles: ['admin', 'financial_administrator', 'financial_auditor'] 
    },
    testCases: [
      { user: mockUsers.admin, shouldAccess: true },
      { user: mockUsers.financialAdmin, shouldAccess: true },
      { user: mockUsers.auditor, shouldAccess: true },
      { user: mockUsers.manager, shouldAccess: false, redirectTo: '/access-denied' }
    ]
  },
  
  {
    name: 'Complex Permission Requirements',
    path: '/advanced-reports',
    config: { 
      requiresAuth: true, 
      requiredPermissions: ['generate_reports', 'export_data', 'view_audit_logs'] 
    },
    testCases: [
      { user: mockUsers.admin, shouldAccess: true },
      { user: mockUsers.auditor, shouldAccess: false, redirectTo: '/access-denied' }, // Missing export_data
      { user: mockUsers.manager, shouldAccess: false, redirectTo: '/access-denied' }, // Missing view_audit_logs
      { user: mockUsers.financialAdmin, shouldAccess: false, redirectTo: '/access-denied' }
    ]
  }
];

/**
 * Permission test scenarios
 */
export const permissionTestScenarios = [
  {
    name: 'Single Permission Check',
    tests: [
      { user: mockUsers.admin, permission: 'read_invoices', expected: true },
      { user: mockUsers.auditor, permission: 'read_invoices', expected: true },
      { user: mockUsers.auditor, permission: 'manage_users', expected: false },
      { user: mockUsers.financialAdmin, permission: 'import_data', expected: true },
      { user: mockUsers.customPermissionUser, permission: 'generate_reports', expected: true }
    ]
  },
  
  {
    name: 'Multiple Permission Check (Any)',
    tests: [
      { 
        user: mockUsers.admin, 
        permissions: ['read_invoices', 'manage_users'], 
        expected: true 
      },
      { 
        user: mockUsers.auditor, 
        permissions: ['manage_users', 'configure_system'], 
        expected: false 
      },
      { 
        user: mockUsers.manager, 
        permissions: ['generate_reports', 'export_data'], 
        expected: true 
      }
    ]
  },
  
  {
    name: 'Multiple Permission Check (All)',
    tests: [
      { 
        user: mockUsers.admin, 
        permissions: ['read_invoices', 'manage_users'], 
        expected: true 
      },
      { 
        user: mockUsers.auditor, 
        permissions: ['read_invoices', 'manage_users'], 
        expected: false 
      },
      { 
        user: mockUsers.manager, 
        permissions: ['generate_reports', 'export_data'], 
        expected: true 
      },
      { 
        user: mockUsers.customPermissionUser, 
        permissions: ['generate_reports', 'export_data'], 
        expected: true 
      }
    ]
  }
];

/**
 * Session management test scenarios
 */
export const sessionTestScenarios = {
  validSession: {
    user: mockUsers.admin,
    token: 'valid-jwt-token',
    expiresIn: Date.now() + (8 * 60 * 60 * 1000) // 8 hours from now
  },
  
  expiredSession: {
    user: mockUsers.admin,
    token: 'expired-jwt-token',
    expiresIn: Date.now() - (1 * 60 * 60 * 1000) // 1 hour ago
  },
  
  corruptedSession: {
    invalidJson: 'invalid-json-data',
    missingFields: { user: mockUsers.admin }, // Missing token and expiry
    nullValues: { user: null, token: null, expiresIn: null }
  }
};

/**
 * Form validation test cases
 */
export const formValidationCases = [
  {
    name: 'Empty Form',
    input: { username: '', password: '', rememberMe: false },
    expectedErrors: ['Username or email is required', 'Password is required']
  },
  
  {
    name: 'Empty Username',
    input: { username: '', password: 'validpassword', rememberMe: false },
    expectedErrors: ['Username or email is required']
  },
  
  {
    name: 'Empty Password',
    input: { username: 'validuser', password: '', rememberMe: false },
    expectedErrors: ['Password is required']
  },
  
  {
    name: 'Short Password',
    input: { username: 'validuser', password: '123', rememberMe: false },
    expectedErrors: ['Password must be at least 6 characters']
  },
  
  {
    name: 'Valid Input',
    input: { username: 'validuser', password: 'validpassword', rememberMe: true },
    expectedErrors: []
  },
  
  {
    name: 'Whitespace Username',
    input: { username: '   ', password: 'validpassword', rememberMe: false },
    expectedErrors: ['Username or email is required']
  }
];

/**
 * Helper function to get user permissions based on role and individual permissions
 */
function getUserPermissions(user) {
  const rolePermissions = ROLE_PERMISSIONS[user.role] || [];
  const allPermissions = [...new Set([...rolePermissions, ...user.permissions])];
  
  return allPermissions.map(permType => PERMISSIONS[permType]).filter(Boolean);
}

/**
 * Helper function to create mock localStorage data
 */
export const createMockStorageData = (user, options = {}) => {
  const {
    rememberMe = true,
    expired = false,
    corrupted = false
  } = options;

  if (corrupted) {
    return 'invalid-json-data';
  }

  const expiresIn = expired 
    ? Date.now() - (1 * 60 * 60 * 1000) // 1 hour ago
    : Date.now() + (8 * 60 * 60 * 1000); // 8 hours from now

  const authData = {
    user: { ...user, password: undefined },
    token: `mock-token-${user.id}`,
    expiresIn
  };

  return JSON.stringify(authData);
};

/**
 * Helper function to create test store with initial auth state
 */
export const createAuthTestStore = (initialAuthState = {}) => {
  return {
    auth: {
      user: null,
      permissions: [],
      isAuthenticated: false,
      isLoading: false,
      error: null,
      token: null,
      tokenExpiry: null,
      isInitialized: true,
      ...initialAuthState
    }
  };
};

/**
 * Mock API responses for different scenarios
 */
export const mockApiResponses = {
  login: {
    success: (user) => Promise.resolve(mockAuthResponses.successfulLogin(user)),
    invalidCredentials: () => Promise.reject(new Error('Invalid username or password')),
    inactiveAccount: () => Promise.reject(new Error('Account is deactivated. Please contact your administrator.')),
    networkError: () => Promise.reject(new Error('Network timeout')),
    serverError: () => Promise.reject(new Error('Internal server error'))
  },
  
  logout: {
    success: () => Promise.resolve(),
    networkError: () => Promise.reject(new Error('Network timeout'))
  }
};

export default {
  mockUsers,
  mockAuthResponses,
  routeProtectionScenarios,
  permissionTestScenarios,
  sessionTestScenarios,
  formValidationCases,
  createMockStorageData,
  createAuthTestStore,
  mockApiResponses
};