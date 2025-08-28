/**
 * Unit tests for masterDataSlice Redux slice
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import masterDataReducer, {
  importMasterData,
  exportMasterData,
  updateMasterData,
  deleteMasterData,
  clearMasterData,
  setImportProgress,
  clearImportProgress,
  selectMasterData,
  selectIsImporting,
  selectImportProgress
} from '../masterDataSlice.js';

// Mock MasterDataService
vi.mock('../../../services/MasterDataService.js', () => ({
  default: {
    importData: vi.fn(),
    exportData: vi.fn(),
    updateData: vi.fn(),
    deleteData: vi.fn()
  }
}));

describe('masterDataSlice', () => {
  let store;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        masterData: masterDataReducer
      }
    });
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    test('should have correct initial state', () => {
      const state = store.getState().masterData;
      
      expect(state.customers).toEqual([]);
      expect(state.products).toEqual([]);
      expect(state.isImporting).toBe(false);
      expect(state.isExporting).toBe(false);
      expect(state.importProgress).toBeNull();
      expect(state.error).toBeNull();
    });
  });

  describe('synchronous actions', () => {
    test('should clear master data', () => {
      // First add some data
      store.dispatch({
        type: 'masterData/importMasterData/fulfilled',
        payload: {
          customers: [{ id: 1, name: 'Customer 1' }],
          products: [{ id: 1, name: 'Product 1' }]
        }
      });
      
      // Clear data
      store.dispatch(clearMasterData());
      
      const state = store.getState().masterData;
      expect(state.customers).toEqual([]);
      expect(state.products).toEqual([]);
    });

    test('should set import progress', () => {
      const progress = {
        totalRecords: 100,
        processedRecords: 50,
        progressPercentage: 50,
        currentOperation: 'importing customers'
      };
      
      store.dispatch(setImportProgress(progress));
      
      const state = store.getState().masterData;
      expect(state.importProgress).toEqual(progress);
    });

    test('should clear import progress', () => {
      // First set progress
      store.dispatch(setImportProgress({
        progressPercentage: 50
      }));
      
      // Then clear
      store.dispatch(clearImportProgress());
      
      const state = store.getState().masterData;
      expect(state.importProgress).toBeNull();
    });
  });

  describe('async thunks', () => {
    test('should handle importMasterData success', async () => {
      const mockData = {
        customers: [
          { id: 1, name: 'Customer 1', email: 'customer1@example.com' },
          { id: 2, name: 'Customer 2', email: 'customer2@example.com' }
        ],
        products: [
          { id: 1, name: 'Product 1', price: 100 }
        ]
      };

      const MasterDataService = await import('../../../services/MasterDataService.js');
      MasterDataService.default.importData.mockResolvedValue(mockData);

      const importConfig = {
        file: new File(['test'], 'customers.csv', { type: 'text/csv' }),
        dataType: 'customers'
      };

      await store.dispatch(importMasterData(importConfig));

      const state = store.getState().masterData;
      expect(state.isImporting).toBe(false);
      expect(state.customers).toEqual(mockData.customers);
      expect(state.products).toEqual(mockData.products);
      expect(state.error).toBeNull();
    });

    test('should handle importMasterData failure', async () => {
      const errorMessage = 'Import failed';
      const MasterDataService = await import('../../../services/MasterDataService.js');
      MasterDataService.default.importData.mockRejectedValue(new Error(errorMessage));

      const importConfig = {
        file: new File(['test'], 'invalid.csv'),
        dataType: 'customers'
      };

      await store.dispatch(importMasterData(importConfig));

      const state = store.getState().masterData;
      expect(state.isImporting).toBe(false);
      expect(state.error).toBe(errorMessage);
    });

    test('should handle exportMasterData success', async () => {
      const mockExportResult = {
        success: true,
        filename: 'master-data.xlsx',
        recordCount: 150
      };

      const MasterDataService = await import('../../../services/MasterDataService.js');
      MasterDataService.default.exportData.mockResolvedValue(mockExportResult);

      const exportConfig = {
        dataTypes: ['customers', 'products'],
        format: 'excel'
      };

      await store.dispatch(exportMasterData(exportConfig));

      const state = store.getState().masterData;
      expect(state.isExporting).toBe(false);
      expect(state.error).toBeNull();
    });

    test('should handle updateMasterData success', async () => {
      // First add some data
      store.dispatch({
        type: 'masterData/importMasterData/fulfilled',
        payload: {
          customers: [{ id: 1, name: 'Customer 1' }],
          products: []
        }
      });

      const updatedCustomer = { id: 1, name: 'Updated Customer 1' };
      const MasterDataService = await import('../../../services/MasterDataService.js');
      MasterDataService.default.updateData.mockResolvedValue(updatedCustomer);

      await store.dispatch(updateMasterData({
        dataType: 'customers',
        id: 1,
        data: updatedCustomer
      }));

      const state = store.getState().masterData;
      expect(state.customers[0].name).toBe('Updated Customer 1');
    });

    test('should handle deleteMasterData success', async () => {
      // First add some data
      store.dispatch({
        type: 'masterData/importMasterData/fulfilled',
        payload: {
          customers: [
            { id: 1, name: 'Customer 1' },
            { id: 2, name: 'Customer 2' }
          ],
          products: []
        }
      });

      const MasterDataService = await import('../../../services/MasterDataService.js');
      MasterDataService.default.deleteData.mockResolvedValue({ success: true });

      await store.dispatch(deleteMasterData({
        dataType: 'customers',
        id: 1
      }));

      const state = store.getState().masterData;
      expect(state.customers).toHaveLength(1);
      expect(state.customers[0].id).toBe(2);
    });
  });

  describe('selectors', () => {
    beforeEach(() => {
      const mockData = {
        customers: [
          { id: 1, name: 'Customer A', type: 'premium' },
          { id: 2, name: 'Customer B', type: 'standard' }
        ],
        products: [
          { id: 1, name: 'Product X', category: 'electronics' }
        ]
      };

      store.dispatch({
        type: 'masterData/importMasterData/fulfilled',
        payload: mockData
      });
    });

    test('should select master data', () => {
      const state = store.getState();
      const masterData = selectMasterData(state);
      
      expect(masterData.customers).toHaveLength(2);
      expect(masterData.products).toHaveLength(1);
    });

    test('should select isImporting', () => {
      const state = store.getState();
      const isImporting = selectIsImporting(state);
      
      expect(isImporting).toBe(false);
    });

    test('should select import progress', () => {
      store.dispatch(setImportProgress({
        progressPercentage: 75,
        currentOperation: 'processing'
      }));

      const state = store.getState();
      const progress = selectImportProgress(state);
      
      expect(progress.progressPercentage).toBe(75);
      expect(progress.currentOperation).toBe('processing');
    });
  });
});