// src/redux/slices/userSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Define the initial state interface
interface UserState {
  id: string | null;
  name: string;
  email: string;
  isAuthenticated: boolean;
  count: number; // Add count to track user-specific actions like in the counter example
}

// Initial state
const initialState: UserState = {
  id: null,
  name: '',
  email: '',
  isAuthenticated: false,
  count: 0, // Initial value for the count
};

// Create the slice
const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    // Action for logging in the user
    login: (state, action: PayloadAction<{ id: string; name: string; email: string }>) => {
      state.id = action.payload.id;
      state.name = action.payload.name;
      state.email = action.payload.email;
      state.isAuthenticated = true;
    },
    // Action for logging out the user
    logout: (state) => {
      state.id = null;
      state.name = '';
      state.email = '';
      state.isAuthenticated = false;
    },
    // Increment the count
    increment: (state) => {
      state.count += 1;
    },
    // Decrement the count
    decrement: (state) => {
      state.count -= 1;
    },
  },
});

// Export actions
export const { login, logout, increment, decrement } = userSlice.actions;

// Export reducer
export default userSlice.reducer;
