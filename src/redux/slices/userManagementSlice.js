import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import UserManagementService from '../../services/UserManagementService.js';

/**
 * User Management Redux Slice
 * 
 * Manages user administration, role assignments, permissions, and audit logging
 * for the Invoice Validation System.
 */

// Async thunks for user management operations

/**
 * Fetch all users with their roles and permissions
 */
export const fetchUsers = createAsyncThunk(
  'userManagement/fetchUsers',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const response = await UserManagementService.getUsers(filters);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Create a new user
 */
export const createUser = createAsyncThunk(
  'userManagement/createUser',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await UserManagementService.createUser(userData);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Update user information
 */
export const updateUser = createAsyncThunk(
  'userManagement/updateUser',
  async ({ userId, userData }, { rejectWithValue }) => {
    try {
      const response = await UserManagementService.updateUser(userId, userData);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Delete a user
 */
export const deleteUser = createAsyncThunk(
  'userManagement/deleteUser',
  async (userId, { rejectWithValue }) => {
    try {
      await UserManagementService.deleteUser(userId);
      return userId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Update user role
 */
export const updateUserRole = createAsyncThunk(
  'userManagement/updateUserRole',
  async ({ userId, role }, { rejectWithValue }) => {
    try {
      const response = await UserManagementService.updateUserRole(userId, role);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Update user permissions
 */
export const updateUserPermissions = createAsyncThunk(
  'userManagement/updateUserPermissions',
  async ({ userId, permissions }, { rejectWithValue }) => {
    try {
      const response = await UserManagementService.updateUserPermissions(userId, permissions);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Fetch user activity logs
 */
export const fetchUserActivity = createAsyncThunk(
  'userManagement/fetchUserActivity',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const response = await UserManagementService.getUserActivity(filters);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Fetch active user sessions
 */
export const fetchActiveSessions = createAsyncThunk(
  'userManagement/fetchActiveSessions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await UserManagementService.getActiveSessions();
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Terminate user session
 */
export const terminateSession = createAsyncThunk(
  'userManagement/terminateSession',
  async (sessionId, { rejectWithValue }) => {
    try {
      await UserManagementService.terminateSession(sessionId);
      return sessionId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Test user permissions
 */
export const testUserPermissions = createAsyncThunk(
  'userManagement/testUserPermissions',
  async ({ userId, permissions }, { rejectWithValue }) => {
    try {
      const response = await UserManagementService.testPermissions(userId, permissions);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Initial state
const initialState = {
  users: [],
  selectedUser: null,
  userActivity: [],
  activeSessions: [],
  permissionTestResults: null,
  filters: {
    search: '',
    role: '',
    status: '',
    sortBy: 'name',
    sortOrder: 'asc'
  },
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  },
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  error: null,
  successMessage: null
};

// User Management slice
const userManagementSlice = createSlice({
  name: 'userManagement',
  initialState,
  reducers: {
    // Clear error and success messages
    clearMessages: (state) => {
      state.error = null;
      state.successMessage = null;
    },
    
    // Set selected user
    setSelectedUser: (state, action) => {
      state.selectedUser = action.payload;
    },
    
    // Clear selected user
    clearSelectedUser: (state) => {
      state.selectedUser = null;
    },
    
    // Update filters
    updateFilters: (state, action) => {
      state.filters = {
        ...state.filters,
        ...action.payload
      };
    },
    
    // Update pagination
    updatePagination: (state, action) => {
      state.pagination = {
        ...state.pagination,
        ...action.payload
      };
    },
    
    // Clear permission test results
    clearPermissionTestResults: (state) => {
      state.permissionTestResults = null;
    },
    
    // Set success message
    setSuccessMessage: (state, action) => {
      state.successMessage = action.payload;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch users
      .addCase(fetchUsers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.users = action.payload.users;
        state.pagination = {
          ...state.pagination,
          total: action.payload.total,
          totalPages: action.payload.totalPages
        };
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Create user
      .addCase(createUser.pending, (state) => {
        state.isCreating = true;
        state.error = null;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.isCreating = false;
        state.users.push(action.payload);
        state.successMessage = 'User created successfully';
      })
      .addCase(createUser.rejected, (state, action) => {
        state.isCreating = false;
        state.error = action.payload;
      })
      
      // Update user
      .addCase(updateUser.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.isUpdating = false;
        const index = state.users.findIndex(user => user.id === action.payload.id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
        if (state.selectedUser && state.selectedUser.id === action.payload.id) {
          state.selectedUser = action.payload;
        }
        state.successMessage = 'User updated successfully';
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload;
      })
      
      // Delete user
      .addCase(deleteUser.pending, (state) => {
        state.isDeleting = true;
        state.error = null;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.isDeleting = false;
        state.users = state.users.filter(user => user.id !== action.payload);
        if (state.selectedUser && state.selectedUser.id === action.payload) {
          state.selectedUser = null;
        }
        state.successMessage = 'User deleted successfully';
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.isDeleting = false;
        state.error = action.payload;
      })
      
      // Update user role
      .addCase(updateUserRole.fulfilled, (state, action) => {
        const index = state.users.findIndex(user => user.id === action.payload.id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
        if (state.selectedUser && state.selectedUser.id === action.payload.id) {
          state.selectedUser = action.payload;
        }
        state.successMessage = 'User role updated successfully';
      })
      .addCase(updateUserRole.rejected, (state, action) => {
        state.error = action.payload;
      })
      
      // Update user permissions
      .addCase(updateUserPermissions.fulfilled, (state, action) => {
        const index = state.users.findIndex(user => user.id === action.payload.id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
        if (state.selectedUser && state.selectedUser.id === action.payload.id) {
          state.selectedUser = action.payload;
        }
        state.successMessage = 'User permissions updated successfully';
      })
      .addCase(updateUserPermissions.rejected, (state, action) => {
        state.error = action.payload;
      })
      
      // Fetch user activity
      .addCase(fetchUserActivity.fulfilled, (state, action) => {
        state.userActivity = action.payload;
      })
      .addCase(fetchUserActivity.rejected, (state, action) => {
        state.error = action.payload;
      })
      
      // Fetch active sessions
      .addCase(fetchActiveSessions.fulfilled, (state, action) => {
        state.activeSessions = action.payload;
      })
      .addCase(fetchActiveSessions.rejected, (state, action) => {
        state.error = action.payload;
      })
      
      // Terminate session
      .addCase(terminateSession.fulfilled, (state, action) => {
        state.activeSessions = state.activeSessions.filter(
          session => session.id !== action.payload
        );
        state.successMessage = 'Session terminated successfully';
      })
      .addCase(terminateSession.rejected, (state, action) => {
        state.error = action.payload;
      })
      
      // Test user permissions
      .addCase(testUserPermissions.fulfilled, (state, action) => {
        state.permissionTestResults = action.payload;
      })
      .addCase(testUserPermissions.rejected, (state, action) => {
        state.error = action.payload;
      });
  }
});

// Export actions
export const {
  clearMessages,
  setSelectedUser,
  clearSelectedUser,
  updateFilters,
  updatePagination,
  clearPermissionTestResults,
  setSuccessMessage
} = userManagementSlice.actions;

// Selectors
export const selectUserManagement = (state) => state.userManagement;
export const selectUsers = (state) => state.userManagement.users;
export const selectSelectedUser = (state) => state.userManagement.selectedUser;
export const selectUserActivity = (state) => state.userManagement.userActivity;
export const selectActiveSessions = (state) => state.userManagement.activeSessions;
export const selectPermissionTestResults = (state) => state.userManagement.permissionTestResults;
export const selectFilters = (state) => state.userManagement.filters;
export const selectPagination = (state) => state.userManagement.pagination;
export const selectIsLoading = (state) => state.userManagement.isLoading;
export const selectIsCreating = (state) => state.userManagement.isCreating;
export const selectIsUpdating = (state) => state.userManagement.isUpdating;
export const selectIsDeleting = (state) => state.userManagement.isDeleting;
export const selectError = (state) => state.userManagement.error;
export const selectSuccessMessage = (state) => state.userManagement.successMessage;

// Export reducer
export default userManagementSlice.reducer;