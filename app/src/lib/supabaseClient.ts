import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

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

const webStorage =
  Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage
    ? window.localStorage
    : AsyncStorage;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: webStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
    // Prevent 5000ms navigator.locks deadlocks across concurrent requests / unmounts on web
    lock: async (_name: string, _acquireTimeout: number, fn: () => Promise<any>) => {
      return await fn();
    },
  },
  global: {
    // Fast timeout + single retry on transient network drops so pages never spin endlessly
    fetch: async (url, options = {}) => {
      let lastError: any;
      const maxRetries = 1;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

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

          const isNetworkError =
            error.name === 'AbortError' ||
            (error.message && error.message.toLowerCase().includes('network'));
          if (!isNetworkError || attempt === maxRetries) {
            throw error;
          }

          await new Promise((resolve) => setTimeout(resolve, 400));
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
