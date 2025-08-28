/**
 * Unit tests for authSlice Redux slice
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import authReducer, {
  loginUser,
  logoutUser,
  initializeAuth,
  refreshPermissions,
  clearError,
  clearAuth,
  updateUserPreferences,
  setLoading,
  selectAuth,
  selectUser,
  selectIsAuthenticated,
  selectPermissions,
  selectHasPermission
} from '../authSlice.js';
import AuthService from '../../../services/AuthService.js';

// Mock AuthService
vi.mock('../../../services/AuthService.js', () => ({
  default: {
    login: vi.fn(),
    logout: vi.fn(),
    getCurrentUser: vi.fn(),
    getUserPermissions: vi.fn(),
    hasPermission: vi.fn(),
    hasAnyPermission: vi.fn(),
    hasAllPermissions: vi.fn(),
    hasRole: vi.fn(),
    hasAnyRole: vi.fn(),
    canAccessRoute: vi.fn()
  }
}));

describe('authSlice', () => {
  let store;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        auth: authReducer
      }
    });
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    test('should have correct initial state', () => {
      const state = store.getState().auth;
      
      expect(state).toEqual({
        user: null,
        permissions: [],
        isAuthenticated: false,
        isLoading: false,
        error: null,
        token: null,
        tokenExpiry: null,
        isInitialized: false
      });
    });
  });

  describe('synchronous actions', () => {
    test('should clear error', () => {
      // Set an error first
      store.dispatch({ type: 'auth/loginUser/rejected', payload: 'Test error' });
      expect(store.getState().auth.error).toBe('Test error');
      
      // Clear error
      store.dispatch(clearError());
      expect(store.getState().auth.error).toBeNull();
    });

    test('should clear auth state', () => {
      // Set some auth state first
      store.dispatch({
        type: 'auth/loginUser/fulfilled',
        payload: {
          user: { id: 1, username: 'test' },
          permissions: ['read'],
          token: 'test-token',
          expiresIn: 3600
        }
      });
      
      expect(store.getState().auth.isAuthenticated).toBe(true);
      
      // Clear auth
      store.dispatch(clearAuth());
      const state = store.getState().auth;
      
      expect(state.user).toBeNull();
      expect(state.permissions).toEqual([]);
      expect(state.isAuthenticated).toBe(false);
      expect(state.token).toBeNull();
      expect(state.tokenExpiry).toBeNull();
      expect(state.error).toBeNull();
    });

    test('should update user preferences', () => {
      // Set user first
      store.dispatch({
        type: 'auth/loginUser/fulfilled',
        payload: {
          user: { id: 1, username: 'test', preferences: { theme: 'light' } },
          permissions: [],
          token: 'test-token',
          expiresIn: 3600
        }
      });
      
      // Update preferences
      store.dispatch(updateUserPreferences({ theme: 'dark', language: 'en' }));
      
      const user = store.getState().auth.user;
      expect(user.preferences).toEqual({
        theme: 'dark',
        language: 'en'
      });
    });

    test('should set loading state', () => {
      store.dispatch(setLoading(true));
      expect(store.getState().auth.isLoading).toBe(true);
      
      store.dispatch(setLoading(false));
      expect(store.getState().auth.isLoading).toBe(false);
    });
  });

  describe('loginUser async thunk', () => {
    test('should handle successful login', async () => {
      const mockResponse = {
        user: { id: 1, username: 'testuser', email: 'test@example.com' },
        permissions: ['read', 'write'],
        token: 'mock-jwt-token',
        expiresIn: 3600
      };
      
      AuthService.login.mockResolvedValue(mockResponse);
      
      const credentials = { username: 'testuser', password: 'password' };
      await store.dispatch(loginUser(credentials));
      
      const state = store.getState().auth;
      
      expect(AuthService.login).toHaveBeenCalledWith(credentials);
      expect(state.isLoading).toBe(false);
      expect(state.user).toEqual(mockResponse.user);
      expect(state.permissions).toEqual(mockResponse.permissions);
      expect(state.isAuthenticated).toBe(true);
      expect(state.token).toBe(mockResponse.token);
      expect(state.tokenExpiry).toBeGreaterThan(Date.now());
      expect(state.error).toBeNull();
    });

    test('should handle login failure', async () => {
      const errorMessage = 'Invalid credentials';
      AuthService.login.mockRejectedValue(new Error(errorMessage));
      
      const credentials = { username: 'testuser', password: 'wrongpassword' };
      await store.dispatch(loginUser(credentials));
      
      const state = store.getState().auth;
      
      expect(state.isLoading).toBe(false);
      expect(state.user).toBeNull();
      expect(state.permissions).toEqual([]);
      expect(state.isAuthenticated).toBe(false);
      expect(state.token).toBeNull();
      expect(state.tokenExpiry).toBeNull();
      expect(state.error).toBe(errorMessage);
    });

    test('should set loading state during login', () => {
      AuthService.login.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      store.dispatch(loginUser({ username: 'test', password: 'test' }));
      
      expect(store.getState().auth.isLoading).toBe(true);
    });
  });

  describe('logoutUser async thunk', () => {
    test('should handle successful logout', async () => {
      // Set authenticated state first
      store.dispatch({
        type: 'auth/loginUser/fulfilled',
        payload: {
          user: { id: 1, username: 'test' },
          permissions: ['read'],
          token: 'test-token',
          expiresIn: 3600
        }
      });
      
      AuthService.logout.mockResolvedValue();
      
      await store.dispatch(logoutUser());
      
      const state = store.getState().auth;
      
      expect(AuthService.logout).toHaveBeenCalled();
      expect(state.isLoading).toBe(false);
      expect(state.user).toBeNull();
      expect(state.permissions).toEqual([]);
      expect(state.isAuthenticated).toBe(false);
      expect(state.token).toBeNull();
      expect(state.tokenExpiry).toBeNull();
      expect(state.error).toBeNull();
    });

    test('should clear auth state even if logout fails', async () => {
      // Set authenticated state first
      store.dispatch({
        type: 'auth/loginUser/fulfilled',
        payload: {
          user: { id: 1, username: 'test' },
          permissions: ['read'],
          token: 'test-token',
          expiresIn: 3600
        }
      });
      
      const errorMessage = 'Logout failed';
      AuthService.logout.mockRejectedValue(new Error(errorMessage));
      
      await store.dispatch(logoutUser());
      
      const state = store.getState().auth;
      
      expect(state.isLoading).toBe(false);
      expect(state.user).toBeNull();
      expect(state.permissions).toEqual([]);
      expect(state.isAuthenticated).toBe(false);
      expect(state.token).toBeNull();
      expect(state.tokenExpiry).toBeNull();
      expect(state.error).toBe(errorMessage);
    });
  });

  describe('initializeAuth async thunk', () => {
    test('should initialize with existing user', async () => {
      const mockUser = { id: 1, username: 'test' };
      const mockPermissions = ['read', 'write'];
      
      AuthService.getCurrentUser.mockReturnValue(mockUser);
      AuthService.getUserPermissions.mockReturnValue(mockPermissions);
      
      await store.dispatch(initializeAuth());
      
      const state = store.getState().auth;
      
      expect(AuthService.getCurrentUser).toHaveBeenCalled();
      expect(AuthService.getUserPermissions).toHaveBeenCalledWith(mockUser);
      expect(state.isLoading).toBe(false);
      expect(state.isInitialized).toBe(true);
      expect(state.user).toEqual(mockUser);
      expect(state.permissions).toEqual(mockPermissions);
      expect(state.isAuthenticated).toBe(true);
    });

    test('should initialize with no user', async () => {
      AuthService.getCurrentUser.mockReturnValue(null);
      
      await store.dispatch(initializeAuth());
      
      const state = store.getState().auth;
      
      expect(state.isLoading).toBe(false);
      expect(state.isInitialized).toBe(true);
      expect(state.user).toBeNull();
      expect(state.permissions).toEqual([]);
      expect(state.isAuthenticated).toBe(false);
    });

    test('should handle initialization error', async () => {
      const errorMessage = 'Initialization failed';
      AuthService.getCurrentUser.mockImplementation(() => {
        throw new Error(errorMessage);
      });
      
      await store.dispatch(initializeAuth());
      
      const state = store.getState().auth;
      
      expect(state.isLoading).toBe(false);
      expect(state.isInitialized).toBe(true);
      expect(state.error).toBe(errorMessage);
      expect(state.user).toBeNull();
      expect(state.permissions).toEqual([]);
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('refreshPermissions async thunk', () => {
    test('should refresh permissions for authenticated user', async () => {
      const mockUser = { id: 1, username: 'test' };
      const newPermissions = ['read', 'write', 'admin'];
      
      // Set authenticated state first
      store.dispatch({
        type: 'auth/loginUser/fulfilled',
        payload: {
          user: mockUser,
          permissions: ['read'],
          token: 'test-token',
          expiresIn: 3600
        }
      });
      
      AuthService.getUserPermissions.mockReturnValue(newPermissions);
      
      await store.dispatch(refreshPermissions());
      
      const state = store.getState().auth;
      
      expect(AuthService.getUserPermissions).toHaveBeenCalledWith(mockUser);
      expect(state.permissions).toEqual(newPermissions);
    });

    test('should return empty permissions for unauthenticated user', async () => {
      await store.dispatch(refreshPermissions());
      
      const state = store.getState().auth;
      
      expect(state.permissions).toEqual([]);
    });
  });

  describe('selectors', () => {
    beforeEach(() => {
      store.dispatch({
        type: 'auth/loginUser/fulfilled',
        payload: {
          user: { id: 1, username: 'testuser', role: 'admin' },
          permissions: ['read', 'write', 'delete'],
          token: 'test-token',
          expiresIn: 3600
        }
      });
    });

    test('selectAuth should return auth state', () => {
      const auth = selectAuth(store.getState());
      expect(auth).toEqual(store.getState().auth);
    });

    test('selectUser should return user', () => {
      const user = selectUser(store.getState());
      expect(user).toEqual({ id: 1, username: 'testuser', role: 'admin' });
    });

    test('selectIsAuthenticated should return authentication status', () => {
      const isAuthenticated = selectIsAuthenticated(store.getState());
      expect(isAuthenticated).toBe(true);
    });

    test('selectPermissions should return permissions', () => {
      const permissions = selectPermissions(store.getState());
      expect(permissions).toEqual(['read', 'write', 'delete']);
    });

    test('selectHasPermission should check specific permission', () => {
      AuthService.hasPermission.mockReturnValue(true);
      
      const hasPermission = selectHasPermission('read')(store.getState());
      
      expect(AuthService.hasPermission).toHaveBeenCalledWith(
        { id: 1, username: 'testuser', role: 'admin' },
        'read'
      );
      expect(hasPermission).toBe(true);
    });
  });
});