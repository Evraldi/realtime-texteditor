import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';

/**
 * Configure Redux store with all reducers
 */
export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
  // Add middleware if needed
  middleware: (getDefaultMiddleware) => 
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;
