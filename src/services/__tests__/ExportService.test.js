/**
 * ExportService Tests
 * 
 * Tests for the export functionality including PDF, Excel, CSV, and JSON formats
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ExportService from '../ExportService';

// Mock jsPDF and xlsx
vi.mock('jspdf', () => {
  const mockDoc = {
    setFontSize: vi.fn(),
    setFont: vi.fn(),
    text: vi.fn(),
    autoTable: vi.fn(),
    addPage: vi.fn(),
    setPage: vi.fn(),
    internal: {
      pageSize: {
        getWidth: () => 210,
        getHeight: () => 297
      },
      getNumberOfPages: () => 1
    },
    lastAutoTable: { finalY: 100 },
    output: vi.fn(() => 'mock-pdf-data')
  };

  return {
    default: vi.fn(() => mockDoc)
  };
});

vi.mock('xlsx', () => ({
  utils: {
    book_new: vi.fn(() => ({})),
    aoa_to_sheet: vi.fn(() => ({})),
    book_append_sheet: vi.fn(),
    sheet_add_aoa: vi.fn()
  },
  write: vi.fn(() => new ArrayBuffer(8))
}));

// Mock global URL.createObjectURL
global.URL = {
  createObjectURL: vi.fn(() => 'mock-blob-url')
};

describe('ExportService', () => {
  let mockReport;
  let mockExportOptions;

  beforeEach(() => {
    mockReport = {
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
        records: [
          {
            recordId: 'rec-001',
            field: 'totalAmount',
            originalValue: 1000,
            calculatedValue: 1050,
            discrepancy: 50,
            discrepancyPercentage: 5,
            severity: 'medium',
            validatedAt: new Date('2024-01-01T10:00:00Z'),
            message: 'Tax calculation discrepancy'
          },
          {
            recordId: 'rec-002',
            field: 'taxAmount',
            originalValue: 200,
            calculatedValue: 210,
            discrepancy: 10,
            discrepancyPercentage: 5,
            severity: 'low',
            validatedAt: new Date('2024-01-01T10:00:00Z'),
            message: 'Minor rounding difference'
          }
        ],
        charts: [],
        aggregations: {
          byField: {
            totalAmount: { count: 1, totalDiscrepancy: 50, averageDiscrepancy: 50 },
            taxAmount: { count: 1, totalDiscrepancy: 10, averageDiscrepancy: 10 }
          }
        }
      }
    };

    mockExportOptions = {
      format: 'pdf',
      filename: 'test-export',
      includeCharts: true,
      includeMetadata: true,
      includeRawData: false,
      formatOptions: {
        pageSize: 'a4',
        orientation: 'portrait'
      }
    };

    // Clear any existing exports
    ExportService.activeExports.clear();
    ExportService.exportListeners.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('exportReport', () => {
    it('should export report to PDF format successfully', async () => {
      const result = await ExportService.exportReport(mockReport, mockExportOptions);

      expect(result).toHaveProperty('exportId');
      expect(result).toHaveProperty('downloadUrl', 'mock-blob-url');
      expect(result).toHaveProperty('filename', 'test-export.pdf');
      expect(result).toHaveProperty('size');
      expect(result).toHaveProperty('type', 'application/pdf');
      expect(result).toHaveProperty('processingTimeMs');
      expect(result).toHaveProperty('metadata');
    });

    it('should export report to Excel format successfully', async () => {
      mockExportOptions.format = 'excel';
      
      const result = await ExportService.exportReport(mockReport, mockExportOptions);

      expect(result).toHaveProperty('exportId');
      expect(result).toHaveProperty('downloadUrl', 'mock-blob-url');
      expect(result).toHaveProperty('filename', 'test-export.excel');
      expect(result).toHaveProperty('type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    });

    it('should export report to CSV format successfully', async () => {
      mockExportOptions.format = 'csv';
      
      const result = await ExportService.exportReport(mockReport, mockExportOptions);

      expect(result).toHaveProperty('exportId');
      expect(result).toHaveProperty('downloadUrl', 'mock-blob-url');
      expect(result).toHaveProperty('filename', 'test-export.csv');
      expect(result).toHaveProperty('type', 'text/csv;charset=utf-8;');
    });

    it('should export report to JSON format successfully', async () => {
      mockExportOptions.format = 'json';
      
      const result = await ExportService.exportReport(mockReport, mockExportOptions);

      expect(result).toHaveProperty('exportId');
      expect(result).toHaveProperty('downloadUrl', 'mock-blob-url');
      expect(result).toHaveProperty('filename', 'test-export.json');
      expect(result).toHaveProperty('type', 'application/json;charset=utf-8;');
    });

    it('should track export progress', async () => {
      const progressCallback = vi.fn();
      
      await ExportService.exportReport(mockReport, mockExportOptions, progressCallback);

      expect(progressCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'preparing',
          progress: 0,
          currentStep: 'Initializing export...'
        })
      );

      expect(progressCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'completed',
          progress: 100
        })
      );
    });

    it('should include export metadata when requested', async () => {
      const result = await ExportService.exportReport(mockReport, mockExportOptions);

      expect(result.metadata).toHaveProperty('exportId');
      expect(result.metadata).toHaveProperty('exportedAt');
      expect(result.metadata).toHaveProperty('exportedBy');
      expect(result.metadata).toHaveProperty('originalReportId', mockReport.id);
      expect(result.metadata).toHaveProperty('systemInfo');
    });

    it('should throw error for unsupported format', async () => {
      mockExportOptions.format = 'unsupported';

      await expect(ExportService.exportReport(mockReport, mockExportOptions))
        .rejects.toThrow('Export failed: Unsupported export format: unsupported');
    });
  });

  describe('progress tracking', () => {
    it('should track active exports', async () => {
      const progressCallback = vi.fn();
      
      const exportPromise = ExportService.exportReport(mockReport, mockExportOptions, progressCallback);
      
      // Check that export is tracked
      const activeExports = ExportService.getAllActiveExports();
      expect(activeExports.length).toBeGreaterThan(0);
      
      await exportPromise;
    });

    it('should allow adding progress listeners', async () => {
      const listener = vi.fn();
      const exportId = 'test-export-id';
      
      const cleanup = ExportService.addProgressListener(exportId, listener);
      
      ExportService.updateProgress(exportId, { status: 'preparing', progress: 0 });
      
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          exportId,
          status: 'preparing',
          progress: 0
        })
      );
      
      cleanup();
    });

    it('should get export progress', () => {
      const exportId = 'test-export-id';
      const progressData = { status: 'exporting', progress: 50 };
      
      ExportService.updateProgress(exportId, progressData);
      
      const progress = ExportService.getExportProgress(exportId);
      expect(progress).toMatchObject(progressData);
    });

    it('should return not found for unknown export ID', () => {
      const progress = ExportService.getExportProgress('unknown-id');
      expect(progress.status).toBe('not_found');
    });
  });

  describe('export cancellation', () => {
    it('should cancel active export', () => {
      const exportId = 'test-export-id';
      
      ExportService.updateProgress(exportId, { status: 'exporting', progress: 50 });
      
      const result = ExportService.cancelExport(exportId);
      expect(result).toBe(true);
      
      const progress = ExportService.getExportProgress(exportId);
      expect(progress.status).toBe('cancelled');
    });

    it('should not cancel completed export', () => {
      const exportId = 'test-export-id';
      
      ExportService.updateProgress(exportId, { status: 'completed', progress: 100 });
      
      const result = ExportService.cancelExport(exportId);
      expect(result).toBe(false);
    });

    it('should not cancel non-existent export', () => {
      const result = ExportService.cancelExport('unknown-id');
      expect(result).toBe(false);
    });
  });

  describe('cleanup', () => {
    it('should clean up old exports', () => {
      const oldExportId = 'old-export';
      const newExportId = 'new-export';
      
      // Add old export (1 hour ago)
      const oldTime = new Date(Date.now() - 3700000); // 1 hour and 10 minutes ago
      ExportService.updateProgress(oldExportId, { 
        status: 'completed', 
        progress: 100,
        startTime: oldTime
      });
      
      // Add new export
      ExportService.updateProgress(newExportId, { 
        status: 'completed', 
        progress: 100,
        startTime: new Date()
      });
      
      ExportService.cleanupOldExports(3600000); // 1 hour
      
      expect(ExportService.getExportProgress(oldExportId).status).toBe('not_found');
      expect(ExportService.getExportProgress(newExportId).status).toBe('completed');
    });
  });
});