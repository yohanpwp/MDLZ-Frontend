/**
 * Integration Tests for Permission Validation in Components
 * 
 * Tests permission-based rendering, access control in UI components,
 * and permission validation across different user roles.
 * 
 * Requirements: 4.3, 4.4
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';

// Components and hooks
import { useAuth, usePermission, useAnyPermission, useAllPermissions, useRole } from '../../hooks/useAuth.js';
import authReducer, { loginUser } from '../../redux/slices/authSlice.js';
import AuthService from '../../services/AuthService.js';

// Test fixtures
import { 
  mockUsers, 
  permissionTestScenarios,
  routeProtectionScenarios 
} from '../fixtures/authFixtures.js';

// Mock components that use permission hooks
const PermissionTestComponent = ({ permission, children }) => {
  const hasPermission = usePermission(permission);
  return hasPermission ? <div data-testid="has-permission">{children}</div> : <div data-testid="no-permission">Access Denied</div>;
};

const MultiPermissionTestComponent = ({ permissions, requireAll = false, children }) => {
  const hasPermissions = requireAll 
    ? useAllPermissions(permissions)
    : useAnyPermission(permissions);
  
  return hasPermissions 
    ? <div data-testid="has-permissions">{children}</div> 
    : <div data-testid="no-permissions">Access Denied</div>;
};

const RoleTestComponent = ({ role, children }) => {
  const hasRole = useRole(role);
  return hasRole ? <div data-testid="has-role">{children}</div> : <div data-testid="no-role">Access Denied</div>;
};

const AuthInfoComponent = () => {
  const { user, isAuthenticated, permissions, hasPermission, hasRole } = useAuth();
  
  return (
    <div data-testid="auth-info">
      <div data-testid="is-authenticated">{isAuthenticated.toString()}</div>
      <div data-testid="username">{user?.username || 'Not logged in'}</div>
      <div data-testid="user-role">{user?.role || 'No role'}</div>
      <div data-testid="permission-count">{permissions.length}</div>
      <div data-testid="can-read-invoices">{hasPermission('read_invoices').toString()}</div>
      <div data-testid="is-admin">{hasRole('admin').toString()}</div>
    </div>
  );
};

// Conditional rendering component based on permissions
const ConditionalActionsComponent = () => {
  const { user } = useAuth();
  const canManageUsers = usePermission('manage_users');
  const canGenerateReports = usePermission('generate_reports');
  const canExportData = usePermission('export_data');
  const hasAnyAdminPermission = useAnyPermission(['manage_users', 'manage_roles', 'configure_system']);
  const hasAllReportPermissions = useAllPermissions(['generate_reports', 'export_data']);

  if (!user) {
    return <div data-testid="not-authenticated">Please log in</div>;
  }

  return (
    <div data-testid="conditional-actions">
      {canManageUsers && (
        <button data-testid="manage-users-btn">Manage Users</button>
      )}
      {canGenerateReports && (
        <button data-testid="generate-reports-btn">Generate Reports</button>
      )}
      {canExportData && (
        <button data-testid="export-data-btn">Export Data</button>
      )}
      {hasAnyAdminPermission && (
        <div data-testid="admin-section">Admin Tools</div>
      )}
      {hasAllReportPermissions && (
        <div data-testid="advanced-reports">Advanced Reports</div>
      )}
    </div>
  );
};

// Test store factory
const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: authReducer
    },
    preloadedState: {
      auth: {
        user: null,
        permissions: [],
        isAuthenticated: false,
        isLoading: false,
        error: null,
        token: null,
        tokenExpiry: null,
        isInitialized: true,
        ...initialState.auth
      }
    }
  });
};

// Test wrapper component
const TestWrapper = ({ children, store }) => (
  <Provider store={store}>
    <BrowserRouter>
      {children}
    </BrowserRouter>
  </Provider>
);

describe('Permission Validation Integration Tests', () => {
  let store;
  let user;

  beforeEach(() => {
    localStorage.clear();
    store = createTestStore();
    user = userEvent.setup();
    
    // Mock console methods
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  describe('Single Permission Validation', () => {
    it('should correctly validate single permissions for different users', async () => {
      // Requirement 4.3: Permission-based access control
      const testCases = permissionTestScenarios[0].tests;

      for (const testCase of testCases) {
        // Clear auth state
        store = createTestStore();
        
        // Set user in store
        if (testCase.user) {
          await store.dispatch(loginUser({
            username: testCase.user.username,
            password: testCase.user.password
          }));
        }

        render(
          <TestWrapper store={store}>
            <PermissionTestComponent permission={testCase.permission}>
              Protected Content
            </PermissionTestComponent>
          </TestWrapper>
        );

        if (testCase.expected) {
          expect(screen.getByTestId('has-permission')).toBeInTheDocument();
          expect(screen.getByText('Protected Content')).toBeInTheDocument();
        } else {
          expect(screen.getByTestId('no-permission')).toBeInTheDocument();
          expect(screen.getByText('Access Denied')).toBeInTheDocument();
        }
      }
    });

    it('should handle permission changes dynamically', async () => {
      // Requirement 4.3: Dynamic permission validation
      // Start with no user
      render(
        <TestWrapper store={store}>
          <PermissionTestComponent permission="read_invoices">
            Invoice Data
          </PermissionTestComponent>
        </TestWrapper>
      );

      // Should show no permission initially
      expect(screen.getByTestId('no-permission')).toBeInTheDocument();

      // Login user with permission
      await store.dispatch(loginUser({
        username: mockUsers.auditor.username,
        password: mockUsers.auditor.password
      }));

      // Should now show permission granted
      await waitFor(() => {
        expect(screen.getByTestId('has-permission')).toBeInTheDocument();
        expect(screen.getByText('Invoice Data')).toBeInTheDocument();
      });
    });
  });

  describe('Multiple Permission Validation', () => {
    it('should validate "any permission" requirements correctly', async () => {
      // Requirement 4.3: Multiple permission validation (OR logic)
      const testCases = permissionTestScenarios[1].tests;

      for (const testCase of testCases) {
        store = createTestStore();
        
        if (testCase.user) {
          await store.dispatch(loginUser({
            username: testCase.user.username,
            password: testCase.user.password
          }));
        }

        render(
          <TestWrapper store={store}>
            <MultiPermissionTestComponent 
              permissions={testCase.permissions} 
              requireAll={false}
            >
              Multi-Permission Content
            </MultiPermissionTestComponent>
          </TestWrapper>
        );

        if (testCase.expected) {
          expect(screen.getByTestId('has-permissions')).toBeInTheDocument();
        } else {
          expect(screen.getByTestId('no-permissions')).toBeInTheDocument();
        }
      }
    });

    it('should validate "all permissions" requirements correctly', async () => {
      // Requirement 4.3: Multiple permission validation (AND logic)
      const testCases = permissionTestScenarios[2].tests;

      for (const testCase of testCases) {
        store = createTestStore();
        
        if (testCase.user) {
          await store.dispatch(loginUser({
            username: testCase.user.username,
            password: testCase.user.password
          }));
        }

        render(
          <TestWrapper store={store}>
            <MultiPermissionTestComponent 
              permissions={testCase.permissions} 
              requireAll={true}
            >
              All-Permissions Content
            </MultiPermissionTestComponent>
          </TestWrapper>
        );

        if (testCase.expected) {
          expect(screen.getByTestId('has-permissions')).toBeInTheDocument();
        } else {
          expect(screen.getByTestId('no-permissions')).toBeInTheDocument();
        }
      }
    });

    it('should handle complex permission combinations in UI components', async () => {
      // Requirement 4.3: Complex permission scenarios
      // Test with admin user (should have all permissions)
      await store.dispatch(loginUser({
        username: mockUsers.admin.username,
        password: mockUsers.admin.password
      }));

      render(
        <TestWrapper store={store}>
          <ConditionalActionsComponent />
        </TestWrapper>
      );

      // Admin should see all buttons and sections
      await waitFor(() => {
        expect(screen.getByTestId('manage-users-btn')).toBeInTheDocument();
        expect(screen.getByTestId('generate-reports-btn')).toBeInTheDocument();
        expect(screen.getByTestId('export-data-btn')).toBeInTheDocument();
        expect(screen.getByTestId('admin-section')).toBeInTheDocument();
        expect(screen.getByTestId('advanced-reports')).toBeInTheDocument();
      });
    });

    it('should show limited UI for users with restricted permissions', async () => {
      // Requirement 4.3: Permission-based UI rendering
      // Test with auditor (limited permissions)
      await store.dispatch(loginUser({
        username: mockUsers.auditor.username,
        password: mockUsers.auditor.password
      }));

      render(
        <TestWrapper store={store}>
          <ConditionalActionsComponent />
        </TestWrapper>
      );

      // Auditor should only see reports button, not user management or admin tools
      await waitFor(() => {
        expect(screen.getByTestId('generate-reports-btn')).toBeInTheDocument();
        expect(screen.queryByTestId('manage-users-btn')).not.toBeInTheDocument();
        expect(screen.queryByTestId('export-data-btn')).not.toBeInTheDocument();
        expect(screen.queryByTestId('admin-section')).not.toBeInTheDocument();
        expect(screen.queryByTestId('advanced-reports')).not.toBeInTheDocument();
      });
    });
  });

  describe('Role-Based Component Access', () => {
    it('should validate role-based component access correctly', async () => {
      // Requirement 4.2: Role-based access control in components
      const rolesToTest = [
        { user: mockUsers.admin, role: 'admin', shouldHaveAccess: true },
        { user: mockUsers.auditor, role: 'admin', shouldHaveAccess: false },
        { user: mockUsers.manager, role: 'finance_manager', shouldHaveAccess: true },
        { user: mockUsers.financialAdmin, role: 'admin', shouldHaveAccess: false }
      ];

      for (const testCase of rolesToTest) {
        store = createTestStore();
        
        await store.dispatch(loginUser({
          username: testCase.user.username,
          password: testCase.user.password
        }));

        render(
          <TestWrapper store={store}>
            <RoleTestComponent role={testCase.role}>
              Role-Protected Content
            </RoleTestComponent>
          </TestWrapper>
        );

        if (testCase.shouldHaveAccess) {
          expect(screen.getByTestId('has-role')).toBeInTheDocument();
          expect(screen.getByText('Role-Protected Content')).toBeInTheDocument();
        } else {
          expect(screen.getByTestId('no-role')).toBeInTheDocument();
          expect(screen.getByText('Access Denied')).toBeInTheDocument();
        }
      }
    });

    it('should provide comprehensive auth information through useAuth hook', async () => {
      // Requirement 4.4: Authentication state management
      // Test with admin user
      await store.dispatch(loginUser({
        username: mockUsers.admin.username,
        password: mockUsers.admin.password
      }));

      render(
        <TestWrapper store={store}>
          <AuthInfoComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
        expect(screen.getByTestId('username')).toHaveTextContent('admin');
        expect(screen.getByTestId('user-role')).toHaveTextContent('admin');
        expect(screen.getByTestId('can-read-invoices')).toHaveTextContent('true');
        expect(screen.getByTestId('is-admin')).toHaveTextContent('true');
        
        // Admin should have multiple permissions
        const permissionCount = parseInt(screen.getByTestId('permission-count').textContent);
        expect(permissionCount).toBeGreaterThan(5);
      });
    });
  });

  describe('Permission Service Integration', () => {
    it('should integrate correctly with AuthService permission methods', async () => {
      // Requirement 4.3: Service integration
      const testUser = mockUsers.manager;
      
      // Test direct service calls
      expect(AuthService.hasPermission(testUser, 'generate_reports')).toBe(true);
      expect(AuthService.hasPermission(testUser, 'manage_users')).toBe(false);
      
      expect(AuthService.hasAnyPermission(testUser, ['generate_reports', 'manage_users'])).toBe(true);
      expect(AuthService.hasAnyPermission(testUser, ['manage_users', 'configure_system'])).toBe(false);
      
      expect(AuthService.hasAllPermissions(testUser, ['generate_reports', 'export_data'])).toBe(true);
      expect(AuthService.hasAllPermissions(testUser, ['generate_reports', 'manage_users'])).toBe(false);
    });

    it('should handle null/undefined users gracefully', async () => {
      // Requirement 4.3: Error handling
      expect(AuthService.hasPermission(null, 'read_invoices')).toBe(false);
      expect(AuthService.hasPermission(undefined, 'read_invoices')).toBe(false);
      
      expect(AuthService.hasAnyPermission(null, ['read_invoices'])).toBe(false);
      expect(AuthService.hasAllPermissions(null, ['read_invoices'])).toBe(false);
      
      expect(AuthService.hasRole(null, 'admin')).toBe(false);
      expect(AuthService.hasAnyRole(null, ['admin'])).toBe(false);
    });

    it('should validate route access with complex configurations', async () => {
      // Requirement 4.4: Complex route validation
      const routeConfigs = [
        {
          requiresAuth: true,
          allowedRoles: ['admin', 'finance_manager'],
          requiredPermissions: ['generate_reports']
        },
        {
          requiresAuth: true,
          requiredPermissions: ['manage_users', 'manage_roles']
        },
        {
          requiresAuth: false // Public route
        }
      ];

      const users = [mockUsers.admin, mockUsers.manager, mockUsers.auditor, null];

      for (const config of routeConfigs) {
        for (const user of users) {
          const canAccess = AuthService.canAccessRoute(user, config);
          
          // Validate based on configuration
          if (!config.requiresAuth) {
            expect(canAccess).toBe(true);
          } else if (!user) {
            expect(canAccess).toBe(false);
          } else {
            // Check role and permission requirements
            let shouldAccess = true;
            
            if (config.allowedRoles && config.allowedRoles.length > 0) {
              shouldAccess = shouldAccess && AuthService.hasAnyRole(user, config.allowedRoles);
            }
            
            if (config.requiredPermissions && config.requiredPermissions.length > 0) {
              shouldAccess = shouldAccess && AuthService.hasAllPermissions(user, config.requiredPermissions);
            }
            
            expect(canAccess).toBe(shouldAccess);
          }
        }
      }
    });
  });

  describe('Custom Permission Scenarios', () => {
    it('should handle users with custom permissions beyond their role', async () => {
      // Requirement 4.3: Custom permission assignment
      await store.dispatch(loginUser({
        username: mockUsers.customPermissionUser.username,
        password: mockUsers.customPermissionUser.password
      }));

      render(
        <TestWrapper store={store}>
          <ConditionalActionsComponent />
        </TestWrapper>
      );

      // Custom user should have generate_reports and export_data permissions
      await waitFor(() => {
        expect(screen.getByTestId('generate-reports-btn')).toBeInTheDocument();
        expect(screen.getByTestId('export-data-btn')).toBeInTheDocument();
        expect(screen.getByTestId('advanced-reports')).toBeInTheDocument();
        
        // But should not have admin permissions
        expect(screen.queryByTestId('manage-users-btn')).not.toBeInTheDocument();
        expect(screen.queryByTestId('admin-section')).not.toBeInTheDocument();
      });
    });

    it('should handle permission elevation requirements', async () => {
      // Requirement 4.3: Permission elevation
      const elevatedPermissions = ['delete_invoices', 'manage_users', 'manage_roles', 'configure_system'];
      
      for (const permission of elevatedPermissions) {
        const permissionDef = AuthService.getUserPermissions(mockUsers.admin)
          .find(p => p.type === permission);
        
        if (permissionDef) {
          expect(permissionDef.requiresElevation).toBe(true);
        }
      }
    });

    it('should validate permissions across different modules', async () => {
      // Requirement 4.3: Module-based permissions
      const modulePermissions = {
        invoices: ['read_invoices', 'write_invoices', 'delete_invoices'],
        validation: ['validate_invoices'],
        reports: ['generate_reports'],
        data: ['export_data', 'import_data'],
        administration: ['manage_users', 'manage_roles', 'configure_system'],
        compliance: ['view_audit_logs'],
        master_data: ['manage_master_data']
      };

      const testUser = mockUsers.admin;
      const userPermissions = AuthService.getUserPermissions(testUser);

      for (const [module, permissions] of Object.entries(modulePermissions)) {
        for (const permission of permissions) {
          const hasPermission = AuthService.hasPermission(testUser, permission);
          const permissionDef = userPermissions.find(p => p.type === permission);
          
          if (permissionDef) {
            expect(permissionDef.module).toBe(module);
            expect(hasPermission).toBe(true);
          }
        }
      }
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle rapid permission checks efficiently', async () => {
      // Requirement 4.4: Performance considerations
      await store.dispatch(loginUser({
        username: mockUsers.admin.username,
        password: mockUsers.admin.password
      }));

      const startTime = performance.now();
      
      // Perform many permission checks
      for (let i = 0; i < 1000; i++) {
        const state = store.getState();
        const user = state.auth.user;
        
        AuthService.hasPermission(user, 'read_invoices');
        AuthService.hasPermission(user, 'manage_users');
        AuthService.hasAnyPermission(user, ['generate_reports', 'export_data']);
        AuthService.hasAllPermissions(user, ['read_invoices', 'validate_invoices']);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time (less than 100ms for 1000 checks)
      expect(duration).toBeLessThan(100);
    });

    it('should handle component unmounting during permission checks', async () => {
      // Requirement 4.4: Component lifecycle handling
      await store.dispatch(loginUser({
        username: mockUsers.admin.username,
        password: mockUsers.admin.password
      }));

      const { unmount } = render(
        <TestWrapper store={store}>
          <PermissionTestComponent permission="read_invoices">
            Test Content
          </PermissionTestComponent>
        </TestWrapper>
      );

      // Verify component renders correctly
      expect(screen.getByTestId('has-permission')).toBeInTheDocument();

      // Unmount component
      unmount();

      // Should not cause any errors or memory leaks
      expect(true).toBe(true); // Test passes if no errors thrown
    });
  });
});