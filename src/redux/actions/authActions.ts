// src/redux/actions/authActions.ts

import { Dispatch } from '@reduxjs/toolkit';
import { setAuth, clearAuth } from '../slices/authSlice';
import axiosInstance from '../../shared/lib/axiosConfig';

interface UserCredentials {
  email: string;
  password: string;
  behaviorData?: {
    keystrokeData: Array<Record<string, unknown>>;
    mouseMovementData: Array<Record<string, unknown>>;
  };
}

interface AuthResponse {
  user: {
    _id: string;
    name: string;
    email: string;
    role: 'user' | 'moderator' | 'admin'; 
  };
  token: string;
  requiresCaptcha?: boolean;
}

interface CaptchaVerificationResponse {
  success: boolean;
}

interface ErrorResponse {
  response?: {
    data: {
      message: string;
    };
  };
  message: string;
}

// Action to log in a user
export const loginUser = (userData: UserCredentials) => async (dispatch: Dispatch) => {
  try {
    // Log the data being sent for login
    console.log('Login data being sent:', userData);

    const { data } = await axiosInstance.post<AuthResponse>('/api/users/login', userData);

    // Log the data received from backend
    console.log('Data received from backend on login:', data);

    if (!data || !data.user || !data.token) {
      console.error('Invalid response structure from login API:', data);
      throw new Error('Invalid response structure from login API');
    }

    // Log the user role before dispatching
    console.log('User role from backend response:', data.user.role);

    dispatch(
      setAuth({
        user: {
          id: data.user._id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role, 
        },
        token: data.token,
      })
    );

    return { token: data.token, requiresCaptcha: data.requiresCaptcha || false };
  } catch (error: unknown) {
    const typedError = error as ErrorResponse;

    // Log the error details received from the backend
    console.error(
      'Error logging in user:',
      typedError.response ? typedError.response.data.message : typedError.message
    );

    throw typedError;
  }
};


// Action to verify CAPTCHA
export const verifyCaptcha = async (captchaValue: string) => {
  try {
    const { data } = await axiosInstance.post<CaptchaVerificationResponse>(
      '/api/verify-captcha',
      { captchaValue }
    );

    if (data.success) {
      console.log('CAPTCHA verified successfully');
      return true;
    } else {
      console.error('CAPTCHA verification failed');
      return false;
    }
  } catch (error: unknown) {
    const typedError = error as ErrorResponse;
    console.error('Error verifying CAPTCHA:', typedError.message);
    throw typedError;
  }
};

// Action to log out a user
export const logoutUser = () => async (dispatch: Dispatch) => {
  try {
    await axiosInstance.post('/api/users/logout');
    dispatch(clearAuth());
  } catch (error: unknown) {
    const typedError = error as ErrorResponse;
    console.error('Error logging out user:', typedError.message);
    throw typedError;
  }
};
