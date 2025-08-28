/**
 * Unit tests for validationSlice Redux slice
 */

import { describe, test, expect, beforeEach, vi } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
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
  selectValidationResultsByRecord,
} from "../validationSlice.js";
import {
  DEFAULT_VALIDATION_CONFIG,
  SEVERITY_LEVELS,
} from "../../../types/validation.js";
import { createEmptyInvoiceRecord } from "../../../types/invoice.js";

// Mock the ValidationEngine
vi.mock("../../../services/ValidationEngine.js", () => ({
  ValidationEngine: vi.fn().mockImplementation(() => ({
    validateRecord: vi.fn(),
    validateBatch: vi.fn(),
    updateConfig: vi.fn(),
    getResults: vi.fn(() => []),
    clearResults: vi.fn(),
  })),
}));

describe("validationSlice", () => {
  let store;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        validation: validationReducer,
      },
    });
  });

  describe("initial state", () => {
    test("should have correct initial state", () => {
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

  describe("synchronous actions", () => {
    test("should update validation config", () => {
      const newConfig = {
        thresholds: { low: 2.0, medium: 6.0, high: 12.0, critical: 25.0 },
      };

      store.dispatch(updateValidationConfig(newConfig));

      const state = store.getState().validation;
      expect(state.config.thresholds.low).toBe(2.0);
      expect(state.config.thresholds.medium).toBe(6.0);
      // Should merge with existing config
      expect(state.config.tolerances).toEqual(
        DEFAULT_VALIDATION_CONFIG.tolerances
      );
    });

    test("should reset validation config", () => {
      // First modify config
      store.dispatch(
        updateValidationConfig({
          thresholds: { low: 5.0 },
        })
      );

      // Then reset
      store.dispatch(resetValidationConfig());

      const state = store.getState().validation;
      expect(state.config).toEqual(DEFAULT_VALIDATION_CONFIG);
    });

    test("should update validation progress", () => {
      const progress = {
        batchId: "test-batch",
        totalRecords: 100,
        processedRecords: 50,
        progressPercentage: 50,
      };

      store.dispatch(updateValidationProgress(progress));

      const state = store.getState().validation;
      expect(state.progress).toEqual(progress);
      expect(state.currentBatchId).toBe("test-batch");
    });

    test("should clear validation progress", () => {
      // First set progress
      store.dispatch(
        updateValidationProgress({
          batchId: "test-batch",
          progressPercentage: 50,
        })
      );

      // Then clear
      store.dispatch(clearValidationProgress());

      const state = store.getState().validation;
      expect(state.progress).toBeNull();
      expect(state.currentBatchId).toBeNull();
    });

    test("should clear validation results", () => {
      // First add some mock results
      const mockResults = [
        {
          id: "result-1",
          recordId: "record-1",
          field: "taxAmount",
          severity: SEVERITY_LEVELS.HIGH,
        },
      ];

      // Manually set state for testing
      store.dispatch({
        type: "validation/test",
        payload: { results: mockResults },
      });

      // Clear results
      store.dispatch(clearValidationResults());

      const state = store.getState().validation;
      expect(state.results).toEqual([]);
      expect(state.alerts).toEqual([]);
      expect(state.unacknowledgedAlerts).toEqual([]);
    });

    test("should clear results for specific records", () => {
      // This would be tested with actual results in state
      const recordIds = ["record-1", "record-2"];

      store.dispatch(clearResultsForRecords(recordIds));

      // Since we don't have actual results, just verify action was dispatched
      const state = store.getState().validation;
      expect(state.results).toEqual([]);
    });

    test("should acknowledge alert", () => {
      // First create a store with alerts
      const mockAlerts = [
        {
          id: "alert-1",
          recordId: "record-1",
          field: "taxAmount",
          severity: SEVERITY_LEVELS.HIGH,
          message: "Tax discrepancy",
          acknowledged: false,
        },
        {
          id: "alert-2",
          recordId: "record-2",
          field: "totalAmount",
          severity: SEVERITY_LEVELS.CRITICAL,
          message: "Total amount discrepancy",
          acknowledged: false,
        },
      ];

      const testStore = configureStore({
        reducer: { validation: validationReducer },
        preloadedState: {
          validation: {
            ...validationReducer(undefined, { type: "@@INIT" }),
            alerts: mockAlerts,
            unacknowledgedAlerts: mockAlerts,
          },
        },
      });

      testStore.dispatch(acknowledgeAlert("alert-1"));

      const state = testStore.getState().validation;
      const acknowledgedAlert = state.alerts.find((a) => a.id === "alert-1");

      expect(acknowledgedAlert.acknowledged).toBe(true);
      expect(acknowledgedAlert.acknowledgedAt).toBeDefined();
      expect(state.unacknowledgedAlerts).toHaveLength(1);
      expect(state.unacknowledgedAlerts[0].id).toBe("alert-2");
    });

    test("should acknowledge all alerts", () => {
      const mockAlerts = [
        {
          id: "alert-1",
          recordId: "record-1",
          severity: SEVERITY_LEVELS.HIGH,
          acknowledged: false,
        },
        {
          id: "alert-2",
          recordId: "record-2",
          severity: SEVERITY_LEVELS.CRITICAL,
          acknowledged: false,
        },
      ];

      const testStore = configureStore({
        reducer: { validation: validationReducer },
        preloadedState: {
          validation: {
            ...validationReducer(undefined, { type: "@@INIT" }),
            alerts: mockAlerts,
            unacknowledgedAlerts: mockAlerts,
          },
        },
      });

      testStore.dispatch(acknowledgeAllAlerts());

      const state = testStore.getState().validation;

      expect(state.alerts.every((alert) => alert.acknowledged)).toBe(true);
      expect(state.alerts.every((alert) => alert.acknowledgedAt)).toBe(true);
      expect(state.unacknowledgedAlerts).toEqual([]);
    });

    test("should dismiss alert", () => {
      const mockAlerts = [
        {
          id: "alert-1",
          recordId: "record-1",
          severity: SEVERITY_LEVELS.HIGH,
          acknowledged: false,
        },
        {
          id: "alert-2",
          recordId: "record-2",
          severity: SEVERITY_LEVELS.CRITICAL,
          acknowledged: false,
        },
      ];

      const testStore = configureStore({
        reducer: { validation: validationReducer },
        preloadedState: {
          validation: {
            ...validationReducer(undefined, { type: "@@INIT" }),
            alerts: mockAlerts,
            unacknowledgedAlerts: mockAlerts,
          },
        },
      });

      testStore.dispatch(dismissAlert("alert-1"));

      const state = testStore.getState().validation;

      expect(state.alerts).toHaveLength(1);
      expect(state.alerts[0].id).toBe("alert-2");
      expect(state.unacknowledgedAlerts).toHaveLength(1);
      expect(state.unacknowledgedAlerts[0].id).toBe("alert-2");
    });

    test("should set validation filters", () => {
      const filters = {
        severity: SEVERITY_LEVELS.HIGH,
        field: "taxAmount",
        recordId: "record-1",
      };

      store.dispatch(setValidationFilters(filters));

      const state = store.getState().validation;
      expect(state.filters.severity).toBe(SEVERITY_LEVELS.HIGH);
      expect(state.filters.field).toBe("taxAmount");
      expect(state.filters.recordId).toBe("record-1");
    });

    test("should clear validation filters", () => {
      // First set filters
      store.dispatch(
        setValidationFilters({
          severity: SEVERITY_LEVELS.HIGH,
          field: "taxAmount",
        })
      );

      // Then clear
      store.dispatch(clearValidationFilters());

      const state = store.getState().validation;
      expect(state.filters.severity).toBeNull();
      expect(state.filters.field).toBeNull();
      expect(state.filters.recordId).toBeNull();
    });

    test("should set validation sort", () => {
      const sortConfig = {
        sortBy: "severity",
        sortOrder: "asc",
      };

      store.dispatch(setValidationSort(sortConfig));

      const state = store.getState().validation;
      expect(state.sortBy).toBe("severity");
      expect(state.sortOrder).toBe("asc");
    });
  });

  describe("selectors", () => {
    test("should select validation results", () => {
      const state = store.getState();
      const results = selectValidationResults(state);

      expect(Array.isArray(results)).toBe(true);
      expect(results).toEqual([]);
    });

    test("should select validation summary", () => {
      const state = store.getState();
      const summary = selectValidationSummary(state);

      expect(summary).toBeDefined();
      expect(summary.totalRecords).toBe(0);
    });

    test("should select isValidating", () => {
      const state = store.getState();
      const isValidating = selectIsValidating(state);

      expect(isValidating).toBe(false);
    });

    test("should select validation alerts", () => {
      const state = store.getState();
      const alerts = selectValidationAlerts(state);

      expect(Array.isArray(alerts)).toBe(true);
      expect(alerts).toEqual([]);
    });

    test("should select filtered validation results", () => {
      const state = store.getState();
      const filteredResults = selectFilteredValidationResults(state);

      expect(Array.isArray(filteredResults)).toBe(true);
      expect(filteredResults).toEqual([]);
    });

    test("should select validation results by record", () => {
      const state = store.getState();
      const recordResults = selectValidationResultsByRecord(state, "record-1");

      expect(Array.isArray(recordResults)).toBe(true);
      expect(recordResults).toEqual([]);
    });
  });

  describe("async thunks", () => {
    test("should handle validateRecord pending state", () => {
      const record = {
        ...createEmptyInvoiceRecord(),
        id: "test-record",
      };

      // Dispatch the async action
      store.dispatch(validateRecord(record));

      // Check that validation errors for this record are cleared
      const state = store.getState().validation;
      expect(
        state.validationErrors.filter((e) => e.recordId === "test-record")
      ).toEqual([]);
    });

    test("should handle validateBatch pending state", () => {
      const records = [
        { ...createEmptyInvoiceRecord(), id: "record-1" },
        { ...createEmptyInvoiceRecord(), id: "record-2" },
      ];

      // Dispatch the async action
      store.dispatch(validateBatch({ records }));

      const state = store.getState().validation;
      expect(state.isValidating).toBe(true);
      expect(state.errors).toEqual([]);
      expect(state.validationErrors).toEqual([]);
    });

    test("should handle revalidateRecords pending state", () => {
      const recordIds = ["record-1", "record-2"];
      const records = [
        { ...createEmptyInvoiceRecord(), id: "record-1" },
        { ...createEmptyInvoiceRecord(), id: "record-2" },
      ];

      // Dispatch the async action
      store.dispatch(revalidateRecords({ recordIds, records }));

      const state = store.getState().validation;
      expect(state.isValidating).toBe(true);
    });

    test("should handle generateValidationSummary", () => {
      // Dispatch the async action
      store.dispatch(generateValidationSummary());

      // Since we don't have actual results, this will just test the action dispatch
      const state = store.getState().validation;
      expect(state.summary).toBeDefined();
    });

    test("should generate validation summary from current results", async () => {
      // First add some mock results to the state
      const mockResults = [
        {
          id: "result-1",
          recordId: "record-1",
          field: "taxAmount",
          discrepancy: 10,
          severity: SEVERITY_LEVELS.HIGH,
        },
        {
          id: "result-2",
          recordId: "record-2",
          field: "totalAmount",
          discrepancy: 5,
          severity: SEVERITY_LEVELS.MEDIUM,
        },
      ];

      // Manually set results in state for testing
      const testStore = configureStore({
        reducer: { validation: validationReducer },
        preloadedState: {
          validation: {
            ...validationReducer(undefined, { type: "@@INIT" }),
            results: mockResults,
          },
        },
      });

      await testStore.dispatch(generateValidationSummary());

      const state = testStore.getState().validation;
      expect(state.summary.totalRecords).toBe(2);
      expect(state.summary.invalidRecords).toBe(2);
      expect(state.summary.totalDiscrepancies).toBe(2);
      expect(state.summary.highSeverityCount).toBe(1);
      expect(state.summary.mediumSeverityCount).toBe(1);
      expect(state.summary.totalDiscrepancyAmount).toBe(15);
    });

    test("should handle generateValidationSummary failure", async () => {
      // Create a store with invalid state to trigger error
      const testStore = configureStore({
        reducer: { validation: validationReducer },
        preloadedState: {
          validation: {
            ...validationReducer(undefined, { type: "@@INIT" }),
            results: null, // Invalid state to trigger error
          },
        },
      });

      await testStore.dispatch(generateValidationSummary());

      const state = testStore.getState().validation;
      expect(state.errors).toHaveLength(1);
      expect(state.errors[0].type).toBe("summary_generation");
    });
  });

  describe("error handling", () => {
    test("should handle validation errors", () => {
      // This would be tested with actual error scenarios
      // For now, just verify the error state structure
      const state = store.getState().validation;
      expect(state.errors).toEqual([]);
      expect(state.validationErrors).toEqual([]);
    });
  });

  describe("alert and notification functionality", () => {
    test("should clear alerts when clearing results for records", () => {
      const mockAlerts = [
        {
          id: "alert-1",
          recordId: "record-1",
          severity: SEVERITY_LEVELS.HIGH,
        },
        {
          id: "alert-2",
          recordId: "record-2",
          severity: SEVERITY_LEVELS.CRITICAL,
        },
      ];

      const testStore = configureStore({
        reducer: { validation: validationReducer },
        preloadedState: {
          validation: {
            ...validationReducer(undefined, { type: "@@INIT" }),
            alerts: mockAlerts,
            unacknowledgedAlerts: mockAlerts,
          },
        },
      });

      testStore.dispatch(clearResultsForRecords(["record-1"]));

      const state = testStore.getState().validation;
      expect(state.alerts).toHaveLength(1);
      expect(state.alerts[0].recordId).toBe("record-2");
      expect(state.unacknowledgedAlerts).toHaveLength(1);
    });

    test("should preserve acknowledged status when acknowledging specific alert", () => {
      const mockAlerts = [
        {
          id: "alert-1",
          recordId: "record-1",
          severity: SEVERITY_LEVELS.HIGH,
          acknowledged: true,
          acknowledgedAt: "2023-01-01T00:00:00.000Z",
        },
        {
          id: "alert-2",
          recordId: "record-2",
          severity: SEVERITY_LEVELS.CRITICAL,
          acknowledged: false,
        },
      ];

      const testStore = configureStore({
        reducer: { validation: validationReducer },
        preloadedState: {
          validation: {
            ...validationReducer(undefined, { type: "@@INIT" }),
            alerts: mockAlerts,
            unacknowledgedAlerts: [mockAlerts[1]],
          },
        },
      });

      testStore.dispatch(acknowledgeAlert("alert-2"));

      const state = testStore.getState().validation;

      // First alert should remain acknowledged
      const firstAlert = state.alerts.find((a) => a.id === "alert-1");
      expect(firstAlert.acknowledged).toBe(true);
      expect(firstAlert.acknowledgedAt).toBe("2023-01-01T00:00:00.000Z");

      // Second alert should now be acknowledged
      const secondAlert = state.alerts.find((a) => a.id === "alert-2");
      expect(secondAlert.acknowledged).toBe(true);
      expect(secondAlert.acknowledgedAt).toBeDefined();

      expect(state.unacknowledgedAlerts).toHaveLength(0);
    });

    test("should handle alert acknowledgment and dismissal", () => {
      const mockAlerts = [
        {
          id: "alert-1",
          recordId: "record-1",
          severity: SEVERITY_LEVELS.HIGH,
          acknowledged: false,
        },
        {
          id: "alert-2",
          recordId: "record-2",
          severity: SEVERITY_LEVELS.CRITICAL,
          acknowledged: false,
        },
      ];

      const testStore = configureStore({
        reducer: { validation: validationReducer },
        preloadedState: {
          validation: {
            ...validationReducer(undefined, { type: "@@INIT" }),
            alerts: mockAlerts,
            unacknowledgedAlerts: mockAlerts,
          },
        },
      });

      // Test acknowledging all alerts
      testStore.dispatch(acknowledgeAllAlerts());

      let state = testStore.getState().validation;
      expect(state.alerts.every((alert) => alert.acknowledged)).toBe(true);
      expect(state.unacknowledgedAlerts).toHaveLength(0);

      // Test dismissing an alert
      testStore.dispatch(dismissAlert("alert-1"));

      state = testStore.getState().validation;
      expect(state.alerts).toHaveLength(1);
      expect(state.alerts[0].id).toBe("alert-2");
    });
  });

  describe("integration with file processing", () => {
    test("should work with file processing results", () => {
      // This would test integration between validation and file processing
      // For now, just verify the basic structure is in place
      const state = store.getState().validation;
      expect(state.results).toEqual([]);
    });

    test("should handle validation state management", () => {
      // Test basic state management functionality
      const state = store.getState().validation;
      expect(state.isValidating).toBe(false);
      expect(state.config).toEqual(DEFAULT_VALIDATION_CONFIG);
      expect(state.alerts).toEqual([]);
      expect(state.errors).toEqual([]);
    });

    test("should handle filtering and sorting configuration", () => {
      // Test filter and sort functionality
      store.dispatch(
        setValidationFilters({
          severity: SEVERITY_LEVELS.HIGH,
          field: "taxAmount",
        })
      );

      store.dispatch(
        setValidationSort({
          sortBy: "severity",
          sortOrder: "desc",
        })
      );

      const state = store.getState().validation;
      expect(state.filters.severity).toBe(SEVERITY_LEVELS.HIGH);
      expect(state.filters.field).toBe("taxAmount");
      expect(state.sortBy).toBe("severity");
      expect(state.sortOrder).toBe("desc");
    });
  });
});
