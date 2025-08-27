/**
 * ExportOptions Component Tests
 * 
 * Tests for the ExportOptions component functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import ExportOptions from '../ExportOptions';
import reportsReducer from '../../../redux/slices/reportsSlice';
import authReducer from '../../../redux/slices/authSlice';

// Mock ExportService
vi.mock('../../../services/ExportService', () => ({
  default: {
    exportReport: vi.fn(),
    cancelExport: vi.fn(),
    addProgressListener: vi.fn(() => () => {}),
    removeProgressListener: vi.fn()
  }
}));

const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      reports: reportsReducer,
      auth: authReducer
    },
    preloadedState: {
      reports: {
        templates: [],
        generated: [],
        filters: {},
        isGenerating: false,
        isExporting: false,
        exports: [],
        error: null,
        selectedTemplate: null,
        previewData: null,
        ...initialState.reports
      },
      auth: {
        user: { name: 'Test User' },
        permissions: [],
        isAuthenticated: true,
        ...initialState.auth
      }
    }
  });
};

const mockReport = {
  id: 'test-report-1',
  name: 'Test Validation Report',
  generatedAt: new Date('2024-01-01T10:00:00Z'),
  generatedBy: 'Test User',
  recordCount: 100,
  data: {
    summary: {
      totalRecords: 100,
      validRecords: 80,
      invalidRecords: 20,
      totalDiscrepancyAmount: 1500.50,
      averageDiscrepancyAmount: 75.03,
      severityBreakdown: {
        low: 10,
        medium: 8,
        high: 2,
        critical: 0
      }
    },
    records: []
  }
};

describe('ExportOptions', () => {
  let store;
  let mockOnClose;

  beforeEach(() => {
    store = createMockStore();
    mockOnClose = vi.fn();
  });

  const renderComponent = (props = {}) => {
    return render(
      <Provider store={store}>
        <ExportOptions
          report={mockReport}
          onClose={mockOnClose}
          {...props}
        />
      </Provider>
    );
  };

  it('should render export options form', () => {
    renderComponent();

    expect(screen.getByText('Export Report')).toBeInTheDocument();
    expect(screen.getByText('Configure export options for "Test Validation Report"')).toBeInTheDocument();
    expect(screen.getByText('Export Format')).toBeInTheDocument();
    expect(screen.getByText('Filename')).toBeInTheDocument();
    expect(screen.getByText('Content Options')).toBeInTheDocument();
  });

  it('should display format options', () => {
    renderComponent();

    expect(screen.getByText('PDF')).toBeInTheDocument();
    expect(screen.getByText('EXCEL')).toBeInTheDocument();
    expect(screen.getByText('CSV')).toBeInTheDocument();
    expect(screen.getByText('JSON')).toBeInTheDocument();
  });

  it('should allow format selection', () => {
    renderComponent();

    const excelOption = screen.getByText('EXCEL').closest('div');
    fireEvent.click(excelOption);

    // Check if Excel format is selected (would need to check styling or state)
    expect(excelOption).toHaveClass('border-primary');
  });

  it('should allow filename editing', () => {
    renderComponent();

    const filenameInput = screen.getByDisplayValue('Test_Validation_Report');
    fireEvent.change(filenameInput, { target: { value: 'custom-filename' } });

    expect(filenameInput.value).toBe('custom-filename');
  });

  it('should display content options checkboxes', () => {
    renderComponent();

    expect(screen.getByLabelText(/Include Charts/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Include Metadata/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Include Raw Data/)).toBeInTheDocument();
  });

  it('should show PDF-specific options when PDF is selected', () => {
    renderComponent();

    // PDF should be selected by default
    expect(screen.getByText('PDF Options')).toBeInTheDocument();
    expect(screen.getByText('Page Size')).toBeInTheDocument();
    expect(screen.getByText('Orientation')).toBeInTheDocument();
  });

  it('should show Excel-specific options when Excel is selected', () => {
    renderComponent();

    // Select Excel format
    const excelOption = screen.getByText('EXCEL').closest('div');
    fireEvent.click(excelOption);

    expect(screen.getByText('Excel Options')).toBeInTheDocument();
    expect(screen.getByLabelText(/Separate Sheets/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Include Formulas/)).toBeInTheDocument();
  });

  it('should display export summary', () => {
    renderComponent();

    expect(screen.getByText('Export Summary')).toBeInTheDocument();
    expect(screen.getByText('Records:')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('Format:')).toBeInTheDocument();
    expect(screen.getByText('PDF')).toBeInTheDocument();
  });

  it('should have export and cancel buttons', () => {
    renderComponent();

    expect(screen.getByText('Export Report')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('should call onClose when cancel button is clicked', () => {
    renderComponent();

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should disable export button when filename is empty', () => {
    renderComponent();

    const filenameInput = screen.getByDisplayValue('Test_Validation_Report');
    fireEvent.change(filenameInput, { target: { value: '' } });

    const exportButton = screen.getByText('Export Report');
    expect(exportButton).toBeDisabled();
  });

  it('should show progress when export is in progress', async () => {
    const storeWithExporting = createMockStore({
      reports: { isExporting: true }
    });

    render(
      <Provider store={storeWithExporting}>
        <ExportOptions report={mockReport} onClose={mockOnClose} />
      </Provider>
    );

    // The export button should show "Preparing..." or "Exporting..." when in progress
    const exportButton = screen.getByRole('button', { name: /export report/i });
    expect(exportButton).toBeDisabled();
  });
});