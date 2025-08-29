/**
 * Integration tests for report generation workflows
 * Tests end-to-end report generation from validation results to export
 */

import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";

import validationReducer from "../../redux/slices/validationSlice";
import ReportService from "../../services/ReportService";
import ExportService from "../../services/ExportService";
import { 
  createMockInvoiceData, 
  createMockValidationResults, 
  createMockReportData
} from "../fixtures/mockData.js";

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

describe("Report Generation Workflow Integration Tests", () => {
  let store;
  let mockReportService;
  let mockExportService;

  beforeEach(() => {
    store = createTestStore();
    
    mockReportService = {
      generateReportData: vi.fn(),
      validateTemplate: vi.fn(),
      getAvailableTemplates: vi.fn(),
      applyFilters: vi.fn(),
      calculateSummaryStatistics: vi.fn(),
    };

    mockExportService = {
      exportReport: vi.fn(),
      getExportProgress: vi.fn(),
      cancelExport: vi.fn(),
      getSupportedFormats: vi.fn(),
      validateExportOptions: vi.fn(),
    };

    // Mock URL methods
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Comprehensive Report Generation", () => {
    it("should generate detailed validation report with all sections", async () => {
      const mockValidationData = createMockInvoiceData(50);
      const mockValidationResults = createMockValidationResults(mockValidationData);
      
      const comprehensiveReportData = {
        reportId: 'report_comprehensive_001',
        generatedAt: new Date().toISOString(),
        template: 'comprehensive',
        sections: {
          executiveSummary: {
            totalRecords: 50,
            validationSuccessRate: 84,
            criticalIssuesCount: 2,
            recommendedActions: 5
          },
          detailedAnalysis: {
            discrepancyBreakdown: {
              taxCalculationErrors: 6,
              totalAmountMismatches: 2,
              missingDataFields: 0
            },
            severityDistribution: {
              critical: 2,
              high: 6,
              medium: 4,
              low: 0
            }
          },
          recordDetails: mockValidationResults.records,
          recommendations: [
            'Implement automated tax calculation validation',
            'Review customer data quality processes',
            'Update validation rules for discount calculations',
            'Establish regular data quality monitoring',
            'Train staff on proper invoice data entry'
          ],
          appendices: {
            validationRules: ['Tax rate validation', 'Amount calculation check'],
            dataQualityMetrics: { completeness: 98, accuracy: 84, consistency: 92 }
          }
        }
      };

      mockReportService.generateReportData.mockResolvedValue({
        success: true,
        reportData: comprehensiveReportData,
        generationTime: '2.3s',
        dataPoints: 250
      });

      const TestComponent = () => {
        const [report, setReport] = React.useState(null);
        const [loading, setLoading] = React.useState(false);

        const handleComprehensiveReport = async () => {
          setLoading(true);
          try {
            const result = await mockReportService.generateReportData({
              validationResults: mockValidationResults,
              template: 'comprehensive',
              includeSections: ['executiveSummary', 'detailedAnalysis', 'recordDetails', 'recommendations', 'appendices'],
              options: {
                includeCharts: true,
                includeRawData: true,
                calculateTrends: true
              }
            });
            setReport(result.reportData);
          } finally {
            setLoading(false);
          }
        };

        return (
          <div>
            <button 
              onClick={handleComprehensiveReport} 
              data-testid="generate-comprehensive-btn"
              disabled={loading}
            >
              {loading ? 'Generating...' : 'Generate Comprehensive Report'}
            </button>
            
            {report && (
              <div>
                <div>Report ID: {report.reportId}</div>
                <div>Template: {report.template}</div>
                
                <div>Executive Summary:</div>
                <div>Total records: {report.sections.executiveSummary.totalRecords}</div>
                <div>Success rate: {report.sections.executiveSummary.validationSuccessRate}%</div>
                <div>Critical issues: {report.sections.executiveSummary.criticalIssuesCount}</div>
                
                <div>Detailed Analysis:</div>
                <div>Tax errors: {report.sections.detailedAnalysis.discrepancyBreakdown.taxCalculationErrors}</div>
                <div>Amount mismatches: {report.sections.detailedAnalysis.discrepancyBreakdown.totalAmountMismatches}</div>
                
                <div>Severity Distribution:</div>
                <div>Critical: {report.sections.detailedAnalysis.severityDistribution.critical}</div>
                <div>High: {report.sections.detailedAnalysis.severityDistribution.high}</div>
                <div>Medium: {report.sections.detailedAnalysis.severityDistribution.medium}</div>
                
                <div>Recommendations: {report.sections.recommendations.length}</div>
                <div>Data Quality - Accuracy: {report.sections.appendices.dataQualityMetrics.accuracy}%</div>
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

      const generateBtn = screen.getByTestId("generate-comprehensive-btn");
      fireEvent.click(generateBtn);

      await waitFor(() => {
        expect(screen.getByText("Generating...")).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(mockReportService.generateReportData).toHaveBeenCalledWith({
          validationResults: mockValidationResults,
          template: 'comprehensive',
          includeSections: ['executiveSummary', 'detailedAnalysis', 'recordDetails', 'recommendations', 'appendices'],
          options: {
            includeCharts: true,
            includeRawData: true,
            calculateTrends: true
          }
        });
      });

      await waitFor(() => {
        expect(screen.getByText("Report ID: report_comprehensive_001")).toBeInTheDocument();
        expect(screen.getByText("Template: comprehensive")).toBeInTheDocument();
        expect(screen.getByText("Total records: 50")).toBeInTheDocument();
        expect(screen.getByText("Success rate: 84%")).toBeInTheDocument();
        expect(screen.getByText("Critical issues: 2")).toBeInTheDocument();
        expect(screen.getByText("Tax errors: 6")).toBeInTheDocument();
        expect(screen.getByText("Amount mismatches: 2")).toBeInTheDocument();
        expect(screen.getByText("Critical: 2")).toBeInTheDocument();
        expect(screen.getByText("High: 6")).toBeInTheDocument();
        expect(screen.getByText("Medium: 4")).toBeInTheDocument();
        expect(screen.getByText("Recommendations: 5")).toBeInTheDocument();
        expect(screen.getByText("Data Quality - Accuracy: 84%")).toBeInTheDocument();
      });
    });

    it("should generate filtered report based on criteria", async () => {
      const mockValidationData = createMockInvoiceData(100);
      const mockValidationResults = createMockValidationResults(mockValidationData);
      
      const reportFilters = {
        dateRange: {
          start: '2024-01-01',
          end: '2024-01-31'
        },
        severity: ['critical', 'high'],
        customerFilter: ['Customer A', 'Customer B'],
        amountRange: {
          min: 100,
          max: 1000
        },
        validationStatus: ['invalid']
      };

      const filteredReportData = {
        reportId: 'report_filtered_001',
        appliedFilters: reportFilters,
        filteredRecordCount: 15,
        originalRecordCount: 100,
        summary: {
          recordsAfterFilter: 15,
          criticalIssues: 3,
          highSeverityIssues: 12,
          totalDiscrepancyAmount: 450.75
        }
      };

      mockReportService.applyFilters.mockResolvedValue({
        success: true,
        filteredData: filteredReportData,
        filterEfficiency: 85 // percentage of records that matched filters
      });

      mockReportService.generateReportData.mockResolvedValue({
        success: true,
        reportData: filteredReportData
      });

      const TestComponent = () => {
        const [filters, setFilters] = React.useState(reportFilters);
        const [report, setReport] = React.useState(null);
        const [filterResult, setFilterResult] = React.useState(null);

        const handleFilteredReport = async () => {
          // First apply filters
          const filterResult = await mockReportService.applyFilters(
            mockValidationResults,
            filters
          );
          setFilterResult(filterResult);
          
          // Then generate report with filtered data
          const reportResult = await mockReportService.generateReportData({
            validationResults: filterResult.filteredData,
            template: 'filtered',
            appliedFilters: filters
          });
          setReport(reportResult.reportData);
        };

        return (
          <div>
            <button onClick={handleFilteredReport} data-testid="generate-filtered-btn">
              Generate Filtered Report
            </button>
            
            <div>Filter Criteria:</div>
            <div>Date range: {filters.dateRange.start} to {filters.dateRange.end}</div>
            <div>Severity: {filters.severity.join(', ')}</div>
            <div>Customers: {filters.customerFilter.join(', ')}</div>
            <div>Amount range: ${filters.amountRange.min} - ${filters.amountRange.max}</div>
            
            {filterResult && (
              <div>
                <div>Filter applied successfully</div>
                <div>Filter efficiency: {filterResult.filterEfficiency}%</div>
              </div>
            )}
            
            {report && (
              <div>
                <div>Filtered Report Generated</div>
                <div>Report ID: {report.reportId}</div>
                <div>Original records: {report.originalRecordCount}</div>
                <div>Filtered records: {report.filteredRecordCount}</div>
                <div>Critical issues: {report.summary.criticalIssues}</div>
                <div>High severity issues: {report.summary.highSeverityIssues}</div>
                <div>Total discrepancy: ${report.summary.totalDiscrepancyAmount}</div>
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

      const generateBtn = screen.getByTestId("generate-filtered-btn");
      fireEvent.click(generateBtn);

      await waitFor(() => {
        expect(mockReportService.applyFilters).toHaveBeenCalledWith(
          mockValidationResults,
          reportFilters
        );
      });

      await waitFor(() => {
        expect(screen.getByText("Filter applied successfully")).toBeInTheDocument();
        expect(screen.getByText("Filter efficiency: 85%")).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText("Filtered Report Generated")).toBeInTheDocument();
        expect(screen.getByText("Report ID: report_filtered_001")).toBeInTheDocument();
        expect(screen.getByText("Original records: 100")).toBeInTheDocument();
        expect(screen.getByText("Filtered records: 15")).toBeInTheDocument();
        expect(screen.getByText("Critical issues: 3")).toBeInTheDocument();
        expect(screen.getByText("High severity issues: 12")).toBeInTheDocument();
        expect(screen.getByText("Total discrepancy: $450.75")).toBeInTheDocument();
      });
    });
  });

  describe("Multi-Format Export Workflows", () => {
    it("should export report to multiple formats simultaneously", async () => {
      const mockReportData = createMockReportData(createMockValidationResults(createMockInvoiceData(25)));
      const exportFormats = ['pdf', 'excel', 'csv'];
      
      const exportResults = {
        pdf: {
          success: true,
          exportId: 'export_pdf_001',
          format: 'pdf',
          downloadUrl: 'blob:pdf-url',
          fileSize: '2.1MB',
          completedAt: new Date().toISOString()
        },
        excel: {
          success: true,
          exportId: 'export_excel_001',
          format: 'excel',
          downloadUrl: 'blob:excel-url',
          fileSize: '1.8MB',
          completedAt: new Date().toISOString()
        },
        csv: {
          success: true,
          exportId: 'export_csv_001',
          format: 'csv',
          downloadUrl: 'blob:csv-url',
          fileSize: '0.5MB',
          completedAt: new Date().toISOString()
        }
      };

      mockExportService.exportReport.mockImplementation(({ format }) => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(exportResults[format]);
          }, 200 * (format === 'pdf' ? 3 : format === 'excel' ? 2 : 1)); // Different completion times
        });
      });

      const TestComponent = () => {
        const [exports, setExports] = React.useState({});
        const [inProgress, setInProgress] = React.useState(new Set());

        const handleMultiFormatExport = async () => {
          const progressSet = new Set(exportFormats);
          setInProgress(progressSet);
          
          const exportPromises = exportFormats.map(async (format) => {
            try {
              const result = await mockExportService.exportReport({
                reportData: mockReportData,
                format,
                template: 'standard'
              });
              
              setExports(prev => ({ ...prev, [format]: result }));
              setInProgress(prev => {
                const newSet = new Set(prev);
                newSet.delete(format);
                return newSet;
              });
              
              return { format, result };
            } catch (error) {
              setExports(prev => ({ ...prev, [format]: { error: error.message } }));
              setInProgress(prev => {
                const newSet = new Set(prev);
                newSet.delete(format);
                return newSet;
              });
              return { format, error };
            }
          });
          
          await Promise.all(exportPromises);
        };

        return (
          <div>
            <button onClick={handleMultiFormatExport} data-testid="multi-export-btn">
              Export to All Formats
            </button>
            
            <div>Export Status:</div>
            {exportFormats.map(format => (
              <div key={format}>
                {format.toUpperCase()}: 
                {inProgress.has(format) && ' In Progress...'}
                {exports[format]?.success && ` Completed - ${exports[format].fileSize}`}
                {exports[format]?.error && ` Failed - ${exports[format].error}`}
                {exports[format]?.downloadUrl && (
                  <a href={exports[format].downloadUrl} data-testid={`download-${format}`}>
                    Download
                  </a>
                )}
              </div>
            ))}
            
            {inProgress.size === 0 && Object.keys(exports).length === exportFormats.length && (
              <div>All exports completed</div>
            )}
          </div>
        );
      };

      render(
        <TestWrapper store={store}>
          <TestComponent />
        </TestWrapper>
      );

      const exportBtn = screen.getByTestId("multi-export-btn");
      fireEvent.click(exportBtn);

      // Should show all formats in progress initially
      await waitFor(() => {
        expect(screen.getByText("PDF: In Progress...")).toBeInTheDocument();
        expect(screen.getByText("EXCEL: In Progress...")).toBeInTheDocument();
        expect(screen.getByText("CSV: In Progress...")).toBeInTheDocument();
      });

      // CSV should complete first (shortest delay)
      await waitFor(() => {
        expect(screen.getByText("CSV: Completed - 0.5MB")).toBeInTheDocument();
        expect(screen.getByTestId("download-csv")).toHaveAttribute('href', 'blob:csv-url');
      });

      // Excel should complete next
      await waitFor(() => {
        expect(screen.getByText("EXCEL: Completed - 1.8MB")).toBeInTheDocument();
        expect(screen.getByTestId("download-excel")).toHaveAttribute('href', 'blob:excel-url');
      });

      // PDF should complete last
      await waitFor(() => {
        expect(screen.getByText("PDF: Completed - 2.1MB")).toBeInTheDocument();
        expect(screen.getByTestId("download-pdf")).toHaveAttribute('href', 'blob:pdf-url');
      });

      await waitFor(() => {
        expect(screen.getByText("All exports completed")).toBeInTheDocument();
      });

      // Verify all export calls were made
      expect(mockExportService.exportReport).toHaveBeenCalledTimes(3);
      exportFormats.forEach(format => {
        expect(mockExportService.exportReport).toHaveBeenCalledWith({
          reportData: mockReportData,
          format,
          template: 'standard'
        });
      });
    });

    it("should handle export with custom templates and options", async () => {
      const mockReportData = createMockReportData(createMockValidationResults(createMockInvoiceData(10)));
      const customExportOptions = {
        template: 'executive-summary',
        options: {
          includeCharts: true,
          includeRawData: false,
          watermark: 'CONFIDENTIAL',
          pageOrientation: 'landscape',
          fontSize: 12,
          colorScheme: 'corporate'
        },
        metadata: {
          author: 'Validation System',
          title: 'Invoice Validation Report',
          subject: 'Monthly Validation Summary',
          keywords: ['validation', 'invoices', 'discrepancies']
        }
      };

      mockExportService.validateExportOptions.mockResolvedValue({
        isValid: true,
        warnings: ['Large dataset may take longer to export'],
        estimatedSize: '3.2MB',
        estimatedTime: '15 seconds'
      });

      mockExportService.exportReport.mockResolvedValue({
        success: true,
        exportId: 'export_custom_001',
        format: 'pdf',
        downloadUrl: 'blob:custom-pdf-url',
        fileSize: '3.1MB',
        appliedOptions: customExportOptions,
        generationTime: '14.2s'
      });

      const TestComponent = () => {
        const [validation, setValidation] = React.useState(null);
        const [exportResult, setExportResult] = React.useState(null);

        const handleCustomExport = async () => {
          // First validate export options
          const validationResult = await mockExportService.validateExportOptions({
            reportData: mockReportData,
            format: 'pdf',
            ...customExportOptions
          });
          setValidation(validationResult);
          
          if (validationResult.isValid) {
            // Proceed with export
            const result = await mockExportService.exportReport({
              reportData: mockReportData,
              format: 'pdf',
              ...customExportOptions
            });
            setExportResult(result);
          }
        };

        return (
          <div>
            <button onClick={handleCustomExport} data-testid="custom-export-btn">
              Export with Custom Options
            </button>
            
            <div>Export Configuration:</div>
            <div>Template: {customExportOptions.template}</div>
            <div>Include charts: {customExportOptions.options.includeCharts.toString()}</div>
            <div>Watermark: {customExportOptions.options.watermark}</div>
            <div>Orientation: {customExportOptions.options.pageOrientation}</div>
            
            {validation && (
              <div>
                <div>Options validation: {validation.isValid ? 'Valid' : 'Invalid'}</div>
                <div>Estimated size: {validation.estimatedSize}</div>
                <div>Estimated time: {validation.estimatedTime}</div>
                {validation.warnings.map((warning, index) => (
                  <div key={index}>Warning: {warning}</div>
                ))}
              </div>
            )}
            
            {exportResult && (
              <div>
                <div>Custom export completed</div>
                <div>Export ID: {exportResult.exportId}</div>
                <div>File size: {exportResult.fileSize}</div>
                <div>Generation time: {exportResult.generationTime}</div>
                <a href={exportResult.downloadUrl} data-testid="download-custom">
                  Download Custom Report
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

      const exportBtn = screen.getByTestId("custom-export-btn");
      fireEvent.click(exportBtn);

      await waitFor(() => {
        expect(mockExportService.validateExportOptions).toHaveBeenCalledWith({
          reportData: mockReportData,
          format: 'pdf',
          ...customExportOptions
        });
      });

      await waitFor(() => {
        expect(screen.getByText("Options validation: Valid")).toBeInTheDocument();
        expect(screen.getByText("Estimated size: 3.2MB")).toBeInTheDocument();
        expect(screen.getByText("Estimated time: 15 seconds")).toBeInTheDocument();
        expect(screen.getByText("Warning: Large dataset may take longer to export")).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(mockExportService.exportReport).toHaveBeenCalledWith({
          reportData: mockReportData,
          format: 'pdf',
          ...customExportOptions
        });
      });

      await waitFor(() => {
        expect(screen.getByText("Custom export completed")).toBeInTheDocument();
        expect(screen.getByText("Export ID: export_custom_001")).toBeInTheDocument();
        expect(screen.getByText("File size: 3.1MB")).toBeInTheDocument();
        expect(screen.getByText("Generation time: 14.2s")).toBeInTheDocument();
        expect(screen.getByTestId("download-custom")).toHaveAttribute('href', 'blob:custom-pdf-url');
      });
    });
  });

  describe("Report Scheduling and Automation", () => {
    it("should handle scheduled report generation", async () => {
      const scheduleConfig = {
        frequency: 'weekly',
        dayOfWeek: 'monday',
        time: '09:00',
        timezone: 'UTC',
        recipients: ['admin@company.com', 'manager@company.com'],
        template: 'weekly-summary',
        autoExport: true,
        exportFormats: ['pdf', 'excel']
      };

      mockReportService.generateReportData.mockResolvedValue({
        success: true,
        reportData: createMockReportData(createMockValidationResults(createMockInvoiceData(100))),
        scheduledGeneration: true,
        scheduleId: 'schedule_weekly_001'
      });

      mockExportService.exportReport.mockImplementation(({ format }) => 
        Promise.resolve({
          success: true,
          exportId: `export_scheduled_${format}_001`,
          format,
          downloadUrl: `blob:scheduled-${format}-url`,
          scheduledExport: true
        })
      );

      const TestComponent = () => {
        const [scheduleResult, setScheduleResult] = React.useState(null);
        const [exports, setExports] = React.useState([]);

        const handleScheduledGeneration = async () => {
          // Simulate scheduled report generation
          const reportResult = await mockReportService.generateReportData({
            template: scheduleConfig.template,
            scheduledGeneration: true,
            scheduleConfig
          });
          
          setScheduleResult(reportResult);
          
          if (scheduleConfig.autoExport) {
            const exportPromises = scheduleConfig.exportFormats.map(async (format) => {
              const exportResult = await mockExportService.exportReport({
                reportData: reportResult.reportData,
                format,
                scheduledExport: true,
                recipients: scheduleConfig.recipients
              });
              return exportResult;
            });
            
            const exportResults = await Promise.all(exportPromises);
            setExports(exportResults);
          }
        };

        return (
          <div>
            <button onClick={handleScheduledGeneration} data-testid="scheduled-generation-btn">
              Simulate Scheduled Generation
            </button>
            
            <div>Schedule Configuration:</div>
            <div>Frequency: {scheduleConfig.frequency}</div>
            <div>Day: {scheduleConfig.dayOfWeek}</div>
            <div>Time: {scheduleConfig.time} {scheduleConfig.timezone}</div>
            <div>Recipients: {scheduleConfig.recipients.join(', ')}</div>
            <div>Auto-export: {scheduleConfig.autoExport.toString()}</div>
            
            {scheduleResult && (
              <div>
                <div>Scheduled report generated</div>
                <div>Schedule ID: {scheduleResult.scheduleId}</div>
                <div>Template: {scheduleConfig.template}</div>
              </div>
            )}
            
            {exports.length > 0 && (
              <div>
                <div>Auto-exports completed:</div>
                {exports.map((exportResult, index) => (
                  <div key={index}>
                    {exportResult.format.toUpperCase()}: {exportResult.exportId}
                    <a href={exportResult.downloadUrl} data-testid={`scheduled-download-${exportResult.format}`}>
                      Download
                    </a>
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

      const generateBtn = screen.getByTestId("scheduled-generation-btn");
      fireEvent.click(generateBtn);

      await waitFor(() => {
        expect(screen.getByText("Scheduled report generated")).toBeInTheDocument();
        expect(screen.getByText("Schedule ID: schedule_weekly_001")).toBeInTheDocument();
        expect(screen.getByText("Template: weekly-summary")).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText("Auto-exports completed:")).toBeInTheDocument();
        expect(screen.getByText("PDF: export_scheduled_pdf_001")).toBeInTheDocument();
        expect(screen.getByText("EXCEL: export_scheduled_excel_001")).toBeInTheDocument();
        expect(screen.getByTestId("scheduled-download-pdf")).toHaveAttribute('href', 'blob:scheduled-pdf-url');
        expect(screen.getByTestId("scheduled-download-excel")).toHaveAttribute('href', 'blob:scheduled-excel-url');
      });

      expect(mockReportService.generateReportData).toHaveBeenCalledWith({
        template: scheduleConfig.template,
        scheduledGeneration: true,
        scheduleConfig
      });

      expect(mockExportService.exportReport).toHaveBeenCalledTimes(2);
    });
  });
});