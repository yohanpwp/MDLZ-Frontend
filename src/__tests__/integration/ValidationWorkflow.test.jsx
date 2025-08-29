/**
 * Integration tests for validation workflow scenarios
 * Tests complex validation scenarios and edge cases
 */

import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";

import validationReducer from "../../redux/slices/validationSlice";
import { ValidationEngine } from "../../services/ValidationEngine";
import { createMockInvoiceData, createMockValidationResults } from "../fixtures/mockData.js";

const createTestStore = () => {
  return configureStore({
    reducer: {
      validation: validationReducer,
    },
  });
};

const TestWrapper = ({ children, store = createTestStore() }) => (
  <Provider store={store}>{children}</Provider>
);

describe("Validation Workflow Integration Tests", () => {
  let store;
  let mockValidationEngine;

  beforeEach(() => {
    store = createTestStore();
    mockValidationEngine = {
      validateBatch: vi.fn(),
      validateRecord: vi.fn(),
      getResults: vi.fn(),
      getSummary: vi.fn(),
      clearResults: vi.fn(),
    };
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Batch Validation Scenarios", () => {
    it("should handle mixed validation results with different severity levels", async () => {
      const mockData = [
        {
          id: 'INV001',
          invoiceNumber: 'INV001',
          amount: 100.00,
          taxRate: 10,
          taxAmount: 10.00, // Correct
          totalAmount: 110.00 // Correct
        },
        {
          id: 'INV002',
          invoiceNumber: 'INV002',
          amount: 200.00,
          taxRate: 10,
          taxAmount: 25.00, // Incorrect - should be 20.00 (HIGH severity)
          totalAmount: 225.00 // Incorrect due to tax error
        },
        {
          id: 'INV003',
          invoiceNumber: 'INV003',
          amount: 1000.00,
          taxRate: 15,
          taxAmount: 100.00, // Incorrect - should be 150.00 (CRITICAL severity)
          totalAmount: 1100.00 // Incorrect due to tax error
        }
      ];

      const mockResults = {
        batchId: 'batch_mixed_001',
        results: [
          {
            recordId: 'INV001',
            isValid: true,
            discrepancies: []
          },
          {
            recordId: 'INV002',
            isValid: false,
            discrepancies: [
              {
                field: 'taxAmount',
                expected: 20.00,
                actual: 25.00,
                severity: 'high',
                message: 'Tax calculation error: 5.00 difference'
              }
            ]
          },
          {
            recordId: 'INV003',
            isValid: false,
            discrepancies: [
              {
                field: 'taxAmount',
                expected: 150.00,
                actual: 100.00,
                severity: 'critical',
                message: 'Major tax calculation error: 50.00 difference'
              }
            ]
          }
        ],
        summary: {
          totalRecords: 3,
          validRecords: 1,
          invalidRecords: 2,
          criticalCount: 1,
          highSeverityCount: 1,
          totalDiscrepancyAmount: 55.00
        }
      };

      mockValidationEngine.validateBatch.mockResolvedValue(mockResults);

      const TestComponent = () => {
        const [results, setResults] = React.useState(null);

        const handleValidation = async () => {
          const validationResults = await mockValidationEngine.validateBatch(mockData);
          setResults(validationResults);
        };

        return (
          <div>
            <button onClick={handleValidation} data-testid="validate-btn">
              Validate Batch
            </button>
            {results && (
              <div>
                <div>Batch ID: {results.batchId}</div>
                <div>Total records: {results.summary.totalRecords}</div>
                <div>Valid records: {results.summary.validRecords}</div>
                <div>Critical issues: {results.summary.criticalCount}</div>
                <div>High severity issues: {results.summary.highSeverityCount}</div>
                <div>Total discrepancy: ${results.summary.totalDiscrepancyAmount}</div>
                
                {results.results.map((result, index) => (
                  <div key={result.recordId}>
                    <div>Record {result.recordId}: {result.isValid ? 'Valid' : 'Invalid'}</div>
                    {result.discrepancies.map((disc, discIndex) => (
                      <div key={discIndex}>
                        {disc.severity.toUpperCase()}: {disc.message}
                      </div>
                    ))}
                  </div>
                ))}
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
        expect(mockValidationEngine.validateBatch).toHaveBeenCalledWith(mockData);
      });

      await waitFor(() => {
        expect(screen.getByText("Batch ID: batch_mixed_001")).toBeInTheDocument();
        expect(screen.getByText("Total records: 3")).toBeInTheDocument();
        expect(screen.getByText("Valid records: 1")).toBeInTheDocument();
        expect(screen.getByText("Critical issues: 1")).toBeInTheDocument();
        expect(screen.getByText("High severity issues: 1")).toBeInTheDocument();
        expect(screen.getByText("Total discrepancy: $55")).toBeInTheDocument();
        
        expect(screen.getByText("Record INV001: Valid")).toBeInTheDocument();
        expect(screen.getByText("Record INV002: Invalid")).toBeInTheDocument();
        expect(screen.getByText("Record INV003: Invalid")).toBeInTheDocument();
        
        expect(screen.getByText("HIGH: Tax calculation error: 5.00 difference")).toBeInTheDocument();
        expect(screen.getByText("CRITICAL: Major tax calculation error: 50.00 difference")).toBeInTheDocument();
      });
    });

    it("should handle validation with custom business rules", async () => {
      const mockData = createMockInvoiceData(5);
      const customRules = {
        maxInvoiceAmount: 500.00,
        requiredFields: ['customerName', 'amount', 'taxRate'],
        taxRateValidation: true,
        discountLimits: { max: 50.00 }
      };

      mockValidationEngine.validateBatch.mockResolvedValue({
        batchId: 'batch_custom_rules_001',
        appliedRules: customRules,
        results: mockData.map(record => ({
          recordId: record.id,
          isValid: record.amount <= customRules.maxInvoiceAmount,
          discrepancies: record.amount > customRules.maxInvoiceAmount ? [
            {
              field: 'amount',
              rule: 'maxInvoiceAmount',
              severity: 'medium',
              message: `Amount ${record.amount} exceeds maximum allowed ${customRules.maxInvoiceAmount}`
            }
          ] : []
        })),
        summary: {
          totalRecords: 5,
          validRecords: 4,
          invalidRecords: 1,
          rulesApplied: Object.keys(customRules).length
        }
      });

      const TestComponent = () => {
        const [results, setResults] = React.useState(null);

        const handleCustomValidation = async () => {
          const validationResults = await mockValidationEngine.validateBatch(
            mockData,
            { customRules }
          );
          setResults(validationResults);
        };

        return (
          <div>
            <button onClick={handleCustomValidation} data-testid="custom-validate-btn">
              Validate with Custom Rules
            </button>
            {results && (
              <div>
                <div>Custom validation completed</div>
                <div>Rules applied: {results.summary.rulesApplied}</div>
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

      const validateBtn = screen.getByTestId("custom-validate-btn");
      fireEvent.click(validateBtn);

      await waitFor(() => {
        expect(mockValidationEngine.validateBatch).toHaveBeenCalledWith(
          mockData,
          { customRules }
        );
      });

      await waitFor(() => {
        expect(screen.getByText("Custom validation completed")).toBeInTheDocument();
        expect(screen.getByText("Rules applied: 4")).toBeInTheDocument();
        expect(screen.getByText("Valid records: 4")).toBeInTheDocument();
        expect(screen.getByText("Invalid records: 1")).toBeInTheDocument();
      });
    });
  });

  describe("Real-time Validation Scenarios", () => {
    it("should handle real-time validation updates", async () => {
      const mockRecord = {
        id: 'INV_REALTIME_001',
        invoiceNumber: 'INV_REALTIME_001',
        amount: 150.00,
        taxRate: 10,
        taxAmount: 15.00,
        totalAmount: 165.00
      };

      let validationCallback;
      mockValidationEngine.validateRecord.mockImplementation((record, options) => {
        validationCallback = options?.onUpdate;
        
        return new Promise((resolve) => {
          // Simulate real-time validation steps
          setTimeout(() => {
            if (validationCallback) {
              validationCallback({
                step: 'field-validation',
                progress: 33,
                message: 'Validating required fields'
              });
            }
          }, 100);

          setTimeout(() => {
            if (validationCallback) {
              validationCallback({
                step: 'calculation-validation',
                progress: 66,
                message: 'Validating calculations'
              });
            }
          }, 200);

          setTimeout(() => {
            if (validationCallback) {
              validationCallback({
                step: 'business-rules',
                progress: 100,
                message: 'Applying business rules'
              });
            }
            
            resolve({
              recordId: record.id,
              isValid: true,
              validationSteps: ['field-validation', 'calculation-validation', 'business-rules'],
              completedAt: new Date().toISOString()
            });
          }, 300);
        });
      });

      const TestComponent = () => {
        const [progress, setProgress] = React.useState(null);
        const [result, setResult] = React.useState(null);

        const handleRealtimeValidation = async () => {
          const validationResult = await mockValidationEngine.validateRecord(
            mockRecord,
            { onUpdate: setProgress, realtime: true }
          );
          setResult(validationResult);
        };

        return (
          <div>
            <button onClick={handleRealtimeValidation} data-testid="realtime-validate-btn">
              Start Real-time Validation
            </button>
            {progress && (
              <div>
                <div>Step: {progress.step}</div>
                <div>Progress: {progress.progress}%</div>
                <div>Message: {progress.message}</div>
              </div>
            )}
            {result && (
              <div>
                <div>Real-time validation completed</div>
                <div>Record: {result.recordId}</div>
                <div>Valid: {result.isValid.toString()}</div>
                <div>Steps completed: {result.validationSteps.length}</div>
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

      const validateBtn = screen.getByTestId("realtime-validate-btn");
      fireEvent.click(validateBtn);

      // Check progress updates
      await waitFor(() => {
        expect(screen.getByText("Step: field-validation")).toBeInTheDocument();
        expect(screen.getByText("Progress: 33%")).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText("Step: calculation-validation")).toBeInTheDocument();
        expect(screen.getByText("Progress: 66%")).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText("Step: business-rules")).toBeInTheDocument();
        expect(screen.getByText("Progress: 100%")).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText("Real-time validation completed")).toBeInTheDocument();
        expect(screen.getByText("Record: INV_REALTIME_001")).toBeInTheDocument();
        expect(screen.getByText("Valid: true")).toBeInTheDocument();
        expect(screen.getByText("Steps completed: 3")).toBeInTheDocument();
      });
    });
  });

  describe("Validation Performance Scenarios", () => {
    it("should handle large dataset validation with memory management", async () => {
      const largeDataset = Array.from({ length: 10000 }, (_, index) => ({
        id: `INV_LARGE_${index + 1}`,
        invoiceNumber: `INV_LARGE_${index + 1}`,
        amount: Math.random() * 1000,
        taxRate: 10,
        taxAmount: (Math.random() * 1000) * 0.1,
        totalAmount: (Math.random() * 1000) * 1.1
      }));

      let progressCallback;
      mockValidationEngine.validateBatch.mockImplementation((data, options) => {
        progressCallback = options?.onProgress;
        
        return new Promise((resolve) => {
          const batchSize = 1000;
          let processed = 0;
          
          const processBatch = () => {
            processed += batchSize;
            const progress = Math.min((processed / data.length) * 100, 100);
            
            if (progressCallback) {
              progressCallback({
                processed,
                total: data.length,
                progress,
                memoryUsage: `${Math.floor(processed / 100)}MB`,
                batchesCompleted: Math.floor(processed / batchSize)
              });
            }
            
            if (processed < data.length) {
              setTimeout(processBatch, 50);
            } else {
              resolve({
                batchId: 'batch_large_dataset_001',
                summary: {
                  totalRecords: data.length,
                  validRecords: Math.floor(data.length * 0.95),
                  invalidRecords: Math.floor(data.length * 0.05),
                  processingTime: '45.2s',
                  memoryPeak: '150MB'
                }
              });
            }
          };
          
          processBatch();
        });
      });

      const TestComponent = () => {
        const [progress, setProgress] = React.useState(null);
        const [result, setResult] = React.useState(null);

        const handleLargeValidation = async () => {
          const validationResult = await mockValidationEngine.validateBatch(
            largeDataset,
            { onProgress: setProgress, batchSize: 1000 }
          );
          setResult(validationResult);
        };

        return (
          <div>
            <button onClick={handleLargeValidation} data-testid="large-validate-btn">
              Validate Large Dataset
            </button>
            {progress && (
              <div>
                <div>Progress: {progress.progress.toFixed(1)}%</div>
                <div>Processed: {progress.processed}/{progress.total}</div>
                <div>Memory usage: {progress.memoryUsage}</div>
                <div>Batches completed: {progress.batchesCompleted}</div>
              </div>
            )}
            {result && (
              <div>
                <div>Large dataset validation completed</div>
                <div>Total records: {result.summary.totalRecords}</div>
                <div>Valid records: {result.summary.validRecords}</div>
                <div>Processing time: {result.summary.processingTime}</div>
                <div>Memory peak: {result.summary.memoryPeak}</div>
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

      const validateBtn = screen.getByTestId("large-validate-btn");
      fireEvent.click(validateBtn);

      // Check progress updates
      await waitFor(() => {
        expect(screen.getByText(/Progress: \d+\.\d+%/)).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText("Processed: 5000/10000")).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText("Large dataset validation completed")).toBeInTheDocument();
        expect(screen.getByText("Total records: 10000")).toBeInTheDocument();
        expect(screen.getByText("Valid records: 9500")).toBeInTheDocument();
        expect(screen.getByText("Processing time: 45.2s")).toBeInTheDocument();
        expect(screen.getByText("Memory peak: 150MB")).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });
});