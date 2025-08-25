import { configureStore } from '@reduxjs/toolkit';

// Import slices here as they are created
// import invoiceSlice from './slices/invoiceSlice';
// import validationSlice from './slices/validationSlice';
// import userSlice from './slices/userSlice';

export const store = configureStore({
  reducer: {
    // Add reducers here as they are created
    // invoices: invoiceSlice,
    // validation: validationSlice,
    // user: userSlice,
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