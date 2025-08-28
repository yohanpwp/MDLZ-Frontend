/**
 * Integration tests for file upload and validation workflow
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import FileUploaderContainer from '../../components/file-upload/FileUploaderContainer.jsx';
import ValidationDashboard from '../../components/validation/ValidationDashboard.jsx';
import fileProcessingReducer from '../../redux/slices/fileProcessingSlice.js';
import validationReducer from '../../redux/slices/validationSlice.js';
import { CsvParser } from '../../utils/CsvParser.js';
import { ValidationEngine } from '../../services/ValidationEngine.js';

// Mock file parsers and validation engine
vi.mock('../../utils/CsvParser.js');
vi.mock('../../utils/TxtParser.js');
vi.mock('../../services/ValidationEngine.js');

// Mock File constructor
class MockFile {
  constructor(name, size, type = '') {
    this.name = name;
    this.size = size;
    this.type = type;
  }
}

describe('File Upload and Validation Integration', () => {
  let store;

  const mockCsvData = [
    {
      invoiceNumber: 'INV-001',
      customerName: 'Customer A',
      amount: 100,
      taxRate: 10,
      taxAmount: 10,
      discountAmount: 0,
      totalAmount: 110,
      date: '2024-01-01'
    },
    {
      invoiceNumber: 'INV-002',
      customerName: 'Customer B',
      amount: 200,
      taxRate: 10,
      taxAmount: 25, // Incorrect - should be 20
      discountAmount: 0,
      totalAmount: 225,
      date: '2024-01-02'
    }
  ];

  const mockValidationResults = [
    {
      id: '1',
      recordId: 'INV-002',
      field: 'taxAmount',
      severity: 'high',
      discrepancy: 5,
      originalValue: 25,
      calculatedValue: 20,
      message: 'Tax calculation discrepancy'
    }
  ];

  beforeEach(() => {
    store = configureStore({
      reducer: {
        fileProcessing: fileProcessingReducer,
        validation: validationReducer
      }
    });

    vi.clearAllMocks();

    // Mock CSV parser
    CsvParser.parse.mockResolvedValue({
      success: true,
      data: mockCsvData,
      errors: []
    });

    // Mock validation engine
    ValidationEngine.prototype.validateBatch.mockResolvedValue({
      totalRecords: 2,
      validRecords: 1,
      invalidRecords: 1,
      totalDiscrepancies: 1,
      highSeverityCount: 1,
      processingTimeMs: 100
    });

    ValidationEngine.prototype.getResults.mockReturnValue(mockValidationResults);
  });

  test('should complete full file upload and validation workflow', async () => {
    render(
      <Provider store={store}>
        <div>
          <FileUploaderContainer />
          <ValidationDashboard />
        </div>
      </Provider>
    );

    // Step 1: Upload file
    const file = new MockFile('invoices.csv', 1000, 'text/csv');
    const input = screen.getByRole('button').querySelector('input[type="file"]');
    
    fireEvent.change(input, { target: { files: [file] } });

    // Step 2: Wait for file processing
    await waitFor(() => {
      expect(CsvParser.parse).toHaveBeenCalledWith(file);
    });

    // Step 3: Wait for validation to complete
    await waitFor(() => {
      expect(ValidationEngine.prototype.validateBatch).toHaveBeenCalledWith(
        mockCsvData,
        expect.any(Function)
      );
    });

    // Step 4: Verify results are displayed
    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument(); // Total records
      expect(screen.getByText('1')).toBeInTheDocument(); // Invalid records
      expect(screen.getByText('Tax calculation discrepancy')).toBeInTheDocument();
    });
  });

  test('should handle file parsing errors', async () => {
    CsvParser.parse.mockResolvedValue({
      success: false,
      data: [],
      errors: ['Invalid CSV format']
    });

    render(
      <Provider store={store}>
        <FileUploaderContainer />
      </Provider>
    );

    const file = new MockFile('invalid.csv', 1000, 'text/csv');
    const input = screen.getByRole('button').querySelector('input[type="file"]');
    
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/invalid csv format/i)).toBeInTheDocument();
    });
  });

  test('should handle validation errors', async () => {
    ValidationEngine.prototype.validateBatch.mockRejectedValue(
      new Error('Validation service unavailable')
    );

    render(
      <Provider store={store}>
        <div>
          <FileUploaderContainer />
          <ValidationDashboard />
        </div>
      </Provider>
    );

    const file = new MockFile('invoices.csv', 1000, 'text/csv');
    const input = screen.getByRole('button').querySelector('input[type="file"]');
    
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/validation service unavailable/i)).toBeInTheDocument();
    });
  });

  test('should show progress during file processing', async () => {
    let progressCallback;
    ValidationEngine.prototype.validateBatch.mockImplementation((records, callback) => {
      progressCallback = callback;
      return new Promise(resolve => {
        setTimeout(() => {
          // Simulate progress updates
          callback({ progressPercentage: 50, status: 'processing' });
          setTimeout(() => {
            callback({ progressPercentage: 100, status: 'completed' });
            resolve({
              totalRecords: 2,
              validRecords: 1,
              invalidRecords: 1,
              totalDiscrepancies: 1
            });
          }, 100);
        }, 100);
      });
    });

    render(
      <Provider store={store}>
        <FileUploaderContainer />
      </Provider>
    );

    const file = new MockFile('invoices.csv', 1000, 'text/csv');
    const input = screen.getByRole('button').querySelector('input[type="file"]');
    
    fireEvent.change(input, { target: { files: [file] } });

    // Should show processing state
    await waitFor(() => {
      expect(screen.getByText(/processing/i)).toBeInTheDocument();
    });

    // Should show completion
    await waitFor(() => {
      expect(screen.getByText(/completed/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  test('should handle multiple file uploads', async () => {
    render(
      <Provider store={store}>
        <FileUploaderContainer multiple={true} />
      </Provider>
    );

    const files = [
      new MockFile('invoices1.csv', 1000, 'text/csv'),
      new MockFile('invoices2.csv', 2000, 'text/csv')
    ];

    const input = screen.getByRole('button').querySelector('input[type="file"]');
    fireEvent.change(input, { target: { files } });

    await waitFor(() => {
      expect(CsvParser.parse).toHaveBeenCalledTimes(2);
      expect(screen.getByText('Selected Files (2)')).toBeInTheDocument();
    });
  });

  test('should filter validation results by severity', async () => {
    // Add more validation results with different severities
    const extendedResults = [
      ...mockValidationResults,
      {
        id: '2',
        recordId: 'INV-003',
        field: 'totalAmount',
        severity: 'medium',
        discrepancy: 2,
        originalValue: 102,
        calculatedValue: 100,
        message: 'Total calculation discrepancy'
      }
    ];

    ValidationEngine.prototype.getResults.mockReturnValue(extendedResults);

    render(
      <Provider store={store}>
        <ValidationDashboard />
      </Provider>
    );

    // Simulate having validation results
    store.dispatch({
      type: 'validation/validateBatch/fulfilled',
      payload: {
        results: extendedResults,
        summary: {
          totalRecords: 3,
          validRecords: 1,
          invalidRecords: 2,
          totalDiscrepancies: 2,
          highSeverityCount: 1,
          mediumSeverityCount: 1
        }
      }
    });

    // Filter by high severity
    const severityFilter = screen.getByLabelText(/severity/i);
    fireEvent.change(severityFilter, { target: { value: 'high' } });

    await waitFor(() => {
      expect(screen.getByText('Tax calculation discrepancy')).toBeInTheDocument();
      expect(screen.queryByText('Total calculation discrepancy')).not.toBeInTheDocument();
    });
  });

  test('should export validation results', async () => {
    const mockExport = vi.fn();
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();

    // Mock document.createElement for download link
    const mockLink = {
      href: '',
      download: '',
      click: vi.fn()
    };
    vi.spyOn(document, 'createElement').mockReturnValue(mockLink);

    render(
      <Provider store={store}>
        <ValidationDashboard />
      </Provider>
    );

    // Simulate having validation results
    store.dispatch({
      type: 'validation/validateBatch/fulfilled',
      payload: {
        results: mockValidationResults,
        summary: {
          totalRecords: 2,
          validRecords: 1,
          invalidRecords: 1,
          totalDiscrepancies: 1
        }
      }
    });

    const exportButton = screen.getByRole('button', { name: /export/i });
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(mockLink.click).toHaveBeenCalled();
    });
  });

  test('should handle large file validation with chunking', async () => {
    // Create large dataset
    const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
      invoiceNumber: `INV-${i.toString().padStart(3, '0')}`,
      customerName: `Customer ${i}`,
      amount: 100 + i,
      taxRate: 10,
      taxAmount: 10 + (i * 0.1),
      discountAmount: 0,
      totalAmount: 110 + i + (i * 0.1),
      date: '2024-01-01'
    }));

    CsvParser.parse.mockResolvedValue({
      success: true,
      data: largeDataset,
      errors: []
    });

    ValidationEngine.prototype.validateBatch.mockImplementation((records, callback) => {
      // Simulate chunked processing
      return new Promise(resolve => {
        let processed = 0;
        const chunkSize = 100;
        
        const processChunk = () => {
          processed += chunkSize;
          const progress = Math.min((processed / records.length) * 100, 100);
          
          callback({
            progressPercentage: progress,
            status: progress === 100 ? 'completed' : 'processing',
            processedRecords: processed,
            totalRecords: records.length
          });
          
          if (progress < 100) {
            setTimeout(processChunk, 10);
          } else {
            resolve({
              totalRecords: records.length,
              validRecords: records.length - 10,
              invalidRecords: 10,
              totalDiscrepancies: 10,
              processingTimeMs: 500
            });
          }
        };
        
        processChunk();
      });
    });

    render(
      <Provider store={store}>
        <div>
          <FileUploaderContainer />
          <ValidationDashboard />
        </div>
      </Provider>
    );

    const file = new MockFile('large-invoices.csv', 100000, 'text/csv');
    const input = screen.getByRole('button').querySelector('input[type="file"]');
    
    fireEvent.change(input, { target: { files: [file] } });

    // Should show progress updates
    await waitFor(() => {
      expect(screen.getByText(/processing/i)).toBeInTheDocument();
    });

    // Should complete processing
    await waitFor(() => {
      expect(screen.getByText('1000')).toBeInTheDocument(); // Total records
    }, { timeout: 5000 });
  });
});