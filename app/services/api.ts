import axios from 'axios';

// Replace YOUR_IP_ADDRESS with your actual IP address from ipconfig
const API_URL = 'http://192.168.1.6:5000/api';

// Create axios instance with timeout
const axiosInstance = axios.create({
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  register: async (userData: { name: string; email: string; password: string }) => {
    try {
      console.log('Attempting registration with:', { ...userData, password: '***' });
      const response = await axiosInstance.post(`${API_URL}/auth/register`, userData);
      console.log('Registration successful:', response.data);
      return response.data;
    } catch (error: any) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Connection timeout. Please check your internet connection.');
      }
      if (!error.response) {
        throw new Error('Network error. Please check if the server is running.');
      }
      console.error('Registration error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers
      });
      throw error;
    }
  },

  verifyEmail: async (data: { email: string; code: string }) => {
    try {
      console.log('Attempting email verification with:', { ...data });
      const response = await axiosInstance.post(`${API_URL}/auth/verify-email`, data);
      console.log('Email verification successful:', response.data);
      return response.data;
    } catch (error: any) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Connection timeout. Please check your internet connection.');
      }
      if (!error.response) {
        throw new Error('Network error. Please check if the server is running.');
      }
      console.error('Verification error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  },

  login: async (credentials: { email: string; password: string }) => {
    try {
      console.log('Attempting login with:', { ...credentials, password: '***' });
      const response = await axiosInstance.post(`${API_URL}/auth/login`, credentials);
      console.log('Login successful:', { ...response.data, token: '***' });
      return response.data;
    } catch (error: any) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Connection timeout. Please check your internet connection.');
      }
      if (!error.response) {
        throw new Error('Network error. Please check if the server is running.');
      }
      console.error('Login error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  },

  forgotPassword: async (email: string) => {
    try {
      const response = await axiosInstance.post(`${API_URL}/auth/forgot-password`, { email });
      return response.data;
    } catch (error: any) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Connection timeout. Please check your internet connection.');
      }
      if (!error.response) {
        throw new Error('Network error. Please check if the server is running.');
      }
      throw error;
    }
  },

  resetPassword: async (data: { email: string; code: string; newPassword: string }) => {
    try {
      const response = await axiosInstance.post(`${API_URL}/auth/reset-password`, data);
      return response.data;
    } catch (error: any) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Connection timeout. Please check your internet connection.');
      }
      if (!error.response) {
        throw new Error('Network error. Please check if the server is running.');
      }
      throw error;
    }
  },
}; 