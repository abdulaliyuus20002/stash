// Get the backend URL from environment
export const API_URL = typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_BACKEND_URL 
  ? process.env.EXPO_PUBLIC_BACKEND_URL 
  : '';
