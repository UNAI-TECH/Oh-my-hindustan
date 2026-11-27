import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateUUID } from './uuid';

const VISITOR_ID_KEY = 'postsapp_visitor_id';
let memoryVisitorId: string | null = null;

export async function getOrCreateVisitorId(): Promise<string> {
  if (memoryVisitorId) return memoryVisitorId;

  if (typeof window !== 'undefined' && window.localStorage) {
    const existing = window.localStorage.getItem(VISITOR_ID_KEY);
    if (existing) {
      memoryVisitorId = existing;
      return existing;
    }
    const created = `anon_${generateUUID()}`;
    window.localStorage.setItem(VISITOR_ID_KEY, created);
    memoryVisitorId = created;
    return created;
  }

  try {
    const existing = await AsyncStorage.getItem(VISITOR_ID_KEY);
    if (existing) {
      memoryVisitorId = existing;
      return existing;
    }
    const created = `anon_${generateUUID()}`;
    await AsyncStorage.setItem(VISITOR_ID_KEY, created);
    memoryVisitorId = created;
    return created;
  } catch {
    memoryVisitorId = `session_${generateUUID()}`;
    return memoryVisitorId;
  }
}
