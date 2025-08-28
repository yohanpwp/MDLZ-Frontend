/**
 * Unit tests for reportsSlice Redux slice
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import reportsReducer, {
  generateReport,
  exportReport,
  deleteReport,
  setReportFilters,
  clearReportFilters,
  setReportSort,
  clearReports,
  selectReports,
  selectIsGenerating,
  selectReportFilters,
  selectFilteredReports
} from '../reportsSlice.js';

// Mock ReportService
vi.mock('../../../services/ReportService.js', () => ({
  default: {
    generateReport: vi.fn(),
    exportReport: vi.fn(),
    deleteReport: vi.fn()
  }
}));

describe('reportsSlice', () => {
  let store;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        reports: reportsReducer
      }
    });
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    test('should have correct initial state', () => {
      const state = store.getState().reports;
      
      expect(state.reports).toEqual([]);
      expect(state.isGenerating).toBe(false);
      expect(state.isExporting).toBe(false);
      expect(state.error).toBeNull();
      expect(state.filters).toEqual({
        dateRange: 'all',
        reportType: 'all',
        severity: 'all'
      });
      expect(state.sortBy).toBe('createdAt');
      expect(state.sortOrder).toBe('desc');
    });
  });

  describe('synchronous actions', () => {
    test('should set report filters', () => {
      const filters = {
        dateRange: 'last30days',
        reportType: 'validation',
        severity: 'high'
      };
      
      store.dispatch(setReportFilters(filters));
      
      const state = store.getState().reports;
      expect(state.filters).toEqual(filters);
    });

    test('should clear report filters', () => {
      // First set filters
      store.dispatch(setReportFilters({
        dateRange: 'last30days',
        reportType: 'validation'
      }));
      
      // Then clear
      store.dispatch(clearReportFilters());
      
      const state = store.getState().reports;
      expect(state.filters).toEqual({
        dateRange: 'all',
        reportType: 'all',
        severity: 'all'
      });
    });

    test('should set report sort', () => {
      const sortConfig = {
        sortBy: 'name',
        sortOrder: 'asc'
      };
      
      store.dispatch(setReportSort(sortConfig));
      
      const state = store.getState().reports;
      expect(state.sortBy).toBe('name');
      expect(state.sortOrder).toBe('asc');
    });

    test('should clear reports', () => {
      // First add some mock reports
      store.dispatch({
        type: 'reports/generateReport/fulfilled',
        payload: {
          id: 'report-1',
          name: 'Test Report',
          type: 'validation',
          createdAt: new Date().toISOString()
        }
      });
      
      // Clear reports
      store.dispatch(clearReports());
      
      const state = store.getState().reports;
      expect(state.reports).toEqual([]);
    });
  });

  describe('async thunks', () => {
    test('should handle generateReport success', async () => {
      const mockReport = {
        id: 'report-1',
        name: 'Validation Report',
        type: 'validation',
        data: { totalRecords: 100 },
        createdAt: new Date().toISOString()
      };

      const ReportService = await import('../../../services/ReportService.js');
      ReportService.default.generateReport.mockResolvedValue(mockReport);

      const reportConfig = {
        type: 'validation',
        name: 'Test Report',
        filters: {}
      };

      await store.dispatch(generateReport(reportConfig));

      const state = store.getState().reports;
      expect(state.isGenerating).toBe(false);
      expect(state.reports).toHaveLength(1);
      expect(state.reports[0]).toEqual(mockReport);
      expect(state.error).toBeNull();
    });

    test('should handle generateReport failure', async () => {
      const errorMessage = 'Failed to generate report';
      const ReportService = await import('../../../services/ReportService.js');
      ReportService.default.generateReport.mockRejectedValue(new Error(errorMessage));

      const reportConfig = {
        type: 'validation',
        name: 'Test Report'
      };

      await store.dispatch(generateReport(reportConfig));

      const state = store.getState().reports;
      expect(state.isGenerating).toBe(false);
      expect(state.error).toBe(errorMessage);
    });

    test('should handle exportReport success', async () => {
      const mockExportResult = {
        success: true,
        filename: 'report.pdf',
        size: 1024
      };

      const ReportService = await import('../../../services/ReportService.js');
      ReportService.default.exportReport.mockResolvedValue(mockExportResult);

      const exportConfig = {
        reportId: 'report-1',
        format: 'pdf',
        filename: 'test-report'
      };

      await store.dispatch(exportReport(exportConfig));

      const state = store.getState().reports;
      expect(state.isExporting).toBe(false);
      expect(state.error).toBeNull();
    });

    test('should handle deleteReport success', async () => {
      // First add a report
      store.dispatch({
        type: 'reports/generateReport/fulfilled',
        payload: {
          id: 'report-1',
          name: 'Test Report'
        }
      });

      const ReportService = await import('../../../services/ReportService.js');
      ReportService.default.deleteReport.mockResolvedValue({ success: true });

      await store.dispatch(deleteReport('report-1'));

      const state = store.getState().reports;
      expect(state.reports).toHaveLength(0);
    });
  });

  describe('selectors', () => {
    beforeEach(() => {
      const mockReports = [
        {
          id: 'report-1',
          name: 'Validation Report',
          type: 'validation',
          createdAt: '2024-01-01T00:00:00Z'
        },
        {
          id: 'report-2',
          name: 'Audit Report',
          type: 'audit',
          createdAt: '2024-01-02T00:00:00Z'
        }
      ];

      store.dispatch({
        type: 'reports/test',
        payload: { reports: mockReports }
      });
    });

    test('should select reports', () => {
      const state = store.getState();
      const reports = selectReports(state);
      
      expect(Array.isArray(reports)).toBe(true);
      expect(reports).toHaveLength(2);
    });

    test('should select isGenerating', () => {
      const state = store.getState();
      const isGenerating = selectIsGenerating(state);
      
      expect(isGenerating).toBe(false);
    });

    test('should select report filters', () => {
      const state = store.getState();
      const filters = selectReportFilters(state);
      
      expect(filters).toEqual({
        dateRange: 'all',
        reportType: 'all',
        severity: 'all'
      });
    });

    test('should select filtered reports', () => {
      // Set filter
      store.dispatch(setReportFilters({ reportType: 'validation' }));
      
      const state = store.getState();
      const filteredReports = selectFilteredReports(state);
      
      expect(filteredReports).toHaveLength(1);
      expect(filteredReports[0].type).toBe('validation');
    });
  });
});