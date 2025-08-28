/**
 * Unit tests for auditSlice Redux slice
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import auditReducer, {
  fetchAuditLogs,
  logAuditEvent,
  exportAuditLogs,
  fetchAuditStatistics,
  clearMessages,
  updateFilters,
  resetFilters,
  updatePagination,
  setSuccessMessage,
  selectAuditLogs,
  selectAuditStatistics,
  selectAuditFilters,
  selectIsLoading,
  selectIsExporting
} from '../auditSlice.js';
import AuditService from '../../../services/AuditService.js';

// Mock AuditService
vi.mock('../../../services/AuditService.js', () => ({
  default: {
    getAuditLogs: vi.fn(),
    logEvent: vi.fn(),
    exportAuditLogs: vi.fn(),
    getAuditStatistics: vi.fn()
  }
}));

describe('auditSlice', () => {
  let store;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        audit: auditReducer
      }
    });
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    test('should have correct initial state', () => {
      const state = store.getState().audit;
      
      expect(state.logs).toEqual([]);
      expect(state.statistics.totalEvents).toBe(0);
      expect(state.filters.page).toBe(1);
      expect(state.filters.limit).toBe(100);
      expect(state.isLoading).toBe(false);
      expect(state.isExporting).toBe(false);
      expect(state.error).toBeNull();
      expect(state.successMessage).toBeNull();
    });
  });

  describe('synchronous actions', () => {
    test('should clear messages', () => {
      // Set error and success message first
      store.dispatch(setSuccessMessage('Test success'));
      store.dispatch({ type: 'audit/fetchAuditLogs/rejected', payload: 'Test error' });
      
      expect(store.getState().audit.successMessage).toBe('Test success');
      expect(store.getState().audit.error).toBe('Test error');
      
      // Clear messages
      store.dispatch(clearMessages());
      
      const state = store.getState().audit;
      expect(state.error).toBeNull();
      expect(state.successMessage).toBeNull();
    });

    test('should update filters', () => {
      const newFilters = {
        userId: 'user123',
        action: 'login',
        severity: 'high'
      };
      
      store.dispatch(updateFilters(newFilters));
      
      const state = store.getState().audit;
      expect(state.filters.userId).toBe('user123');
      expect(state.filters.action).toBe('login');
      expect(state.filters.severity).toBe('high');
      // Should preserve existing filters
      expect(state.filters.page).toBe(1);
      expect(state.filters.limit).toBe(100);
    });

    test('should reset filters', () => {
      // First set some filters
      store.dispatch(updateFilters({
        userId: 'user123',
        action: 'login',
        page: 5
      }));
      
      expect(store.getState().audit.filters.userId).toBe('user123');
      
      // Reset filters
      store.dispatch(resetFilters());
      
      const state = store.getState().audit;
      expect(state.filters.userId).toBe('');
      expect(state.filters.action).toBe('');
      expect(state.filters.page).toBe(1);
      expect(state.filters.limit).toBe(100);
    });

    test('should update pagination', () => {
      const paginationUpdate = {
        page: 3,
        total: 150,
        totalPages: 15
      };
      
      store.dispatch(updatePagination(paginationUpdate));
      
      const state = store.getState().audit;
      expect(state.pagination.page).toBe(3);
      expect(state.pagination.total).toBe(150);
      expect(state.pagination.totalPages).toBe(15);
      // Should preserve existing pagination values
      expect(state.pagination.limit).toBe(100);
    });

    test('should set success message', () => {
      const message = 'Operation completed successfully';
      
      store.dispatch(setSuccessMessage(message));
      
      const state = store.getState().audit;
      expect(state.successMessage).toBe(message);
      expect(state.error).toBeNull();
    });
  });

  describe('async thunks', () => {
    test('should handle fetchAuditLogs success', async () => {
      const mockLogs = [
        {
          id: '1',
          userId: 'user1',
          action: 'login',
          timestamp: '2024-01-01T10:00:00Z'
        },
        {
          id: '2',
          userId: 'user2',
          action: 'file_upload',
          timestamp: '2024-01-01T11:00:00Z'
        }
      ];
      
      const mockResponse = {
        logs: mockLogs,
        total: 25,
        totalPages: 3
      };
      
      AuditService.getAuditLogs.mockReturnValue(mockResponse);
      
      await store.dispatch(fetchAuditLogs({ page: 1 }));
      
      const state = store.getState().audit;
      
      expect(AuditService.getAuditLogs).toHaveBeenCalledWith({ page: 1 });
      expect(state.isLoading).toBe(false);
      expect(state.logs).toEqual(mockLogs);
      expect(state.pagination.total).toBe(25);
      expect(state.pagination.totalPages).toBe(3);
      expect(state.error).toBeNull();
    });

    test('should handle fetchAuditLogs failure', async () => {
      const errorMessage = 'Failed to fetch audit logs';
      AuditService.getAuditLogs.mockImplementation(() => {
        throw new Error(errorMessage);
      });
      
      await store.dispatch(fetchAuditLogs());
      
      const state = store.getState().audit;
      
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(errorMessage);
      expect(state.logs).toEqual([]);
    });

    test('should handle logAuditEvent success', async () => {
      const eventData = {
        userId: 'user123',
        action: 'validation_run',
        module: 'validation',
        severity: 'info'
      };
      
      AuditService.logEvent.mockResolvedValue();
      
      await store.dispatch(logAuditEvent(eventData));
      
      const state = store.getState().audit;
      
      expect(AuditService.logEvent).toHaveBeenCalledWith(eventData);
      expect(state.logs).toHaveLength(1);
      expect(state.logs[0]).toMatchObject(eventData);
      expect(state.logs[0].id).toBeDefined();
      expect(state.logs[0].timestamp).toBeDefined();
    });

    test('should handle logAuditEvent failure', async () => {
      const errorMessage = 'Failed to log audit event';
      AuditService.logEvent.mockRejectedValue(new Error(errorMessage));
      
      await store.dispatch(logAuditEvent({}));
      
      const state = store.getState().audit;
      
      expect(state.error).toBe(errorMessage);
    });

    test('should handle exportAuditLogs success', async () => {
      const mockBlob = new Blob(['test data'], { type: 'text/csv' });
      AuditService.exportAuditLogs.mockResolvedValue(mockBlob);
      
      // Mock DOM methods
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn()
      };
      
      global.document = {
        createElement: vi.fn(() => mockLink),
        body: {
          appendChild: vi.fn(),
          removeChild: vi.fn()
        }
      };
      
      global.URL = {
        createObjectURL: vi.fn(() => 'mock-url'),
        revokeObjectURL: vi.fn()
      };
      
      await store.dispatch(exportAuditLogs({ startDate: '2024-01-01' }));
      
      const state = store.getState().audit;
      
      expect(AuditService.exportAuditLogs).toHaveBeenCalledWith({ startDate: '2024-01-01' });
      expect(state.isExporting).toBe(false);
      expect(state.successMessage).toBe('Audit logs exported successfully');
      expect(mockLink.click).toHaveBeenCalled();
    });

    test('should handle exportAuditLogs failure', async () => {
      const errorMessage = 'Export failed';
      AuditService.exportAuditLogs.mockRejectedValue(new Error(errorMessage));
      
      await store.dispatch(exportAuditLogs());
      
      const state = store.getState().audit;
      
      expect(state.isExporting).toBe(false);
      expect(state.error).toBe(errorMessage);
    });

    test('should handle fetchAuditStatistics success', async () => {
      const mockStats = {
        totalEvents: 1250,
        eventsByModule: {
          validation: 500,
          fileProcessing: 300,
          auth: 200
        },
        eventsByAction: {
          login: 150,
          file_upload: 200,
          validation_run: 300
        },
        eventsLast24Hours: 45,
        eventsLast7Days: 280,
        eventsLast30Days: 1100
      };
      
      AuditService.getAuditStatistics.mockReturnValue(mockStats);
      
      await store.dispatch(fetchAuditStatistics({ module: 'validation' }));
      
      const state = store.getState().audit;
      
      expect(AuditService.getAuditStatistics).toHaveBeenCalledWith({ module: 'validation' });
      expect(state.statistics).toEqual(mockStats);
    });

    test('should handle fetchAuditStatistics failure', async () => {
      const errorMessage = 'Failed to fetch statistics';
      AuditService.getAuditStatistics.mockImplementation(() => {
        throw new Error(errorMessage);
      });
      
      await store.dispatch(fetchAuditStatistics());
      
      const state = store.getState().audit;
      
      expect(state.error).toBe(errorMessage);
    });
  });

  describe('selectors', () => {
    beforeEach(() => {
      // Set up some test data
      store.dispatch({
        type: 'audit/fetchAuditLogs/fulfilled',
        payload: {
          logs: [
            { id: '1', action: 'login' },
            { id: '2', action: 'logout' }
          ],
          total: 2,
          totalPages: 1
        }
      });
      
      store.dispatch({
        type: 'audit/fetchAuditStatistics/fulfilled',
        payload: {
          totalEvents: 100,
          eventsByModule: { auth: 50 }
        }
      });
    });

    test('should select audit logs', () => {
      const state = store.getState();
      const logs = selectAuditLogs(state);
      
      expect(logs).toHaveLength(2);
      expect(logs[0].action).toBe('login');
    });

    test('should select audit statistics', () => {
      const state = store.getState();
      const statistics = selectAuditStatistics(state);
      
      expect(statistics.totalEvents).toBe(100);
      expect(statistics.eventsByModule.auth).toBe(50);
    });

    test('should select audit filters', () => {
      store.dispatch(updateFilters({ userId: 'test-user' }));
      
      const state = store.getState();
      const filters = selectAuditFilters(state);
      
      expect(filters.userId).toBe('test-user');
      expect(filters.page).toBe(1);
    });

    test('should select loading state', () => {
      store.dispatch({ type: 'audit/fetchAuditLogs/pending' });
      
      const state = store.getState();
      const isLoading = selectIsLoading(state);
      
      expect(isLoading).toBe(true);
    });

    test('should select exporting state', () => {
      store.dispatch({ type: 'audit/exportAuditLogs/pending' });
      
      const state = store.getState();
      const isExporting = selectIsExporting(state);
      
      expect(isExporting).toBe(true);
    });
  });
});