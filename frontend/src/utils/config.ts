import Constants from 'expo-constants';

// Get the backend URL from environment
export const getApiUrl = () => {
  const backendUrl = Constants.expoConfig?.extra?.backendUrl || 
                     process.env.EXPO_PUBLIC_BACKEND_URL || 
                     '';
  return backendUrl;
};

export const API_URL = getApiUrl();
