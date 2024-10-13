// src/redux/slices/tagsSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Define the post type
interface Post {
  id: string;
  title: string;
  description: string;
  image: string;
  price: number;
  tags: string[];
}

// Define the state type
interface TagsState {
  posts: Post[];
  tags: string[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

// Initial state
const initialState: TagsState = {
  posts: [],
  tags: [],
  status: 'idle',
  error: null,
};

// Async thunk to fetch posts and tags
export const fetchPostsAndTags = createAsyncThunk('tags/fetchPostsAndTags', async () => {
  const response = await axios.get('/api/posts'); // Adjust API path if necessary
  console.log("API response data:", response.data); // Log API response to verify
  return response.data;
});

const tagsSlice = createSlice({
  name: 'tags',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPostsAndTags.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchPostsAndTags.fulfilled, (state, action) => {
        console.log("Fulfilled action payload:", action.payload); // Log the action payload

        // Check if payload has posts and tags
        if (Array.isArray(action.payload)) {
          state.posts = action.payload;  // Assuming entire response is posts array
          state.tags = Array.from(new Set(action.payload.flatMap((post) => post.tags)));  // Extract unique tags
        } else {
          console.warn("Unexpected API response format:", action.payload);
        }

        state.status = 'succeeded';
      })
      .addCase(fetchPostsAndTags.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Failed to load posts and tags';
      });
  },
});

export default tagsSlice.reducer;
