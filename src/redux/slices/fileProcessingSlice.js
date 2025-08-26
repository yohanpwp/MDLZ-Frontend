import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { CsvParser } from '../../utils/CsvParser';
import { TxtParser } from '../../utils/TxtParser';
import { FileValidator } from '../../utils/FileValidator';

// Async thunk for processing uploaded files
export const processFile = createAsyncThunk(
  'fileProcessing/processFile',
  async (fileData, { rejectWithValue }) => {
    try {
      const { file } = fileData;
      
      // Validate file first
      const validationResult = FileValidator.validateFile(file);
      
      // Choose appropriate parser based on file type
      let parser;
      if (validationResult.fileType === 'csv') {
        parser = new CsvParser();
      } else {
        parser = new TxtParser();
      }

      // Process the file
      const processingResult = await parser.parseFile(file);
      
      return {
        fileInfo: {
          id: fileData.id,
          fileName: file.name,
          fileSize: file.size,
          fileType: validationResult.fileType,
          uploadedAt: new Date().toISOString()
        },
        processingResult
      };
    } catch (error) {
      return rejectWithValue({
        message: error.message,
        code: error.code || 'PROCESSING_ERROR'
      });
    }
  }
);

// Async thunk for batch processing multiple files
export const processBatchFiles = createAsyncThunk(
  'fileProcessing/processBatchFiles',
  async (filesData, { dispatch, rejectWithValue }) => {
    try {
      const results = [];
      
      for (const fileData of filesData) {
        const result = await dispatch(processFile(fileData)).unwrap();
        results.push(result);
      }
      
      return results;
    } catch (error) {
      return rejectWithValue({
        message: 'Batch processing failed',
        details: error.message
      });
    }
  }
);

const initialState = {
  // File upload state
  uploads: [],
  currentUpload: null,
  uploadProgress: 0,
  
  // Processing state
  isProcessing: false,
  processingProgress: 0,
  processedFiles: [],
  
  // Records state
  allRecords: [],
  validRecords: [],
  invalidRecords: [],
  
  // Error state
  errors: [],
  processingErrors: [],
  
  // Statistics
  statistics: {
    totalFiles: 0,
    totalRecords: 0,
    validRecords: 0,
    invalidRecords: 0,
    processingErrors: 0
  }
};

const fileProcessingSlice = createSlice({
  name: 'fileProcessing',
  initialState,
  reducers: {
    // File upload actions
    addUpload: (state, action) => {
      const upload = {
        id: action.payload.id,
        fileName: action.payload.fileName,
        fileSize: action.payload.fileSize,
        fileType: action.payload.fileType,
        status: 'pending',
        uploadedAt: new Date().toISOString(),
        progress: 0
      };
      state.uploads.push(upload);
    },
    
    updateUploadProgress: (state, action) => {
      const { id, progress } = action.payload;
      const upload = state.uploads.find(u => u.id === id);
      if (upload) {
        upload.progress = progress;
        upload.status = progress === 100 ? 'completed' : 'uploading';
      }
    },
    
    removeUpload: (state, action) => {
      const id = action.payload;
      state.uploads = state.uploads.filter(u => u.id !== id);
      
      // Also remove associated processed file and records
      state.processedFiles = state.processedFiles.filter(f => f.fileInfo.id !== id);
      state.allRecords = state.allRecords.filter(r => r.metadata?.fileId !== id);
      
      // Recalculate statistics
      fileProcessingSlice.caseReducers.calculateStatistics(state);
    },
    
    clearUploads: (state) => {
      state.uploads = [];
      state.currentUpload = null;
      state.uploadProgress = 0;
    },
    
    // Processing actions
    setProcessingProgress: (state, action) => {
      state.processingProgress = action.payload;
    },
    
    clearProcessingErrors: (state) => {
      state.processingErrors = [];
    },
    
    // Record management actions
    updateRecordStatus: (state, action) => {
      const { recordId, status } = action.payload;
      const record = state.allRecords.find(r => r.id === recordId);
      if (record) {
        record.status = status;
        
        // Update categorized records
        state.validRecords = state.allRecords.filter(r => r.status === 'valid');
        state.invalidRecords = state.allRecords.filter(r => r.status === 'invalid');
        
        // Recalculate statistics
        fileProcessingSlice.caseReducers.calculateStatistics(state);
      }
    },
    
    removeRecord: (state, action) => {
      const recordId = action.payload;
      state.allRecords = state.allRecords.filter(r => r.id !== recordId);
      state.validRecords = state.validRecords.filter(r => r.id !== recordId);
      state.invalidRecords = state.invalidRecords.filter(r => r.id !== recordId);
      
      // Recalculate statistics
      fileProcessingSlice.caseReducers.calculateStatistics(state);
    },
    
    // Statistics calculation
    calculateStatistics: (state) => {
      state.statistics = {
        totalFiles: state.processedFiles.length,
        totalRecords: state.allRecords.length,
        validRecords: state.validRecords.length,
        invalidRecords: state.invalidRecords.length,
        processingErrors: state.processingErrors.length
      };
    },
    
    // Clear all data
    clearAllData: (state) => {
      return { ...initialState };
    }
  },
  
  extraReducers: (builder) => {
    builder
      // Process single file
      .addCase(processFile.pending, (state, action) => {
        state.isProcessing = true;
        state.processingProgress = 0;
        
        const fileId = action.meta.arg.id;
        const upload = state.uploads.find(u => u.id === fileId);
        if (upload) {
          upload.status = 'processing';
        }
      })
      .addCase(processFile.fulfilled, (state, action) => {
        state.isProcessing = false;
        state.processingProgress = 100;
        
        const { fileInfo, processingResult } = action.payload;
        
        // Update upload status
        const upload = state.uploads.find(u => u.id === fileInfo.id);
        if (upload) {
          upload.status = processingResult.success ? 'completed' : 'error';
        }
        
        // Add processed file
        state.processedFiles.push({
          fileInfo,
          processingResult,
          processedAt: new Date().toISOString()
        });
        
        // Add records with file reference
        const recordsWithFileId = processingResult.records.map(record => ({
          ...record,
          metadata: {
            ...record.metadata,
            fileId: fileInfo.id,
            fileName: fileInfo.fileName
          }
        }));
        
        state.allRecords.push(...recordsWithFileId);
        
        // Categorize records
        state.validRecords = state.allRecords.filter(r => r.status === 'valid');
        state.invalidRecords = state.allRecords.filter(r => r.status === 'invalid');
        
        // Add processing errors
        if (processingResult.errors.length > 0) {
          state.processingErrors.push(...processingResult.errors.map(error => ({
            ...error,
            fileId: fileInfo.id,
            fileName: fileInfo.fileName
          })));
        }
        
        // Calculate statistics
        fileProcessingSlice.caseReducers.calculateStatistics(state);
      })
      .addCase(processFile.rejected, (state, action) => {
        state.isProcessing = false;
        
        const fileId = action.meta.arg.id;
        const upload = state.uploads.find(u => u.id === fileId);
        if (upload) {
          upload.status = 'error';
        }
        
        // Add error
        state.errors.push({
          id: Date.now(),
          type: 'processing',
          message: action.payload?.message || 'File processing failed',
          fileId,
          timestamp: new Date().toISOString()
        });
      })
      
      // Process batch files
      .addCase(processBatchFiles.pending, (state) => {
        state.isProcessing = true;
        state.processingProgress = 0;
      })
      .addCase(processBatchFiles.fulfilled, (state, action) => {
        state.isProcessing = false;
        state.processingProgress = 100;
        
        // Results are already handled by individual processFile actions
      })
      .addCase(processBatchFiles.rejected, (state, action) => {
        state.isProcessing = false;
        
        state.errors.push({
          id: Date.now(),
          type: 'batch_processing',
          message: action.payload?.message || 'Batch processing failed',
          timestamp: new Date().toISOString()
        });
      });
  }
});

export const {
  addUpload,
  updateUploadProgress,
  removeUpload,
  clearUploads,
  setProcessingProgress,
  clearProcessingErrors,
  updateRecordStatus,
  removeRecord,
  calculateStatistics,
  clearAllData
} = fileProcessingSlice.actions;

// Selectors
export const selectUploads = (state) => state.fileProcessing.uploads;
export const selectIsProcessing = (state) => state.fileProcessing.isProcessing;
export const selectProcessingProgress = (state) => state.fileProcessing.processingProgress;
export const selectProcessedFiles = (state) => state.fileProcessing.processedFiles;
export const selectAllRecords = (state) => state.fileProcessing.allRecords;
export const selectValidRecords = (state) => state.fileProcessing.validRecords;
export const selectInvalidRecords = (state) => state.fileProcessing.invalidRecords;
export const selectProcessingErrors = (state) => state.fileProcessing.processingErrors;
export const selectStatistics = (state) => state.fileProcessing.statistics;
export const selectErrors = (state) => state.fileProcessing.errors;

// Complex selectors
export const selectRecordsByFile = (state, fileId) => 
  state.fileProcessing.allRecords.filter(record => record.metadata?.fileId === fileId);

export const selectErrorsByFile = (state, fileId) =>
  state.fileProcessing.processingErrors.filter(error => error.fileId === fileId);

export const selectFileProcessingStatus = (state, fileId) => {
  const upload = state.fileProcessing.uploads.find(u => u.id === fileId);
  const processedFile = state.fileProcessing.processedFiles.find(f => f.fileInfo.id === fileId);
  
  return {
    upload,
    processedFile,
    records: selectRecordsByFile(state, fileId),
    errors: selectErrorsByFile(state, fileId)
  };
};

export default fileProcessingSlice.reducer;