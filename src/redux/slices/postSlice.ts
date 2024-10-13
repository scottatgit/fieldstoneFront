// src/redux/slices/postSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Post {
  id: string;
  title: string;
  content: string;
}

interface PostState {
  posts: Post[];
}

const initialState: PostState = {
  posts: [],
};

const postSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    addPost: (state, action: PayloadAction<Post>) => {
      state.posts.push(action.payload);
    },
    removePost: (state, action: PayloadAction<string>) => {
      state.posts = state.posts.filter((post) => post.id !== action.payload);
    },
    updatePost: (state, action: PayloadAction<{ id: string; title: string; content: string }>) => {
      const postIndex = state.posts.findIndex((post) => post.id === action.payload.id);
      if (postIndex >= 0) {
        state.posts[postIndex].title = action.payload.title;
        state.posts[postIndex].content = action.payload.content;
      }
    },
  },
});

export const { addPost, removePost, updatePost } = postSlice.actions;
export default postSlice.reducer;
