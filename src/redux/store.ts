// src/redux/store.ts
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import postReducer from './slices/postSlice';
import lotteryReducer from './slices/lotterySlice';
import flashMessageReducer from './slices/flashMessageSlice';
import tagsReducer from './slices/tagsSlice'; // Import the new tags reducer

export const store = configureStore({
  reducer: {
    auth: authReducer,
    posts: postReducer,
    lottery: lotteryReducer,
    flashMessage: flashMessageReducer,
    tags: tagsReducer, // Add the tags reducer to the store
  },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
