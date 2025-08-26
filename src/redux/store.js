import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice.js';
import fileProcessingReducer from './slices/fileProcessingSlice.js';
import validationReducer from './slices/validationSlice.js';

// Import slices here as they are created
// import invoiceSlice from './slices/invoiceSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    fileProcessing: fileProcessingReducer,
    validation: validationReducer,
    // Add other reducers here as they are created
    // invoices: invoiceSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

// Export types for use with useSelector and useDispatch hooks
// These will be used when creating typed hooks in hooks/redux.js