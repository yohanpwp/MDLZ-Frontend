/**
 * Authentication and User Management Type Definitions
 * 
 * This file contains all type definitions related to user authentication,
 * permissions, and role-based access control for the Invoice Validation System.
 */

/**
 * User role enumeration
 * @typedef {'admin' | 'financial_administrator' | 'financial_auditor' | 'finance_manager' | 'system_administrator' | 'business_user' | 'compliance_officer' | 'financial_analyst'} UserRole
 */

/**
 * Permission enumeration for granular access control
 * @typedef {'read_invoices' | 'write_invoices' | 'delete_invoices' | 'validate_invoices' | 'generate_reports' | 'export_data' | 'import_data' | 'manage_users' | 'manage_roles' | 'view_audit_logs' | 'manage_master_data' | 'configure_system'} PermissionType
 */

/**
 * User interface definition
 * @typedef {Object} User
 * @property {string} id - Unique user identifier
 * @property {string} username - User's login username
 * @property {string} email - User's email address
 * @property {string} firstName - User's first name
 * @property {string} lastName - User's last name
 * @property {UserRole} role - User's primary role
 * @property {PermissionType[]} permissions - Array of specific permissions
 * @property {boolean} isActive - Whether the user account is active
 * @property {string} createdAt - ISO string of account creation date
 * @property {string} lastLoginAt - ISO string of last login date
 * @property {Object} preferences - User preferences object
 * @property {string} preferences.theme - UI theme preference ('light' | 'dark')
 * @property {string} preferences.language - Language preference
 */

/**
 * Permission definition with metadata
 * @typedef {Object} Permission
 * @property {PermissionType} type - Permission type identifier
 * @property {string} name - Human-readable permission name
 * @property {string} description - Permission description
 * @property {string} module - Module this permission belongs to
 * @property {boolean} requiresElevation - Whether this permission requires additional confirmation
 */

/**
 * Authentication state interface
 * @typedef {Object} AuthState
 * @property {User | null} user - Currently authenticated user
 * @property {Permission[]} permissions - User's resolved permissions
 * @property {boolean} isAuthenticated - Authentication status
 * @property {boolean} isLoading - Loading state for auth operations
 * @property {string | null} error - Authentication error message
 * @property {string | null} token - Authentication token (if using token-based auth)
 * @property {number | null} tokenExpiry - Token expiration timestamp
 */

/**
 * Login credentials interface
 * @typedef {Object} LoginCredentials
 * @property {string} username - Username or email
 * @property {string} password - User password
 * @property {boolean} [rememberMe] - Whether to persist login
 */

/**
 * Login response interface
 * @typedef {Object} LoginResponse
 * @property {User} user - Authenticated user data
 * @property {string} token - Authentication token
 * @property {number} expiresIn - Token expiration time in seconds
 * @property {Permission[]} permissions - User permissions
 */

/**
 * Route protection configuration
 * @typedef {Object} RouteProtection
 * @property {boolean} requiresAuth - Whether route requires authentication
 * @property {UserRole[]} [allowedRoles] - Roles allowed to access this route
 * @property {PermissionType[]} [requiredPermissions] - Specific permissions required
 * @property {string} [redirectTo] - Where to redirect if access denied
 */

// Default permissions for each role
export const ROLE_PERMISSIONS = {
  admin: [
    'read_invoices', 'write_invoices', 'delete_invoices', 'validate_invoices',
    'generate_reports', 'export_data', 'import_data', 'manage_users',
    'manage_roles', 'view_audit_logs', 'manage_master_data', 'configure_system'
  ],
  financial_administrator: [
    'read_invoices', 'write_invoices', 'validate_invoices', 'import_data',
    'export_data', 'manage_master_data'
  ],
  financial_auditor: [
    'read_invoices', 'validate_invoices', 'generate_reports', 'view_audit_logs'
  ],
  finance_manager: [
    'read_invoices', 'validate_invoices', 'generate_reports', 'export_data',
    'view_audit_logs'
  ],
  system_administrator: [
    'manage_users', 'manage_roles', 'view_audit_logs', 'configure_system'
  ],
  business_user: [
    'read_invoices', 'validate_invoices'
  ],
  compliance_officer: [
    'read_invoices', 'generate_reports', 'view_audit_logs', 'export_data'
  ],
  financial_analyst: [
    'read_invoices', 'validate_invoices', 'generate_reports', 'export_data'
  ]
};

// Permission definitions with metadata
export const PERMISSIONS = {
  read_invoices: {
    type: 'read_invoices',
    name: 'Read Invoices',
    description: 'View invoice data and validation results',
    module: 'invoices',
    requiresElevation: false
  },
  write_invoices: {
    type: 'write_invoices',
    name: 'Write Invoices',
    description: 'Create and modify invoice data',
    module: 'invoices',
    requiresElevation: false
  },
  delete_invoices: {
    type: 'delete_invoices',
    name: 'Delete Invoices',
    description: 'Delete invoice records',
    module: 'invoices',
    requiresElevation: true
  },
  validate_invoices: {
    type: 'validate_invoices',
    name: 'Validate Invoices',
    description: 'Run validation processes on invoice data',
    module: 'validation',
    requiresElevation: false
  },
  generate_reports: {
    type: 'generate_reports',
    name: 'Generate Reports',
    description: 'Create and export validation reports',
    module: 'reports',
    requiresElevation: false
  },
  export_data: {
    type: 'export_data',
    name: 'Export Data',
    description: 'Export system data in various formats',
    module: 'data',
    requiresElevation: false
  },
  import_data: {
    type: 'import_data',
    name: 'Import Data',
    description: 'Import data files into the system',
    module: 'data',
    requiresElevation: false
  },
  manage_users: {
    type: 'manage_users',
    name: 'Manage Users',
    description: 'Create, modify, and delete user accounts',
    module: 'administration',
    requiresElevation: true
  },
  manage_roles: {
    type: 'manage_roles',
    name: 'Manage Roles',
    description: 'Assign and modify user roles and permissions',
    module: 'administration',
    requiresElevation: true
  },
  view_audit_logs: {
    type: 'view_audit_logs',
    name: 'View Audit Logs',
    description: 'Access system audit trails and logs',
    module: 'compliance',
    requiresElevation: false
  },
  manage_master_data: {
    type: 'manage_master_data',
    name: 'Manage Master Data',
    description: 'Manage customer, product, and reference data',
    module: 'master_data',
    requiresElevation: false
  },
  configure_system: {
    type: 'configure_system',
    name: 'Configure System',
    description: 'Modify system settings and configuration',
    module: 'administration',
    requiresElevation: true
  }
};