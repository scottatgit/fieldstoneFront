import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'moderator' | 'admin';  // User role
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  requiresCaptcha: boolean;  // Add requiresCaptcha to the state
}

// Check localStorage for persisted auth state
const tokenFromStorage = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
const userFromStorage = typeof window !== 'undefined' && localStorage.getItem('user')
  ? JSON.parse(localStorage.getItem('user')!)
  : null;

const initialState: AuthState = {
  isAuthenticated: !!tokenFromStorage,  // If token exists, user is authenticated
  user: userFromStorage,
  token: tokenFromStorage,
  requiresCaptcha: false,  // Default CAPTCHA to false
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuth(state, action: PayloadAction<{ user: User; token: string; requiresCaptcha?: boolean }>) {
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;

      // Store in localStorage
      localStorage.setItem('token', action.payload.token);
      localStorage.setItem('user', JSON.stringify(action.payload.user));

      // Update requiresCaptcha (if provided)
      state.requiresCaptcha = action.payload.requiresCaptcha || false;
    },
    clearAuth(state) {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.requiresCaptcha = false;  // Reset CAPTCHA

      // Remove from localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
  },
});

export const { setAuth, clearAuth } = authSlice.actions;
export default authSlice.reducer;
