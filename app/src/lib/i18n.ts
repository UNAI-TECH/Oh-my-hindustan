import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';

import en from '../constants/translations/en.json';
import ta from '../constants/translations/ta.json';
import hi from '../constants/translations/hi.json';

const LANGUAGE_KEY = 'user-language';

const resources = {
  en: { translation: en },
  ta: { translation: ta },
  hi: { translation: hi },
};

const normalizeLang = (raw?: string | null): 'en' | 'ta' | 'hi' => {
  const code = (raw || '').toLowerCase().slice(0, 2);
  if (code === 'ta') return 'ta';
  if (code === 'hi') return 'hi';
  return 'en';
};

export async function setAppLanguage(lang: string) {
  const normalized = normalizeLang(lang);
  await AsyncStorage.setItem(LANGUAGE_KEY, normalized);
  await i18n.changeLanguage(normalized);
  return normalized;
}

const languageDetector = {
  type: 'languageDetector',
  async: true,
  detect: async (callback: (lang: string) => void) => {
    try {
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
      if (savedLanguage) {
        return callback(normalizeLang(savedLanguage));
      }

      const bestLanguage = Localization.getLocales?.()[0]?.languageCode || 'en';
      callback(normalizeLang(bestLanguage));
    } catch (error) {
      console.log('Error detecting language:', error);
      callback('en');
    }
  },
  init: () => {},
  cacheUserLanguage: async (language: string) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, normalizeLang(language));
    } catch (error) {
      console.log('Error caching language:', error);
    }
  },
};

i18n
  .use(languageDetector as any)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
