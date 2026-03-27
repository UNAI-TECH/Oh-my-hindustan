/**
 * Network resilience utilities for handling slow/unstable connections.
 * Used to wrap Supabase and API calls with retry logic and timeouts.
 */

/**
 * Determines if an error is a network-level failure (timeout, DNS, connection refused, etc.)
 */
export const isNetworkError = (error: any): boolean => {
  if (!error) return false;
  const message = (error.message || '').toLowerCase();
  return (
    message.includes('network') ||
    message.includes('timeout') ||
    message.includes('abort') ||
    message.includes('fetch') ||
    message.includes('econnrefused') ||
    message.includes('enotfound') ||
    message.includes('dns') ||
    message.includes('socket') ||
    error.code === 'ECONNABORTED' ||
    error.code === 'ETIMEDOUT' ||
    error.code === 'ERR_NETWORK'
  );
};

/**
 * Wraps an async function with exponential backoff retry logic.
 * Only retries on network errors, not on business logic errors (e.g., RLS violations).
 *
 * @param fn - Async function to execute
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @param baseDelay - Base delay in ms before first retry (default: 1000)
 */
export const withRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
): Promise<T> => {
  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Only retry on network errors, not on auth/permission errors
      if (!isNetworkError(error) || attempt === maxRetries) {
        throw error;
      }

      const delay = baseDelay * Math.pow(2, attempt); // 1s, 2s, 4s
      console.warn(`[NETWORK] Retry ${attempt + 1}/${maxRetries} after ${delay}ms:`, error.message);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
};

/**
 * Wraps a promise with a timeout. If the promise doesn't resolve within
 * the specified duration, it rejects with a timeout error.
 *
 * @param promise - The promise to wrap
 * @param timeoutMs - Timeout in milliseconds (default: 15000)
 */
export const withTimeout = <T>(
  promise: Promise<T>,
  timeoutMs: number = 15000,
): Promise<T> => {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Request timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    promise
      .then(result => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch(error => {
        clearTimeout(timer);
        reject(error);
      });
  });
};
