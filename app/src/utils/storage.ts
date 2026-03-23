import AsyncStorage from '@react-native-async-storage/async-storage';

export const TOKEN_KEY = 'jwt_token';
export const USER_ID_KEY = 'user_id';
export const USERNAME_KEY = 'username';
export const USER_EMAIL_KEY = 'user_email';

export const SessionManager = {
  async saveSession(token: string, id: string | null, name: string | null, email: string | null) {
    try {
      if (token) await AsyncStorage.setItem(TOKEN_KEY, token);
      if (id) await AsyncStorage.setItem(USER_ID_KEY, id);
      if (name) await AsyncStorage.setItem(USERNAME_KEY, name);
      if (email) await AsyncStorage.setItem(USER_EMAIL_KEY, email);
    } catch (e) {
      console.error('Error saving session', e);
    }
  },

  async clearSession() {
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem(USER_ID_KEY);
      await AsyncStorage.removeItem(USERNAME_KEY);
      await AsyncStorage.removeItem(USER_EMAIL_KEY);
    } catch (e) {
      console.error('Error clearing session', e);
    }
  },

  async getToken() {
    return await AsyncStorage.getItem(TOKEN_KEY);
  },
  
  async getUserDetails() {
    const id = await AsyncStorage.getItem(USER_ID_KEY);
    const name = await AsyncStorage.getItem(USERNAME_KEY);
    const email = await AsyncStorage.getItem(USER_EMAIL_KEY);
    return { id, name, email };
  }
};
