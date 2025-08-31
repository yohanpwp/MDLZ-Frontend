/**
 * Integration Tests for Authentication and Authorization Workflows
 * 
 * Tests login/logout workflows, role-based access control, permission validation,
 * and session management for the Invoice Validation System.
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';

// Components and services
import LoginForm from '../../components/auth/LoginForm.jsx';
import ProtectedRoute from '../../components/auth/ProtectedRoute.jsx';
import authReducer, { 
  loginUser, 
  logoutUser, 
  initializeAuth,
  clearAuth 
} from '../../redux/slices/authSlice.js';
import AuthService from '../../services/AuthService.js';

// Mock components for testing route protection
const MockDashboard = () => <div data-testid="dashboard">Dashboard</div>;
const MockAdminPanel = () => <div data-testid="admin-panel">Admin Panel</div>;
const MockUserManagement = () => <div data-testid="user-management">User Management</div>;
const MockReports = () => <div data-testid="reports">Reports</div>;
const MockAccessDenied = () => <div data-testid="access-denied">Access Denied</div>;
const MockLogin = () => <div data-testid="login-page">Login Page</div>;

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
const TestWrapper = ({ children, store, initialEntries = ['/'] }) => (
  <Provider store={store}>
    <BrowserRouter>
      {children}
    </BrowserRouter>
  </Provider>
);

// Route configuration for testing
const TestRoutes = ({ store }) => (
  <Provider store={store}>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<MockLogin />} />
        <Route path="/access-denied" element={<MockAccessDenied />} />
        
        {/* Protected routes with different permission requirements */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute requiresAuth={true}>
              <MockDashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute 
              requiresAuth={true}
              allowedRoles={['admin']}
            >
              <MockAdminPanel />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/users" 
          element={
            <ProtectedRoute 
              requiresAuth={true}
              requiredPermissions={['manage_users']}
            >
              <MockUserManagement />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/reports" 
          element={
            <ProtectedRoute 
              requiresAuth={true}
              requiredPermissions={['generate_reports']}
            >
              <MockReports />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </BrowserRouter>
  </Provider>
);

describe('Authentication Workflows Integration Tests', () => {
  let store;
  let user;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    
    // Create fresh store
    store = createTestStore();
    
    // Setup user event
    user = userEvent.setup();
    
    // Mock console methods to avoid noise in tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console methods
    vi.restoreAllMocks();
    
    // Clear localStorage
    localStorage.clear();
  });

  describe('Login/Logout Workflows', () => {
    it('should successfully login with valid credentials', async () => {
      // Requirement 4.1: User authentication
      render(
        <TestWrapper store={store}>
          <LoginForm />
        </TestWrapper>
      );

      // Fill in login form
      const usernameInput = screen.getByLabelText(/username or email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(usernameInput, 'admin');
      await user.type(passwordInput, 'admin123');
      await user.click(submitButton);

      // Wait for login to complete
      await waitFor(() => {
        const state = store.getState();
        expect(state.auth.isAuthenticated).toBe(true);
        expect(state.auth.user).toBeTruthy();
        expect(state.auth.user.username).toBe('admin');
        expect(state.auth.user.role).toBe('admin');
      });
    });

    it('should handle login failure with invalid credentials', async () => {
      // Requirement 4.1: Authentication error handling
      render(
        <TestWrapper store={store}>
          <LoginForm />
        </TestWrapper>
      );

      const usernameInput = screen.getByLabelText(/username or email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(usernameInput, 'invalid_user');
      await user.type(passwordInput, 'wrong_password');
      await user.click(submitButton);

      // Wait for error to appear
      await waitFor(() => {
        expect(screen.getByText(/invalid username or password/i)).toBeInTheDocument();
      });

      // Verify user is not authenticated
      const state = store.getState();
      expect(state.auth.isAuthenticated).toBe(false);
      expect(state.auth.user).toBeNull();
    });

    it('should successfully logout authenticated user', async () => {
      // Requirement 4.1: User logout
      // First login
      await store.dispatch(loginUser({
        username: 'admin',
        password: 'admin123',
        rememberMe: false
      }));

      // Verify user is logged in
      let state = store.getState();
      expect(state.auth.isAuthenticated).toBe(true);

      // Logout
      await store.dispatch(logoutUser());

      // Verify user is logged out
      state = store.getState();
      expect(state.auth.isAuthenticated).toBe(false);
      expect(state.auth.user).toBeNull();
      expect(state.auth.permissions).toEqual([]);
    });

    it('should handle remember me functionality', async () => {
      // Requirement 4.1: Session persistence
      render(
        <TestWrapper store={store}>
          <LoginForm />
        </TestWrapper>
      );

      const usernameInput = screen.getByLabelText(/username or email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const rememberMeCheckbox = screen.getByLabelText(/remember me/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(usernameInput, 'admin');
      await user.type(passwordInput, 'admin123');
      await user.click(rememberMeCheckbox);
      await user.click(submitButton);

      // Wait for login to complete
      await waitFor(() => {
        const state = store.getState();
        expect(state.auth.isAuthenticated).toBe(true);
      });

      // Verify data is stored in localStorage
      expect(localStorage.getItem('invoice_validation_auth')).toBeTruthy();
      expect(localStorage.getItem('invoice_validation_token')).toBeTruthy();
    });

    it('should initialize auth state from stored data on app start', async () => {
      // Requirement 4.1: Session restoration
      // Simulate stored auth data
      const mockUser = {
        id: '1',
        username: 'admin',
        role: 'admin',
        isActive: true
      };
      
      const authData = {
        user: mockUser,
        token: 'mock-token',
        expiresIn: Date.now() + (8 * 60 * 60 * 1000) // 8 hours from now
      };
      
      localStorage.setItem('invoice_validation_auth', JSON.stringify(authData));
      localStorage.setItem('invoice_validation_token', authData.token);

      // Initialize auth
      await store.dispatch(initializeAuth());

      // Verify auth state is restored
      const state = store.getState();
      expect(state.auth.isAuthenticated).toBe(true);
      expect(state.auth.user.username).toBe('admin');
    });
  });

  describe('Role-Based Access Control', () => {
    it('should allow admin access to all protected routes', async () => {
      // Requirement 4.2: Role-based access control
      // Login as admin
      await store.dispatch(loginUser({
        username: 'admin',
        password: 'admin123'
      }));

      // Test admin panel access
      render(<TestRoutes store={store} />);
      
      // Navigate to admin route
      window.history.pushState({}, '', '/admin');
      
      await waitFor(() => {
        expect(screen.getByTestId('admin-panel')).toBeInTheDocument();
      });
    });

    it('should deny non-admin access to admin routes', async () => {
      // Requirement 4.2: Access control enforcement
      // Login as financial auditor (non-admin)
      await store.dispatch(loginUser({
        username: 'auditor',
        password: 'auditor123'
      }));

      render(<TestRoutes store={store} />);
      
      // Try to navigate to admin route
      window.history.pushState({}, '', '/admin');
      
      await waitFor(() => {
        expect(screen.getByTestId('access-denied')).toBeInTheDocument();
      });
    });

    it('should redirect unauthenticated users to login', async () => {
      // Requirement 4.2: Authentication requirement
      render(<TestRoutes store={store} />);
      
      // Try to access protected route without authentication
      window.history.pushState({}, '', '/');
      
      await waitFor(() => {
        expect(screen.getByTestId('login-page')).toBeInTheDocument();
      });
    });

    it('should handle multiple role requirements correctly', async () => {
      // Requirement 4.2: Multiple role validation
      const testCases = [
        { username: 'admin', password: 'admin123', shouldAccess: true },
        { username: 'fin_admin', password: 'finadmin123', shouldAccess: false },
        { username: 'auditor', password: 'auditor123', shouldAccess: false },
        { username: 'manager', password: 'manager123', shouldAccess: false }
      ];

      for (const testCase of testCases) {
        // Clear auth state
        store.dispatch(clearAuth());
        
        // Login with test user
        await store.dispatch(loginUser({
          username: testCase.username,
          password: testCase.password
        }));

        render(<TestRoutes store={store} />);
        
        // Try to access admin route
        window.history.pushState({}, '', '/admin');
        
        if (testCase.shouldAccess) {
          await waitFor(() => {
            expect(screen.getByTestId('admin-panel')).toBeInTheDocument();
          });
        } else {
          await waitFor(() => {
            expect(screen.getByTestId('access-denied')).toBeInTheDocument();
          });
        }
      }
    });
  });

  describe('Permission Validation', () => {
    it('should validate specific permissions for route access', async () => {
      // Requirement 4.3: Permission-based access control
      // Login as financial auditor (has generate_reports permission)
      await store.dispatch(loginUser({
        username: 'auditor',
        password: 'auditor123'
      }));

      render(<TestRoutes store={store} />);
      
      // Navigate to reports route (requires generate_reports permission)
      window.history.pushState({}, '', '/reports');
      
      await waitFor(() => {
        expect(screen.getByTestId('reports')).toBeInTheDocument();
      });
    });

    it('should deny access when user lacks required permissions', async () => {
      // Requirement 4.3: Permission enforcement
      // Login as financial auditor (does not have manage_users permission)
      await store.dispatch(loginUser({
        username: 'auditor',
        password: 'auditor123'
      }));

      render(<TestRoutes store={store} />);
      
      // Try to access user management route (requires manage_users permission)
      window.history.pushState({}, '', '/users');
      
      await waitFor(() => {
        expect(screen.getByTestId('access-denied')).toBeInTheDocument();
      });
    });

    it('should validate multiple permission requirements', async () => {
      // Requirement 4.3: Multiple permission validation
      const testPermissions = [
        { 
          user: 'admin', 
          password: 'admin123', 
          permissions: ['manage_users', 'generate_reports'],
          shouldHaveAll: true 
        },
        { 
          user: 'auditor', 
          password: 'auditor123', 
          permissions: ['manage_users', 'generate_reports'],
          shouldHaveAll: false 
        },
        { 
          user: 'manager', 
          password: 'manager123', 
          permissions: ['generate_reports', 'export_data'],
          shouldHaveAll: true 
        }
      ];

      for (const testCase of testPermissions) {
        // Clear auth state
        store.dispatch(clearAuth());
        
        // Login with test user
        await store.dispatch(loginUser({
          username: testCase.user,
          password: testCase.password
        }));

        const state = store.getState();
        const user = state.auth.user;
        
        // Test permission validation
        const hasAllPermissions = AuthService.hasAllPermissions(user, testCase.permissions);
        expect(hasAllPermissions).toBe(testCase.shouldHaveAll);
      }
    });

    it('should handle permission checking for inactive users', async () => {
      // Requirement 4.3: User status validation
      // Mock an inactive user scenario
      const mockInactiveUser = {
        id: '999',
        username: 'inactive_user',
        role: 'admin',
        isActive: false
      };

      // Test permission checking for inactive user
      const hasPermission = AuthService.hasPermission(mockInactiveUser, 'read_invoices');
      
      // Should still check permissions based on role, but login should be prevented
      expect(hasPermission).toBe(true); // Permission exists for role
      
      // But login should fail for inactive user
      try {
        await store.dispatch(loginUser({
          username: 'inactive_user',
          password: 'password'
        })).unwrap();
      } catch (error) {
        expect(error).toContain('deactivated');
      }
    });
  });

  describe('Session Management and Security', () => {
    it('should handle token expiration correctly', async () => {
      // Requirement 4.4: Session management
      // Login user
      await store.dispatch(loginUser({
        username: 'admin',
        password: 'admin123'
      }));

      // Simulate expired token by setting past expiry time
      const expiredAuthData = {
        user: { id: '1', username: 'admin' },
        token: 'expired-token',
        expiresIn: Date.now() - 1000 // 1 second ago
      };
      
      localStorage.setItem('invoice_validation_auth', JSON.stringify(expiredAuthData));

      // Try to get current user (should return null for expired token)
      const currentUser = AuthService.getCurrentUser();
      expect(currentUser).toBeNull();
    });

    it('should clear session data on logout', async () => {
      // Requirement 4.4: Session cleanup
      // Login with remember me
      await store.dispatch(loginUser({
        username: 'admin',
        password: 'admin123',
        rememberMe: true
      }));

      // Verify data is stored
      expect(localStorage.getItem('invoice_validation_auth')).toBeTruthy();
      expect(localStorage.getItem('invoice_validation_token')).toBeTruthy();

      // Logout
      await store.dispatch(logoutUser());

      // Verify data is cleared
      expect(localStorage.getItem('invoice_validation_auth')).toBeNull();
      expect(localStorage.getItem('invoice_validation_token')).toBeNull();
    });

    it('should handle concurrent session management', async () => {
      // Requirement 4.4: Concurrent session handling
      // Simulate multiple login attempts
      const loginPromises = [
        store.dispatch(loginUser({ username: 'admin', password: 'admin123' })),
        store.dispatch(loginUser({ username: 'admin', password: 'admin123' })),
        store.dispatch(loginUser({ username: 'admin', password: 'admin123' }))
      ];

      const results = await Promise.allSettled(loginPromises);
      
      // All should succeed (last one wins)
      results.forEach(result => {
        expect(result.status).toBe('fulfilled');
      });

      // Final state should be consistent
      const state = store.getState();
      expect(state.auth.isAuthenticated).toBe(true);
      expect(state.auth.user.username).toBe('admin');
    });

    it('should validate route access with complex permission combinations', async () => {
      // Requirement 4.4: Complex authorization scenarios
      const routeConfigs = [
        {
          name: 'admin-only',
          config: { requiresAuth: true, allowedRoles: ['admin'] },
          users: [
            { username: 'admin', password: 'admin123', shouldAccess: true },
            { username: 'auditor', password: 'auditor123', shouldAccess: false }
          ]
        },
        {
          name: 'multi-role',
          config: { 
            requiresAuth: true, 
            allowedRoles: ['admin', 'finance_manager', 'financial_auditor'] 
          },
          users: [
            { username: 'admin', password: 'admin123', shouldAccess: true },
            { username: 'manager', password: 'manager123', shouldAccess: true },
            { username: 'auditor', password: 'auditor123', shouldAccess: true },
            { username: 'fin_admin', password: 'finadmin123', shouldAccess: false }
          ]
        },
        {
          name: 'permission-based',
          config: { 
            requiresAuth: true, 
            requiredPermissions: ['generate_reports', 'export_data'] 
          },
          users: [
            { username: 'admin', password: 'admin123', shouldAccess: true },
            { username: 'manager', password: 'manager123', shouldAccess: true },
            { username: 'auditor', password: 'auditor123', shouldAccess: false }
          ]
        }
      ];

      for (const routeTest of routeConfigs) {
        for (const userTest of routeTest.users) {
          // Clear auth state
          store.dispatch(clearAuth());
          
          // Login with test user
          await store.dispatch(loginUser({
            username: userTest.username,
            password: userTest.password
          }));

          const state = store.getState();
          const user = state.auth.user;
          
          // Test route access
          const canAccess = AuthService.canAccessRoute(user, routeTest.config);
          expect(canAccess).toBe(userTest.shouldAccess);
        }
      }
    });

    it('should handle authentication state persistence across page reloads', async () => {
      // Requirement 4.4: State persistence
      // Login and store data
      await store.dispatch(loginUser({
        username: 'admin',
        password: 'admin123',
        rememberMe: true
      }));

      // Simulate page reload by creating new store and initializing
      const newStore = createTestStore();
      await newStore.dispatch(initializeAuth());

      // Verify state is restored
      const state = newStore.getState();
      expect(state.auth.isAuthenticated).toBe(true);
      expect(state.auth.user.username).toBe('admin');
      expect(state.auth.permissions.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle network errors during authentication', async () => {
      // Mock network error
      const originalLogin = AuthService.login;
      AuthService.login = vi.fn().mockRejectedValue(new Error('Network error'));

      render(
        <TestWrapper store={store}>
          <LoginForm />
        </TestWrapper>
      );

      const usernameInput = screen.getByLabelText(/username or email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(usernameInput, 'admin');
      await user.type(passwordInput, 'admin123');
      await user.click(submitButton);

      // Wait for error to appear
      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });

      // Restore original method
      AuthService.login = originalLogin;
    });

    it('should handle corrupted localStorage data gracefully', async () => {
      // Set corrupted data in localStorage
      localStorage.setItem('invoice_validation_auth', 'invalid-json');

      // Initialize auth should handle gracefully
      await store.dispatch(initializeAuth());

      const state = store.getState();
      expect(state.auth.isAuthenticated).toBe(false);
      expect(state.auth.user).toBeNull();
    });

    it('should validate form inputs properly', async () => {
      render(
        <TestWrapper store={store}>
          <LoginForm />
        </TestWrapper>
      );

      const submitButton = screen.getByRole('button', { name: /sign in/i });

      // Try to submit empty form
      await user.click(submitButton);

      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText(/username or email is required/i)).toBeInTheDocument();
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });
    });
  });
});