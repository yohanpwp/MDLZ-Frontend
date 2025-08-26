import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AuthService from '../../services/AuthService.js';

/**
 * Auth Redux Slice
 * 
 * Manages authentication state including user login, logout, and permission checking
 * for the Invoice Validation System.
 */

// Async thunks for authentication actions

/**
 * Login user with credentials
 */
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await AuthService.login(credentials);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Logout current user
 */
export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      await AuthService.logout();
      return null;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Initialize auth state from stored data
 */
export const initializeAuth = createAsyncThunk(
  'auth/initializeAuth',
  async (_, { rejectWithValue }) => {
    try {
      const user = AuthService.getCurrentUser();
      if (user) {
        const permissions = AuthService.getUserPermissions(user);
        return { user, permissions };
      }
      return null;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Refresh user permissions
 */
export const refreshPermissions = createAsyncThunk(
  'auth/refreshPermissions',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      if (auth.user) {
        const permissions = AuthService.getUserPermissions(auth.user);
        return permissions;
      }
      return [];
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Initial state
const initialState = {
  user: null,
  permissions: [],
  isAuthenticated: false,
  isLoading: false,
  error: null,
  token: null,
  tokenExpiry: null,
  isInitialized: false
};

// Auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Clear auth error
    clearError: (state) => {
      state.error = null;
    },
    
    // Clear auth state (for manual logout)
    clearAuth: (state) => {
      state.user = null;
      state.permissions = [];
      state.isAuthenticated = false;
      state.token = null;
      state.tokenExpiry = null;
      state.error = null;
    },
    
    // Update user preferences
    updateUserPreferences: (state, action) => {
      if (state.user) {
        state.user.preferences = {
          ...state.user.preferences,
          ...action.payload
        };
      }
    },
    
    // Set loading state
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Initialize auth
      .addCase(initializeAuth.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isInitialized = true;
        if (action.payload) {
          state.user = action.payload.user;
          state.permissions = action.payload.permissions;
          state.isAuthenticated = true;
        } else {
          state.user = null;
          state.permissions = [];
          state.isAuthenticated = false;
        }
      })
      .addCase(initializeAuth.rejected, (state, action) => {
        state.isLoading = false;
        state.isInitialized = true;
        state.error = action.payload;
        state.user = null;
        state.permissions = [];
        state.isAuthenticated = false;
      })
      
      // Login user
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.permissions = action.payload.permissions;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.tokenExpiry = Date.now() + (action.payload.expiresIn * 1000);
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.user = null;
        state.permissions = [];
        state.isAuthenticated = false;
        state.token = null;
        state.tokenExpiry = null;
      })
      
      // Logout user
      .addCase(logoutUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.permissions = [];
        state.isAuthenticated = false;
        state.token = null;
        state.tokenExpiry = null;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        // Still clear auth state even if logout fails
        state.user = null;
        state.permissions = [];
        state.isAuthenticated = false;
        state.token = null;
        state.tokenExpiry = null;
      })
      
      // Refresh permissions
      .addCase(refreshPermissions.fulfilled, (state, action) => {
        state.permissions = action.payload;
      })
      .addCase(refreshPermissions.rejected, (state, action) => {
        state.error = action.payload;
      });
  }
});

// Export actions
export const { 
  clearError, 
  clearAuth, 
  updateUserPreferences, 
  setLoading 
} = authSlice.actions;

// Selectors
export const selectAuth = (state) => state.auth;
export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectPermissions = (state) => state.auth.permissions;
export const selectIsLoading = (state) => state.auth.isLoading;
export const selectError = (state) => state.auth.error;
export const selectIsInitialized = (state) => state.auth.isInitialized;

// Permission selectors
export const selectHasPermission = (permission) => (state) => {
  const user = selectUser(state);
  return AuthService.hasPermission(user, permission);
};

export const selectHasAnyPermission = (permissions) => (state) => {
  const user = selectUser(state);
  return AuthService.hasAnyPermission(user, permissions);
};

export const selectHasAllPermissions = (permissions) => (state) => {
  const user = selectUser(state);
  return AuthService.hasAllPermissions(user, permissions);
};

export const selectHasRole = (role) => (state) => {
  const user = selectUser(state);
  return AuthService.hasRole(user, role);
};

export const selectHasAnyRole = (roles) => (state) => {
  const user = selectUser(state);
  return AuthService.hasAnyRole(user, roles);
};

export const selectCanAccessRoute = (routeConfig) => (state) => {
  const user = selectUser(state);
  return AuthService.canAccessRoute(user, routeConfig);
};

// Export reducer
export default authSlice.reducer;