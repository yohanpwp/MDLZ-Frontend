import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice.js';
import fileProcessingReducer from './slices/fileProcessingSlice.js';
import validationReducer from './slices/validationSlice.js';
import reportsReducer from './slices/reportsSlice.js';
import masterDataReducer from './slices/masterDataSlice.js';
import userManagementReducer from './slices/userManagementSlice.js';
import auditReducer from './slices/auditSlice.js';
import { authMiddleware, apiResponseMiddleware } from './middleware/authMiddleware.js';

// Import slices here as they are created
// import invoiceSlice from './slices/invoiceSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    fileProcessing: fileProcessingReducer,
    validation: validationReducer,
    reports: reportsReducer,
    masterData: masterDataReducer,
    userManagement: userManagementReducer,
    audit: auditReducer,
    [api.reducerPath]: api.reducer
    // Add other reducers here as they are created
    // invoices: invoiceSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }).concat(authMiddleware, apiResponseMiddleware),
});

// Export types for use with useSelector and useDispatch hooks
// These will be used when creating typed hooks in hooks/redux.js