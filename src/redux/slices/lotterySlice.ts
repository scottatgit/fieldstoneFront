// src/redux/slices/lotterySlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Define the initial state type
interface LotteryState {
  lotteryId: string;
  userId: string;
}

// Initial state
const initialState: LotteryState = {
  lotteryId: 'defaultLotteryId',
  userId: 'defaultUserId',
};

// Create the slice
const lotterySlice = createSlice({
  name: 'lottery',
  initialState,
  reducers: {
    enterLottery: (state, action: PayloadAction<{ lotteryId: string; userId: string }>) => {
      state.lotteryId = action.payload.lotteryId;
      state.userId = action.payload.userId;
    },
    resetLottery: (state) => {
      state.lotteryId = initialState.lotteryId;
      state.userId = initialState.userId;
    },
  },
});

// Export the actions
export const { enterLottery, resetLottery } = lotterySlice.actions;

// Export the reducer to be added to the store
export default lotterySlice.reducer;