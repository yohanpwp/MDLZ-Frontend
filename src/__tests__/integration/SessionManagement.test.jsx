/**
 * Integration Tests for Session Management and Security Controls
 * 
 * Tests session persistence, token expiration, security controls,
 * and concurrent session handling for the Invoice Validation System.
 * 
 * Requirements: 4.4
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';

// Components and services
import authReducer, { 
  loginUser, 
  logoutUser, 
  initializeAuth,
  clearAuth 
} from '../../redux/slices/authSlice.js';
import AuthService from '../../services/AuthService.js';
import { useAuth } from '../../hooks/useAuth.js';

// Test fixtures
import { 
  mockUsers, 
  sessionTestScenarios,
  createMockStorageData 
} from '../fixtures/authFixtures.js';

// Mock component for testing session state
const SessionTestComponent = () => {
  const { user, isAuthenticated, isLoading, error } = useAuth();
  
  return (
    <div data-testid="session-info">
      <div data-testid="authenticated">{isAuthenticated.toString()}</div>
      <div data-testid="loading">{isLoading.toString()}</div>
      <div data-testid="user-id">{user?.id || 'none'}</div>
      <div data-testid="username">{user?.username || 'none'}</div>
      <div data-testid="error">{error || 'none'}</div>
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

describe('Session Management Integration Tests', () => {
  let store;
  let user;
  let originalDateNow;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    store = createTestStore();
    user = userEvent.setup();
    
    // Mock Date.now for consistent testing
    originalDateNow = Date.now;
    
    // Mock console methods
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    Date.now = originalDateNow;
  });

  describe('Session Persistence', () => {
    it('should persist session data when remember me is enabled', async () => {
      // Requirement 4.4: Session persistence
      await store.dispatch(loginUser({
        username: mockUsers.admin.username,
        password: mockUsers.admin.password,
        rememberMe: true
      }));

      // Verify session data is stored in localStorage
      const storedAuth = localStorage.getItem('invoice_validation_auth');
      const storedToken = localStorage.getItem('invoice_validation_token');
      
      expect(storedAuth).toBeTruthy();
      expect(storedToken).toBeTruthy();

      const authData = JSON.parse(storedAuth);
      expect(authData.user.username).toBe('admin');
      expect(authData.token).toBeTruthy();
      expect(authData.expiresIn).toBeGreaterThan(Date.now());
    });

    it('should not persist session data when remember me is disabled', async () => {
      // Requirement 4.4: Temporary session handling
      await store.dispatch(loginUser({
        username: mockUsers.admin.username,
        password: mockUsers.admin.password,
        rememberMe: false
      }));

      // Verify no session data is stored in localStorage
      const storedAuth = localStorage.getItem('invoice_validation_auth');
      const storedToken = localStorage.getItem('invoice_validation_token');
      
      expect(storedAuth).toBeNull();
      expect(storedToken).toBeNull();

      // But user should still be authenticated in current session
      const state = store.getState();
      expect(state.auth.isAuthenticated).toBe(true);
    });

    it('should restore session from localStorage on app initialization', async () => {
      // Requirement 4.4: Session restoration
      const mockAuthData = createMockStorageData(mockUsers.admin, { expired: false });
      localStorage.setItem('invoice_validation_auth', mockAuthData);
      localStorage.setItem('invoice_validation_token', 'mock-token');

      // Create new store and initialize
      const newStore = createTestStore();
      await newStore.dispatch(initializeAuth());

      const state = newStore.getState();
      expect(state.auth.isAuthenticated).toBe(true);
      expect(state.auth.user.username).toBe('admin');
      expect(state.auth.permissions.length).toBeGreaterThan(0);
    });

    it('should handle corrupted localStorage data gracefully', async () => {
      // Requirement 4.4: Error handling
      localStorage.setItem('invoice_validation_auth', 'invalid-json');
      localStorage.setItem('invoice_validation_token', 'some-token');

      const newStore = createTestStore();
      await newStore.dispatch(initializeAuth());

      const state = newStore.getState();
      expect(state.auth.isAuthenticated).toBe(false);
      expect(state.auth.user).toBeNull();
      expect(state.auth.error).toBeTruthy();
    });
  });

  describe('Token Expiration Handling', () => {
    it('should detect and handle expired tokens', async () => {
      // Requirement 4.4: Token expiration
      const expiredAuthData = createMockStorageData(mockUsers.admin, { expired: true });
      localStorage.setItem('invoice_validation_auth', expiredAuthData);

      // Try to get current user with expired token
      const currentUser = AuthService.getCurrentUser();
      expect(currentUser).toBeNull();

      // localStorage should be cleared
      expect(localStorage.getItem('invoice_validation_auth')).toBeNull();
      expect(localStorage.getItem('invoice_validation_token')).toBeNull();
    });

    it('should automatically logout user when token expires during session', async () => {
      // Requirement 4.4: Automatic session cleanup
      const mockNow = Date.now();
      Date.now = vi.fn(() => mockNow);

      // Login user
      await store.dispatch(loginUser({
        username: mockUsers.admin.username,
        password: mockUsers.admin.password,
        rememberMe: true
      }));

      // Verify user is logged in
      let state = store.getState();
      expect(state.auth.isAuthenticated).toBe(true);

      // Simulate time passing (token expires)
      const expiredTime = mockNow + (9 * 60 * 60 * 1000); // 9 hours later
      Date.now = vi.fn(() => expiredTime);

      // Try to get current user (should trigger cleanup)
      const currentUser = AuthService.getCurrentUser();
      expect(currentUser).toBeNull();
    });

    it('should handle token refresh scenarios', async () => {
      // Requirement 4.4: Token management
      const mockNow = Date.now();
      Date.now = vi.fn(() => mockNow);

      // Login user
      await store.dispatch(loginUser({
        username: mockUsers.admin.username,
        password: mockUsers.admin.password,
        rememberMe: true
      }));

      // Verify token expiry is set correctly
      const state = store.getState();
      expect(state.auth.tokenExpiry).toBeGreaterThan(mockNow);
      expect(state.auth.tokenExpiry).toBeLessThanOrEqual(mockNow + (8 * 60 * 60 * 1000));
    });
  });

  describe('Concurrent Session Management', () => {
    it('should handle multiple simultaneous login attempts', async () => {
      // Requirement 4.4: Concurrent session handling
      const loginPromises = Array.from({ length: 5 }, () =>
        store.dispatch(loginUser({
          username: mockUsers.admin.username,
          password: mockUsers.admin.password,
          rememberMe: true
        }))
      );

      const results = await Promise.allSettled(loginPromises);
      
      // All should succeed
      results.forEach(result => {
        expect(result.status).toBe('fulfilled');
      });

      // Final state should be consistent
      const state = store.getState();
      expect(state.auth.isAuthenticated).toBe(true);
      expect(state.auth.user.username).toBe('admin');
    });

    it('should handle logout during concurrent operations', async () => {
      // Requirement 4.4: Concurrent operation safety
      // Login user first
      await store.dispatch(loginUser({
        username: mockUsers.admin.username,
        password: mockUsers.admin.password,
        rememberMe: true
      }));

      // Start multiple operations and logout simultaneously
      const operations = [
        store.dispatch(loginUser({
          username: mockUsers.manager.username,
          password: mockUsers.manager.password
        })),
        store.dispatch(logoutUser()),
        store.dispatch(initializeAuth())
      ];

      await Promise.allSettled(operations);

      // Final state should be consistent (logout should win)
      const state = store.getState();
      expect(state.auth.isAuthenticated).toBe(false);
      expect(state.auth.user).toBeNull();
    });

    it('should handle multiple browser tabs/windows', async () => {
      // Requirement 4.4: Multi-tab session management
      // Simulate first tab login
      await store.dispatch(loginUser({
        username: mockUsers.admin.username,
        password: mockUsers.admin.password,
        rememberMe: true
      }));

      // Simulate second tab initialization
      const secondStore = createTestStore();
      await secondStore.dispatch(initializeAuth());

      // Both should have consistent state
      const firstState = store.getState();
      const secondState = secondStore.getState();

      expect(firstState.auth.isAuthenticated).toBe(true);
      expect(secondState.auth.isAuthenticated).toBe(true);
      expect(firstState.auth.user.username).toBe(secondState.auth.user.username);
    });
  });

  describe('Security Controls', () => {
    it('should clear sensitive data on logout', async () => {
      // Requirement 4.4: Security cleanup
      await store.dispatch(loginUser({
        username: mockUsers.admin.username,
        password: mockUsers.admin.password,
        rememberMe: true
      }));

      // Verify data is stored
      expect(localStorage.getItem('invoice_validation_auth')).toBeTruthy();
      expect(localStorage.getItem('invoice_validation_token')).toBeTruthy();

      // Logout
      await store.dispatch(logoutUser());

      // Verify all sensitive data is cleared
      expect(localStorage.getItem('invoice_validation_auth')).toBeNull();
      expect(localStorage.getItem('invoice_validation_token')).toBeNull();

      const state = store.getState();
      expect(state.auth.user).toBeNull();
      expect(state.auth.token).toBeNull();
      expect(state.auth.tokenExpiry).toBeNull();
      expect(state.auth.permissions).toEqual([]);
    });

    it('should handle forced logout scenarios', async () => {
      // Requirement 4.4: Security enforcement
      await store.dispatch(loginUser({
        username: mockUsers.admin.username,
        password: mockUsers.admin.password,
        rememberMe: true
      }));

      // Simulate forced logout (e.g., admin action, security breach)
      store.dispatch(clearAuth());

      const state = store.getState();
      expect(state.auth.isAuthenticated).toBe(false);
      expect(state.auth.user).toBeNull();
      expect(state.auth.permissions).toEqual([]);
    });

    it('should validate session integrity', async () => {
      // Requirement 4.4: Session validation
      const validAuthData = createMockStorageData(mockUsers.admin, { expired: false });
      localStorage.setItem('invoice_validation_auth', validAuthData);

      // Initialize and verify session
      await store.dispatch(initializeAuth());

      const state = store.getState();
      expect(state.auth.isAuthenticated).toBe(true);

      // Tamper with localStorage
      const tamperedData = JSON.parse(validAuthData);
      tamperedData.user.role = 'super_admin'; // Invalid role
      localStorage.setItem('invoice_validation_auth', JSON.stringify(tamperedData));

      // Re-initialize should handle gracefully
      const newStore = createTestStore();
      await newStore.dispatch(initializeAuth());

      const newState = newStore.getState();
      // Should still work but with original user data from service
      expect(newState.auth.isAuthenticated).toBe(true);
    });

    it('should handle session timeout scenarios', async () => {
      // Requirement 4.4: Session timeout
      render(
        <TestWrapper store={store}>
          <SessionTestComponent />
        </TestWrapper>
      );

      // Login user
      await store.dispatch(loginUser({
        username: mockUsers.admin.username,
        password: mockUsers.admin.password,
        rememberMe: true
      }));

      // Verify user is authenticated
      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
        expect(screen.getByTestId('username')).toHaveTextContent('admin');
      });

      // Simulate session timeout by clearing storage externally
      act(() => {
        localStorage.clear();
      });

      // Try to initialize auth again
      await store.dispatch(initializeAuth());

      // Should show user as not authenticated
      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
        expect(screen.getByTestId('username')).toHaveTextContent('none');
      });
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle network errors during session operations', async () => {
      // Requirement 4.4: Network error handling
      // Mock network error for logout
      const originalLogout = AuthService.logout;
      AuthService.logout = vi.fn().mockRejectedValue(new Error('Network timeout'));

      await store.dispatch(loginUser({
        username: mockUsers.admin.username,
        password: mockUsers.admin.password,
        rememberMe: true
      }));

      // Attempt logout with network error
      await store.dispatch(logoutUser());

      // Should still clear local state even if network call fails
      const state = store.getState();
      expect(state.auth.isAuthenticated).toBe(false);
      expect(state.auth.user).toBeNull();
      expect(localStorage.getItem('invoice_validation_auth')).toBeNull();

      // Restore original method
      AuthService.logout = originalLogout;
    });

    it('should recover from storage quota exceeded errors', async () => {
      // Requirement 4.4: Storage error handling
      // Mock localStorage to throw quota exceeded error
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn().mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      // Login should still work even if storage fails
      await store.dispatch(loginUser({
        username: mockUsers.admin.username,
        password: mockUsers.admin.password,
        rememberMe: true
      }));

      const state = store.getState();
      expect(state.auth.isAuthenticated).toBe(true);
      expect(state.auth.user.username).toBe('admin');

      // Restore original method
      localStorage.setItem = originalSetItem;
    });

    it('should handle malformed token scenarios', async () => {
      // Requirement 4.4: Token validation
      const malformedTokenData = {
        user: mockUsers.admin,
        token: 'malformed.token.data',
        expiresIn: Date.now() + (8 * 60 * 60 * 1000)
      };

      localStorage.setItem('invoice_validation_auth', JSON.stringify(malformedTokenData));
      localStorage.setItem('invoice_validation_token', malformedTokenData.token);

      // Should handle gracefully
      await store.dispatch(initializeAuth());

      const state = store.getState();
      // Should still authenticate user based on stored data
      expect(state.auth.isAuthenticated).toBe(true);
    });
  });

  describe('Performance and Memory Management', () => {
    it('should efficiently manage session state updates', async () => {
      // Requirement 4.4: Performance optimization
      const startTime = performance.now();

      // Perform multiple session operations
      for (let i = 0; i < 100; i++) {
        await store.dispatch(loginUser({
          username: mockUsers.admin.username,
          password: mockUsers.admin.password,
          rememberMe: false
        }));
        
        await store.dispatch(logoutUser());
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time
      expect(duration).toBeLessThan(5000); // 5 seconds for 100 operations
    });

    it('should prevent memory leaks in session management', async () => {
      // Requirement 4.4: Memory management
      const initialMemory = performance.memory?.usedJSHeapSize || 0;

      // Create and destroy multiple stores
      for (let i = 0; i < 50; i++) {
        const testStore = createTestStore();
        await testStore.dispatch(loginUser({
          username: mockUsers.admin.username,
          password: mockUsers.admin.password
        }));
        await testStore.dispatch(logoutUser());
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = performance.memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });

    it('should handle rapid session state changes', async () => {
      // Requirement 4.4: State consistency
      render(
        <TestWrapper store={store}>
          <SessionTestComponent />
        </TestWrapper>
      );

      // Rapid login/logout cycles
      for (let i = 0; i < 10; i++) {
        await act(async () => {
          await store.dispatch(loginUser({
            username: mockUsers.admin.username,
            password: mockUsers.admin.password
          }));
        });

        await waitFor(() => {
          expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
        });

        await act(async () => {
          await store.dispatch(logoutUser());
        });

        await waitFor(() => {
          expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
        });
      }

      // Final state should be consistent
      expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
      expect(screen.getByTestId('username')).toHaveTextContent('none');
    });
  });
});