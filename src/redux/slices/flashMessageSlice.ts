// src/redux/slices/flashMessageSlice.ts

import { createSlice } from '@reduxjs/toolkit';

interface FlashMessageState {
  message: string | null;
}

const initialState: FlashMessageState = {
  message: null,
};

const flashMessageSlice = createSlice({
  name: 'flashMessage',
  initialState,
  reducers: {
    setFlashMessage(state, action) {
      state.message = action.payload;
    },
    clearFlashMessage(state) {
      state.message = null;
    },
  },
});

export const { setFlashMessage, clearFlashMessage } = flashMessageSlice.actions;
export default flashMessageSlice.reducer;
