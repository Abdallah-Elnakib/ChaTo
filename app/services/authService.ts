import { api } from './api';

export const login = async (email: string, password: string) => {
  try {
    const response = await api.login({ email, password });
    return response;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Login failed');
  }
}; 