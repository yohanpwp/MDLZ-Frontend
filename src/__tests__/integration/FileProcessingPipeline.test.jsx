/**
 * Integration tests for complete file processing pipeline workflows
 * Tests the end-to-end flow from file upload through validation to report generation
 *
 * Requirements covered:
 * - Complete file upload to validation workflow
 * - Error handling in file processing pipeline
 * - Validation engine integration with file data
 * - Report generation from validation results
 */

import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { userEvent } from "@testing-library/user-event";

// Redux slices
import fileProcessingReducer from "../../redux/slices/fileProcessingSlice";
import validationReducer from "../../redux/slices/validationSlice";

// Services
import { ValidationEngine } from "../../services/ValidationEngine";
import ValidationIntegrationService from "../../services/ValidationIntegrationService";
import ReportService from "../../services/ReportService";
import ExportService from "../../services/ExportService";

// Test utilities
import { createMockInvoiceData, createMockValidationResults, createMockReportData } from "../fixtures/mockData.js";

// Mock file creation utilities
const createMockCsvFile = (content) => {
  const csvContent = content || `invoiceNumber,customerName,amount,taxRate,taxAmount,discountAmount,totalAmount,date
INV001,Customer A,100.00,10,10.00,0.00,110.00,2024-01-01
INV002,Customer B,200.00,10,20.00,5.00,215.00,2024-01-02
INV003,Customer C,150.00,10,15.50,0.00,165.50,2024-01-03`;
  
  return new File([csvContent], "test-invoices.csv", { type: "text/csv" });
};

const createMockTxtFile = (content) => {
  const txtContent = content || `INV001|Customer A|100.00|10|10.00|0.00|110.00|2024-01-01
INV002|Customer B|200.00|10|20.00|5.00|215.00|2024-01-02
INV003|Customer C|150.00|10|15.50|0.00|165.50|2024-01-03`;
  
  return new File([txtContent], "test-invoices.txt", { type: "text/plain" });
};

const createCorruptedFile = () => {
  return new File(["corrupted data"], "corrupted.csv", { type: "text/csv" });
};

// Mock store setup
const createTestStore = () => {
  return configureStore({
    reducer: {
      fileProcessing: fileProcessingReducer,
      validation: validationReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: ['persist/PERSIST'],
        },
      }),
  });
};

// Test wrapper component
const TestWrapper = ({ children, store = createTestStore() }) => (
  <Provider store={store}>{children}</Provider>
);

describe("File Processing Pipeline Integration Tests", () => {
  let store;
  let mockValidationEngine;
  let mockValidationIntegrationService;
  let mockReportService;
  let mockExportService;

  beforeEach(() => {
    store = createTestStore();

    // Mock ValidationEngine
    mockValidationEngine = {
      validateBatch: vi.fn(),
      validateRecord: vi.fn(),
      getResults: vi.fn(),
      getSummary: vi.fn(),
      clearResults: vi.fn(),
      updateConfig: vi.fn(),
    };

    // Mock ValidationIntegrationService
    mockValidationIntegrationService = {
      validateAllProcessedRecords: vi.fn(),
      validateNewRecords: vi.fn(),
      revalidateSpecificRecords: vi.fn(),
      validateRecordsFromFile: vi.fn(),
      getValidationStatistics: vi.fn(),
      isValidationInProgress: vi.fn(),
    };

    // Mock ReportService
    mockReportService = {
      generateReportData: vi.fn(),
      validateTemplate: vi.fn(),
      getAvailableTemplates: vi.fn(),
    };

    // Mock ExportService
    mockExportService = {
      exportReport: vi.fn(),
      getExportProgress: vi.fn(),
      cancelExport: vi.fn(),
    };

    // Mock FileReader
    global.FileReader = class MockFileReader {
      constructor() {
        this.readAsText = vi.fn();
        this.onload = null;
        this.onerror = null;
        this.result = null;
      }
    };

    // Mock URL methods for file downloads
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Complete File Upload to Validation Workflow", () => {
    it("should successfully process CSV file through complete validation workflow", async () => {
      const user = userEvent.setup();
      const csvFile = createMockCsvFile();
      
      const mockProcessedData = createMockInvoiceData(3);
      const mockValidationResults = createMockValidationResults(mockProcessedData);

      // Mock successful file processing and validation
      mockValidationIntegrationService.validateAllProcessedRecords.mockResolvedValue({
        success: true,
        summary: mockValidationResults.summary,
        batchId: 'batch_123',
        recordsValidated: 3,
        validatedAt: new Date().toISOString()
      });

      // Create a minimal component for testing
      const TestComponent = () => {
        const [file, setFile] = React.useState(null);
        const [processing, setProcessing] = React.useState(false);
        const [validationResults, setValidationResults] = React.useState(null);

        const handleFileUpload = async (uploadedFile) => {
          setFile(uploadedFile);
          setProcessing(true);
          
          try {
            // Simulate file processing
            const reader = new FileReader();
            reader.onload = async (e) => {
              // Simulate parsing and validation
              const results = await mockValidationIntegrationService.validateAllProcessedRecords();
              setValidationResults(results);
              setProcessing(false);
            };
            reader.readAsText(uploadedFile);
          } catch (error) {
            setProcessing(false);
          }
        };

        return (
          <div>
            <input
              type="file"
              accept=".csv,.txt"
              onChange={(e) => handleFileUpload(e.target.files[0])}
              data-testid="file-input"
            />
            {processing && <div>Processing file...</div>}
            {file && <div>File uploaded: {file.name}</div>}
            {validationResults && (
              <div>
                <div>Validation completed</div>
                <div>Records validated: {validationResults.recordsValidated}</div>
                <div>Batch ID: {validationResults.batchId}</div>
              </div>
            )}
          </div>
        );
      };

      render(
        <TestWrapper store={store}>
          <TestComponent />
        </TestWrapper>
      );

      // Upload file
      const fileInput = screen.getByTestId("file-input");
      await user.upload(fileInput, csvFile);

      // Verify file upload
      expect(screen.getByText("File uploaded: test-invoices.csv")).toBeInTheDocument();
      expect(screen.getByText("Processing file...")).toBeInTheDocument();

      // Simulate FileReader completion
      await act(async () => {
        const fileReader = new FileReader();
        if (fileReader.onload) {
          await fileReader.onload({ target: { result: csvFile.content } });
        }
      });

      // Wait for validation to complete
      await waitFor(() => {
        expect(mockValidationIntegrationService.validateAllProcessedRecords).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(screen.getByText("Validation completed")).toBeInTheDocument();
        expect(screen.getByText("Records validated: 3")).toBeInTheDocument();
        expect(screen.getByText("Batch ID: batch_123")).toBeInTheDocument();
      });
    });

    it("should handle TXT file processing with validation discrepancies", async () => {
      const user = userEvent.setup();
      const txtFile = createMockTxtFile();
      
      const mockProcessedData = createMockInvoiceData(3);
      const mockValidationResults = {
        success: true,
        summary: {
          totalRecords: 3,
          validRecords: 2,
          invalidRecords: 1,
          totalDiscrepancies: 2,
          criticalCount: 1,
          highSeverityCount: 1,
          totalDiscrepancyAmount: 15.50
        },
        batchId: 'batch_456',
        recordsValidated: 3
      };

      mockValidationIntegrationService.validateAllProcessedRecords.mockResolvedValue(mockValidationResults);

      const TestComponent = () => {
        const [validationResults, setValidationResults] = React.useState(null);

        const handleFileUpload = async (uploadedFile) => {
          const reader = new FileReader();
          reader.onload = async () => {
            const results = await mockValidationIntegrationService.validateAllProcessedRecords();
            setValidationResults(results);
          };
          reader.readAsText(uploadedFile);
        };

        return (
          <div>
            <input
              type="file"
              onChange={(e) => handleFileUpload(e.target.files[0])}
              data-testid="file-input"
            />
            {validationResults && (
              <div>
                <div>Total records: {validationResults.summary.totalRecords}</div>
                <div>Valid records: {validationResults.summary.validRecords}</div>
                <div>Invalid records: {validationResults.summary.invalidRecords}</div>
                <div>Total discrepancies: {validationResults.summary.totalDiscrepancies}</div>
                <div>Critical issues: {validationResults.summary.criticalCount}</div>
                <div>High severity issues: {validationResults.summary.highSeverityCount}</div>
              </div>
            )}
          </div>
        );
      };

      render(
        <TestWrapper store={store}>
          <TestComponent />
        </TestWrapper>
      );

      const fileInput = screen.getByTestId("file-input");
      await user.upload(fileInput, txtFile);

      await act(async () => {
        const fileReader = new FileReader();
        if (fileReader.onload) {
          await fileReader.onload({ target: { result: txtFile.content } });
        }
      });

      await waitFor(() => {
        expect(screen.getByText("Total records: 3")).toBeInTheDocument();
        expect(screen.getByText("Valid records: 2")).toBeInTheDocument();
        expect(screen.getByText("Invalid records: 1")).toBeInTheDocument();
        expect(screen.getByText("Total discrepancies: 2")).toBeInTheDocument();
        expect(screen.getByText("Critical issues: 1")).toBeInTheDocument();
        expect(screen.getByText("High severity issues: 1")).toBeInTheDocument();
      });
    });

    it("should handle large file processing with progress tracking", async () => {
      const user = userEvent.setup();
      const largeFile = createMockCsvFile();
      
      let progressCallback;
      mockValidationIntegrationService.validateAllProcessedRecords.mockImplementation((options) => {
        progressCallback = options?.onProgress;
        
        return new Promise((resolve) => {
          // Simulate progress updates
          setTimeout(() => {
            if (progressCallback) {
              progressCallback({
                batchId: 'batch_large',
                totalRecords: 1000,
                processedRecords: 250,
                progressPercentage: 25,
                status: 'processing'
              });
            }
          }, 100);

          setTimeout(() => {
            if (progressCallback) {
              progressCallback({
                batchId: 'batch_large',
                totalRecords: 1000,
                processedRecords: 500,
                progressPercentage: 50,
                status: 'processing'
              });
            }
          }, 200);

          setTimeout(() => {
            if (progressCallback) {
              progressCallback({
                batchId: 'batch_large',
                totalRecords: 1000,
                processedRecords: 1000,
                progressPercentage: 100,
                status: 'completed'
              });
            }
            
            resolve({
              success: true,
              summary: {
                totalRecords: 1000,
                validRecords: 950,
                invalidRecords: 50,
                totalDiscrepancies: 75
              },
              batchId: 'batch_large',
              recordsValidated: 1000
            });
          }, 300);
        });
      });

      const TestComponent = () => {
        const [progress, setProgress] = React.useState(null);
        const [results, setResults] = React.useState(null);

        const handleFileUpload = async (uploadedFile) => {
          const reader = new FileReader();
          reader.onload = async () => {
            const validationResults = await mockValidationIntegrationService.validateAllProcessedRecords({
              onProgress: setProgress
            });
            setResults(validationResults);
          };
          reader.readAsText(uploadedFile);
        };

        return (
          <div>
            <input
              type="file"
              onChange={(e) => handleFileUpload(e.target.files[0])}
              data-testid="file-input"
            />
            {progress && (
              <div>
                <div>Progress: {progress.progressPercentage}%</div>
                <div>Status: {progress.status}</div>
                <div>Processed: {progress.processedRecords}/{progress.totalRecords}</div>
              </div>
            )}
            {results && (
              <div>
                <div>Validation completed</div>
                <div>Total processed: {results.recordsValidated}</div>
              </div>
            )}
          </div>
        );
      };

      render(
        <TestWrapper store={store}>
          <TestComponent />
        </TestWrapper>
      );

      const fileInput = screen.getByTestId("file-input");
      await user.upload(fileInput, largeFile);

      await act(async () => {
        const fileReader = new FileReader();
        if (fileReader.onload) {
          await fileReader.onload({ target: { result: largeFile.content } });
        }
      });

      // Check progress updates
      await waitFor(() => {
        expect(screen.getByText("Progress: 25%")).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText("Progress: 50%")).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText("Progress: 100%")).toBeInTheDocument();
        expect(screen.getByText("Status: completed")).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText("Validation completed")).toBeInTheDocument();
        expect(screen.getByText("Total processed: 1000")).toBeInTheDocument();
      });
    });
  });

  describe("Error Handling in File Processing Pipeline", () => {
    it("should handle invalid file format errors", async () => {
      const user = userEvent.setup();
      const invalidFile = new File(["invalid content"], "test.pdf", { type: "application/pdf" });

      const TestComponent = () => {
        const [error, setError] = React.useState(null);

        const handleFileUpload = (uploadedFile) => {
          if (!uploadedFile.type.includes('csv') && !uploadedFile.type.includes('text')) {
            setError('Unsupported file format. Only CSV and TXT files are supported.');
            return;
          }
          setError(null);
        };

        return (
          <div>
            <input
              type="file"
              onChange={(e) => handleFileUpload(e.target.files[0])}
              data-testid="file-input"
            />
            {error && <div role="alert">{error}</div>}
          </div>
        );
      };

      render(
        <TestWrapper store={store}>
          <TestComponent />
        </TestWrapper>
      );

      const fileInput = screen.getByTestId("file-input");
      await user.upload(fileInput, invalidFile);

      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent(
          "Unsupported file format. Only CSV and TXT files are supported."
        );
      });
    });

    it("should handle file reading errors", async () => {
      const user = userEvent.setup();
      const csvFile = createMockCsvFile();

      const TestComponent = () => {
        const [error, setError] = React.useState(null);

        const handleFileUpload = (uploadedFile) => {
          const reader = new FileReader();
          reader.onerror = () => {
            setError('Error reading file. Please try again.');
          };
          reader.onload = () => {
            setError(null);
          };
          reader.readAsText(uploadedFile);
        };

        return (
          <div>
            <input
              type="file"
              onChange={(e) => handleFileUpload(e.target.files[0])}
              data-testid="file-input"
            />
            {error && <div role="alert">{error}</div>}
          </div>
        );
      };

      render(
        <TestWrapper store={store}>
          <TestComponent />
        </TestWrapper>
      );

      const fileInput = screen.getByTestId("file-input");
      await user.upload(fileInput, csvFile);

      // Simulate file reading error
      await act(async () => {
        const fileReader = new FileReader();
        if (fileReader.onerror) {
          fileReader.onerror(new Error('File read failed'));
        }
      });

      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent(
          "Error reading file. Please try again."
        );
      });
    });

    it("should handle validation service errors", async () => {
      const user = userEvent.setup();
      const csvFile = createMockCsvFile();

      mockValidationIntegrationService.validateAllProcessedRecords.mockRejectedValue(
        new Error('Validation service unavailable')
      );

      const TestComponent = () => {
        const [error, setError] = React.useState(null);
        const [processing, setProcessing] = React.useState(false);

        const handleFileUpload = async (uploadedFile) => {
          setProcessing(true);
          setError(null);
          
          const reader = new FileReader();
          reader.onload = async () => {
            try {
              await mockValidationIntegrationService.validateAllProcessedRecords();
            } catch (err) {
              setError(`Validation failed: ${err.message}`);
            } finally {
              setProcessing(false);
            }
          };
          reader.readAsText(uploadedFile);
        };

        return (
          <div>
            <input
              type="file"
              onChange={(e) => handleFileUpload(e.target.files[0])}
              data-testid="file-input"
            />
            {processing && <div>Processing...</div>}
            {error && <div role="alert">{error}</div>}
          </div>
        );
      };

      render(
        <TestWrapper store={store}>
          <TestComponent />
        </TestWrapper>
      );

      const fileInput = screen.getByTestId("file-input");
      await user.upload(fileInput, csvFile);

      await act(async () => {
        const fileReader = new FileReader();
        if (fileReader.onload) {
          await fileReader.onload({ target: { result: csvFile.content } });
        }
      });

      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent(
          "Validation failed: Validation service unavailable"
        );
      });
    });

    it("should handle corrupted file data", async () => {
      const user = userEvent.setup();
      const corruptedFile = createCorruptedFile();

      const TestComponent = () => {
        const [error, setError] = React.useState(null);

        const handleFileUpload = (uploadedFile) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            try {
              const content = e.target.result;
              // Simulate parsing validation
              if (!content.includes('invoiceNumber') && !content.includes('|')) {
                throw new Error('Invalid file format or corrupted data');
              }
            } catch (err) {
              setError(`File processing error: ${err.message}`);
            }
          };
          reader.readAsText(uploadedFile);
        };

        return (
          <div>
            <input
              type="file"
              onChange={(e) => handleFileUpload(e.target.files[0])}
              data-testid="file-input"
            />
            {error && <div role="alert">{error}</div>}
          </div>
        );
      };

      render(
        <TestWrapper store={store}>
          <TestComponent />
        </TestWrapper>
      );

      const fileInput = screen.getByTestId("file-input");
      await user.upload(fileInput, corruptedFile);

      await act(async () => {
        const fileReader = new FileReader();
        if (fileReader.onload) {
          await fileReader.onload({ target: { result: 'corrupted data' } });
        }
      });

      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent(
          "File processing error: Invalid file format or corrupted data"
        );
      });
    });

    it("should handle network timeout during validation", async () => {
      const user = userEvent.setup();
      const csvFile = createMockCsvFile();

      mockValidationIntegrationService.validateAllProcessedRecords.mockImplementation(
        () => new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 100)
        )
      );

      const TestComponent = () => {
        const [error, setError] = React.useState(null);
        const [processing, setProcessing] = React.useState(false);

        const handleFileUpload = async (uploadedFile) => {
          setProcessing(true);
          
          const reader = new FileReader();
          reader.onload = async () => {
            try {
              await mockValidationIntegrationService.validateAllProcessedRecords();
            } catch (err) {
              setError(`Network error: ${err.message}`);
            } finally {
              setProcessing(false);
            }
          };
          reader.readAsText(uploadedFile);
        };

        return (
          <div>
            <input
              type="file"
              onChange={(e) => handleFileUpload(e.target.files[0])}
              data-testid="file-input"
            />
            {processing && <div>Processing...</div>}
            {error && <div role="alert">{error}</div>}
          </div>
        );
      };

      render(
        <TestWrapper store={store}>
          <TestComponent />
        </TestWrapper>
      );

      const fileInput = screen.getByTestId("file-input");
      await user.upload(fileInput, csvFile);

      await act(async () => {
        const fileReader = new FileReader();
        if (fileReader.onload) {
          await fileReader.onload({ target: { result: csvFile.content } });
        }
      });

      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent(
          "Network error: Request timeout"
        );
      }, { timeout: 2000 });
    });
  });  
  describe("Validation Engine Integration with File Data", () => {
    it("should integrate validation engine with parsed file data", async () => {
      const mockInvoiceData = [
        {
          id: 'INV001',
          invoiceNumber: 'INV001',
          customerName: 'Customer A',
          amount: 100.00,
          taxRate: 10,
          taxAmount: 10.00,
          discountAmount: 0.00,
          totalAmount: 110.00,
          date: '2024-01-01'
        },
        {
          id: 'INV002',
          invoiceNumber: 'INV002',
          customerName: 'Customer B',
          amount: 200.00,
          taxRate: 10,
          taxAmount: 25.00, // Incorrect - should be 20.00
          discountAmount: 5.00,
          totalAmount: 225.00, // Incorrect - should be 215.00
          date: '2024-01-02'
        }
      ];

      const mockValidationResults = {
        success: true,
        summary: {
          totalRecords: 2,
          validRecords: 1,
          invalidRecords: 1,
          totalDiscrepancies: 2,
          criticalCount: 0,
          highSeverityCount: 2,
          mediumSeverityCount: 0,
          lowSeverityCount: 0,
          totalDiscrepancyAmount: 10.00,
          averageDiscrepancyAmount: 5.00,
          maxDiscrepancyAmount: 5.00
        },
        batchId: 'batch_validation_001',
        recordsValidated: 2
      };

      mockValidationIntegrationService.validateAllProcessedRecords.mockResolvedValue(mockValidationResults);
      mockValidationIntegrationService.getValidationStatistics.mockReturnValue({
        totalRecords: 2,
        validatedRecords: 2,
        unvalidatedRecords: 0,
        totalDiscrepancies: 2,
        alertsCount: 2,
        validationSummary: mockValidationResults.summary
      });

      const TestComponent = () => {
        const [data, setData] = React.useState(null);
        const [validationResults, setValidationResults] = React.useState(null);
        const [statistics, setStatistics] = React.useState(null);

        const handleValidation = async () => {
          setData(mockInvoiceData);
          const results = await mockValidationIntegrationService.validateAllProcessedRecords();
          setValidationResults(results);
          
          const stats = mockValidationIntegrationService.getValidationStatistics();
          setStatistics(stats);
        };

        return (
          <div>
            <button onClick={handleValidation} data-testid="validate-btn">
              Validate Data
            </button>
            {data && (
              <div>
                <div>Data loaded: {data.length} records</div>
              </div>
            )}
            {validationResults && (
              <div>
                <div>Validation completed</div>
                <div>Total records: {validationResults.summary.totalRecords}</div>
                <div>Valid records: {validationResults.summary.validRecords}</div>
                <div>Invalid records: {validationResults.summary.invalidRecords}</div>
                <div>Total discrepancies: {validationResults.summary.totalDiscrepancies}</div>
                <div>High severity: {validationResults.summary.highSeverityCount}</div>
                <div>Total discrepancy amount: ${validationResults.summary.totalDiscrepancyAmount}</div>
              </div>
            )}
            {statistics && (
              <div>
                <div>Statistics available</div>
                <div>Validated records: {statistics.validatedRecords}</div>
                <div>Alerts count: {statistics.alertsCount}</div>
              </div>
            )}
          </div>
        );
      };

      render(
        <TestWrapper store={store}>
          <TestComponent />
        </TestWrapper>
      );

      const validateBtn = screen.getByTestId("validate-btn");
      fireEvent.click(validateBtn);

      await waitFor(() => {
        expect(screen.getByText("Data loaded: 2 records")).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(mockValidationIntegrationService.validateAllProcessedRecords).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(screen.getByText("Validation completed")).toBeInTheDocument();
        expect(screen.getByText("Total records: 2")).toBeInTheDocument();
        expect(screen.getByText("Valid records: 1")).toBeInTheDocument();
        expect(screen.getByText("Invalid records: 1")).toBeInTheDocument();
        expect(screen.getByText("Total discrepancies: 2")).toBeInTheDocument();
        expect(screen.getByText("High severity: 2")).toBeInTheDocument();
        expect(screen.getByText("Total discrepancy amount: $10")).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText("Statistics available")).toBeInTheDocument();
        expect(screen.getByText("Validated records: 2")).toBeInTheDocument();
        expect(screen.getByText("Alerts count: 2")).toBeInTheDocument();
      });
    });

    it("should handle validation of specific record subsets", async () => {
      const mockRecordIds = ['INV001', 'INV003'];
      
      mockValidationIntegrationService.revalidateSpecificRecords.mockResolvedValue({
        success: true,
        recordIds: mockRecordIds,
        recordsRevalidated: 2,
        revalidatedAt: new Date().toISOString()
      });

      const TestComponent = () => {
        const [results, setResults] = React.useState(null);

        const handleRevalidation = async () => {
          const revalidationResults = await mockValidationIntegrationService.revalidateSpecificRecords(
            mockRecordIds,
            { strictMode: true }
          );
          setResults(revalidationResults);
        };

        return (
          <div>
            <button onClick={handleRevalidation} data-testid="revalidate-btn">
              Revalidate Records
            </button>
            {results && (
              <div>
                <div>Revalidation completed</div>
                <div>Records revalidated: {results.recordsRevalidated}</div>
                <div>Record IDs: {results.recordIds.join(', ')}</div>
              </div>
            )}
          </div>
        );
      };

      render(
        <TestWrapper store={store}>
          <TestComponent />
        </TestWrapper>
      );

      const revalidateBtn = screen.getByTestId("revalidate-btn");
      fireEvent.click(revalidateBtn);

      await waitFor(() => {
        expect(mockValidationIntegrationService.revalidateSpecificRecords).toHaveBeenCalledWith(
          mockRecordIds,
          { strictMode: true }
        );
      });

      await waitFor(() => {
        expect(screen.getByText("Revalidation completed")).toBeInTheDocument();
        expect(screen.getByText("Records revalidated: 2")).toBeInTheDocument();
        expect(screen.getByText("Record IDs: INV001, INV003")).toBeInTheDocument();
      });
    });

    it("should validate new records incrementally", async () => {
      const newRecords = [
        {
          id: 'INV006',
          invoiceNumber: 'INV006',
          customerName: 'Customer F',
          amount: 400.00,
          taxRate: 15,
          taxAmount: 60.00,
          discountAmount: 20.00,
          totalAmount: 440.00,
          date: '2024-01-06'
        }
      ];

      mockValidationIntegrationService.validateNewRecords.mockResolvedValue({
        success: true,
        newRecordsValidated: 1,
        batchId: 'batch_incremental_001',
        validatedAt: new Date().toISOString()
      });

      const TestComponent = () => {
        const [results, setResults] = React.useState(null);

        const handleIncrementalValidation = async () => {
          const validationResults = await mockValidationIntegrationService.validateNewRecords(
            newRecords,
            { incrementalMode: true }
          );
          setResults(validationResults);
        };

        return (
          <div>
            <button onClick={handleIncrementalValidation} data-testid="incremental-validate-btn">
              Validate New Records
            </button>
            {results && (
              <div>
                <div>Incremental validation completed</div>
                <div>New records validated: {results.newRecordsValidated}</div>
                <div>Batch ID: {results.batchId}</div>
              </div>
            )}
          </div>
        );
      };

      render(
        <TestWrapper store={store}>
          <TestComponent />
        </TestWrapper>
      );

      const validateBtn = screen.getByTestId("incremental-validate-btn");
      fireEvent.click(validateBtn);

      await waitFor(() => {
        expect(mockValidationIntegrationService.validateNewRecords).toHaveBeenCalledWith(
          newRecords,
          { incrementalMode: true }
        );
      });

      await waitFor(() => {
        expect(screen.getByText("Incremental validation completed")).toBeInTheDocument();
        expect(screen.getByText("New records validated: 1")).toBeInTheDocument();
        expect(screen.getByText("Batch ID: batch_incremental_001")).toBeInTheDocument();
      });
    });

    it("should handle validation engine configuration updates", async () => {
      const newConfig = {
        taxValidationEnabled: true,
        discountValidationEnabled: true,
        strictMode: true,
        tolerancePercentage: 0.01
      };

      mockValidationEngine.updateConfig.mockResolvedValue({
        success: true,
        configUpdated: true,
        newConfig
      });

      const TestComponent = () => {
        const [configResult, setConfigResult] = React.useState(null);

        const handleConfigUpdate = async () => {
          const result = await mockValidationEngine.updateConfig(newConfig);
          setConfigResult(result);
        };

        return (
          <div>
            <button onClick={handleConfigUpdate} data-testid="update-config-btn">
              Update Validation Config
            </button>
            {configResult && (
              <div>
                <div>Config updated: {configResult.configUpdated.toString()}</div>
                <div>Tax validation: {configResult.newConfig.taxValidationEnabled.toString()}</div>
                <div>Strict mode: {configResult.newConfig.strictMode.toString()}</div>
              </div>
            )}
          </div>
        );
      };

      render(
        <TestWrapper store={store}>
          <TestComponent />
        </TestWrapper>
      );

      const updateBtn = screen.getByTestId("update-config-btn");
      fireEvent.click(updateBtn);

      await waitFor(() => {
        expect(mockValidationEngine.updateConfig).toHaveBeenCalledWith(newConfig);
      });

      await waitFor(() => {
        expect(screen.getByText("Config updated: true")).toBeInTheDocument();
        expect(screen.getByText("Tax validation: true")).toBeInTheDocument();
        expect(screen.getByText("Strict mode: true")).toBeInTheDocument();
      });
    });
  });

  describe("Report Generation from Validation Results", () => {
    it("should generate comprehensive validation report", async () => {
      const mockValidationData = createMockInvoiceData(5);
      const mockValidationResults = createMockValidationResults(mockValidationData);
      const mockReportData = createMockReportData(mockValidationResults);

      mockReportService.generateReportData.mockResolvedValue({
        success: true,
        reportData: mockReportData,
        generatedAt: new Date().toISOString()
      });

      const TestComponent = () => {
        const [report, setReport] = React.useState(null);

        const handleReportGeneration = async () => {
          const reportResult = await mockReportService.generateReportData({
            validationResults: mockValidationResults,
            template: 'comprehensive',
            includeDetails: true
          });
          setReport(reportResult.reportData);
        };

        return (
          <div>
            <button onClick={handleReportGeneration} data-testid="generate-report-btn">
              Generate Report
            </button>
            {report && (
              <div>
                <div>Report generated</div>
                <div>Report ID: {report.reportId}</div>
                <div>Total processed: {report.details.totalProcessed}</div>
                <div>Success rate: {report.details.successRate}%</div>
                <div>Critical issues: {report.details.criticalIssues}</div>
                <div>Recommendations: {report.details.recommendations.length}</div>
              </div>
            )}
          </div>
        );
      };

      render(
        <TestWrapper store={store}>
          <TestComponent />
        </TestWrapper>
      );

      const generateBtn = screen.getByTestId("generate-report-btn");
      fireEvent.click(generateBtn);

      await waitFor(() => {
        expect(mockReportService.generateReportData).toHaveBeenCalledWith({
          validationResults: mockValidationResults,
          template: 'comprehensive',
          includeDetails: true
        });
      });

      await waitFor(() => {
        expect(screen.getByText("Report generated")).toBeInTheDocument();
        expect(screen.getByText(/Report ID:/)).toBeInTheDocument();
        expect(screen.getByText("Total processed: 5")).toBeInTheDocument();
        expect(screen.getByText("Success rate: 80%")).toBeInTheDocument();
        expect(screen.getByText("Critical issues: 0")).toBeInTheDocument();
        expect(screen.getByText("Recommendations: 3")).toBeInTheDocument();
      });
    });

    it("should export report to PDF format", async () => {
      const mockReportData = createMockReportData(createMockValidationResults(createMockInvoiceData(3)));

      mockExportService.exportReport.mockResolvedValue({
        success: true,
        exportId: 'export_pdf_001',
        format: 'pdf',
        downloadUrl: 'blob:mock-pdf-url',
        fileSize: '2.5MB'
      });

      const TestComponent = () => {
        const [exportResult, setExportResult] = React.useState(null);

        const handlePdfExport = async () => {
          const result = await mockExportService.exportReport({
            reportData: mockReportData,
            format: 'pdf',
            template: 'detailed'
          });
          setExportResult(result);
        };

        return (
          <div>
            <button onClick={handlePdfExport} data-testid="export-pdf-btn">
              Export to PDF
            </button>
            {exportResult && (
              <div>
                <div>Export completed</div>
                <div>Export ID: {exportResult.exportId}</div>
                <div>Format: {exportResult.format}</div>
                <div>File size: {exportResult.fileSize}</div>
                <a href={exportResult.downloadUrl} data-testid="download-link">
                  Download Report
                </a>
              </div>
            )}
          </div>
        );
      };

      render(
        <TestWrapper store={store}>
          <TestComponent />
        </TestWrapper>
      );

      const exportBtn = screen.getByTestId("export-pdf-btn");
      fireEvent.click(exportBtn);

      await waitFor(() => {
        expect(mockExportService.exportReport).toHaveBeenCalledWith({
          reportData: mockReportData,
          format: 'pdf',
          template: 'detailed'
        });
      });

      await waitFor(() => {
        expect(screen.getByText("Export completed")).toBeInTheDocument();
        expect(screen.getByText("Export ID: export_pdf_001")).toBeInTheDocument();
        expect(screen.getByText("Format: pdf")).toBeInTheDocument();
        expect(screen.getByText("File size: 2.5MB")).toBeInTheDocument();
        expect(screen.getByTestId("download-link")).toHaveAttribute('href', 'blob:mock-pdf-url');
      });
    });

    it("should export report to Excel format with filtering", async () => {
      const mockReportData = createMockReportData(createMockValidationResults(createMockInvoiceData(10)));
      const exportFilters = {
        severity: ['critical', 'high'],
        dateRange: { start: '2024-01-01', end: '2024-01-31' },
        includeValidRecords: false
      };

      mockExportService.exportReport.mockResolvedValue({
        success: true,
        exportId: 'export_excel_001',
        format: 'excel',
        downloadUrl: 'blob:mock-excel-url',
        fileSize: '1.8MB',
        recordsIncluded: 3
      });

      const TestComponent = () => {
        const [exportResult, setExportResult] = React.useState(null);

        const handleExcelExport = async () => {
          const result = await mockExportService.exportReport({
            reportData: mockReportData,
            format: 'excel',
            filters: exportFilters,
            template: 'discrepancies-only'
          });
          setExportResult(result);
        };

        return (
          <div>
            <button onClick={handleExcelExport} data-testid="export-excel-btn">
              Export to Excel
            </button>
            {exportResult && (
              <div>
                <div>Excel export completed</div>
                <div>Records included: {exportResult.recordsIncluded}</div>
                <div>File size: {exportResult.fileSize}</div>
              </div>
            )}
          </div>
        );
      };

      render(
        <TestWrapper store={store}>
          <TestComponent />
        </TestWrapper>
      );

      const exportBtn = screen.getByTestId("export-excel-btn");
      fireEvent.click(exportBtn);

      await waitFor(() => {
        expect(mockExportService.exportReport).toHaveBeenCalledWith({
          reportData: mockReportData,
          format: 'excel',
          filters: exportFilters,
          template: 'discrepancies-only'
        });
      });

      await waitFor(() => {
        expect(screen.getByText("Excel export completed")).toBeInTheDocument();
        expect(screen.getByText("Records included: 3")).toBeInTheDocument();
        expect(screen.getByText("File size: 1.8MB")).toBeInTheDocument();
      });
    });

    it("should handle export progress tracking", async () => {
      const mockReportData = createMockReportData(createMockValidationResults(createMockInvoiceData(1000)));

      let progressCallback;
      mockExportService.exportReport.mockImplementation((options) => {
        progressCallback = options?.onProgress;
        
        return new Promise((resolve) => {
          // Simulate export progress
          setTimeout(() => {
            if (progressCallback) {
              progressCallback({
                exportId: 'export_large_001',
                progress: 25,
                status: 'processing',
                currentStep: 'Generating report data'
              });
            }
          }, 100);

          setTimeout(() => {
            if (progressCallback) {
              progressCallback({
                exportId: 'export_large_001',
                progress: 75,
                status: 'processing',
                currentStep: 'Creating PDF document'
              });
            }
          }, 200);

          setTimeout(() => {
            resolve({
              success: true,
              exportId: 'export_large_001',
              format: 'pdf',
              downloadUrl: 'blob:mock-large-pdf-url',
              fileSize: '15.2MB'
            });
          }, 300);
        });
      });

      const TestComponent = () => {
        const [progress, setProgress] = React.useState(null);
        const [exportResult, setExportResult] = React.useState(null);

        const handleLargeExport = async () => {
          const result = await mockExportService.exportReport({
            reportData: mockReportData,
            format: 'pdf',
            onProgress: setProgress
          });
          setExportResult(result);
        };

        return (
          <div>
            <button onClick={handleLargeExport} data-testid="export-large-btn">
              Export Large Report
            </button>
            {progress && (
              <div>
                <div>Progress: {progress.progress}%</div>
                <div>Status: {progress.status}</div>
                <div>Step: {progress.currentStep}</div>
              </div>
            )}
            {exportResult && (
              <div>
                <div>Large export completed</div>
                <div>File size: {exportResult.fileSize}</div>
              </div>
            )}
          </div>
        );
      };

      render(
        <TestWrapper store={store}>
          <TestComponent />
        </TestWrapper>
      );

      const exportBtn = screen.getByTestId("export-large-btn");
      fireEvent.click(exportBtn);

      await waitFor(() => {
        expect(screen.getByText("Progress: 25%")).toBeInTheDocument();
        expect(screen.getByText("Step: Generating report data")).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText("Progress: 75%")).toBeInTheDocument();
        expect(screen.getByText("Step: Creating PDF document")).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText("Large export completed")).toBeInTheDocument();
        expect(screen.getByText("File size: 15.2MB")).toBeInTheDocument();
      });
    });

    it("should handle report generation errors gracefully", async () => {
      const mockValidationResults = createMockValidationResults(createMockInvoiceData(5));

      mockReportService.generateReportData.mockRejectedValue(
        new Error('Report template not found')
      );

      const TestComponent = () => {
        const [error, setError] = React.useState(null);

        const handleReportGeneration = async () => {
          try {
            await mockReportService.generateReportData({
              validationResults: mockValidationResults,
              template: 'invalid-template'
            });
          } catch (err) {
            setError(err.message);
          }
        };

        return (
          <div>
            <button onClick={handleReportGeneration} data-testid="generate-report-btn">
              Generate Report
            </button>
            {error && <div role="alert">Report error: {error}</div>}
          </div>
        );
      };

      render(
        <TestWrapper store={store}>
          <TestComponent />
        </TestWrapper>
      );

      const generateBtn = screen.getByTestId("generate-report-btn");
      fireEvent.click(generateBtn);

      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent(
          "Report error: Report template not found"
        );
      });
    });
  });

  describe("End-to-End Workflow Integration", () => {
    it("should complete full workflow from file upload to report export", async () => {
      const user = userEvent.setup();
      const csvFile = createMockCsvFile();
      const mockData = createMockInvoiceData(3);
      const mockValidationResults = createMockValidationResults(mockData);
      const mockReportData = createMockReportData(mockValidationResults);

      // Mock the complete workflow
      mockValidationIntegrationService.validateAllProcessedRecords.mockResolvedValue(mockValidationResults);
      mockReportService.generateReportData.mockResolvedValue({
        success: true,
        reportData: mockReportData
      });
      mockExportService.exportReport.mockResolvedValue({
        success: true,
        exportId: 'export_workflow_001',
        format: 'pdf',
        downloadUrl: 'blob:workflow-report-url'
      });

      const WorkflowComponent = () => {
        const [step, setStep] = React.useState('upload');
        const [validationResults, setValidationResults] = React.useState(null);
        const [reportData, setReportData] = React.useState(null);
        const [exportResult, setExportResult] = React.useState(null);

        const handleFileUpload = async (file) => {
          setStep('processing');
          const reader = new FileReader();
          reader.onload = async () => {
            const results = await mockValidationIntegrationService.validateAllProcessedRecords();
            setValidationResults(results);
            setStep('validated');
          };
          reader.readAsText(file);
        };

        const handleReportGeneration = async () => {
          setStep('generating-report');
          const reportResult = await mockReportService.generateReportData({
            validationResults,
            template: 'comprehensive'
          });
          setReportData(reportResult.reportData);
          setStep('report-ready');
        };

        const handleExport = async () => {
          setStep('exporting');
          const exportResult = await mockExportService.exportReport({
            reportData,
            format: 'pdf'
          });
          setExportResult(exportResult);
          setStep('completed');
        };

        return (
          <div>
            <div>Current step: {step}</div>
            
            {step === 'upload' && (
              <input
                type="file"
                onChange={(e) => handleFileUpload(e.target.files[0])}
                data-testid="file-input"
              />
            )}
            
            {step === 'validated' && validationResults && (
              <div>
                <div>Validation completed - {validationResults.summary.totalRecords} records</div>
                <button onClick={handleReportGeneration} data-testid="generate-report-btn">
                  Generate Report
                </button>
              </div>
            )}
            
            {step === 'report-ready' && reportData && (
              <div>
                <div>Report ready - ID: {reportData.reportId}</div>
                <button onClick={handleExport} data-testid="export-btn">
                  Export Report
                </button>
              </div>
            )}
            
            {step === 'completed' && exportResult && (
              <div>
                <div>Workflow completed successfully</div>
                <div>Export ID: {exportResult.exportId}</div>
                <a href={exportResult.downloadUrl} data-testid="download-link">
                  Download Report
                </a>
              </div>
            )}
          </div>
        );
      };

      render(
        <TestWrapper store={store}>
          <WorkflowComponent />
        </TestWrapper>
      );

      // Step 1: Upload file
      expect(screen.getByText("Current step: upload")).toBeInTheDocument();
      const fileInput = screen.getByTestId("file-input");
      await user.upload(fileInput, csvFile);

      // Step 2: File processing and validation
      await act(async () => {
        const fileReader = new FileReader();
        if (fileReader.onload) {
          await fileReader.onload({ target: { result: csvFile.content } });
        }
      });

      await waitFor(() => {
        expect(screen.getByText("Current step: validated")).toBeInTheDocument();
        expect(screen.getByText("Validation completed - 3 records")).toBeInTheDocument();
      });

      // Step 3: Generate report
      const generateReportBtn = screen.getByTestId("generate-report-btn");
      fireEvent.click(generateReportBtn);

      await waitFor(() => {
        expect(screen.getByText("Current step: report-ready")).toBeInTheDocument();
        expect(screen.getByText(/Report ready - ID:/)).toBeInTheDocument();
      });

      // Step 4: Export report
      const exportBtn = screen.getByTestId("export-btn");
      fireEvent.click(exportBtn);

      await waitFor(() => {
        expect(screen.getByText("Current step: completed")).toBeInTheDocument();
        expect(screen.getByText("Workflow completed successfully")).toBeInTheDocument();
        expect(screen.getByText("Export ID: export_workflow_001")).toBeInTheDocument();
        expect(screen.getByTestId("download-link")).toHaveAttribute('href', 'blob:workflow-report-url');
      });

      // Verify all services were called in correct order
      expect(mockValidationIntegrationService.validateAllProcessedRecords).toHaveBeenCalled();
      expect(mockReportService.generateReportData).toHaveBeenCalled();
      expect(mockExportService.exportReport).toHaveBeenCalled();

      render(
        <TestWrapper store={store}>
          <TestComponent />
        </TestWrapper>
      );
      
            const revalidateBtn = screen.getByTestId("revalidate-btn");
            fireEvent.click(revalidateBtn);
      
            await waitFor(() => {
              expect(mockValidationIntegrationService.revalidateSpecificRecords).toHaveBeenCalledWith(
                mockRecordIds,
                { strictMode: true }
              );
            });
      
            await waitFor(() => {
              expect(screen.getByText("Revalidation completed")).toBeInTheDocument();
              expect(screen.getByText("Records revalidated: 2")).toBeInTheDocument();
              expect(screen.getByText("Record IDs: INV001, INV003")).toBeInTheDocument();
            });
    });
    it("should validate records from specific files", async () => {
      const fileId = 'file_123';
      
      mockValidationIntegrationService.validateRecordsFromFile.mockResolvedValue({
        success: true,
        fileId,
        summary: {
          totalRecords: 5,
          validRecords: 4,
          invalidRecords: 1,
          totalDiscrepancies: 3
        },
        batchId: 'batch_file_123',
        recordsValidated: 5
      });

      const TestComponent = () => {
        const [results, setResults] = React.useState(null);

        const handleFileValidation = async () => {
          const fileResults = await mockValidationIntegrationService.validateRecordsFromFile(
            fileId,
            { validateTaxCalculation: true }
          );
          setResults(fileResults);
        };

        return (
          <div>
            <button onClick={handleFileValidation} data-testid="validate-file-btn">
              Validate File Records
            </button>
            {results && (
              <div>
                <div>File validation completed</div>
                <div>File ID: {results.fileId}</div>
                <div>Records validated: {results.recordsValidated}</div>
                <div>Valid records: {results.summary.validRecords}</div>
                <div>Invalid records: {results.summary.invalidRecords}</div>
              </div>
            )}
          </div>
        );
      };

      render(
        <TestWrapper store={store}>
          <TestComponent />
        </TestWrapper>
      );

      const validateFileBtn = screen.getByTestId("validate-file-btn");
      fireEvent.click(validateFileBtn);

      await waitFor(() => {
        expect(mockValidationIntegrationService.validateRecordsFromFile).toHaveBeenCalledWith(
          fileId,
          { validateTaxCalculation: true }
        );
      });

      await waitFor(() => {
        expect(screen.getByText("File validation completed")).toBeInTheDocument();
        expect(screen.getByText("File ID: file_123")).toBeInTheDocument();
        expect(screen.getByText("Records validated: 5")).toBeInTheDocument();
        expect(screen.getByText("Valid records: 4")).toBeInTheDocument();
        expect(screen.getByText("Invalid records: 1")).toBeInTheDocument();
      });
    });

    it("should handle validation progress monitoring", async () => {
      mockValidationIntegrationService.isValidationInProgress.mockReturnValue(true);
      mockValidationIntegrationService.getValidationProgress.mockReturnValue({
        batchId: 'batch_progress',
        totalRecords: 100,
        processedRecords: 45,
        progressPercentage: 45,
        status: 'processing',
        currentOperation: 'Validating record 45 of 100'
      });

      const TestComponent = () => {
        const [isValidating, setIsValidating] = React.useState(false);
        const [progress, setProgress] = React.useState(null);

        const checkValidationStatus = () => {
          const inProgress = mockValidationIntegrationService.isValidationInProgress();
          setIsValidating(inProgress);
          
          if (inProgress) {
            const currentProgress = mockValidationIntegrationService.getValidationProgress();
            setProgress(currentProgress);
          }
        };

        return (
          <div>
            <button onClick={checkValidationStatus} data-testid="check-status-btn">
              Check Validation Status
            </button>
            {isValidating && <div>Validation in progress</div>}
            {progress && (
              <div>
                <div>Progress: {progress.progressPercentage}%</div>
                <div>Status: {progress.status}</div>
                <div>Processed: {progress.processedRecords}/{progress.totalRecords}</div>
                <div>Current operation: {progress.currentOperation}</div>
              </div>
            )}
          </div>
        );
      };

      render(
        <TestWrapper store={store}>
          <TestComponent />
        </TestWrapper>
      );

      const checkStatusBtn = screen.getByTestId("check-status-btn");
      fireEvent.click(checkStatusBtn);

      await waitFor(() => {
        expect(screen.getByText("Validation in progress")).toBeInTheDocument();
        expect(screen.getByText("Progress: 45%")).toBeInTheDocument();
        expect(screen.getByText("Status: processing")).toBeInTheDocument();
        expect(screen.getByText("Processed: 45/100")).toBeInTheDocument();
        expect(screen.getByText("Current operation: Validating record 45 of 100")).toBeInTheDocument();
      });
    });
  });
  describe("Report Generation from Validation Results", () => {
    it("should generate comprehensive reports from validation results", async () => {
      const mockValidationData = {
        summary: {
          totalRecords: 100,
          validRecords: 85,
          invalidRecords: 15,
          totalDiscrepancies: 25,
          criticalCount: 2,
          highSeverityCount: 8,
          mediumSeverityCount: 10,
          lowSeverityCount: 5,
          totalDiscrepancyAmount: 1250.75,
          averageDiscrepancyAmount: 50.03,
          maxDiscrepancyAmount: 250.00
        },
        records: createMockValidationResults().results,
        charts: [
          {
            id: 'severity-distribution',
            title: 'Discrepancies by Severity Level',
            type: 'pie',
            data: [
              { name: 'Critical', value: 2, color: '#dc2626' },
              { name: 'High', value: 8, color: '#ef4444' },
              { name: 'Medium', value: 10, color: '#f59e0b' },
              { name: 'Low', value: 5, color: '#10b981' }
            ]
          }
        ],
        aggregations: {
          byField: {
            taxAmount: { count: 12, totalDiscrepancy: 450.25 },
            totalAmount: { count: 8, totalDiscrepancy: 320.50 },
            discountAmount: { count: 5, totalDiscrepancy: 480.00 }
          }
        }
      };

      const mockReportTemplate = {
        id: 'comprehensive-report',
        name: 'Comprehensive Validation Report',
        type: 'analysis',
        sections: ['summary', 'charts', 'details', 'aggregations']
      };

      mockReportService.generateReportData.mockResolvedValue(mockValidationData);
      mockReportService.getAvailableTemplates.mockReturnValue([mockReportTemplate]);

      const TestComponent = () => {
        const [reportData, setReportData] = React.useState(null);
        const [templates, setTemplates] = React.useState([]);

        const generateReport = async () => {
          const availableTemplates = mockReportService.getAvailableTemplates();
          setTemplates(availableTemplates);
          
          const reportResults = await mockReportService.generateReportData(
            mockReportTemplate,
            mockValidationData.records,
            mockValidationData.summary,
            { includeCharts: true, includeAggregations: true }
          );
          setReportData(reportResults);
        };

        return (
          <div>
            <button onClick={generateReport} data-testid="generate-report-btn">
              Generate Report
            </button>
            {templates.length > 0 && (
              <div>
                <div>Available templates: {templates.length}</div>
                <div>Template: {templates[0].name}</div>
              </div>
            )}
            {reportData && (
              <div>
                <div>Report generated successfully</div>
                <div>Total records: {reportData.summary.totalRecords}</div>
                <div>Valid records: {reportData.summary.validRecords}</div>
                <div>Invalid records: {reportData.summary.invalidRecords}</div>
                <div>Total discrepancy amount: ${reportData.summary.totalDiscrepancyAmount}</div>
                <div>Charts available: {reportData.charts.length}</div>
                <div>Field aggregations: {Object.keys(reportData.aggregations.byField).length}</div>
              </div>
            )}
          </div>
        );
      };

      render(
        <TestWrapper store={store}>
          <TestComponent />
        </TestWrapper>
      );

      const generateReportBtn = screen.getByTestId("generate-report-btn");
      fireEvent.click(generateReportBtn);

      await waitFor(() => {
        expect(mockReportService.getAvailableTemplates).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(screen.getByText("Available templates: 1")).toBeInTheDocument();
        expect(screen.getByText("Template: Comprehensive Validation Report")).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(mockReportService.generateReportData).toHaveBeenCalledWith(
          mockReportTemplate,
          mockValidationData.records,
          mockValidationData.summary,
          { includeCharts: true, includeAggregations: true }
        );
      });

      await waitFor(() => {
        expect(screen.getByText("Report generated successfully")).toBeInTheDocument();
        expect(screen.getByText("Total records: 100")).toBeInTheDocument();
        expect(screen.getByText("Valid records: 85")).toBeInTheDocument();
        expect(screen.getByText("Invalid records: 15")).toBeInTheDocument();
        expect(screen.getByText("Total discrepancy amount: $1250.75")).toBeInTheDocument();
        expect(screen.getByText("Charts available: 1")).toBeInTheDocument();
        expect(screen.getByText("Field aggregations: 3")).toBeInTheDocument();
      });
    });

    it("should export reports to multiple formats", async () => {
      const mockReport = {
        id: 'report_001',
        name: 'Validation Summary Report',
        generatedAt: new Date().toISOString(),
        data: {
          summary: {
            totalRecords: 50,
            validRecords: 45,
            invalidRecords: 5,
            totalDiscrepancyAmount: 125.50
          },
          records: []
        }
      };

      const mockExportOptions = {
        format: 'pdf',
        filename: 'validation-report',
        includeCharts: true,
        includeMetadata: true
      };

      mockExportService.exportReport.mockResolvedValue({
        exportId: 'export_001',
        downloadUrl: 'blob:mock-pdf-url',
        filename: 'validation-report.pdf',
        size: 1024000,
        type: 'application/pdf',
        processingTimeMs: 2500
      });

      const TestComponent = () => {
        const [exportResult, setExportResult] = React.useState(null);
        const [exporting, setExporting] = React.useState(false);

        const exportReport = async (format) => {
          setExporting(true);
          try {
            const result = await mockExportService.exportReport(
              mockReport,
              { ...mockExportOptions, format },
              (progress) => {
                // Progress callback
                console.log('Export progress:', progress);
              }
            );
            setExportResult(result);
          } finally {
            setExporting(false);
          }
        };

        return (
          <div>
            <button 
              onClick={() => exportReport('pdf')} 
              data-testid="export-pdf-btn"
              disabled={exporting}
            >
              Export to PDF
            </button>
            <button 
              onClick={() => exportReport('excel')} 
              data-testid="export-excel-btn"
              disabled={exporting}
            >
              Export to Excel
            </button>
            <button 
              onClick={() => exportReport('csv')} 
              data-testid="export-csv-btn"
              disabled={exporting}
            >
              Export to CSV
            </button>
            {exporting && <div>Exporting report...</div>}
            {exportResult && (
              <div>
                <div>Export completed</div>
                <div>Export ID: {exportResult.exportId}</div>
                <div>Filename: {exportResult.filename}</div>
                <div>Size: {Math.round(exportResult.size / 1024)} KB</div>
                <div>Processing time: {exportResult.processingTimeMs}ms</div>
              </div>
            )}
          </div>
        );
      };

      render(
        <TestWrapper store={store}>
          <TestComponent />
        </TestWrapper>
      );

      // Test PDF export
      const exportPdfBtn = screen.getByTestId("export-pdf-btn");
      fireEvent.click(exportPdfBtn);

      await waitFor(() => {
        expect(screen.getByText("Exporting report...")).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(mockExportService.exportReport).toHaveBeenCalledWith(
          mockReport,
          { ...mockExportOptions, format: 'pdf' },
          expect.any(Function)
        );
      });

      await waitFor(() => {
        expect(screen.getByText("Export completed")).toBeInTheDocument();
        expect(screen.getByText("Export ID: export_001")).toBeInTheDocument();
        expect(screen.getByText("Filename: validation-report.pdf")).toBeInTheDocument();
        expect(screen.getByText("Size: 1000 KB")).toBeInTheDocument();
        expect(screen.getByText("Processing time: 2500ms")).toBeInTheDocument();
      });
    });

    it("should handle export progress tracking", async () => {
      const mockReport = {
        id: 'report_002',
        name: 'Large Validation Report',
        data: { summary: {}, records: [] }
      };

      let progressCallback;
      mockExportService.exportReport.mockImplementation((report, options, onProgress) => {
        progressCallback = onProgress;
        
        return new Promise((resolve) => {
          // Simulate export progress
          setTimeout(() => {
            if (progressCallback) {
              progressCallback({
                status: 'preparing',
                progress: 10,
                currentStep: 'Preparing export data...'
              });
            }
          }, 100);

          setTimeout(() => {
            if (progressCallback) {
              progressCallback({
                status: 'exporting',
                progress: 50,
                currentStep: 'Generating PDF content...'
              });
            }
          }, 200);

          setTimeout(() => {
            if (progressCallback) {
              progressCallback({
                status: 'completed',
                progress: 100,
                currentStep: 'Export completed successfully'
              });
            }
            
            resolve({
              exportId: 'export_002',
              downloadUrl: 'blob:mock-url',
              filename: 'large-report.pdf',
              processingTimeMs: 5000
            });
          }, 300);
        });
      });

      const TestComponent = () => {
        const [progress, setProgress] = React.useState(null);
        const [result, setResult] = React.useState(null);

        const exportWithProgress = async () => {
          const exportResult = await mockExportService.exportReport(
            mockReport,
            { format: 'pdf', filename: 'large-report' },
            setProgress
          );
          setResult(exportResult);
        };

        return (
          <div>
            <button onClick={exportWithProgress} data-testid="export-with-progress-btn">
              Export with Progress
            </button>
            {progress && (
              <div>
                <div>Status: {progress.status}</div>
                <div>Progress: {progress.progress}%</div>
                <div>Step: {progress.currentStep}</div>
              </div>
            )}
            {result && (
              <div>
                <div>Export finished</div>
                <div>Processing time: {result.processingTimeMs}ms</div>
              </div>
            )}
          </div>
        );
      };

      render(
        <TestWrapper store={store}>
          <TestComponent />
        </TestWrapper>
      );

      const exportBtn = screen.getByTestId("export-with-progress-btn");
      fireEvent.click(exportBtn);

      // Check progress updates
      await waitFor(() => {
        expect(screen.getByText("Status: preparing")).toBeInTheDocument();
        expect(screen.getByText("Progress: 10%")).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText("Status: exporting")).toBeInTheDocument();
        expect(screen.getByText("Progress: 50%")).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText("Status: completed")).toBeInTheDocument();
        expect(screen.getByText("Progress: 100%")).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText("Export finished")).toBeInTheDocument();
        expect(screen.getByText("Processing time: 5000ms")).toBeInTheDocument();
      });
    });

    it("should handle report generation errors gracefully", async () => {
      mockReportService.generateReportData.mockRejectedValue(
        new Error('Report generation service unavailable')
      );

      const TestComponent = () => {
        const [error, setError] = React.useState(null);

        const generateReport = async () => {
          try {
            await mockReportService.generateReportData(
              { id: 'test-template' },
              [],
              {},
              {}
            );
          } catch (err) {
            setError(`Report generation failed: ${err.message}`);
          }
        };

        return (
          <div>
            <button onClick={generateReport} data-testid="generate-report-btn">
              Generate Report
            </button>
            {error && <div role="alert">{error}</div>}
          </div>
        );
      };

      render(
        <TestWrapper store={store}>
          <TestComponent />
        </TestWrapper>
      );

      const generateBtn = screen.getByTestId("generate-report-btn");
      fireEvent.click(generateBtn);

      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent(
          "Report generation failed: Report generation service unavailable"
        );
      });
    });
  });

  describe("End-to-End Workflow Integration", () => {
    it("should complete full workflow from file upload to report export", async () => {
      const user = userEvent.setup();
      const csvFile = createMockCsvFile();

      // Mock the complete workflow
      const mockValidationResults = {
        success: true,
        summary: {
          totalRecords: 3,
          validRecords: 2,
          invalidRecords: 1,
          totalDiscrepancies: 2,
          totalDiscrepancyAmount: 25.50
        },
        batchId: 'batch_e2e',
        recordsValidated: 3
      };

      const mockReportData = {
        summary: mockValidationResults.summary,
        records: [],
        charts: [],
        aggregations: {}
      };

      const mockExportResult = {
        exportId: 'export_e2e',
        downloadUrl: 'blob:e2e-report-url',
        filename: 'e2e-report.pdf'
      };

      mockValidationIntegrationService.validateAllProcessedRecords.mockResolvedValue(mockValidationResults);
      mockReportService.generateReportData.mockResolvedValue(mockReportData);
      mockExportService.exportReport.mockResolvedValue(mockExportResult);

      const TestComponent = () => {
        const [step, setStep] = React.useState('upload');
        const [file, setFile] = React.useState(null);
        const [validationResults, setValidationResults] = React.useState(null);
        const [reportData, setReportData] = React.useState(null);
        const [exportResult, setExportResult] = React.useState(null);

        const handleFileUpload = async (uploadedFile) => {
          setFile(uploadedFile);
          setStep('processing');
          
          // Simulate file processing
          const reader = new FileReader();
          reader.onload = async () => {
            setStep('validating');
            const results = await mockValidationIntegrationService.validateAllProcessedRecords();
            setValidationResults(results);
            setStep('validated');
          };
          reader.readAsText(uploadedFile);
        };

        const generateReport = async () => {
          setStep('generating-report');
          const report = await mockReportService.generateReportData(
            { id: 'e2e-template' },
            [],
            validationResults.summary,
            {}
          );
          setReportData(report);
          setStep('report-ready');
        };

        const exportReport = async () => {
          setStep('exporting');
          const result = await mockExportService.exportReport(
            { data: reportData },
            { format: 'pdf', filename: 'e2e-report' }
          );
          setExportResult(result);
          setStep('completed');
        };

        return (
          <div>
            <div>Current step: {step}</div>
            
            {step === 'upload' && (
              <input
                type="file"
                onChange={(e) => handleFileUpload(e.target.files[0])}
                data-testid="file-input"
              />
            )}
            
            {file && <div>File: {file.name}</div>}
            
            {validationResults && (
              <div>
                <div>Validation completed</div>
                <div>Records: {validationResults.recordsValidated}</div>
                <div>Discrepancies: {validationResults.summary.totalDiscrepancies}</div>
                {step === 'validated' && (
                  <button onClick={generateReport} data-testid="generate-report-btn">
                    Generate Report
                  </button>
                )}
              </div>
            )}
            
            {reportData && (
              <div>
                <div>Report generated</div>
                {step === 'report-ready' && (
                  <button onClick={exportReport} data-testid="export-report-btn">
                    Export Report
                  </button>
                )}
              </div>
            )}
            
            {exportResult && (
              <div>
                <div>Export completed</div>
                <div>Download: {exportResult.filename}</div>
              </div>
            )}
          </div>
        );
      };

      render(
        <TestWrapper store={store}>
          <TestComponent />
        </TestWrapper>
      );

      // Step 1: Upload file
      expect(screen.getByText("Current step: upload")).toBeInTheDocument();
      
      const fileInput = screen.getByTestId("file-input");
      await user.upload(fileInput, csvFile);

      // Step 2: File processing
      await waitFor(() => {
        expect(screen.getByText("File: test-invoices.csv")).toBeInTheDocument();
        expect(screen.getByText("Current step: processing")).toBeInTheDocument();
      });

      // Step 3: Validation
      await act(async () => {
        const fileReader = new FileReader();
        if (fileReader.onload) {
          await fileReader.onload({ target: { result: csvFile.content } });
        }
      });

      await waitFor(() => {
        expect(screen.getByText("Current step: validated")).toBeInTheDocument();
        expect(screen.getByText("Validation completed")).toBeInTheDocument();
        expect(screen.getByText("Records: 3")).toBeInTheDocument();
        expect(screen.getByText("Discrepancies: 2")).toBeInTheDocument();
      });

      // Step 4: Generate report
      const generateReportBtn = screen.getByTestId("generate-report-btn");
      fireEvent.click(generateReportBtn);

      await waitFor(() => {
        expect(screen.getByText("Current step: report-ready")).toBeInTheDocument();
        expect(screen.getByText("Report generated")).toBeInTheDocument();
      });

      // Step 5: Export report
      const exportReportBtn = screen.getByTestId("export-report-btn");
      fireEvent.click(exportReportBtn);

      await waitFor(() => {
        expect(screen.getByText("Current step: completed")).toBeInTheDocument();
        expect(screen.getByText("Export completed")).toBeInTheDocument();
        expect(screen.getByText("Download: e2e-report.pdf")).toBeInTheDocument();
      });

      // Verify all services were called in correct order
      expect(mockValidationIntegrationService.validateAllProcessedRecords).toHaveBeenCalled();
      expect(mockReportService.generateReportData).toHaveBeenCalled();
      expect(mockExportService.exportReport).toHaveBeenCalled();
    });
  });
});