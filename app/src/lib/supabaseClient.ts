import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Runtime validation — catch misconfigured builds early
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '[SUPABASE] ⚠️ CRITICAL: Missing environment variables!\n' +
    'EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY must be set in .env file.\n' +
    'The app will not be able to fetch data without these.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    // Add timeout and exponential backoff retry to all fetch requests — prevents infinite loading/failures on slow mobile data
    fetch: async (url, options = {}) => {
      let lastError: any;
      const maxRetries = 3;
      
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout per attempt
        
        try {
          const res = await fetch(url, {
            ...options,
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          return res;
        } catch (error: any) {
          clearTimeout(timeoutId);
          lastError = error;
          
          // Only retry on strict network errors or timeouts
          const isNetworkError = error.name === 'AbortError' || (error.message && error.message.toLowerCase().includes('network'));
          if (!isNetworkError || attempt === maxRetries) {
            throw error;
          }
          
          // Exponential backoff
          const delay = 1000 * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
      throw lastError;
    },
  },
  realtime: {
    params: {
      eventsPerSecond: 2,
    },
  },
});

// Export URL and key for use in places that need direct access (e.g., storage uploads)
export const SUPABASE_URL = supabaseUrl;
export const SUPABASE_ANON_KEY = supabaseAnonKey;
