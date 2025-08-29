/**
 * LoginForm Component Tests
 * 
 * Tests for the LoginForm component including authentication,
 * validation, demo accounts, and error handling.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { vi } from 'vitest';
import LoginForm from '../../components/auth/LoginForm';

// Mock UI components
vi.mock('../../components/ui/Button', () => ({
  default: ({ children, onClick, variant, disabled, className, type, ...props }) => (
    <button 
      onClick={onClick} 
      data-variant={variant} 
      disabled={disabled}
      className={className}
      type={type}
      {...props}
    >
      {children}
    </button>
  )
}));

vi.mock('../../components/ui/LoadingSpinner', () => ({
  default: ({ size, className, text }) => (
    <div data-testid="loading-spinner" data-size={size} className={className}>
      {text}
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
const mockLoginUser = vi.fn();
const mockClearError = vi.fn();

vi.mock('../../redux/slices/authSlice.js', () => ({
  loginUser: () => mockLoginUser(),
  clearError: () => mockClearError(),
  selectIsLoading: (state) => state.auth.isLoading,
  selectError: (state) => state.auth.error
}));

describe('LoginForm Component', () => {
  const createMockStore = (initialState = {}) => {
    return configureStore({
      reducer: {
        auth: (state = {
          isLoading: false,
          error: null,
          user: null,
          isAuthenticated: false,
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
          <LoginForm {...props} />
        </BrowserRouter>
      </Provider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    mockLoginUser.mockReturnValue({
      unwrap: vi.fn().mockResolvedValue({ user: { username: 'testuser' } })
    });
  });

  describe('Rendering', () => {
    it('renders the login form correctly', () => {
      const store = createMockStore();
      renderWithProviders(store);

      expect(screen.getByText('Invoice Validation System')).toBeInTheDocument();
      expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
      expect(screen.getByLabelText('Username or Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      expect(screen.getByText('Sign In')).toBeInTheDocument();
    });

    it('shows demo accounts section', () => {
      const store = createMockStore();
      renderWithProviders(store);

      expect(screen.getByText('Demo Accounts (Development Only)')).toBeInTheDocument();
      expect(screen.getByText('Admin')).toBeInTheDocument();
      expect(screen.getByText('Fin Admin')).toBeInTheDocument();
      expect(screen.getByText('Auditor')).toBeInTheDocument();
      expect(screen.getByText('Manager')).toBeInTheDocument();
    });

    it('shows remember me checkbox', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const rememberMeCheckbox = screen.getByLabelText('Remember me');
      expect(rememberMeCheckbox).toBeInTheDocument();
      expect(rememberMeCheckbox).not.toBeChecked();
    });
  });

  describe('Form Validation', () => {
    it('validates required username field', async () => {
      const store = createMockStore();
      renderWithProviders(store);

      const submitButton = screen.getByText('Sign In');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Username or email is required')).toBeInTheDocument();
      });
    });

    it('validates required password field', async () => {
      const store = createMockStore();
      renderWithProviders(store);

      const usernameInput = screen.getByLabelText('Username or Email');
      fireEvent.change(usernameInput, { target: { value: 'testuser' } });

      const submitButton = screen.getByText('Sign In');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Password is required')).toBeInTheDocument();
      });
    });

    it('validates minimum password length', async () => {
      const store = createMockStore();
      renderWithProviders(store);

      const usernameInput = screen.getByLabelText('Username or Email');
      const passwordInput = screen.getByLabelText('Password');

      fireEvent.change(usernameInput, { target: { value: 'testuser' } });
      fireEvent.change(passwordInput, { target: { value: '123' } });

      const submitButton = screen.getByText('Sign In');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument();
      });
    });

    it('clears validation errors when user starts typing', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const usernameInput = screen.getByLabelText('Username or Email');
      const submitButton = screen.getByText('Sign In');

      // Trigger validation error
      fireEvent.click(submitButton);
      expect(screen.getByText('Username or email is required')).toBeInTheDocument();

      // Start typing to clear error
      fireEvent.change(usernameInput, { target: { value: 'test' } });
      expect(screen.queryByText('Username or email is required')).not.toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('submits form with valid credentials', async () => {
      const store = createMockStore();
      const onSuccess = vi.fn();
      renderWithProviders(store, { onSuccess });

      const usernameInput = screen.getByLabelText('Username or Email');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByText('Sign In');

      fireEvent.change(usernameInput, { target: { value: 'testuser' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockLoginUser).toHaveBeenCalled();
      });

      expect(onSuccess).toHaveBeenCalledWith({ user: { username: 'testuser' } });
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    });

    it('includes remember me option in submission', async () => {
      const store = createMockStore();
      renderWithProviders(store);

      const usernameInput = screen.getByLabelText('Username or Email');
      const passwordInput = screen.getByLabelText('Password');
      const rememberMeCheckbox = screen.getByLabelText('Remember me');
      const submitButton = screen.getByText('Sign In');

      fireEvent.change(usernameInput, { target: { value: 'testuser' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(rememberMeCheckbox);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockLoginUser).toHaveBeenCalled();
      });
    });

    it('trims whitespace from username', async () => {
      const store = createMockStore();
      renderWithProviders(store);

      const usernameInput = screen.getByLabelText('Username or Email');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByText('Sign In');

      fireEvent.change(usernameInput, { target: { value: '  testuser  ' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockLoginUser).toHaveBeenCalled();
      });
    });

    it('navigates to intended destination after login', async () => {
      mockLocation.state = { from: { pathname: '/dashboard' } };
      
      const store = createMockStore();
      renderWithProviders(store);

      const usernameInput = screen.getByLabelText('Username or Email');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByText('Sign In');

      fireEvent.change(usernameInput, { target: { value: 'testuser' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
      });
    });
  });

  describe('Loading State', () => {
    it('shows loading state during authentication', () => {
      const store = createMockStore({
        auth: { isLoading: true }
      });
      renderWithProviders(store);

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.getByText('Signing in...')).toBeInTheDocument();
    });

    it('disables form inputs during loading', () => {
      const store = createMockStore({
        auth: { isLoading: true }
      });
      renderWithProviders(store);

      expect(screen.getByLabelText('Username or Email')).toBeDisabled();
      expect(screen.getByLabelText('Password')).toBeDisabled();
      expect(screen.getByLabelText('Remember me')).toBeDisabled();
      expect(screen.getByText('Signing in...')).toBeInTheDocument();
    });

    it('disables demo buttons during loading', () => {
      const store = createMockStore({
        auth: { isLoading: true }
      });
      renderWithProviders(store);

      expect(screen.getByText('Admin')).toBeDisabled();
      expect(screen.getByText('Fin Admin')).toBeDisabled();
      expect(screen.getByText('Auditor')).toBeDisabled();
      expect(screen.getByText('Manager')).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('displays authentication errors', () => {
      const store = createMockStore({
        auth: { error: 'Invalid credentials' }
      });
      renderWithProviders(store);

      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });

    it('clears error when user starts typing', () => {
      const store = createMockStore({
        auth: { error: 'Invalid credentials' }
      });
      renderWithProviders(store);

      const usernameInput = screen.getByLabelText('Username or Email');
      fireEvent.change(usernameInput, { target: { value: 'test' } });

      expect(mockClearError).toHaveBeenCalled();
    });

    it('handles login failure', async () => {
      mockLoginUser.mockReturnValue({
        unwrap: vi.fn().mockRejectedValue(new Error('Login failed'))
      });

      const store = createMockStore();
      renderWithProviders(store);

      const usernameInput = screen.getByLabelText('Username or Email');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByText('Sign In');

      fireEvent.change(usernameInput, { target: { value: 'testuser' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockLoginUser).toHaveBeenCalled();
      });

      // Should not navigate on failure
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('Demo Account Functionality', () => {
    it('populates form with admin demo credentials', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const adminButton = screen.getByText('Admin');
      fireEvent.click(adminButton);

      expect(screen.getByDisplayValue('admin')).toBeInTheDocument();
      expect(screen.getByDisplayValue('admin123')).toBeInTheDocument();
    });

    it('populates form with financial administrator demo credentials', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const finAdminButton = screen.getByText('Fin Admin');
      fireEvent.click(finAdminButton);

      expect(screen.getByDisplayValue('fin_admin')).toBeInTheDocument();
      expect(screen.getByDisplayValue('finadmin123')).toBeInTheDocument();
    });

    it('populates form with auditor demo credentials', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const auditorButton = screen.getByText('Auditor');
      fireEvent.click(auditorButton);

      expect(screen.getByDisplayValue('auditor')).toBeInTheDocument();
      expect(screen.getByDisplayValue('auditor123')).toBeInTheDocument();
    });

    it('populates form with manager demo credentials', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const managerButton = screen.getByText('Manager');
      fireEvent.click(managerButton);

      expect(screen.getByDisplayValue('manager')).toBeInTheDocument();
      expect(screen.getByDisplayValue('manager123')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels', () => {
      const store = createMockStore();
      renderWithProviders(store);

      expect(screen.getByLabelText('Username or Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      expect(screen.getByLabelText('Remember me')).toBeInTheDocument();
    });

    it('has proper input attributes', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const usernameInput = screen.getByLabelText('Username or Email');
      const passwordInput = screen.getByLabelText('Password');

      expect(usernameInput).toHaveAttribute('type', 'text');
      expect(usernameInput).toHaveAttribute('autoComplete', 'username');
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(passwordInput).toHaveAttribute('autoComplete', 'current-password');
    });

    it('has proper heading structure', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent('Invoice Validation System');
    });
  });
});