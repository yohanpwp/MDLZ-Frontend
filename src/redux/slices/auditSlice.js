import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AuditService from '../../services/AuditService.js';

/**
 * Audit Redux Slice
 * 
 * Manages audit logging, compliance features, and audit trail display
 * for the Invoice Validation System.
 */

// Async thunks for audit operations

/**
 * Fetch audit logs with filtering
 */
export const fetchAuditLogs = createAsyncThunk(
  'audit/fetchAuditLogs',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const response = AuditService.getAuditLogs(filters);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Log an audit event
 */
export const logAuditEvent = createAsyncThunk(
  'audit/logAuditEvent',
  async (eventData, { rejectWithValue }) => {
    try {
      await AuditService.logEvent(eventData);
      return eventData;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Export audit logs
 */
export const exportAuditLogs = createAsyncThunk(
  'audit/exportAuditLogs',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const blob = await AuditService.exportAuditLogs(filters);
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      return { success: true, message: 'Audit logs exported successfully' };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Get audit statistics
 */
export const fetchAuditStatistics = createAsyncThunk(
  'audit/fetchAuditStatistics',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const stats = AuditService.getAuditStatistics(filters);
      return stats;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Initial state
const initialState = {
  logs: [],
  statistics: {
    totalEvents: 0,
    eventsByModule: {},
    eventsByAction: {},
    eventsBySeverity: {},
    eventsLast24Hours: 0,
    eventsLast7Days: 0,
    eventsLast30Days: 0
  },
  filters: {
    userId: '',
    action: '',
    module: '',
    severity: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 100
  },
  pagination: {
    page: 1,
    limit: 100,
    total: 0,
    totalPages: 0
  },
  isLoading: false,
  isExporting: false,
  error: null,
  successMessage: null
};

// Audit slice
const auditSlice = createSlice({
  name: 'audit',
  initialState,
  reducers: {
    // Clear error and success messages
    clearMessages: (state) => {
      state.error = null;
      state.successMessage = null;
    },
    
    // Update filters
    updateFilters: (state, action) => {
      state.filters = {
        ...state.filters,
        ...action.payload
      };
    },
    
    // Reset filters
    resetFilters: (state) => {
      state.filters = {
        userId: '',
        action: '',
        module: '',
        severity: '',
        startDate: '',
        endDate: '',
        page: 1,
        limit: 100
      };
    },
    
    // Update pagination
    updatePagination: (state, action) => {
      state.pagination = {
        ...state.pagination,
        ...action.payload
      };
    },
    
    // Set success message
    setSuccessMessage: (state, action) => {
      state.successMessage = action.payload;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch audit logs
      .addCase(fetchAuditLogs.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAuditLogs.fulfilled, (state, action) => {
        state.isLoading = false;
        state.logs = action.payload.logs;
        state.pagination = {
          ...state.pagination,
          total: action.payload.total,
          totalPages: action.payload.totalPages
        };
      })
      .addCase(fetchAuditLogs.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Log audit event
      .addCase(logAuditEvent.fulfilled, (state, action) => {
        // Optionally add the new event to the beginning of the logs array
        // if we want real-time updates
        state.logs.unshift({
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          ...action.payload
        });
      })
      .addCase(logAuditEvent.rejected, (state, action) => {
        state.error = action.payload;
      })
      
      // Export audit logs
      .addCase(exportAuditLogs.pending, (state) => {
        state.isExporting = true;
        state.error = null;
      })
      .addCase(exportAuditLogs.fulfilled, (state, action) => {
        state.isExporting = false;
        state.successMessage = action.payload.message;
      })
      .addCase(exportAuditLogs.rejected, (state, action) => {
        state.isExporting = false;
        state.error = action.payload;
      })
      
      // Fetch audit statistics
      .addCase(fetchAuditStatistics.fulfilled, (state, action) => {
        state.statistics = action.payload;
      })
      .addCase(fetchAuditStatistics.rejected, (state, action) => {
        state.error = action.payload;
      });
  }
});

// Export actions
export const {
  clearMessages,
  updateFilters,
  resetFilters,
  updatePagination,
  setSuccessMessage
} = auditSlice.actions;

// Selectors
export const selectAudit = (state) => state.audit;
export const selectAuditLogs = (state) => state.audit.logs;
export const selectAuditStatistics = (state) => state.audit.statistics;
export const selectAuditFilters = (state) => state.audit.filters;
export const selectAuditPagination = (state) => state.audit.pagination;
export const selectIsLoading = (state) => state.audit.isLoading;
export const selectIsExporting = (state) => state.audit.isExporting;
export const selectError = (state) => state.audit.error;
export const selectSuccessMessage = (state) => state.audit.successMessage;

// Export reducer
export default auditSlice.reducer;