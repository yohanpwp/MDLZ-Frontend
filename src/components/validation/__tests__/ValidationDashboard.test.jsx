/**
 * ValidationDashboard Component Tests
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { describe, it, expect, vi } from 'vitest';
import ValidationDashboard from '../ValidationDashboard';
import validationSlice from '../../../redux/slices/validationSlice';

// Mock store with validation data
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      validation: validationSlice
    },
    preloadedState: {
      validation: {
        summary: {
          totalRecords: 100,
          validRecords: 85,
          invalidRecords: 15,
          totalDiscrepancies: 25,
          criticalCount: 2,
          highSeverityCount: 5,
          mediumSeverityCount: 8,
          lowSeverityCount: 10,
          validationEndTime: new Date().toISOString(),
          processingTimeMs: 1500,
          batchId: 'test-batch-001'
        },
        results: [],
        alerts: [],
        unacknowledgedAlerts: [],
        isValidating: false,
        progress: null,
        ...initialState
      }
    }
  });
};

const renderWithProvider = (component, store) => {
  return render(
    <Provider store={store}>
      {component}
    </Provider>
  );
};

describe('ValidationDashboard', () => {
  it('should render dashboard with summary statistics', () => {
    const store = createMockStore();
    const mockNavigateToResults = vi.fn();
    const mockNavigateToAlerts = vi.fn();

    renderWithProvider(
      <ValidationDashboard 
        onNavigateToResults={mockNavigateToResults}
        onNavigateToAlerts={mockNavigateToAlerts}
      />, 
      store
    );

    // Check if main elements are rendered
    expect(screen.getByText('Validation Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Monitor validation results and system performance')).toBeInTheDocument();
    
    // Check statistics cards
    expect(screen.getByText('Total Records')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('Valid Records')).toBeInTheDocument();
    expect(screen.getByText('85')).toBeInTheDocument();
    expect(screen.getByText('Discrepancies Found')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
  });

  it('should show validation progress when validating', () => {
    const store = createMockStore({
      isValidating: true,
      progress: {
        progressPercentage: 45,
        currentOperation: 'Processing records...',
        processedRecords: 45,
        totalRecords: 100
      }
    });

    renderWithProvider(<ValidationDashboard />, store);

    expect(screen.getByText('Validation in Progress')).toBeInTheDocument();
    expect(screen.getByText('45%')).toBeInTheDocument();
    expect(screen.getByText('Processing records...')).toBeInTheDocument();
  });

  it('should show alerts button when there are unacknowledged alerts', () => {
    const store = createMockStore({
      unacknowledgedAlerts: [
        { id: '1', severity: 'high' },
        { id: '2', severity: 'critical' }
      ]
    });

    renderWithProvider(<ValidationDashboard />, store);

    expect(screen.getByText('View Alerts')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // Alert count badge
  });
});