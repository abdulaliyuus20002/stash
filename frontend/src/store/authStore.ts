import { create } from 'zustand';
import axios from 'axios';
import { User, AuthResponse } from '../types';
import { API_URL } from '../utils/config';
import { setAuthToken } from '../utils/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: false,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const response = await axios.post<AuthResponse>(`${API_URL}/api/auth/login`, {
        email,
        password,
      });
      const token = response.data.access_token;
      setAuthToken(token);  // Set token for API interceptor
      set({
        user: response.data.user,
        token: token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      set({ isLoading: false });
      throw new Error(error.response?.data?.detail || 'Login failed');
    }
  },

  register: async (email: string, password: string, name?: string) => {
    set({ isLoading: true });
    try {
      const response = await axios.post<AuthResponse>(`${API_URL}/api/auth/register`, {
        email,
        password,
        name,
      });
      const token = response.data.access_token;
      setAuthToken(token);  // Set token for API interceptor
      set({
        user: response.data.user,
        token: token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      set({ isLoading: false });
      throw new Error(error.response?.data?.detail || 'Registration failed');
    }
  },

  logout: () => {
    setAuthToken(null);  // Clear token from API interceptor
    set({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  },
}));
