import axios from 'axios';
import { SessionManager } from '../utils/storage';

// Same IP as ApiClient.kt 
const BASE_URL = 'http://172.30.80.116:3001/api';

export const ApiClient = axios.create({
  baseURL: BASE_URL,
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
