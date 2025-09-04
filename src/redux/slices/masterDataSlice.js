import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import MasterDataService from '../../services/MasterDataService.js';

// Async thunk for importing master data
export const importMasterData = createAsyncThunk(
  'masterData/import',
  async ({ file, dataType, options = {} }, { rejectWithValue, dispatch }) => {
    try {
      const result = await MasterDataService.importData(
        file,
        dataType,
        options,
        (progress) => {
          dispatch(updateImportProgress(progress));
        }
      );

      if (!result.success) {
        return rejectWithValue(result.error);
      }

      return result;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for validating import file
export const validateImportFile = createAsyncThunk(
  'masterData/validateFile',
  async ({ file, dataType }, { rejectWithValue }) => {
    try {
      const result = await MasterDataService.validateImportFile(file, dataType);
      return { ...result, file, dataType };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for rolling back import
export const rollbackImport = createAsyncThunk(
  'masterData/rollback',
  async (importId, { rejectWithValue }) => {
    try {
      const result = await MasterDataService.rollbackImport(importId);
      
      if (!result.success) {
        return rejectWithValue(result.error);
      }

      return { importId, ...result };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for exporting master data
export const exportMasterData = createAsyncThunk(
  'masterData/export',
  async ({ dataType, filters, format, options }, { rejectWithValue, dispatch }) => {
    try {
      const result = await MasterDataService.exportData(
        dataType,
        filters,
        format,
        options,
        (progress) => {
          dispatch(updateExportProgress(progress));
        }
      );

      if (!result.success) {
        return rejectWithValue(result.error);
      }

      return result;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  // Import state
  isImporting: false,
  importProgress: {
    stage: 'idle',
    progress: 0,
    message: ''
  },
  currentImport: null,
  
  // Validation state
  isValidating: false,
  validationResult: null,
  
  // Data preview
  previewData: null,
  
  // Import history
  importHistory: [],
  
  // Export state
  isExporting: false,
  exportProgress: {
    stage: 'idle',
    progress: 0,
    message: ''
  },
  exportHistory: [],
  exportFilters: {
    dateFrom: null,
    dateTo: null,
    status: 'all',
    search: '',
    format: 'csv'
  },
  
  // Master data
  customers: [],
  products: [],
  references: [],
  
  // UI state
  selectedDataType: 'customers',
  showPreview: false,
  showRollbackConfirm: false,
  rollbackImportId: null,
  
  // Error state
  error: null,
  validationErrors: [],
  importErrors: []
};

const masterDataSlice = createSlice({
  name: 'masterData',
  initialState,
  reducers: {
    // UI actions
    setSelectedDataType: (state, action) => {
      state.selectedDataType = action.payload;
      state.validationResult = null;
      state.previewData = null;
      state.error = null;
    },
    
    setShowPreview: (state, action) => {
      state.showPreview = action.payload;
    },
    
    setShowRollbackConfirm: (state, action) => {
      state.showRollbackConfirm = action.payload.show;
      state.rollbackImportId = action.payload.importId || null;
    },
    
    // Progress updates
    updateImportProgress: (state, action) => {
      state.importProgress = { ...state.importProgress, ...action.payload };
    },
    
    updateExportProgress: (state, action) => {
      state.exportProgress = { ...state.exportProgress, ...action.payload };
    },
    
    // Clear actions
    clearValidationResult: (state) => {
      state.validationResult = null;
      state.previewData = null;
      state.validationErrors = [];
    },
    
    clearImportProgress: (state) => {
      state.importProgress = {
        stage: 'idle',
        progress: 0,
        message: ''
      };
      state.currentImport = null;
    },
    
    clearError: (state) => {
      state.error = null;
      state.validationErrors = [];
      state.importErrors = [];
    },
    
    // Data management
    loadImportHistory: (state) => {
      state.importHistory = MasterDataService.getImportHistory();
    },
    // TODO: Delete it later
    loadMasterData: (state, action) => {
      const { dataType } = action.payload;
      const data = MasterDataService.loadFromStorage(`masterData_${dataType}`) || [];
      state[dataType] = data;
    },

    createCustomer: (state, action) => {
      const newCustomer = action.payload;
      state.customers.push(newCustomer);
    },
    
    // Export actions
    setExportFilters: (state, action) => {
      state.exportFilters = { ...state.exportFilters, ...action.payload };
    },
    
    clearExportProgress: (state) => {
      state.exportProgress = {
        stage: 'idle',
        progress: 0,
        message: ''
      };
    },
    
    loadExportHistory: (state) => {
      state.exportHistory = MasterDataService.getExportHistory();
    },
    
    // Reset state
    resetImportState: (state) => {
      state.isImporting = false;
      state.isValidating = false;
      state.validationResult = null;
      state.previewData = null;
      state.currentImport = null;
      state.showPreview = false;
      state.error = null;
      state.validationErrors = [];
      state.importErrors = [];
      state.importProgress = {
        stage: 'idle',
        progress: 0,
        message: ''
      };
    },
    
    resetExportState: (state) => {
      state.isExporting = false;
      state.exportProgress = {
        stage: 'idle',
        progress: 0,
        message: ''
      };
      state.error = null;
    }
  },
  
  extraReducers: (builder) => {
    builder
      // Validate import file
      .addCase(validateImportFile.pending, (state) => {
        state.isValidating = true;
        state.validationResult = null;
        state.error = null;
        state.validationErrors = [];
      })
      .addCase(validateImportFile.fulfilled, (state, action) => {
        state.isValidating = false;
        state.validationResult = action.payload;
        
        if (action.payload.isValid) {
          state.previewData = action.payload.preview;
          state.showPreview = true;
        } else {
          state.validationErrors = action.payload.errors;
        }
      })
      .addCase(validateImportFile.rejected, (state, action) => {
        state.isValidating = false;
        state.error = action.payload;
        state.validationErrors = [action.payload];
      })
      
      // Import master data
      .addCase(importMasterData.pending, (state, action) => {
        state.isImporting = true;
        state.currentImport = {
          dataType: action.meta.arg.dataType,
          fileName: action.meta.arg.file.name,
          startTime: new Date().toISOString()
        };
        state.error = null;
        state.importErrors = [];
      })
      .addCase(importMasterData.fulfilled, (state, action) => {
        state.isImporting = false;
        
        // Update import history
        state.importHistory.unshift(action.payload.importRecord);
        
        // Load updated data
        const dataType = state.currentImport.dataType;
        const data = MasterDataService.loadFromStorage(`masterData_${dataType}`) || [];
        state[dataType] = data;
        
        // Store any errors or warnings
        if (action.payload.errors.length > 0) {
          state.importErrors = action.payload.errors;
        }
        
        // Clear validation and preview
        state.validationResult = null;
        state.previewData = null;
        state.showPreview = false;
      })
      .addCase(importMasterData.rejected, (state, action) => {
        state.isImporting = false;
        state.error = action.payload;
        state.importErrors = [action.payload];
      })
      
      // Rollback import
      .addCase(rollbackImport.pending, (state) => {
        // Keep UI responsive during rollback
      })
      .addCase(rollbackImport.fulfilled, (state, action) => {
        // Update import history
        const importRecord = state.importHistory.find(record => record.id === action.payload.importId);
        if (importRecord) {
          importRecord.status = 'rolled_back';
          importRecord.rolledBackAt = new Date().toISOString();
        }
        
        state.showRollbackConfirm = false;
        state.rollbackImportId = null;
      })
      .addCase(rollbackImport.rejected, (state, action) => {
        state.error = action.payload;
        state.showRollbackConfirm = false;
        state.rollbackImportId = null;
      })
      
      // Export master data
      .addCase(exportMasterData.pending, (state, action) => {
        state.isExporting = true;
        state.error = null;
      })
      .addCase(exportMasterData.fulfilled, (state, action) => {
        state.isExporting = false;
        
        // Update export history
        state.exportHistory.unshift(action.payload.exportRecord);
      })
      .addCase(exportMasterData.rejected, (state, action) => {
        state.isExporting = false;
        state.error = action.payload;
      });
  }
});

export const {
  setSelectedDataType,
  setShowPreview,
  setShowRollbackConfirm,
  updateImportProgress,
  updateExportProgress,
  setExportFilters,
  clearValidationResult,
  clearImportProgress,
  clearExportProgress,
  clearError,
  loadImportHistory,
  loadExportHistory,
  loadMasterData,
  resetImportState,
  resetExportState,
  createCustomer
} = masterDataSlice.actions;

// Selectors
export const selectIsImporting = (state) => state.masterData.isImporting;
export const selectIsValidating = (state) => state.masterData.isValidating;
export const selectImportProgress = (state) => state.masterData.importProgress;
export const selectValidationResult = (state) => state.masterData.validationResult;
export const selectPreviewData = (state) => state.masterData.previewData;
export const selectShowPreview = (state) => state.masterData.showPreview;
export const selectImportHistory = (state) => state.masterData.importHistory;
export const selectSelectedDataType = (state) => state.masterData.selectedDataType;
export const selectMasterDataByType = (state, dataType) => state.masterData[dataType] || [];
export const selectError = (state) => state.masterData.error;
export const selectValidationErrors = (state) => state.masterData.validationErrors;
export const selectImportErrors = (state) => state.masterData.importErrors;
export const selectCurrentImport = (state) => state.masterData.currentImport;
export const selectShowRollbackConfirm = (state) => state.masterData.showRollbackConfirm;
export const selectRollbackImportId = (state) => state.masterData.rollbackImportId;

// Export selectors
export const selectIsExporting = (state) => state.masterData.isExporting;
export const selectExportProgress = (state) => state.masterData.exportProgress;
export const selectExportHistory = (state) => state.masterData.exportHistory;

export default masterDataSlice.reducer;