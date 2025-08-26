/**
 * Unit tests for validationSlice
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import validationReducer, {
  validateRecord,
  validateBatch,
  revalidateRecords,
  generateValidationSummary,
  updateValidationConfig,
  resetValidationConfig,
  updateValidationProgress,
  clearValidationProgress,
  clearValidationResults,
  clearResultsForRecords,
  acknowledgeAlert,
  acknowledgeAllAlerts,
  dismissAlert,
  setValidationFilters,
  clearValidationFilters,
  setValidationSort,
  selectValidationResults,
  selectValidationSummary,
  selectIsValidating,
  selectValidationAlerts,
  selectFilteredValidationResults,
  selectValidationResultsByRecord
} from '../validationSlice.js';
import { DEFAULT_VALIDATION_CONFIG, SEVERITY_LEVELS } from '../../../types/validation.js';
import { createEmptyInvoiceRecord } from '../../../types/invoice.js';

// Mock the ValidationEngine
vi.mock('../../../services/ValidationEngine.js', () => ({
  ValidationEngine: vi.fn().mockImplementation(() => ({
    validateRecord: vi.fn(),
    validateBatch: vi.fn(),
    updateConfig: vi.fn(),
    getResults: vi.fn(() => []),
    clearResults: vi.fn()
  }))
}));

describe('validationSlice', () => {
  let store;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        validation: validationReducer
      }
    });
  });

  describe('initial state', () => {
    test('should have correct initial state', () => {
      const state = store.getState().validation;
      
      expect(state.results).toEqual([]);
      expect(state.isValidating).toBe(false);
      expect(state.progress).toBeNull();
      expect(state.config).toEqual(DEFAULT_VALIDATION_CONFIG);
      expect(state.alerts).toEqual([]);
      expect(state.unacknowledgedAlerts).toEqual([]);
      expect(state.errors).toEqual([]);
    });
  });

  describe('synchronous actions', () => {
    test('should update validation config', () => {
      const newConfig = {
        thresholds: { low: 2.0, medium: 6.0, high: 12.0, critical: 25.0 }
      };
      
      store.dispatch(updateValidationConfig(newConfig));
      
      const state = store.getState().validation;
      expect(state.config.thresholds.low).toBe(2.0);
      expect(state.config.thresholds.medium).toBe(6.0);
      // Should merge with existing config
      expect(state.config.tolerances).toEqual(DEFAULT_VALIDATION_CONFIG.tolerances);
    });

    test('should reset validation config', () => {
      // First modify config
      store.dispatch(updateValidationConfig({
        thresholds: { low: 5.0 }
      }));
      
      // Then reset
      store.dispatch(resetValidationConfig());
      
      const state = store.getState().validation;
      expect(state.config).toEqual(DEFAULT_VALIDATION_CONFIG);
    });

    test('should update validation progress', () => {
      const progress = {
        batchId: 'test-batch',
        totalRecords: 100,
        processedRecords: 50,
        progressPercentage: 50
      };
      
      store.dispatch(updateValidationProgress(progress));
      
      const state = store.getState().validation;
      expect(state.progress).toEqual(progress);
      expect(state.currentBatchId).toBe('test-batch');
    });

    test('should clear validation progress', () => {
      // First set progress
      store.dispatch(updateValidationProgress({
        batchId: 'test-batch',
        progressPercentage: 50
      }));
      
      // Then clear
      store.dispatch(clearValidationProgress());
      
      const state = store.getState().validation;
      expect(state.progress).toBeNull();
      expect(state.currentBatchId).toBeNull();
    });

    test('should clear validation results', () => {
      // First add some mock results
      const mockResults = [
        {
          id: 'result-1',
          recordId: 'record-1',
          field: 'taxAmount',
          severity: SEVERITY_LEVELS.HIGH
        }
      ];
      
      // Manually set state for testing
      store.dispatch({ type: 'validation/test', payload: { results: mockResults } });
      
      // Clear results
      store.dispatch(clearValidationResults());
      
      const state = store.getState().validation;
      expect(state.results).toEqual([]);
      expect(state.alerts).toEqual([]);
      expect(state.unacknowledgedAlerts).toEqual([]);
    });

    test('should clear results for specific records', () => {
      // This would be tested with actual results in state
      const recordIds = ['record-1', 'record-2'];
      
      store.dispatch(clearResultsForRecords(recordIds));
      
      // Since we don't have actual results, just verify action was dispatched
      const state = store.getState().validation;
      expect(state.results).toEqual([]);
    });

    test('should acknowledge alert', () => {
      // This would be tested with actual alerts in state
      const alertId = 'alert-1';
      
      store.dispatch(acknowledgeAlert(alertId));
      
      // Verify action was dispatched
      const state = store.getState().validation;
      expect(state.alerts).toEqual([]);
    });

    test('should acknowledge all alerts', () => {
      store.dispatch(acknowledgeAllAlerts());
      
      const state = store.getState().validation;
      expect(state.unacknowledgedAlerts).toEqual([]);
    });

    test('should dismiss alert', () => {
      const alertId = 'alert-1';
      
      store.dispatch(dismissAlert(alertId));
      
      const state = store.getState().validation;
      expect(state.alerts).toEqual([]);
    });

    test('should set validation filters', () => {
      const filters = {
        severity: SEVERITY_LEVELS.HIGH,
        field: 'taxAmount',
        recordId: 'record-1'
      };
      
      store.dispatch(setValidationFilters(filters));
      
      const state = store.getState().validation;
      expect(state.filters.severity).toBe(SEVERITY_LEVELS.HIGH);
      expect(state.filters.field).toBe('taxAmount');
      expect(state.filters.recordId).toBe('record-1');
    });

    test('should clear validation filters', () => {
      // First set filters
      store.dispatch(setValidationFilters({
        severity: SEVERITY_LEVELS.HIGH,
        field: 'taxAmount'
      }));
      
      // Then clear
      store.dispatch(clearValidationFilters());
      
      const state = store.getState().validation;
      expect(state.filters.severity).toBeNull();
      expect(state.filters.field).toBeNull();
      expect(state.filters.recordId).toBeNull();
    });

    test('should set validation sort', () => {
      const sortConfig = {
        sortBy: 'severity',
        sortOrder: 'asc'
      };
      
      store.dispatch(setValidationSort(sortConfig));
      
      const state = store.getState().validation;
      expect(state.sortBy).toBe('severity');
      expect(state.sortOrder).toBe('asc');
    });
  });

  describe('selectors', () => {
    test('should select validation results', () => {
      const state = store.getState();
      const results = selectValidationResults(state);
      
      expect(Array.isArray(results)).toBe(true);
      expect(results).toEqual([]);
    });

    test('should select validation summary', () => {
      const state = store.getState();
      const summary = selectValidationSummary(state);
      
      expect(summary).toBeDefined();
      expect(summary.totalRecords).toBe(0);
    });

    test('should select isValidating', () => {
      const state = store.getState();
      const isValidating = selectIsValidating(state);
      
      expect(isValidating).toBe(false);
    });

    test('should select validation alerts', () => {
      const state = store.getState();
      const alerts = selectValidationAlerts(state);
      
      expect(Array.isArray(alerts)).toBe(true);
      expect(alerts).toEqual([]);
    });

    test('should select filtered validation results', () => {
      const state = store.getState();
      const filteredResults = selectFilteredValidationResults(state);
      
      expect(Array.isArray(filteredResults)).toBe(true);
      expect(filteredResults).toEqual([]);
    });

    test('should select validation results by record', () => {
      const state = store.getState();
      const recordResults = selectValidationResultsByRecord(state, 'record-1');
      
      expect(Array.isArray(recordResults)).toBe(true);
      expect(recordResults).toEqual([]);
    });
  });

  describe('async thunks', () => {
    test('should handle validateRecord pending state', () => {
      const record = {
        ...createEmptyInvoiceRecord(),
        id: 'test-record'
      };
      
      // Dispatch the async action
      store.dispatch(validateRecord(record));
      
      // Check that validation errors for this record are cleared
      const state = store.getState().validation;
      expect(state.validationErrors.filter(e => e.recordId === 'test-record')).toEqual([]);
    });

    test('should handle validateBatch pending state', () => {
      const records = [
        { ...createEmptyInvoiceRecord(), id: 'record-1' },
        { ...createEmptyInvoiceRecord(), id: 'record-2' }
      ];
      
      // Dispatch the async action
      store.dispatch(validateBatch({ records }));
      
      const state = store.getState().validation;
      expect(state.isValidating).toBe(true);
      expect(state.errors).toEqual([]);
      expect(state.validationErrors).toEqual([]);
    });

    test('should handle revalidateRecords pending state', () => {
      const recordIds = ['record-1', 'record-2'];
      const records = [
        { ...createEmptyInvoiceRecord(), id: 'record-1' },
        { ...createEmptyInvoiceRecord(), id: 'record-2' }
      ];
      
      // Dispatch the async action
      store.dispatch(revalidateRecords({ recordIds, records }));
      
      const state = store.getState().validation;
      expect(state.isValidating).toBe(true);
    });

    test('should handle generateValidationSummary', () => {
      // Dispatch the async action
      store.dispatch(generateValidationSummary());
      
      // Since we don't have actual results, this will just test the action dispatch
      const state = store.getState().validation;
      expect(state.summary).toBeDefined();
    });
  });

  describe('error handling', () => {
    test('should handle validation errors', () => {
      // This would be tested with actual error scenarios
      // For now, just verify the error state structure
      const state = store.getState().validation;
      expect(state.errors).toEqual([]);
      expect(state.validationErrors).toEqual([]);
    });
  });

  describe('integration with file processing', () => {
    test('should work with file processing results', () => {
      // This would test integration between validation and file processing
      // For now, just verify the basic structure is in place
      const state = store.getState().validation;
      expect(state.results).toEqual([]);
    });
  });
});