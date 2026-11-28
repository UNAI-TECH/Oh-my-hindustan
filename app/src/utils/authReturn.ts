import { Platform } from 'react-native';

export type PendingAuthReturn =
  | {
      screen: 'ArticleDetail';
      params: {
        id?: string;
        slug?: string;
        title?: string;
        lang?: 'en' | 'ta';
      };
    }
  | {
      screen: 'Home' | 'Explore' | 'Library' | 'Profile' | 'CreatorProfile' | 'Search';
      params?: Record<string, any>;
    };

const STORAGE_KEY = 'postsapp_pending_auth_return';
let memoryReturnTarget: PendingAuthReturn | null = null;

export function savePendingAuthReturn(target: PendingAuthReturn | null) {
  memoryReturnTarget = target;
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.sessionStorage) {
    try {
      if (target) {
        window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(target));
      } else {
        window.sessionStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // ignore storage quota failures
    }
  }
}

export function getPendingAuthReturn(): PendingAuthReturn | null {
  if (memoryReturnTarget) return memoryReturnTarget;
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.sessionStorage) {
    try {
      const raw = window.sessionStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
  }
  return null;
}

export function consumePendingAuthReturn(): PendingAuthReturn | null {
  let target = memoryReturnTarget;
  memoryReturnTarget = null;
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.sessionStorage) {
    try {
      const raw = window.sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        window.sessionStorage.removeItem(STORAGE_KEY);
        target = JSON.parse(raw);
      }
    } catch {
      // ignore invalid JSON
    }
  }
  return target;
}

export function navigateAfterAuth(navigation: any) {
  const target = consumePendingAuthReturn();
  if (target?.screen === 'ArticleDetail' && (target.params?.id || target.params?.slug)) {
    navigation.reset({
      index: 1,
      routes: [
        { name: 'Home', params: { initialCategory: 'home' } },
        { name: 'ArticleDetail', params: target.params },
      ],
    });
    return;
  }
  if (target?.screen && target.screen !== 'Home') {
    navigation.reset({
      index: 1,
      routes: [
        { name: 'Home', params: { initialCategory: 'home' } },
        { name: target.screen, ...(target.params ? { params: target.params } : {}) },
      ],
    });
    return;
  }
  navigation.reset({
    index: 0,
    routes: [{ name: 'Home', params: target?.params || { initialCategory: 'home' } }],
  });
}
