import { Linking, Platform } from 'react-native';

/**
 * Normalize an external URL by prepending https:// when a scheme is omitted.
 */
export function normalizeExternalUrl(rawUrl?: string | null): string | null {
  const trimmed = rawUrl?.trim();
  if (!trimmed) return null;
  return /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(trimmed) ? trimmed : `https://${trimmed}`;
}

/**
 * Open an external URL synchronously within the active click gesture so web
 * browsers do not block the redirect as a popup after async tracking calls.
 */
export function openExternalUrl(rawUrl?: string | null): boolean {
  const targetUrl = normalizeExternalUrl(rawUrl);
  if (!targetUrl) return false;

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const popup = window.open(targetUrl, '_blank', 'noopener,noreferrer');
    if (!popup) {
      window.location.assign(targetUrl);
    }
    return true;
  }

  Linking.openURL(targetUrl).catch(() => {});
  return true;
}
