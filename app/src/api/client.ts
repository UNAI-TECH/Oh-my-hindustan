import axios from 'axios';
import { SessionManager } from '../utils/storage';

// LEGACY: This API client is not currently used — all data flows through Supabase directly.
// Kept for potential future backend API integration.
const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || '';

export const ApiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000, // 15s timeout to prevent infinite loading on mobile data
});

ApiClient.interceptors.request.use(
  async (config) => {
    const token = await SessionManager.getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// We can add logging interceptor here as well to mirror HttpLoggingInterceptor
ApiClient.interceptors.response.use(
  (response) => {
    console.log('[API] Response:', response.config.url, response.status);
    return response;
  },
  (error) => {
    if (error.response) {
      console.error(`[API ERROR] ${error.response.status} - ${error.config.url}`);
    } else {
      console.error(`[API ERROR] Network / Server Error: ${error.message}`);
    }
    return Promise.reject(error);
  }
);
