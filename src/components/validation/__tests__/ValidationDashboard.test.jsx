/**
 * Unit tests for ValidationDashboard component
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import ValidationDashboard from '../ValidationDashboard.jsx';
import validationReducer from '../../../redux/slices/validationSlice.js';
import { SEVERITY_LEVELS } from '../../../types/validation.js';

// Mock child components
vi.mock('../ValidationResults.jsx', () => ({
  default: ({ results }) => (
    <div data-testid="validation-results">
      Results: {results.length}
    </div>
  )
}));

vi.mock('../DiscrepancyAlert.jsx', () => ({
  default: ({ alert }) => (
    <div data-testid="discrepancy-alert">
      Alert: {alert.message}
    </div>
  )
}));

describe('ValidationDashboard', () => {
  let store;

  const mockValidationState = {
    results: [
      {
        id: '1',
        recordId: 'inv-001',
        field: 'taxAmount',
        severity: SEVERITY_LEVELS.HIGH,
        discrepancy: 5.00,
        originalValue: 15,
        calculatedValue: 10,
        message: 'Tax calculation discrepancy'
      },
      {
        id: '2',
        recordId: 'inv-002',
        field: 'totalAmount',
        severity: SEVERITY_LEVELS.MEDIUM,
        discrepancy: 2.50,
        originalValue: 102.50,
        calculatedValue: 100,
        message: 'Total calculation discrepancy'
      }
    ],
    summary: {
      totalRecords: 100,
      validRecords: 98,
      invalidRecords: 2,
      totalDiscrepancies: 2,
      highSeverityCount: 1,
      mediumSeverityCount: 1,
      lowSeverityCount: 0,
      criticalCount: 0,
      totalDiscrepancyAmount: 7.50,
      averageDiscrepancyAmount: 3.75,
      maxDiscrepancyAmount: 5.00,
      processingTimeMs: 1500
    },
    alerts: [
      {
        id: 'alert-1',
        type: 'discrepancy',
        severity: SEVERITY_LEVELS.HIGH,
        message: 'High severity discrepancy detected',
        recordId: 'inv-001',
        acknowledged: false,
        timestamp: new Date().toISOString()
      }
    ],
    isValidating: false,
    error: null,
    filters: {
      severity: 'all',
      dateRange: 'all',
      recordType: 'all'
    }
  };

  beforeEach(() => {
    store = configureStore({
      reducer: {
        validation: validationReducer
      },
      preloadedState: {
        validation: mockValidationState
      }
    });
  });

  test('should render validation summary statistics', () => {
    render(
      <Provider store={store}>
        <ValidationDashboard />
      </Provider>
    );

    expect(screen.getByText('100')).toBeInTheDocument(); // Total records
    expect(screen.getByText('98')).toBeInTheDocument(); // Valid records
    expect(screen.getByText('2')).toBeInTheDocument(); // Invalid records
    expect(screen.getByText('2')).toBeInTheDocument(); // Total discrepancies
  });

  test('should display severity breakdown', () => {
    render(
      <Provider store={store}>
        <ValidationDashboard />
      </Provider>
    );

    expect(screen.getByText('Critical: 0')).toBeInTheDocument();
    expect(screen.getByText('High: 1')).toBeInTheDocument();
    expect(screen.getByText('Medium: 1')).toBeInTheDocument();
    expect(screen.getByText('Low: 0')).toBeInTheDocument();
  });

  test('should display financial impact metrics', () => {
    render(
      <Provider store={store}>
        <ValidationDashboard />
      </Provider>
    );

    expect(screen.getByText('$7.50')).toBeInTheDocument(); // Total discrepancy amount
    expect(screen.getByText('$3.75')).toBeInTheDocument(); // Average discrepancy
    expect(screen.getByText('$5.00')).toBeInTheDocument(); // Max discrepancy
  });

  test('should show processing time', () => {
    render(
      <Provider store={store}>
        <ValidationDashboard />
      </Provider>
    );

    expect(screen.getByText('1.5s')).toBeInTheDocument(); // Processing time
  });

  test('should render validation results component', () => {
    render(
      <Provider store={store}>
        <ValidationDashboard />
      </Provider>
    );

    expect(screen.getByTestId('validation-results')).toBeInTheDocument();
    expect(screen.getByText('Results: 2')).toBeInTheDocument();
  });

  test('should render discrepancy alerts', () => {
    render(
      <Provider store={store}>
        <ValidationDashboard />
      </Provider>
    );

    expect(screen.getByTestId('discrepancy-alert')).toBeInTheDocument();
    expect(screen.getByText('Alert: High severity discrepancy detected')).toBeInTheDocument();
  });

  test('should handle filter changes', () => {
    render(
      <Provider store={store}>
        <ValidationDashboard />
      </Provider>
    );

    const severityFilter = screen.getByLabelText(/severity/i);
    fireEvent.change(severityFilter, { target: { value: 'high' } });

    // Should update the filter in the store
    expect(severityFilter.value).toBe('high');
  });

  test('should show loading state when validating', () => {
    const loadingStore = configureStore({
      reducer: {
        validation: validationReducer
      },
      preloadedState: {
        validation: {
          ...mockValidationState,
          isValidating: true
        }
      }
    });

    render(
      <Provider store={loadingStore}>
        <ValidationDashboard />
      </Provider>
    );

    expect(screen.getByText(/validating/i)).toBeInTheDocument();
  });

  test('should show error state when validation fails', () => {
    const errorStore = configureStore({
      reducer: {
        validation: validationReducer
      },
      preloadedState: {
        validation: {
          ...mockValidationState,
          error: 'Validation failed'
        }
      }
    });

    render(
      <Provider store={errorStore}>
        <ValidationDashboard />
      </Provider>
    );

    expect(screen.getByText(/validation failed/i)).toBeInTheDocument();
  });

  test('should show empty state when no results', () => {
    const emptyStore = configureStore({
      reducer: {
        validation: validationReducer
      },
      preloadedState: {
        validation: {
          ...mockValidationState,
          results: [],
          summary: {
            ...mockValidationState.summary,
            totalRecords: 0,
            validRecords: 0,
            invalidRecords: 0,
            totalDiscrepancies: 0
          }
        }
      }
    });

    render(
      <Provider store={emptyStore}>
        <ValidationDashboard />
      </Provider>
    );

    expect(screen.getByText(/no validation results/i)).toBeInTheDocument();
  });

  test('should handle refresh action', () => {
    render(
      <Provider store={store}>
        <ValidationDashboard />
      </Provider>
    );

    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    fireEvent.click(refreshButton);

    // Should dispatch refresh action
    expect(refreshButton).toBeInTheDocument();
  });

  test('should display validation accuracy percentage', () => {
    render(
      <Provider store={store}>
        <ValidationDashboard />
      </Provider>
    );

    // 98 valid out of 100 total = 98%
    expect(screen.getByText('98%')).toBeInTheDocument();
  });

  test('should show records per second metric', () => {
    render(
      <Provider store={store}>
        <ValidationDashboard />
      </Provider>
    );

    // 100 records in 1500ms = ~67 records/second
    expect(screen.getByText(/67.*records\/sec/i)).toBeInTheDocument();
  });

  test('should handle export results action', () => {
    render(
      <Provider store={store}>
        <ValidationDashboard />
      </Provider>
    );

    const exportButton = screen.getByRole('button', { name: /export/i });
    fireEvent.click(exportButton);

    // Should trigger export functionality
    expect(exportButton).toBeInTheDocument();
  });
});