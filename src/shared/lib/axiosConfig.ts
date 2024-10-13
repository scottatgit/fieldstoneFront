// src/shared/lib/axiosConfig.ts

import axios from 'axios';
import { store } from '../../redux/store'; // Import the store to dispatch logout action
import { clearAuth } from '../../redux/slices/authSlice';

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.kreationation.com',
});

// Interceptor to attach token from localStorage
axiosInstance.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token && config.headers) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to handle token expiration
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response &&
      error.response.status === 401 &&
      !error.config.__isRetryRequest
    ) {
      // Prevent infinite loop in case of repeated 401 errors
      error.config.__isRetryRequest = true;

      // Dispatch the action to clear auth state
      store.dispatch(clearAuth());

      // Remove token from localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Redirect to login page
      if (typeof window !== 'undefined') {
        window.location.href = '/login'; // Adjust the path if necessary
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
