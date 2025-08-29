/**
 * Integration tests for complete file processing workflows
 * Tests the end-to-end flow from file upload through validation to report generation
 *
 * Requirements covered:
 * - 1.1: File upload and processing for CSV and TXT files
 * - 1.2: File format validation and error handling
 * - 2.1: Automatic validation calculations and discrepancy detection
 * - 2.4: Validation results display and management
 * - 5.1: Report generation from validation results
 */

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

// Components
import FileUploader from "../../components/file-upload/FileUploader";
import ValidationDashboard from "../../components/validation/ValidationDashboard";
import ReportGenerator from "../../components/reports/ReportGenerator";

// Services and utilities
import { ValidationEngine } from "../../services/ValidationEngine";
import { FileValidator } from "../../utils/FileValidator";
import { CsvParser } from "../../utils/CsvParser";
import { TxtParser } from "../../utils/TxtParser";
import ReportService from "../../services/ReportService";

// Test data
const createMockCsvFile = (
  content = "invoiceNumber,customerName,amount,taxAmount,totalAmount\nINV001,Customer A,100.00,10.00,110.00\nINV002,Customer B,200.00,20.00,220.00"
) => {
  return new File([content], "test-invoices.csv", { type: "text/csv" });
};

const createMockTxtFile = (
  content = "INV001|Customer A|100.00|10.00|110.00\nINV002|Customer B|200.00|20.00|220.00"
) => {
  return new File([content], "test-invoices.txt", { type: "text/plain" });
};

const createInvalidFile = () => {
  return new File(["invalid content"], "test.pdf", { type: "application/pdf" });
};

// Mock store setup
const createTestStore = () => {
  return configureStore({
    reducer: {
      fileProcessing: fileProcessingReducer,
      validation: validationReducer,
    },
  });
};

// Test wrapper component
const TestWrapper = ({ children, store = createTestStore() }) => (
  <Provider store={store}>{children}</Provider>
);

describe("FileProcessingWorkflows Integration Tests", () => {
  let mockValidationEngine;
  let mockReportService;
  let store;

  beforeEach(() => {
    store = createTestStore();

    // Mock ValidationEngine
    mockValidationEngine = {
      validateInvoiceData: vi.fn(),
      calculateDiscrepancies: vi.fn(),
      generateValidationReport: vi.fn(),
    };

    // Mock ReportService
    mockReportService = {
      generateReport: vi.fn(),
      exportToPdf: vi.fn(),
      exportToCsv: vi.fn(),
    };

    // Mock file reading
    global.FileReader = class {
      constructor() {
        this.readAsText = vi.fn();
        this.onload = null;
        this.onerror = null;
      }
    };

    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Complete File Upload to Validation Flow", () => {
    it("should successfully process CSV file through complete workflow", async () => {
      const user = userEvent.setup();
      const csvFile = createMockCsvFile();

      // Mock successful validation results
      const mockValidationResults = {
        totalRecords: 2,
        validRecords: 2,
        invalidRecords: 0,
        discrepancies: [],
        summary: {
          totalAmount: 330.0,
          totalTax: 30.0,
          calculatedTotal: 330.0,
        },
      };

      mockValidationEngine.validateInvoiceData.mockResolvedValue(
        mockValidationResults
      );

      render(
        <TestWrapper store={store}>
          <FileUploader />
          <ValidationDashboard />
        </TestWrapper>
      );

      // Upload file
      const fileInput = screen.getByLabelText(/upload file/i);
      await user.upload(fileInput, csvFile);

      // Wait for file processing
      await waitFor(() => {
        expect(screen.getByText(/processing/i)).toBeInTheDocument();
      });

      // Simulate file reading completion
      const fileReader = new FileReader();
      act(() => {
        fileReader.onload({ target: { result: csvFile.content } });
      });

      // Wait for validation to complete
      await waitFor(() => {
        expect(mockValidationEngine.validateInvoiceData).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              invoiceNumber: "INV001",
              customerName: "Customer A",
              amount: 100.0,
            }),
          ])
        );
      });

      // Verify validation results are displayed
      await waitFor(() => {
        expect(screen.getByText(/validation complete/i)).toBeInTheDocument();
        expect(screen.getByText(/2 records processed/i)).toBeInTheDocument();
        expect(screen.getByText(/0 discrepancies found/i)).toBeInTheDocument();
      });
    });

    it("should handle TXT file processing with validation", async () => {
      const user = userEvent.setup();
      const txtFile = createMockTxtFile();

      const mockValidationResults = {
        totalRecords: 2,
        validRecords: 1,
        invalidRecords: 1,
        discrepancies: [
          {
            recordId: "INV002",
            type: "calculation_error",
            expected: 220.0,
            actual: 200.0,
            message: "Total amount does not match sum of amount and tax",
          },
        ],
        summary: {
          totalAmount: 300.0,
          totalTax: 30.0,
          calculatedTotal: 330.0,
        },
      };

      mockValidationEngine.validateInvoiceData.mockResolvedValue(
        mockValidationResults
      );

      render(
        <TestWrapper store={store}>
          <FileUploader />
          <ValidationDashboard />
        </TestWrapper>
      );

      const fileInput = screen.getByLabelText(/upload file/i);
      await user.upload(fileInput, txtFile);

      await waitFor(() => {
        expect(screen.getByText(/processing/i)).toBeInTheDocument();
      });

      // Simulate successful file processing
      act(() => {
        const fileReader = new FileReader();
        fileReader.onload({ target: { result: txtFile.content } });
      });

      await waitFor(() => {
        expect(mockValidationEngine.validateInvoiceData).toHaveBeenCalled();
      });

      // Verify discrepancy detection
      await waitFor(() => {
        expect(screen.getByText(/1 discrepancy found/i)).toBeInTheDocument();
        expect(screen.getByText(/calculation_error/i)).toBeInTheDocument();
      });
    });
  });

  describe("Error Handling in File Processing Pipeline", () => {
    it("should handle invalid file format errors", async () => {
      const user = userEvent.setup();
      const invalidFile = createInvalidFile();

      render(
        <TestWrapper store={store}>
          <FileUploader />
        </TestWrapper>
      );

      const fileInput = screen.getByLabelText(/upload file/i);
      await user.upload(fileInput, invalidFile);

      await waitFor(() => {
        expect(
          screen.getByText(/unsupported file format/i)
        ).toBeInTheDocument();
        expect(
          screen.getByText(/only csv and txt files are supported/i)
        ).toBeInTheDocument();
      });
    });

    it("should handle file reading errors", async () => {
      const user = userEvent.setup();
      const csvFile = createMockCsvFile();

      render(
        <TestWrapper store={store}>
          <FileUploader />
        </TestWrapper>
      );

      const fileInput = screen.getByLabelText(/upload file/i);
      await user.upload(fileInput, csvFile);

      // Simulate file reading error
      act(() => {
        const fileReader = new FileReader();
        fileReader.onerror({
          target: { error: new Error("File read failed") },
        });
      });

      await waitFor(() => {
        expect(screen.getByText(/error reading file/i)).toBeInTheDocument();
        expect(screen.getByText(/file read failed/i)).toBeInTheDocument();
      });
    });

    it("should handle validation engine errors", async () => {
      const user = userEvent.setup();
      const csvFile = createMockCsvFile();

      mockValidationEngine.validateInvoiceData.mockRejectedValue(
        new Error("Validation service unavailable")
      );

      render(
        <TestWrapper store={store}>
          <FileUploader />
          <ValidationDashboard />
        </TestWrapper>
      );

      const fileInput = screen.getByLabelText(/upload file/i);
      await user.upload(fileInput, csvFile);

      // Simulate successful file reading
      act(() => {
        const fileReader = new FileReader();
        fileReader.onload({ target: { result: csvFile.content } });
      });

      await waitFor(() => {
        expect(screen.getByText(/validation failed/i)).toBeInTheDocument();
        expect(
          screen.getByText(/validation service unavailable/i)
        ).toBeInTheDocument();
      });
    });

    it("should handle malformed CSV data", async () => {
      const user = userEvent.setup();
      const malformedCsv = createMockCsvFile(
        "invalid,csv,data\nmissing,fields"
      );

      render(
        <TestWrapper store={store}>
          <FileUploader />
        </TestWrapper>
      );

      const fileInput = screen.getByLabelText(/upload file/i);
      await user.upload(fileInput, malformedCsv);

      act(() => {
        const fileReader = new FileReader();
        fileReader.onload({
          target: { result: "invalid,csv,data\nmissing,fields" },
        });
      });

      await waitFor(() => {
        expect(screen.getByText(/invalid file format/i)).toBeInTheDocument();
        expect(
          screen.getByText(/missing required columns/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe("Validation Engine Integration", () => {
    it("should integrate with validation engine for discrepancy detection", async () => {
      const testData = [
        {
          invoiceNumber: "INV001",
          customerName: "Customer A",
          amount: 100.0,
          taxAmount: 10.0,
          totalAmount: 110.0,
        },
        {
          invoiceNumber: "INV002",
          customerName: "Customer B",
          amount: 200.0,
          taxAmount: 20.0,
          totalAmount: 215.0, // Incorrect total
        },
      ];

      const mockResults = {
        totalRecords: 2,
        validRecords: 1,
        invalidRecords: 1,
        discrepancies: [
          {
            recordId: "INV002",
            type: "calculation_error",
            field: "totalAmount",
            expected: 220.0,
            actual: 215.0,
            message: "Total amount calculation error",
          },
        ],
      };

      mockValidationEngine.validateInvoiceData.mockResolvedValue(mockResults);

      render(
        <TestWrapper store={store}>
          <ValidationDashboard />
        </TestWrapper>
      );

      // Simulate validation trigger
      fireEvent.click(screen.getByText(/validate data/i));

      await waitFor(() => {
        expect(mockValidationEngine.validateInvoiceData).toHaveBeenCalledWith(
          testData
        );
      });

      await waitFor(() => {
        expect(screen.getByText(/1 discrepancy found/i)).toBeInTheDocument();
        expect(screen.getByText(/calculation_error/i)).toBeInTheDocument();
        expect(screen.getByText(/INV002/i)).toBeInTheDocument();
      });
    });

    it("should handle validation engine timeout", async () => {
      mockValidationEngine.validateInvoiceData.mockImplementation(
        () =>
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Validation timeout")), 100)
          )
      );

      render(
        <TestWrapper store={store}>
          <ValidationDashboard />
        </TestWrapper>
      );

      fireEvent.click(screen.getByText(/validate data/i));

      await waitFor(
        () => {
          expect(screen.getByText(/validation timeout/i)).toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    });
  });

  describe("Report Generation Integration", () => {
    it("should generate reports from validation results", async () => {
      const mockValidationResults = {
        totalRecords: 10,
        validRecords: 8,
        invalidRecords: 2,
        discrepancies: [
          {
            recordId: "INV003",
            type: "missing_data",
            field: "customerName",
            message: "Customer name is required",
          },
          {
            recordId: "INV007",
            type: "calculation_error",
            field: "totalAmount",
            expected: 150.0,
            actual: 140.0,
            message: "Total amount calculation error",
          },
        ],
        summary: {
          totalAmount: 1500.0,
          totalTax: 150.0,
          calculatedTotal: 1650.0,
        },
      };

      const mockReport = {
        id: "report-123",
        generatedAt: new Date().toISOString(),
        summary: mockValidationResults.summary,
        discrepancies: mockValidationResults.discrepancies,
        metadata: {
          fileName: "test-invoices.csv",
          processedAt: new Date().toISOString(),
        },
      };

      mockReportService.generateReport.mockResolvedValue(mockReport);

      render(
        <TestWrapper store={store}>
          <ReportGenerator validationResults={mockValidationResults} />
        </TestWrapper>
      );

      fireEvent.click(screen.getByText(/generate report/i));

      await waitFor(() => {
        expect(mockReportService.generateReport).toHaveBeenCalledWith(
          mockValidationResults
        );
      });

      await waitFor(() => {
        expect(
          screen.getByText(/report generated successfully/i)
        ).toBeInTheDocument();
        expect(screen.getByText(/10 records processed/i)).toBeInTheDocument();
        expect(screen.getByText(/2 discrepancies found/i)).toBeInTheDocument();
      });
    });

    it("should export reports to different formats", async () => {
      const mockValidationResults = {
        totalRecords: 5,
        validRecords: 5,
        invalidRecords: 0,
        discrepancies: [],
        summary: {
          totalAmount: 500.0,
          totalTax: 50.0,
          calculatedTotal: 550.0,
        },
      };

      mockReportService.exportToPdf.mockResolvedValue("report.pdf");
      mockReportService.exportToCsv.mockResolvedValue("report.csv");

      render(
        <TestWrapper store={store}>
          <ReportGenerator validationResults={mockValidationResults} />
        </TestWrapper>
      );

      // Test PDF export
      fireEvent.click(screen.getByText(/export to pdf/i));
      await waitFor(() => {
        expect(mockReportService.exportToPdf).toHaveBeenCalledWith(
          mockValidationResults
        );
      });

      // Test CSV export
      fireEvent.click(screen.getByText(/export to csv/i));
      await waitFor(() => {
        expect(mockReportService.exportToCsv).toHaveBeenCalledWith(
          mockValidationResults
        );
      });
    });

    it("should handle report generation errors", async () => {
      const mockValidationResults = {
        totalRecords: 1,
        validRecords: 1,
        invalidRecords: 0,
        discrepancies: [],
      };

      mockReportService.generateReport.mockRejectedValue(
        new Error("Report generation failed")
      );

      render(
        <TestWrapper store={store}>
          <ReportGenerator validationResults={mockValidationResults} />
        </TestWrapper>
      );

      fireEvent.click(screen.getByText(/generate report/i));

      await waitFor(() => {
        expect(
          screen.getByText(/report generation failed/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe("End-to-End Workflow Tests", () => {
    it("should complete full workflow from upload to report generation", async () => {
      const user = userEvent.setup();
      const csvFile = createMockCsvFile();

      const mockValidationResults = {
        totalRecords: 2,
        validRecords: 2,
        invalidRecords: 0,
        discrepancies: [],
        summary: {
          totalAmount: 300.0,
          totalTax: 30.0,
          calculatedTotal: 330.0,
        },
      };

      const mockReport = {
        id: "report-456",
        generatedAt: new Date().toISOString(),
        summary: mockValidationResults.summary,
        discrepancies: mockValidationResults.discrepancies,
      };

      mockValidationEngine.validateInvoiceData.mockResolvedValue(
        mockValidationResults
      );
      mockReportService.generateReport.mockResolvedValue(mockReport);

      render(
        <TestWrapper store={store}>
          <FileUploader />
          <ValidationDashboard />
          <ReportGenerator />
        </TestWrapper>
      );

      // Step 1: Upload file
      const fileInput = screen.getByLabelText(/upload file/i);
      await user.upload(fileInput, csvFile);

      // Step 2: Wait for processing
      await waitFor(() => {
        expect(screen.getByText(/processing/i)).toBeInTheDocument();
      });

      // Step 3: Simulate file reading and validation
      act(() => {
        const fileReader = new FileReader();
        fileReader.onload({ target: { result: csvFile.content } });
      });

      await waitFor(() => {
        expect(mockValidationEngine.validateInvoiceData).toHaveBeenCalled();
      });

      // Step 4: Verify validation results
      await waitFor(() => {
        expect(screen.getByText(/validation complete/i)).toBeInTheDocument();
        expect(screen.getByText(/2 records processed/i)).toBeInTheDocument();
      });

      // Step 5: Generate report
      fireEvent.click(screen.getByText(/generate report/i));

      await waitFor(() => {
        expect(mockReportService.generateReport).toHaveBeenCalledWith(
          mockValidationResults
        );
      });

      // Step 6: Verify report generation
      await waitFor(() => {
        expect(
          screen.getByText(/report generated successfully/i)
        ).toBeInTheDocument();
      });
    });

    it("should handle workflow interruption and recovery", async () => {
      const user = userEvent.setup();
      const csvFile = createMockCsvFile();

      // First attempt fails
      mockValidationEngine.validateInvoiceData
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce({
          totalRecords: 2,
          validRecords: 2,
          invalidRecords: 0,
          discrepancies: [],
        });

      render(
        <TestWrapper store={store}>
          <FileUploader />
          <ValidationDashboard />
        </TestWrapper>
      );

      // Upload file
      const fileInput = screen.getByLabelText(/upload file/i);
      await user.upload(fileInput, csvFile);

      // Simulate file reading
      act(() => {
        const fileReader = new FileReader();
        fileReader.onload({ target: { result: csvFile.content } });
      });

      // First validation fails
      await waitFor(() => {
        expect(screen.getByText(/validation failed/i)).toBeInTheDocument();
      });

      // Retry validation
      fireEvent.click(screen.getByText(/retry validation/i));

      // Second attempt succeeds
      await waitFor(() => {
        expect(screen.getByText(/validation complete/i)).toBeInTheDocument();
      });
    });
  });
});
