import { describe, it, expect, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import fileProcessingReducer, {
  addUpload,
  updateUploadProgress,
  removeUpload,
  clearUploads,
  updateRecordStatus,
  removeRecord,
  clearAllData,
  processFile,
  selectUploads,
  selectAllRecords,
  selectStatistics
} from '../fileProcessingSlice';

// Mock the parsers and validator
vi.mock('../../../utils/CsvParser', () => ({
  CsvParser: vi.fn().mockImplementation(() => ({
    parseFile: vi.fn().mockResolvedValue({
      success: true,
      records: [
        {
          id: 'record-1',
          invoiceNumber: 'INV-001',
          customerName: 'Test Customer',
          amount: 100,
          totalAmount: 110,
          status: 'valid'
        }
      ],
      totalRecords: 1,
      validRecords: 1,
      invalidRecords: 0,
      errors: []
    })
  }))
}));

vi.mock('../../../utils/TxtParser', () => ({
  TxtParser: vi.fn().mockImplementation(() => ({
    parseFile: vi.fn().mockResolvedValue({
      success: true,
      records: [],
      totalRecords: 0,
      validRecords: 0,
      invalidRecords: 0,
      errors: []
    })
  }))
}));

vi.mock('../../../utils/FileValidator', () => ({
  FileValidator: {
    validateFile: vi.fn().mockReturnValue({
      isValid: true,
      fileName: 'test.csv',
      fileSize: 1000,
      fileType: 'csv',
      formattedSize: '1000 Bytes'
    })
  }
}));

describe('fileProcessingSlice', () => {
  let store;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        fileProcessing: fileProcessingReducer
      }
    });
  });

  describe('reducers', () => {
    it('should add upload', () => {
      const uploadData = {
        id: 'upload-1',
        fileName: 'test.csv',
        fileSize: 1000,
        fileType: 'csv'
      };

      store.dispatch(addUpload(uploadData));
      const state = store.getState();
      const uploads = selectUploads(state);

      expect(uploads).toHaveLength(1);
      expect(uploads[0].id).toBe('upload-1');
      expect(uploads[0].status).toBe('pending');
    });

    it('should update upload progress', () => {
      const uploadData = {
        id: 'upload-1',
        fileName: 'test.csv',
        fileSize: 1000,
        fileType: 'csv'
      };

      store.dispatch(addUpload(uploadData));
      store.dispatch(updateUploadProgress({ id: 'upload-1', progress: 50 }));

      const state = store.getState();
      const uploads = selectUploads(state);

      expect(uploads[0].progress).toBe(50);
      expect(uploads[0].status).toBe('uploading');
    });

    it('should remove upload', () => {
      const uploadData = {
        id: 'upload-1',
        fileName: 'test.csv',
        fileSize: 1000,
        fileType: 'csv'
      };

      store.dispatch(addUpload(uploadData));
      store.dispatch(removeUpload('upload-1'));

      const state = store.getState();
      const uploads = selectUploads(state);

      expect(uploads).toHaveLength(0);
    });

    it('should clear all uploads', () => {
      const uploadData1 = {
        id: 'upload-1',
        fileName: 'test1.csv',
        fileSize: 1000,
        fileType: 'csv'
      };
      const uploadData2 = {
        id: 'upload-2',
        fileName: 'test2.csv',
        fileSize: 2000,
        fileType: 'csv'
      };

      store.dispatch(addUpload(uploadData1));
      store.dispatch(addUpload(uploadData2));
      store.dispatch(clearUploads());

      const state = store.getState();
      const uploads = selectUploads(state);

      expect(uploads).toHaveLength(0);
    });

    it('should update record status', () => {
      // First add a record through file processing
      const initialState = {
        fileProcessing: {
          ...fileProcessingReducer(undefined, { type: '@@INIT' }),
          allRecords: [
            {
              id: 'record-1',
              invoiceNumber: 'INV-001',
              status: 'valid'
            }
          ],
          validRecords: [
            {
              id: 'record-1',
              invoiceNumber: 'INV-001',
              status: 'valid'
            }
          ],
          invalidRecords: []
        }
      };

      const testStore = configureStore({
        reducer: { fileProcessing: fileProcessingReducer },
        preloadedState: initialState
      });

      testStore.dispatch(updateRecordStatus({ recordId: 'record-1', status: 'invalid' }));

      const state = testStore.getState();
      const records = selectAllRecords(state);

      expect(records[0].status).toBe('invalid');
    });

    it('should remove record', () => {
      const initialState = {
        fileProcessing: {
          ...fileProcessingReducer(undefined, { type: '@@INIT' }),
          allRecords: [
            {
              id: 'record-1',
              invoiceNumber: 'INV-001',
              status: 'valid'
            }
          ],
          validRecords: [
            {
              id: 'record-1',
              invoiceNumber: 'INV-001',
              status: 'valid'
            }
          ]
        }
      };

      const testStore = configureStore({
        reducer: { fileProcessing: fileProcessingReducer },
        preloadedState: initialState
      });

      testStore.dispatch(removeRecord('record-1'));

      const state = testStore.getState();
      const records = selectAllRecords(state);

      expect(records).toHaveLength(0);
    });

    it('should clear all data', () => {
      const uploadData = {
        id: 'upload-1',
        fileName: 'test.csv',
        fileSize: 1000,
        fileType: 'csv'
      };

      store.dispatch(addUpload(uploadData));
      store.dispatch(clearAllData());

      const state = store.getState();
      const uploads = selectUploads(state);
      const records = selectAllRecords(state);

      expect(uploads).toHaveLength(0);
      expect(records).toHaveLength(0);
    });
  });

  describe('async thunks', () => {
    it('should process file successfully', async () => {
      const fileData = {
        id: 'upload-1',
        file: new File(['test'], 'test.csv', { type: 'text/csv' })
      };

      // Add upload first
      store.dispatch(addUpload({
        id: 'upload-1',
        fileName: 'test.csv',
        fileSize: 1000,
        fileType: 'csv'
      }));

      await store.dispatch(processFile(fileData));

      const state = store.getState();
      const records = selectAllRecords(state);
      const statistics = selectStatistics(state);

      expect(records).toHaveLength(1);
      expect(records[0].invoiceNumber).toBe('INV-001');
      expect(statistics.totalRecords).toBe(1);
      expect(statistics.validRecords).toBe(1);
    });

    it('should handle file processing errors', async () => {
      // Mock validation to throw error
      const { FileValidator } = await import('../../../utils/FileValidator');
      FileValidator.validateFile.mockImplementationOnce(() => {
        throw new Error('Validation failed');
      });

      const fileData = {
        id: 'upload-1',
        file: new File(['test'], 'test.csv', { type: 'text/csv' })
      };

      store.dispatch(addUpload({
        id: 'upload-1',
        fileName: 'test.csv',
        fileSize: 1000,
        fileType: 'csv'
      }));

      await store.dispatch(processFile(fileData));

      const state = store.getState();
      expect(state.fileProcessing.errors).toHaveLength(1);
    });
  });

  describe('selectors', () => {
    it('should select uploads correctly', () => {
      const uploadData = {
        id: 'upload-1',
        fileName: 'test.csv',
        fileSize: 1000,
        fileType: 'csv'
      };

      store.dispatch(addUpload(uploadData));
      const state = store.getState();
      const uploads = selectUploads(state);

      expect(uploads).toHaveLength(1);
      expect(uploads[0].id).toBe('upload-1');
    });

    it('should calculate statistics correctly', () => {
      const initialState = {
        fileProcessing: {
          ...fileProcessingReducer(undefined, { type: '@@INIT' }),
          allRecords: [
            { id: '1', status: 'valid' },
            { id: '2', status: 'valid' },
            { id: '3', status: 'invalid' }
          ],
          validRecords: [
            { id: '1', status: 'valid' },
            { id: '2', status: 'valid' }
          ],
          invalidRecords: [
            { id: '3', status: 'invalid' }
          ],
          processedFiles: [{ id: 'file-1' }],
          processingErrors: [{ id: 'error-1' }]
        }
      };

      const testStore = configureStore({
        reducer: { fileProcessing: fileProcessingReducer },
        preloadedState: initialState
      });

      const state = testStore.getState();
      const statistics = selectStatistics(state);

      expect(statistics.totalFiles).toBe(1);
      expect(statistics.totalRecords).toBe(3);
      expect(statistics.validRecords).toBe(2);
      expect(statistics.invalidRecords).toBe(1);
      expect(statistics.processingErrors).toBe(1);
    });
  });
});