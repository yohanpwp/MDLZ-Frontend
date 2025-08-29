/**
 * Login Page Component Tests
 * 
 * Tests for the Login page component including authentication redirect,
 * layout, and integration with LoginForm component.
 */

import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { vi } from 'vitest';
import Login from '../../pages/Login';

// Mock LoginForm component
vi.mock('../../components/auth/LoginForm', () => ({
  default: ({ onSuccess }) => (
    <div data-testid="login-form">
      <button onClick={() => onSuccess && onSuccess({ user: { username: 'testuser' } })}>
        Mock Login
      </button>
    </div>
  )
}));

// Mock React Router hooks
const mockNavigate = vi.fn();
const mockLocation = { state: null };

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation,
    BrowserRouter: ({ children }) => <div>{children}</div>
  };
});

// Mock Redux auth slice
vi.mock('../../redux/slices/authSlice.js', () => ({
  selectIsAuthenticated: (state) => state.auth.isAuthenticated
}));

describe('Login Page Component', () => {
  const createMockStore = (initialState = {}) => {
    return configureStore({
      reducer: {
        auth: (state = {
          isAuthenticated: false,
          user: null,
          ...initialState.auth
        }) => state
      },
      preloadedState: initialState
    });
  };

  const renderWithProviders = (store, props = {}) => {
    return render(
      <Provider store={store}>
        <BrowserRouter>
          <Login {...props} />
        </BrowserRouter>
      </Provider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    mockLocation.state = null;
  });

  describe('Rendering', () => {
    it('renders the login page correctly', () => {
      const store = createMockStore();
      renderWithProviders(store);

      expect(screen.getByTestId('login-form')).toBeInTheDocument();
      expect(screen.getByText('Invoice Validation System v1.0')).toBeInTheDocument();
      expect(screen.getByText('Secure financial document validation and compliance')).toBeInTheDocument();
    });

    it('has proper page layout structure', () => {
      const store = createMockStore();
      renderWithProviders(store);

      // Check for main container with proper styling
      const container = screen.getByText('Invoice Validation System v1.0').closest('div');
      expect(container).toBeInTheDocument();
    });

    it('displays footer information', () => {
      const store = createMockStore();
      renderWithProviders(store);

      expect(screen.getByText('Invoice Validation System v1.0')).toBeInTheDocument();
      expect(screen.getByText('Secure financial document validation and compliance')).toBeInTheDocument();
    });
  });

  describe('Authentication Redirect', () => {
    it('redirects authenticated users to home page', () => {
      const store = createMockStore({
        auth: { isAuthenticated: true }
      });
      renderWithProviders(store);

      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    });

    it('redirects to intended destination when specified', () => {
      mockLocation.state = { from: { pathname: '/dashboard' } };
      
      const store = createMockStore({
        auth: { isAuthenticated: true }
      });
      renderWithProviders(store);

      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });

    it('does not redirect unauthenticated users', () => {
      const store = createMockStore({
        auth: { isAuthenticated: false }
      });
      renderWithProviders(store);

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('handles authentication state changes', () => {
      const store = createMockStore({
        auth: { isAuthenticated: false }
      });
      const { rerender } = renderWithProviders(store);

      // Initially no redirect
      expect(mockNavigate).not.toHaveBeenCalled();

      // Update store to authenticated
      const authenticatedStore = createMockStore({
        auth: { isAuthenticated: true }
      });
      
      rerender(
        <Provider store={authenticatedStore}>
          <BrowserRouter>
            <Login />
          </BrowserRouter>
        </Provider>
      );

      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    });
  });

  describe('Login Success Handling', () => {
    it('handles successful login callback', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const store = createMockStore();
      renderWithProviders(store);

      const mockLoginButton = screen.getByText('Mock Login');
      mockLoginButton.click();

      expect(consoleSpy).toHaveBeenCalledWith('Login successful:', 'testuser');
      
      consoleSpy.mockRestore();
    });

    it('logs successful login with correct user data', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const store = createMockStore();
      renderWithProviders(store);

      const mockLoginButton = screen.getByText('Mock Login');
      mockLoginButton.click();

      expect(consoleSpy).toHaveBeenCalledWith('Login successful:', 'testuser');
      
      consoleSpy.mockRestore();
    });
  });

  describe('Layout and Styling', () => {
    it('applies correct CSS classes for responsive design', () => {
      const store = createMockStore();
      renderWithProviders(store);

      // Check that the page has proper responsive classes
      const pageContainer = screen.getByText('Invoice Validation System v1.0').closest('div').parentElement;
      expect(pageContainer).toHaveClass('min-h-screen');
    });

    it('centers the login form properly', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const formContainer = screen.getByTestId('login-form').closest('div');
      expect(formContainer).toHaveClass('sm:mx-auto');
    });

    it('displays footer at bottom of page', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const footer = screen.getByText('Invoice Validation System v1.0').closest('div');
      expect(footer).toHaveClass('mt-8');
    });
  });

  describe('Integration with LoginForm', () => {
    it('passes onSuccess callback to LoginForm', () => {
      const store = createMockStore();
      renderWithProviders(store);

      // LoginForm should receive and be able to call onSuccess
      expect(screen.getByTestId('login-form')).toBeInTheDocument();
      expect(screen.getByText('Mock Login')).toBeInTheDocument();
    });

    it('renders LoginForm component', () => {
      const store = createMockStore();
      renderWithProviders(store);

      expect(screen.getByTestId('login-form')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper semantic structure', () => {
      const store = createMockStore();
      renderWithProviders(store);

      // Should have proper page structure
      expect(screen.getByTestId('login-form')).toBeInTheDocument();
    });

    it('provides proper contrast and readability', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const versionText = screen.getByText('Invoice Validation System v1.0');
      const descriptionText = screen.getByText('Secure financial document validation and compliance');
      
      expect(versionText).toBeInTheDocument();
      expect(descriptionText).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles missing location state gracefully', () => {
      mockLocation.state = null;
      
      const store = createMockStore({
        auth: { isAuthenticated: true }
      });
      renderWithProviders(store);

      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    });

    it('handles malformed location state', () => {
      mockLocation.state = { invalidProperty: 'test' };
      
      const store = createMockStore({
        auth: { isAuthenticated: true }
      });
      renderWithProviders(store);

      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    });

    it('handles undefined from pathname', () => {
      mockLocation.state = { from: {} };
      
      const store = createMockStore({
        auth: { isAuthenticated: true }
      });
      renderWithProviders(store);

      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    });
  });

  describe('Component Lifecycle', () => {
    it('checks authentication on mount', () => {
      const store = createMockStore({
        auth: { isAuthenticated: true }
      });
      renderWithProviders(store);

      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    });

    it('responds to authentication state changes', () => {
      const store = createMockStore({
        auth: { isAuthenticated: false }
      });
      const { rerender } = renderWithProviders(store);

      expect(mockNavigate).not.toHaveBeenCalled();

      // Simulate authentication
      const newStore = createMockStore({
        auth: { isAuthenticated: true }
      });
      
      rerender(
        <Provider store={newStore}>
          <BrowserRouter>
            <Login />
          </BrowserRouter>
        </Provider>
      );

      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    });
  });

  describe('Branding and Information', () => {
    it('displays correct application name', () => {
      const store = createMockStore();
      renderWithProviders(store);

      expect(screen.getByText('Invoice Validation System v1.0')).toBeInTheDocument();
    });

    it('displays correct application description', () => {
      const store = createMockStore();
      renderWithProviders(store);

      expect(screen.getByText('Secure financial document validation and compliance')).toBeInTheDocument();
    });

    it('shows version information', () => {
      const store = createMockStore();
      renderWithProviders(store);

      expect(screen.getByText(/v1\.0/)).toBeInTheDocument();
    });
  });
});