/**
 * ProtectedRoute Component Tests
 * 
 * Tests for the ProtectedRoute component including authentication checks,
 * role-based access control, permission validation, and navigation.
 */

import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { vi } from 'vitest';
import ProtectedRoute from '../../components/auth/ProtectedRoute';

// Mock LoadingSpinner component
vi.mock('../../components/ui/LoadingSpinner', () => ({
  default: () => <div data-testid="loading-spinner">Loading...</div>
}));

// Mock AuthService
vi.mock('../../services/AuthService', () => ({
  default: {
    hasAnyRole: vi.fn(),
    hasAllPermissions: vi.fn()
  }
}));

// Mock React Router Navigate component
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Navigate: ({ to, state, replace }) => {
      mockNavigate(to, state, replace);
      return <div data-testid="navigate" data-to={to}>Redirecting to {to}</div>;
    },
    useLocation: () => ({ pathname: '/test-path' }),
    BrowserRouter: ({ children }) => <div>{children}</div>
  };
});

// Mock Redux auth slice
vi.mock('../../redux/slices/authSlice.js', () => ({
  selectUser: (state) => state.auth.user,
  selectIsAuthenticated: (state) => state.auth.isAuthenticated,
  selectIsInitialized: (state) => state.auth.isInitialized
}));

describe('ProtectedRoute Component', () => {
  const mockUser = {
    id: 1,
    username: 'testuser',
    roles: ['user'],
    permissions: ['view_data']
  };

  const createMockStore = (initialState = {}) => {
    return configureStore({
      reducer: {
        auth: (state = {
          user: null,
          isAuthenticated: false,
          isInitialized: true,
          ...initialState.auth
        }) => state
      },
      preloadedState: initialState
    });
  };

  const renderWithProviders = (store, props = {}) => {
    const defaultProps = {
      children: <div data-testid="protected-content">Protected Content</div>,
      ...props
    };

    return render(
      <Provider store={store}>
        <BrowserRouter>
          <ProtectedRoute {...defaultProps} />
        </BrowserRouter>
      </Provider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    
    // Get the mocked functions
    const AuthService = require('../../services/AuthService').default;
    AuthService.hasAnyRole.mockReturnValue(true);
    AuthService.hasAllPermissions.mockReturnValue(true);
  });

  describe('Loading State', () => {
    it('shows loading spinner when auth is not initialized', () => {
      const store = createMockStore({
        auth: { isInitialized: false }
      });
      renderWithProviders(store);

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('does not show loading spinner when auth is initialized', () => {
      const store = createMockStore({
        auth: { 
          isInitialized: true,
          isAuthenticated: false
        }
      });
      renderWithProviders(store);

      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });
  });

  describe('Public Routes', () => {
    it('renders children for public routes without authentication', () => {
      const store = createMockStore({
        auth: { isAuthenticated: false }
      });
      renderWithProviders(store, { requiresAuth: false });

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
    });

    it('renders children for public routes even when authenticated', () => {
      const store = createMockStore({
        auth: { 
          isAuthenticated: true,
          user: mockUser
        }
      });
      renderWithProviders(store, { requiresAuth: false });

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
  });

  describe('Authentication Required', () => {
    it('redirects to login when user is not authenticated', () => {
      const store = createMockStore({
        auth: { isAuthenticated: false }
      });
      renderWithProviders(store, { requiresAuth: true });

      expect(screen.getByTestId('navigate')).toBeInTheDocument();
      expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/login');
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('redirects to custom path when specified', () => {
      const store = createMockStore({
        auth: { isAuthenticated: false }
      });
      renderWithProviders(store, { 
        requiresAuth: true,
        redirectTo: '/custom-login'
      });

      expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/custom-login');
    });

    it('redirects when user is null even if authenticated flag is true', () => {
      const store = createMockStore({
        auth: { 
          isAuthenticated: true,
          user: null
        }
      });
      renderWithProviders(store);

      expect(screen.getByTestId('navigate')).toBeInTheDocument();
      expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/login');
    });

    it('renders children when user is authenticated', () => {
      const store = createMockStore({
        auth: { 
          isAuthenticated: true,
          user: mockUser
        }
      });
      renderWithProviders(store);

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
    });
  });

  describe('Role-Based Access Control', () => {
    it('allows access when user has required role', () => {
      const AuthService = require('../../services/AuthService').default;
      AuthService.hasAnyRole.mockReturnValue(true);
      
      const store = createMockStore({
        auth: { 
          isAuthenticated: true,
          user: mockUser
        }
      });
      renderWithProviders(store, { 
        allowedRoles: ['user', 'admin']
      });

      expect(AuthService.hasAnyRole).toHaveBeenCalledWith(mockUser, ['user', 'admin']);
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('redirects to access denied when user lacks required role', () => {
      const AuthService = require('../../services/AuthService').default;
      AuthService.hasAnyRole.mockReturnValue(false);
      
      const store = createMockStore({
        auth: { 
          isAuthenticated: true,
          user: mockUser
        }
      });
      renderWithProviders(store, { 
        allowedRoles: ['admin']
      });

      expect(AuthService.hasAnyRole).toHaveBeenCalledWith(mockUser, ['admin']);
      expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/access-denied');
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('shows custom fallback when user lacks required role', () => {
      const AuthService = require('../../services/AuthService').default;
      AuthService.hasAnyRole.mockReturnValue(false);
      
      const store = createMockStore({
        auth: { 
          isAuthenticated: true,
          user: mockUser
        }
      });
      
      const fallback = <div data-testid="custom-fallback">Access Denied</div>;
      renderWithProviders(store, { 
        allowedRoles: ['admin'],
        fallback
      });

      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
      expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('skips role check when no roles are specified', () => {
      const AuthService = require('../../services/AuthService').default;
      
      const store = createMockStore({
        auth: { 
          isAuthenticated: true,
          user: mockUser
        }
      });
      renderWithProviders(store, { allowedRoles: [] });

      expect(AuthService.hasAnyRole).not.toHaveBeenCalled();
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
  });

  describe('Permission-Based Access Control', () => {
    it('allows access when user has required permissions', () => {
      const AuthService = require('../../services/AuthService').default;
      AuthService.hasAllPermissions.mockReturnValue(true);
      
      const store = createMockStore({
        auth: { 
          isAuthenticated: true,
          user: mockUser
        }
      });
      renderWithProviders(store, { 
        requiredPermissions: ['view_data', 'edit_data']
      });

      expect(AuthService.hasAllPermissions).toHaveBeenCalledWith(mockUser, ['view_data', 'edit_data']);
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('redirects to access denied when user lacks required permissions', () => {
      const AuthService = require('../../services/AuthService').default;
      AuthService.hasAllPermissions.mockReturnValue(false);
      
      const store = createMockStore({
        auth: { 
          isAuthenticated: true,
          user: mockUser
        }
      });
      renderWithProviders(store, { 
        requiredPermissions: ['admin_access']
      });

      expect(AuthService.hasAllPermissions).toHaveBeenCalledWith(mockUser, ['admin_access']);
      expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/access-denied');
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('shows custom fallback when user lacks required permissions', () => {
      const AuthService = require('../../services/AuthService').default;
      AuthService.hasAllPermissions.mockReturnValue(false);
      
      const store = createMockStore({
        auth: { 
          isAuthenticated: true,
          user: mockUser
        }
      });
      
      const fallback = <div data-testid="permission-denied">Permission Denied</div>;
      renderWithProviders(store, { 
        requiredPermissions: ['admin_access'],
        fallback
      });

      expect(screen.getByTestId('permission-denied')).toBeInTheDocument();
      expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
    });

    it('skips permission check when no permissions are specified', () => {
      const AuthService = require('../../services/AuthService').default;
      
      const store = createMockStore({
        auth: { 
          isAuthenticated: true,
          user: mockUser
        }
      });
      renderWithProviders(store, { requiredPermissions: [] });

      expect(AuthService.hasAllPermissions).not.toHaveBeenCalled();
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
  });

  describe('Combined Role and Permission Checks', () => {
    it('requires both role and permission checks to pass', () => {
      const AuthService = require('../../services/AuthService').default;
      AuthService.hasAnyRole.mockReturnValue(true);
      AuthService.hasAllPermissions.mockReturnValue(true);
      
      const store = createMockStore({
        auth: { 
          isAuthenticated: true,
          user: mockUser
        }
      });
      renderWithProviders(store, { 
        allowedRoles: ['user'],
        requiredPermissions: ['view_data']
      });

      expect(AuthService.hasAnyRole).toHaveBeenCalledWith(mockUser, ['user']);
      expect(AuthService.hasAllPermissions).toHaveBeenCalledWith(mockUser, ['view_data']);
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('fails when role check passes but permission check fails', () => {
      const AuthService = require('../../services/AuthService').default;
      AuthService.hasAnyRole.mockReturnValue(true);
      AuthService.hasAllPermissions.mockReturnValue(false);
      
      const store = createMockStore({
        auth: { 
          isAuthenticated: true,
          user: mockUser
        }
      });
      renderWithProviders(store, { 
        allowedRoles: ['user'],
        requiredPermissions: ['admin_access']
      });

      expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/access-denied');
    });

    it('fails when permission check passes but role check fails', () => {
      const AuthService = require('../../services/AuthService').default;
      AuthService.hasAnyRole.mockReturnValue(false);
      AuthService.hasAllPermissions.mockReturnValue(true);
      
      const store = createMockStore({
        auth: { 
          isAuthenticated: true,
          user: mockUser
        }
      });
      renderWithProviders(store, { 
        allowedRoles: ['admin'],
        requiredPermissions: ['view_data']
      });

      expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/access-denied');
    });
  });

  describe('Navigation State', () => {
    it('passes current location in navigation state', () => {
      const store = createMockStore({
        auth: { isAuthenticated: false }
      });
      renderWithProviders(store);

      expect(mockNavigate).toHaveBeenCalledWith(
        '/login',
        { from: { pathname: '/test-path' } },
        true
      );
    });

    it('uses replace navigation by default', () => {
      const store = createMockStore({
        auth: { isAuthenticated: false }
      });
      renderWithProviders(store);

      expect(mockNavigate).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        true
      );
    });
  });

  describe('Component Props', () => {
    it('accepts and renders custom children', () => {
      const store = createMockStore({
        auth: { 
          isAuthenticated: true,
          user: mockUser
        }
      });
      
      const customChildren = <div data-testid="custom-children">Custom Content</div>;
      renderWithProviders(store, { children: customChildren });

      expect(screen.getByTestId('custom-children')).toBeInTheDocument();
    });

    it('uses default props when not specified', () => {
      const store = createMockStore({
        auth: { isAuthenticated: false }
      });
      renderWithProviders(store);

      // Should redirect to default login path
      expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/login');
    });

    it('handles empty arrays for roles and permissions', () => {
      const store = createMockStore({
        auth: { 
          isAuthenticated: true,
          user: mockUser
        }
      });
      renderWithProviders(store, { 
        allowedRoles: [],
        requiredPermissions: []
      });

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles undefined user gracefully', () => {
      const store = createMockStore({
        auth: { 
          isAuthenticated: true,
          user: undefined
        }
      });
      renderWithProviders(store);

      expect(screen.getByTestId('navigate')).toBeInTheDocument();
    });

    it('handles null fallback component', () => {
      const AuthService = require('../../services/AuthService').default;
      AuthService.hasAnyRole.mockReturnValue(false);
      
      const store = createMockStore({
        auth: { 
          isAuthenticated: true,
          user: mockUser
        }
      });
      renderWithProviders(store, { 
        allowedRoles: ['admin'],
        fallback: null
      });

      expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/access-denied');
    });

    it('handles complex user objects', () => {
      const complexUser = {
        ...mockUser,
        profile: { name: 'Test User' },
        settings: { theme: 'dark' }
      };
      
      const store = createMockStore({
        auth: { 
          isAuthenticated: true,
          user: complexUser
        }
      });
      renderWithProviders(store);

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
  });
});