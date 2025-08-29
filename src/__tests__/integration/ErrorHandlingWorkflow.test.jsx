/**
 * Integration tests for error handling workflows
 * Tests comprehensive error scenarios and recovery mechanisms
 */

import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { setup } from "@testing-library/user-event";
import fileProcessingReducer from "../../redux/slices/fileProcessingSlice";
import validationReducer from "../../redux/slices/validationSlice";
import { createMockErrorScenarios } from "../fixtures/mockData.js";

const createTestStore = () => {
  return configureStore({
    reducer: {
      fileProcessing: fileProcessingReducer,
      validation: validationReducer,
    },
  });
};

const TestWrapper = ({ children, store = createTestStore() }) => (
  <Provider store={store}>{children}</Provider>
);

describe("Error Handling Workflow Integration Tests", () => {
  let store;
  let mockServices;
  let errorScenarios;

  beforeEach(() => {
    store = createTestStore();
    errorScenarios = createMockErrorScenarios();
    
    mockServices = {
      fileService: {
        processFile: vi.fn(),
        validateFileFormat: vi.fn(),
      },
      validationService: {
        validateRecords: vi.fn(),
        getValidationStatus: vi.fn(),
      },
      reportService: {
        generateReport: vi.fn(),
        exportReport: vi.fn(),
      },
    };

    // Mock console methods to avoid noise in tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("File Processing Error Recovery", () => {
    it("should handle file read errors with retry mechanism", async () => {
      const user = setup();
      let attemptCount = 0;

      mockServices.fileService.processFile.mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          return Promise.reject(errorScenarios.fileReadError);
        }
        return Promise.resolve({
          success: true,
          recordsProcessed: 5,
          message: 'File processed successfully after retry'
        });
      });

      const TestComponent = () => {
        const [error, setError] = React.useState(null);
        const [result, setResult] = React.useState(null);
        const [retryCount, setRetryCount] = React.useState(0);
        const [isRetrying, setIsRetrying] = React.useState(false);

        const handleFileProcess = async (file, maxRetries = 3) => {
          setError(null);
          setIsRetrying(false);
          
          for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
              if (attempt > 1) {
                setIsRetrying(true);
                setRetryCount(attempt - 1);
                await new Promise(resolve => setTimeout(resolve, 1000)); // Retry delay
              }
              
              const result = await mockServices.fileService.processFile(file);
              setResult(result);
              setIsRetrying(false);
              return;
            } catch (err) {
              if (attempt === maxRetries) {
                setError(`Failed after ${maxRetries} attempts: ${err.message}`);
                setIsRetrying(false);
              }
            }
          }
        };

        const mockFile = new File(['test content'], 'test.csv', { type: 'text/csv' });

        return (
          <div>
            <button 
              onClick={() => handleFileProcess(mockFile)} 
              data-testid="process-file-btn"
            >
              Process File
            </button>
            
            {isRetrying && (
              <div>
                <div>Retrying... Attempt {retryCount}</div>
              </div>
            )}
            
            {error && (
              <div role="alert">
                Error: {error}
                <button 
                  onClick={() => handleFileProcess(mockFile)} 
                  data-testid="retry-btn"
                >
                  Retry
                </button>
              </div>
            )}
            
            {result && (
              <div>
                <div>Success: {result.message}</div>
                <div>Records processed: {result.recordsProcessed}</div>
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

      const processBtn = screen.getByTestId("process-file-btn");
      fireEvent.click(processBtn);

      // Should show retry attempts
      await waitFor(() => {
        expect(screen.getByText("Retrying... Attempt 1")).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText("Retrying... Attempt 2")).toBeInTheDocument();
      });

      // Should eventually succeed
      await waitFor(() => {
        expect(screen.getByText("Success: File processed successfully after retry")).toBeInTheDocument();
        expect(screen.getByText("Records processed: 5")).toBeInTheDocument();
      }, { timeout: 5000 });

      expect(mockServices.fileService.processFile).toHaveBeenCalledTimes(3);
    });

    it("should handle corrupted file data with graceful degradation", async () => {
      const corruptedData = "corrupted,data,format\ninvalid,row,structure";
      
      mockServices.fileService.validateFileFormat.mockResolvedValue({
        isValid: false,
        errors: [
          'Missing required column: taxAmount',
          'Invalid data format in row 2',
          'Inconsistent column count'
        ],
        recoverable: true,
        suggestions: [
          'Add missing taxAmount column with default value 0',
          'Skip invalid rows and process valid ones',
          'Use data mapping to fix column structure'
        ]
      });

      mockServices.fileService.processFile.mockImplementation((file, options) => {
        if (options?.skipInvalidRows) {
          return Promise.resolve({
            success: true,
            recordsProcessed: 1,
            recordsSkipped: 1,
            warnings: ['Skipped 1 invalid row'],
            message: 'Processed with data recovery'
          });
        }
        return Promise.reject(errorScenarios.parseError);
      });

      const TestComponent = () => {
        const [validationResult, setValidationResult] = React.useState(null);
        const [processResult, setProcessResult] = React.useState(null);
        const [error, setError] = React.useState(null);

        const handleCorruptedFile = async () => {
          try {
            // First validate the file
            const validation = await mockServices.fileService.validateFileFormat(corruptedData);
            setValidationResult(validation);
            
            if (!validation.isValid && validation.recoverable) {
              // Attempt recovery
              const result = await mockServices.fileService.processFile(
                corruptedData,
                { skipInvalidRows: true, useDataMapping: true }
              );
              setProcessResult(result);
            }
          } catch (err) {
            setError(err.message);
          }
        };

        return (
          <div>
            <button onClick={handleCorruptedFile} data-testid="process-corrupted-btn">
              Process Corrupted File
            </button>
            
            {validationResult && (
              <div>
                <div>File validation: {validationResult.isValid ? 'Valid' : 'Invalid'}</div>
                <div>Recoverable: {validationResult.recoverable.toString()}</div>
                <div>Errors found: {validationResult.errors.length}</div>
                {validationResult.errors.map((error, index) => (
                  <div key={index}>- {error}</div>
                ))}
                <div>Suggestions: {validationResult.suggestions.length}</div>
                {validationResult.suggestions.map((suggestion, index) => (
                  <div key={index}>• {suggestion}</div>
                ))}
              </div>
            )}
            
            {processResult && (
              <div>
                <div>Recovery successful: {processResult.message}</div>
                <div>Records processed: {processResult.recordsProcessed}</div>
                <div>Records skipped: {processResult.recordsSkipped}</div>
                {processResult.warnings.map((warning, index) => (
                  <div key={index}>Warning: {warning}</div>
                ))}
              </div>
            )}
            
            {error && (
              <div role="alert">Processing failed: {error}</div>
            )}
          </div>
        );
      };

      render(
        <TestWrapper store={store}>
          <TestComponent />
        </TestWrapper>
      );

      const processBtn = screen.getByTestId("process-corrupted-btn");
      fireEvent.click(processBtn);

      await waitFor(() => {
        expect(screen.getByText("File validation: Invalid")).toBeInTheDocument();
        expect(screen.getByText("Recoverable: true")).toBeInTheDocument();
        expect(screen.getByText("Errors found: 3")).toBeInTheDocument();
        expect(screen.getByText("- Missing required column: taxAmount")).toBeInTheDocument();
        expect(screen.getByText("- Invalid data format in row 2")).toBeInTheDocument();
        expect(screen.getByText("- Inconsistent column count")).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText("Recovery successful: Processed with data recovery")).toBeInTheDocument();
        expect(screen.getByText("Records processed: 1")).toBeInTheDocument();
        expect(screen.getByText("Records skipped: 1")).toBeInTheDocument();
        expect(screen.getByText("Warning: Skipped 1 invalid row")).toBeInTheDocument();
      });
    });
  });

  describe("Validation Service Error Handling", () => {
    it("should handle validation service timeouts with circuit breaker", async () => {
      let callCount = 0;
      const maxFailures = 3;
      let circuitOpen = false;

      mockServices.validationService.validateRecords.mockImplementation(() => {
        callCount++;
        
        if (circuitOpen) {
          return Promise.reject(new Error('Circuit breaker is open'));
        }
        
        if (callCount <= maxFailures) {
          return Promise.reject(errorScenarios.networkError);
        }
        
        // Reset circuit breaker after successful call
        circuitOpen = false;
        callCount = 0;
        return Promise.resolve({
          success: true,
          recordsValidated: 10,
          message: 'Validation completed after circuit breaker reset'
        });
      });

      const TestComponent = () => {
        const [status, setStatus] = React.useState('idle');
        const [result, setResult] = React.useState(null);
        const [error, setError] = React.useState(null);
        const [failureCount, setFailureCount] = React.useState(0);

        const handleValidationWithCircuitBreaker = async () => {
          setStatus('validating');
          setError(null);
          
          try {
            const result = await mockServices.validationService.validateRecords();
            setResult(result);
            setStatus('completed');
            setFailureCount(0);
          } catch (err) {
            const newFailureCount = failureCount + 1;
            setFailureCount(newFailureCount);
            
            if (newFailureCount >= maxFailures) {
              circuitOpen = true;
              setError(`Circuit breaker opened after ${maxFailures} failures`);
              setStatus('circuit-open');
              
              // Auto-reset circuit breaker after delay
              setTimeout(() => {
                circuitOpen = false;
                setStatus('idle');
                setError(null);
              }, 3000);
            } else {
              setError(`Validation failed (${newFailureCount}/${maxFailures}): ${err.message}`);
              setStatus('failed');
            }
          }
        };

        return (
          <div>
            <button 
              onClick={handleValidationWithCircuitBreaker} 
              data-testid="validate-with-cb-btn"
              disabled={status === 'circuit-open'}
            >
              Validate with Circuit Breaker
            </button>
            
            <div>Status: {status}</div>
            <div>Failure count: {failureCount}</div>
            
            {error && (
              <div role="alert">Error: {error}</div>
            )}
            
            {result && (
              <div>
                <div>Success: {result.message}</div>
                <div>Records validated: {result.recordsValidated}</div>
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

      const validateBtn = screen.getByTestId("validate-with-cb-btn");

      // First failure
      fireEvent.click(validateBtn);
      await waitFor(() => {
        expect(screen.getByText("Status: failed")).toBeInTheDocument();
        expect(screen.getByText("Failure count: 1")).toBeInTheDocument();
      });

      // Second failure
      fireEvent.click(validateBtn);
      await waitFor(() => {
        expect(screen.getByText("Failure count: 2")).toBeInTheDocument();
      });

      // Third failure - circuit breaker opens
      fireEvent.click(validateBtn);
      await waitFor(() => {
        expect(screen.getByText("Status: circuit-open")).toBeInTheDocument();
        expect(screen.getByText("Failure count: 3")).toBeInTheDocument();
        expect(screen.getByRole("alert")).toHaveTextContent("Circuit breaker opened after 3 failures");
      });

      // Button should be disabled when circuit is open
      expect(validateBtn).toBeDisabled();

      // Wait for circuit breaker to reset
      await waitFor(() => {
        expect(screen.getByText("Status: idle")).toBeInTheDocument();
        expect(validateBtn).not.toBeDisabled();
      }, { timeout: 4000 });

      // Should succeed after reset
      fireEvent.click(validateBtn);
      await waitFor(() => {
        expect(screen.getByText("Success: Validation completed after circuit breaker reset")).toBeInTheDocument();
        expect(screen.getByText("Records validated: 10")).toBeInTheDocument();
      });
    });

    it("should handle partial validation failures with rollback", async () => {
      const batchData = Array.from({ length: 100 }, (_, i) => ({
        id: `INV_${i + 1}`,
        amount: 100 + i
      }));

      mockServices.validationService.validateRecords.mockImplementation((records, options) => {
        const { batchSize = 10 } = options || {};
        
        return new Promise((resolve, reject) => {
          let processed = 0;
          const results = [];
          
          const processBatch = () => {
            const batch = records.slice(processed, processed + batchSize);
            
            // Simulate failure at 50% completion
            if (processed >= 50) {
              reject(new Error(`Validation failed at record ${processed + 1}`));
              return;
            }
            
            // Process current batch
            batch.forEach(record => {
              results.push({
                recordId: record.id,
                isValid: true,
                processedAt: new Date().toISOString()
              });
            });
            
            processed += batch.length;
            
            if (options?.onProgress) {
              options.onProgress({
                processed,
                total: records.length,
                progress: (processed / records.length) * 100
              });
            }
            
            if (processed < records.length) {
              setTimeout(processBatch, 100);
            } else {
              resolve({
                success: true,
                results,
                recordsValidated: processed
              });
            }
          };
          
          processBatch();
        });
      });

      const TestComponent = () => {
        const [progress, setProgress] = React.useState(null);
        const [result, setResult] = React.useState(null);
        const [error, setError] = React.useState(null);
        const [rollbackStatus, setRollbackStatus] = React.useState(null);

        const handleBatchValidation = async () => {
          setError(null);
          setResult(null);
          setRollbackStatus(null);
          
          try {
            const validationResult = await mockServices.validationService.validateRecords(
              batchData,
              {
                batchSize: 10,
                onProgress: setProgress
              }
            );
            setResult(validationResult);
          } catch (err) {
            setError(err.message);
            
            // Simulate rollback process
            setRollbackStatus('Rolling back partial changes...');
            setTimeout(() => {
              setRollbackStatus('Rollback completed - no changes persisted');
            }, 1000);
          }
        };

        return (
          <div>
            <button onClick={handleBatchValidation} data-testid="batch-validate-btn">
              Validate Batch with Rollback
            </button>
            
            {progress && (
              <div>
                <div>Progress: {progress.progress.toFixed(1)}%</div>
                <div>Processed: {progress.processed}/{progress.total}</div>
              </div>
            )}
            
            {error && (
              <div role="alert">
                <div>Validation Error: {error}</div>
              </div>
            )}
            
            {rollbackStatus && (
              <div>
                <div>Rollback Status: {rollbackStatus}</div>
              </div>
            )}
            
            {result && (
              <div>
                <div>Batch validation completed</div>
                <div>Records validated: {result.recordsValidated}</div>
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

      const validateBtn = screen.getByTestId("batch-validate-btn");
      fireEvent.click(validateBtn);

      // Should show progress
      await waitFor(() => {
        expect(screen.getByText(/Progress: \d+\.\d+%/)).toBeInTheDocument();
      });

      // Should show progress up to failure point
      await waitFor(() => {
        expect(screen.getByText("Processed: 50/100")).toBeInTheDocument();
      });

      // Should show error and rollback
      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent("Validation Error: Validation failed at record 51");
        expect(screen.getByText("Rollback Status: Rolling back partial changes...")).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText("Rollback Status: Rollback completed - no changes persisted")).toBeInTheDocument();
      });
    });
  });

  describe("Report Generation Error Recovery", () => {
    it("should handle report generation failures with alternative formats", async () => {
      const mockReportData = {
        summary: { totalRecords: 100, validRecords: 95 },
        records: Array.from({ length: 100 }, (_, i) => ({ id: `INV_${i + 1}` }))
      };

      mockServices.reportService.generateReport.mockImplementation((data, options) => {
        const { format } = options;
        
        if (format === 'pdf') {
          return Promise.reject(new Error('PDF generation service unavailable'));
        } else if (format === 'excel') {
          return Promise.reject(new Error('Excel export library error'));
        } else if (format === 'csv') {
          return Promise.resolve({
            success: true,
            format: 'csv',
            downloadUrl: 'blob:csv-fallback-url',
            message: 'Generated CSV as fallback format'
          });
        }
        
        return Promise.reject(new Error('Unsupported format'));
      });

      const TestComponent = () => {
        const [attempts, setAttempts] = React.useState([]);
        const [result, setResult] = React.useState(null);
        const [currentFormat, setCurrentFormat] = React.useState(null);

        const handleReportGeneration = async () => {
          const formats = ['pdf', 'excel', 'csv'];
          const attemptLog = [];
          
          for (const format of formats) {
            setCurrentFormat(format);
            
            try {
              const reportResult = await mockServices.reportService.generateReport(
                mockReportData,
                { format }
              );
              
              attemptLog.push({ format, status: 'success' });
              setAttempts([...attemptLog]);
              setResult(reportResult);
              return;
            } catch (err) {
              attemptLog.push({ format, status: 'failed', error: err.message });
              setAttempts([...attemptLog]);
            }
          }
          
          setCurrentFormat(null);
        };

        return (
          <div>
            <button onClick={handleReportGeneration} data-testid="generate-report-btn">
              Generate Report with Fallback
            </button>
            
            {currentFormat && (
              <div>Trying format: {currentFormat}</div>
            )}
            
            <div>
              <div>Attempts:</div>
              {attempts.map((attempt, index) => (
                <div key={index}>
                  {attempt.format}: {attempt.status}
                  {attempt.error && ` - ${attempt.error}`}
                </div>
              ))}
            </div>
            
            {result && (
              <div>
                <div>Report generated successfully</div>
                <div>Format: {result.format}</div>
                <div>Message: {result.message}</div>
                <a href={result.downloadUrl} data-testid="download-link">
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

      const generateBtn = screen.getByTestId("generate-report-btn");
      fireEvent.click(generateBtn);

      // Should try PDF first
      await waitFor(() => {
        expect(screen.getByText("Trying format: pdf")).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText("pdf: failed - PDF generation service unavailable")).toBeInTheDocument();
      });

      // Should try Excel next
      await waitFor(() => {
        expect(screen.getByText("Trying format: excel")).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText("excel: failed - Excel export library error")).toBeInTheDocument();
      });

      // Should succeed with CSV
      await waitFor(() => {
        expect(screen.getByText("Trying format: csv")).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText("csv: success")).toBeInTheDocument();
        expect(screen.getByText("Report generated successfully")).toBeInTheDocument();
        expect(screen.getByText("Format: csv")).toBeInTheDocument();
        expect(screen.getByText("Message: Generated CSV as fallback format")).toBeInTheDocument();
        expect(screen.getByTestId("download-link")).toHaveAttribute('href', 'blob:csv-fallback-url');
      });
    });
  });
});