/**
 * Validation Redux Slice
 * 
 * Manages validation state including validation results, progress tracking,
 * discrepancy alerts, and validation summaries for the Invoice Validation System.
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ValidationEngine } from '../../services/ValidationEngine.js';
import { 
  createEmptyValidationSummary, 
  DEFAULT_VALIDATION_CONFIG,
  SEVERITY_LEVELS 
} from '../../types/validation.js';

// Create validation engine instance
const validationEngine = new ValidationEngine();

/**
 * Validate a single invoice record
 */
export const validateRecord = createAsyncThunk(
  'validation/validateRecord',
  async (record, { rejectWithValue }) => {
    try {
      const results = await validationEngine.validateRecord(record);
      return {
        recordId: record.id,
        results,
        validatedAt: new Date().toISOString()
      };
    } catch (error) {
      return rejectWithValue({
        message: error.message,
        recordId: record.id
      });
    }
  }
);

/**
 * Validate multiple records in batch
 */
export const validateBatch = createAsyncThunk(
  'validation/validateBatch',
  async ({ records, config }, { dispatch, rejectWithValue }) => {
    try {
      // Update validation config if provided
      if (config) {
        validationEngine.updateConfig(config);
      }

      // Create progress callback to dispatch progress updates
      const progressCallback = (progress) => {
        dispatch(updateValidationProgress(progress));
      };

      // Start batch validation
      const summary = await validationEngine.validateBatch(records, progressCallback);
      const results = validationEngine.getResults();

      return {
        summary,
        results,
        batchId: summary.batchId,
        validatedAt: new Date().toISOString()
      };
    } catch (error) {
      return rejectWithValue({
        message: error.message,
        code: error.code || 'VALIDATION_ERROR'
      });
    }
  }
);

/**
 * Re-validate specific records with updated configuration
 */
export const revalidateRecords = createAsyncThunk(
  'validation/revalidateRecords',
  async ({ recordIds, records, config }, { dispatch, rejectWithValue }) => {
    try {
      // Update validation config if provided
      if (config) {
        validationEngine.updateConfig(config);
      }

      // Filter records to re-validate
      const recordsToValidate = records.filter(record => recordIds.includes(record.id));
      
      if (recordsToValidate.length === 0) {
        throw new Error('No records found for re-validation');
      }

      // Clear previous results for these records
      dispatch(clearResultsForRecords(recordIds));

      // Validate each record individually
      const validationPromises = recordsToValidate.map(record => 
        dispatch(validateRecord(record)).unwrap()
      );

      const results = await Promise.all(validationPromises);

      return {
        recordIds,
        results,
        revalidatedAt: new Date().toISOString()
      };
    } catch (error) {
      return rejectWithValue({
        message: error.message,
        recordIds
      });
    }
  }
);

/**
 * Generate validation summary from current results
 */
export const generateValidationSummary = createAsyncThunk(
  'validation/generateValidationSummary',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { validation } = getState();
      const { results } = validation;

      // Calculate summary statistics
      const totalRecords = new Set(results.map(r => r.recordId)).size;
      const recordsWithDiscrepancies = new Set(
        results.filter(r => r.discrepancy > 0).map(r => r.recordId)
      ).size;

      const summary = {
        ...createEmptyValidationSummary(),
        totalRecords,
        validRecords: totalRecords - recordsWithDiscrepancies,
        invalidRecords: recordsWithDiscrepancies,
        totalDiscrepancies: results.length,
        criticalCount: results.filter(r => r.severity === SEVERITY_LEVELS.CRITICAL).length,
        highSeverityCount: results.filter(r => r.severity === SEVERITY_LEVELS.HIGH).length,
        mediumSeverityCount: results.filter(r => r.severity === SEVERITY_LEVELS.MEDIUM).length,
        lowSeverityCount: results.filter(r => r.severity === SEVERITY_LEVELS.LOW).length,
        totalDiscrepancyAmount: results.reduce((sum, r) => sum + (r.discrepancy || 0), 0),
        validationStartTime: validation.lastValidationTime || new Date().toISOString(),
        validationEndTime: new Date().toISOString(),
        batchId: validation.currentBatchId || 'manual'
      };

      // Calculate derived statistics
      if (summary.totalDiscrepancies > 0) {
        summary.averageDiscrepancyAmount = summary.totalDiscrepancyAmount / summary.totalDiscrepancies;
        summary.maxDiscrepancyAmount = Math.max(...results.map(r => r.discrepancy || 0));
      }

      return summary;
    } catch (error) {
      return rejectWithValue({
        message: error.message
      });
    }
  }
);

// Initial state
const initialState = {
  // Validation results
  results: [],
  summary: createEmptyValidationSummary(),
  
  // Validation progress
  isValidating: false,
  progress: null,
  currentBatchId: null,
  lastValidationTime: null,
  
  // Configuration
  config: DEFAULT_VALIDATION_CONFIG,
  
  // Alerts and notifications
  alerts: [],
  unacknowledgedAlerts: [],
  
  // Filtering and sorting
  filters: {
    severity: null,
    field: null,
    recordId: null,
    dateRange: null
  },
  sortBy: 'validatedAt',
  sortOrder: 'desc',
  
  // Statistics
  statistics: {
    totalValidations: 0,
    averageProcessingTime: 0,
    successRate: 0,
    mostCommonDiscrepancies: []
  },
  
  // Error state
  errors: [],
  validationErrors: []
};

// Validation slice
const validationSlice = createSlice({
  name: 'validation',
  initialState,
  reducers: {
    // Configuration management
    updateValidationConfig: (state, action) => {
      state.config = { ...state.config, ...action.payload };
    },
    
    resetValidationConfig: (state) => {
      state.config = DEFAULT_VALIDATION_CONFIG;
    },
    
    // Progress tracking
    updateValidationProgress: (state, action) => {
      state.progress = action.payload;
      if (action.payload.batchId) {
        state.currentBatchId = action.payload.batchId;
      }
    },
    
    clearValidationProgress: (state) => {
      state.progress = null;
      state.currentBatchId = null;
    },
    
    // Results management
    clearValidationResults: (state) => {
      state.results = [];
      state.summary = createEmptyValidationSummary();
      state.alerts = [];
      state.unacknowledgedAlerts = [];
    },
    
    clearResultsForRecords: (state, action) => {
      const recordIds = action.payload;
      state.results = state.results.filter(result => !recordIds.includes(result.recordId));
      
      // Remove alerts for these records
      state.alerts = state.alerts.filter(alert => !recordIds.includes(alert.recordId));
      state.unacknowledgedAlerts = state.unacknowledgedAlerts.filter(
        alert => !recordIds.includes(alert.recordId)
      );
    },
    
    removeValidationResult: (state, action) => {
      const resultId = action.payload;
      state.results = state.results.filter(result => result.id !== resultId);
    },
    
    // Alert management
    acknowledgeAlert: (state, action) => {
      const alertId = action.payload;
      const alert = state.alerts.find(a => a.id === alertId);
      if (alert) {
        alert.acknowledged = true;
        alert.acknowledgedAt = new Date().toISOString();
      }
      
      // Remove from unacknowledged alerts
      state.unacknowledgedAlerts = state.unacknowledgedAlerts.filter(a => a.id !== alertId);
    },
    
    acknowledgeAllAlerts: (state) => {
      const now = new Date().toISOString();
      state.alerts.forEach(alert => {
        if (!alert.acknowledged) {
          alert.acknowledged = true;
          alert.acknowledgedAt = now;
        }
      });
      state.unacknowledgedAlerts = [];
    },
    
    dismissAlert: (state, action) => {
      const alertId = action.payload;
      state.alerts = state.alerts.filter(a => a.id !== alertId);
      state.unacknowledgedAlerts = state.unacknowledgedAlerts.filter(a => a.id !== alertId);
    },
    
    // Filtering and sorting
    setValidationFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    
    clearValidationFilters: (state) => {
      state.filters = {
        severity: null,
        field: null,
        recordId: null,
        dateRange: null
      };
    },
    
    setValidationSort: (state, action) => {
      const { sortBy, sortOrder } = action.payload;
      state.sortBy = sortBy;
      state.sortOrder = sortOrder;
    },
    
    // Error management
    clearValidationErrors: (state) => {
      state.errors = [];
      state.validationErrors = [];
    },
    
    addValidationError: (state, action) => {
      state.validationErrors.push({
        id: Date.now(),
        ...action.payload,
        timestamp: new Date().toISOString()
      });
    }
  },
  
  extraReducers: (builder) => {
    builder
      // Validate single record
      .addCase(validateRecord.pending, (state, action) => {
        const recordId = action.meta.arg.id;
        // Mark this record as being validated
        state.validationErrors = state.validationErrors.filter(e => e.recordId !== recordId);
      })
      .addCase(validateRecord.fulfilled, (state, action) => {
        const { recordId, results, validatedAt } = action.payload;
        
        // Remove existing results for this record
        state.results = state.results.filter(r => r.recordId !== recordId);
        
        // Add new results
        const newResults = results.map(result => ({
          ...result,
          id: `${recordId}_${result.field}_${Date.now()}`,
          validatedAt
        }));
        
        state.results.push(...newResults);
        
        // Generate alerts for high severity discrepancies
        const highSeverityResults = newResults.filter(
          r => r.severity === SEVERITY_LEVELS.HIGH || r.severity === SEVERITY_LEVELS.CRITICAL
        );
        
        const newAlerts = highSeverityResults.map(result => ({
          id: `alert_${result.id}`,
          recordId: result.recordId,
          field: result.field,
          severity: result.severity,
          message: result.message,
          discrepancy: result.discrepancy,
          acknowledged: false,
          createdAt: validatedAt
        }));
        
        state.alerts.push(...newAlerts);
        state.unacknowledgedAlerts.push(...newAlerts);
        
        state.lastValidationTime = validatedAt;
      })
      .addCase(validateRecord.rejected, (state, action) => {
        const { recordId, message } = action.payload;
        state.validationErrors.push({
          id: Date.now(),
          type: 'record_validation',
          recordId,
          message,
          timestamp: new Date().toISOString()
        });
      })
      
      // Validate batch
      .addCase(validateBatch.pending, (state) => {
        state.isValidating = true;
        state.errors = [];
        state.validationErrors = [];
      })
      .addCase(validateBatch.fulfilled, (state, action) => {
        state.isValidating = false;
        const { summary, results, batchId, validatedAt } = action.payload;
        
        // Clear previous results
        state.results = [];
        state.alerts = [];
        state.unacknowledgedAlerts = [];
        
        // Add new results with IDs
        const newResults = results.map(result => ({
          ...result,
          id: `${result.recordId}_${result.field}_${Date.now()}`,
          validatedAt
        }));
        
        state.results = newResults;
        state.summary = summary;
        state.currentBatchId = batchId;
        state.lastValidationTime = validatedAt;
        
        // Generate alerts for high severity discrepancies
        const highSeverityResults = newResults.filter(
          r => r.severity === SEVERITY_LEVELS.HIGH || r.severity === SEVERITY_LEVELS.CRITICAL
        );
        
        const newAlerts = highSeverityResults.map(result => ({
          id: `alert_${result.id}`,
          recordId: result.recordId,
          field: result.field,
          severity: result.severity,
          message: result.message,
          discrepancy: result.discrepancy,
          acknowledged: false,
          createdAt: validatedAt
        }));
        
        state.alerts = newAlerts;
        state.unacknowledgedAlerts = newAlerts;
        
        // Clear progress
        state.progress = null;
      })
      .addCase(validateBatch.rejected, (state, action) => {
        state.isValidating = false;
        state.progress = null;
        
        state.errors.push({
          id: Date.now(),
          type: 'batch_validation',
          message: action.payload?.message || 'Batch validation failed',
          timestamp: new Date().toISOString()
        });
      })
      
      // Re-validate records
      .addCase(revalidateRecords.pending, (state) => {
        state.isValidating = true;
      })
      .addCase(revalidateRecords.fulfilled, (state, action) => {
        state.isValidating = false;
        const { recordIds, results, revalidatedAt } = action.payload;
        
        // Results are already added by individual validateRecord actions
        state.lastValidationTime = revalidatedAt;
      })
      .addCase(revalidateRecords.rejected, (state, action) => {
        state.isValidating = false;
        
        state.errors.push({
          id: Date.now(),
          type: 'revalidation',
          message: action.payload?.message || 'Re-validation failed',
          recordIds: action.payload?.recordIds,
          timestamp: new Date().toISOString()
        });
      })
      
      // Generate validation summary
      .addCase(generateValidationSummary.fulfilled, (state, action) => {
        state.summary = action.payload;
      })
      .addCase(generateValidationSummary.rejected, (state, action) => {
        state.errors.push({
          id: Date.now(),
          type: 'summary_generation',
          message: action.payload?.message || 'Failed to generate validation summary',
          timestamp: new Date().toISOString()
        });
      });
  }
});

// Export actions
export const {
  updateValidationConfig,
  resetValidationConfig,
  updateValidationProgress,
  clearValidationProgress,
  clearValidationResults,
  clearResultsForRecords,
  removeValidationResult,
  acknowledgeAlert,
  acknowledgeAllAlerts,
  dismissAlert,
  setValidationFilters,
  clearValidationFilters,
  setValidationSort,
  clearValidationErrors,
  addValidationError
} = validationSlice.actions;

// Selectors
export const selectValidation = (state) => state.validation;
export const selectValidationResults = (state) => state.validation.results;
export const selectValidationSummary = (state) => state.validation.summary;
export const selectIsValidating = (state) => state.validation.isValidating;
export const selectValidationProgress = (state) => state.validation.progress;
export const selectValidationConfig = (state) => state.validation.config;
export const selectValidationAlerts = (state) => state.validation.alerts;
export const selectUnacknowledgedAlerts = (state) => state.validation.unacknowledgedAlerts;
export const selectValidationFilters = (state) => state.validation.filters;
export const selectValidationSort = (state) => ({ 
  sortBy: state.validation.sortBy, 
  sortOrder: state.validation.sortOrder 
});
export const selectValidationErrors = (state) => state.validation.errors;

// Complex selectors
export const selectFilteredValidationResults = (state) => {
  const results = selectValidationResults(state);
  const filters = selectValidationFilters(state);
  const { sortBy, sortOrder } = selectValidationSort(state);
  
  let filteredResults = results;
  
  // Apply filters
  if (filters.severity) {
    filteredResults = filteredResults.filter(r => r.severity === filters.severity);
  }
  
  if (filters.field) {
    filteredResults = filteredResults.filter(r => r.field === filters.field);
  }
  
  if (filters.recordId) {
    filteredResults = filteredResults.filter(r => r.recordId === filters.recordId);
  }
  
  if (filters.dateRange) {
    const { startDate, endDate } = filters.dateRange;
    filteredResults = filteredResults.filter(r => {
      const validatedAt = new Date(r.validatedAt);
      return validatedAt >= new Date(startDate) && validatedAt <= new Date(endDate);
    });
  }
  
  // Apply sorting
  filteredResults.sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];
    
    // Handle different data types
    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }
    
    if (sortOrder === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });
  
  return filteredResults;
};

export const selectValidationResultsByRecord = (state, recordId) =>
  selectValidationResults(state).filter(result => result.recordId === recordId);

export const selectValidationResultsBySeverity = (state, severity) =>
  selectValidationResults(state).filter(result => result.severity === severity);

export const selectValidationStatistics = (state) => {
  const results = selectValidationResults(state);
  const summary = selectValidationSummary(state);
  
  return {
    totalValidations: results.length,
    recordsValidated: summary.totalRecords,
    validRecords: summary.validRecords,
    invalidRecords: summary.invalidRecords,
    severityBreakdown: {
      critical: summary.criticalCount,
      high: summary.highSeverityCount,
      medium: summary.mediumSeverityCount,
      low: summary.lowSeverityCount
    },
    financialImpact: {
      totalDiscrepancyAmount: summary.totalDiscrepancyAmount,
      averageDiscrepancyAmount: summary.averageDiscrepancyAmount,
      maxDiscrepancyAmount: summary.maxDiscrepancyAmount
    },
    alertsCount: {
      total: state.validation.alerts.length,
      unacknowledged: state.validation.unacknowledgedAlerts.length
    }
  };
};

// Export reducer
export default validationSlice.reducer;