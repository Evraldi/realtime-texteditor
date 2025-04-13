import { createSlice } from '@reduxjs/toolkit';
import { STORAGE_KEYS } from '../../config/constants';

/**
 * Initial state for auth slice
 */
const initialState = {
  isAuthenticated: false,
  user: null,
  token: localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) ||
         sessionStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) ||
         localStorage.getItem('token') ||
         sessionStorage.getItem('token') ||
         null,
  loading: false,
  error: null,
};

/**
 * Auth slice for Redux store
 */
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action) => {
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.loading = false;
      state.error = null;
    },
    loginFailure: (state, action) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.loading = false;
      state.error = action.payload;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.loading = false;
      state.error = null;
    },
    setUser: (state, action) => {
      state.user = action.payload;
    },
  },
});

// Export actions
export const { loginStart, loginSuccess, loginFailure, logout, setUser } = authSlice.actions;

// Export reducer
export default authSlice.reducer;

// Selectors
export const selectAuth = (state) => state.auth;
export const selectUser = (state) => state.auth?.user;
export const selectIsAuthenticated = (state) => state.auth?.isAuthenticated;
