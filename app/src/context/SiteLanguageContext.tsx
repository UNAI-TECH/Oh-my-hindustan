import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n, { setAppLanguage } from '../lib/i18n';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';

export type SiteLang = 'en' | 'ta';

interface SiteLanguageContextValue {
  lang: SiteLang;
  isTamil: boolean;
  setSiteLang: (nextLang: SiteLang, options?: { persistDb?: boolean }) => Promise<void>;
  formatDate: (iso?: string | null) => string;
  formatShortDate: (iso?: string | null) => string;
}

const SiteLanguageContext = createContext<SiteLanguageContextValue | undefined>(undefined);

function detectInitialLang(): SiteLang {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const path = window.location.pathname || '';
    if (path === '/ta' || path.startsWith('/ta/')) return 'ta';
    if (path === '/en' || path.startsWith('/en/')) return 'en';

    const queryLang = new URLSearchParams(window.location.search || '').get('lang');
    if (queryLang === 'ta') return 'ta';
    if (queryLang === 'en') return 'en';

    const match = document.cookie.match(/(?:^|;\s*)postsapp_lang=(en|ta)/);
    if (match?.[1] === 'ta') return 'ta';
    if (match?.[1] === 'en') return 'en';
  }
  return i18n.language === 'ta' ? 'ta' : 'en';
}

export function normalizeUtcTimestamp(iso?: string | null): Date | null {
  if (!iso) return null;
  let normalized = String(iso).trim();
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(normalized)) {
    normalized = normalized.replace(' ', 'T');
  }
  if (normalized && !normalized.endsWith('Z') && !/[+-]\d{2}(:?\d{2})?$/.test(normalized)) {
    normalized += 'Z';
  }
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function SiteLanguageProvider({ children }: { children: ReactNode }) {
  const { userProfile } = useAuth();
  const [lang, setLang] = useState<SiteLang>(detectInitialLang);

  const applyBrowserLangMeta = useCallback((target: SiteLang) => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.documentElement.lang = target;
      document.cookie = `postsapp_lang=${target}; path=/; max-age=31536000; SameSite=Lax`;
    }
  }, []);

  useEffect(() => {
    // Respect explicit URL locale on initial web mount; otherwise hydrate from AsyncStorage / user profile
    const init = async () => {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const path = window.location.pathname || '';
        if (path === '/ta' || path.startsWith('/ta/')) {
          await setAppLanguage('ta');
          setLang('ta');
          applyBrowserLangMeta('ta');
          return;
        }
        if (path === '/en' || path.startsWith('/en/')) {
          await setAppLanguage('en');
          setLang('en');
          applyBrowserLangMeta('en');
          return;
        }
      }

      const stored = await AsyncStorage.getItem('user-language').catch(() => null);
      if (stored === 'ta' || stored === 'en') {
        await setAppLanguage(stored);
        setLang(stored);
        applyBrowserLangMeta(stored);
        return;
      }

      const pref = userProfile?.preferred_language;
      if (pref === 'ta' || pref === 'en') {
        await setAppLanguage(pref);
        setLang(pref);
        applyBrowserLangMeta(pref);
      } else if (pref === 'hi') {
        // Preserve legacy Hindi UI strings if set, while defaulting news feed language cleanly
        await setAppLanguage('hi');
      }
    };
    init();
  }, [userProfile?.preferred_language, applyBrowserLangMeta]);

  const setSiteLang = useCallback(
    async (nextLang: SiteLang, options: { persistDb?: boolean } = { persistDb: true }) => {
      setLang(nextLang);
      applyBrowserLangMeta(nextLang);
      await setAppLanguage(nextLang);

      if (options.persistDb !== false && userProfile?.id) {
        try {
          await supabase
            .from('User')
            .update({ preferred_language: nextLang, updatedAt: new Date().toISOString() })
            .eq('id', userProfile.id);
        } catch {
          // ignore offline profile sync error
        }
      }
    },
    [applyBrowserLangMeta, userProfile?.id]
  );

  const formatDate = useCallback(
    (iso?: string | null) => {
      const date = normalizeUtcTimestamp(iso);
      if (!date) return iso || '';
      try {
        return new Intl.DateTimeFormat(lang === 'ta' ? 'ta-IN' : 'en-IN', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
          timeZone: 'Asia/Kolkata',
        }).format(date);
      } catch {
        return iso || '';
      }
    },
    [lang]
  );

  const formatShortDate = useCallback(
    (iso?: string | null) => {
      const date = normalizeUtcTimestamp(iso);
      if (!date) return '';
      try {
        return new Intl.DateTimeFormat(lang === 'ta' ? 'ta-IN' : 'en-IN', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          timeZone: 'Asia/Kolkata',
        }).format(date);
      } catch {
        return '';
      }
    },
    [lang]
  );

  return (
    <SiteLanguageContext.Provider
      value={{
        lang,
        isTamil: lang === 'ta',
        setSiteLang,
        formatDate,
        formatShortDate,
      }}
    >
      {children}
    </SiteLanguageContext.Provider>
  );
}

export function useSiteLanguage() {
  const ctx = useContext(SiteLanguageContext);
  if (!ctx) {
    throw new Error('useSiteLanguage must be used within SiteLanguageProvider');
  }
  return ctx;
}
