import React from 'react';
import { StyleSheet, Platform } from 'react-native';
import { NavigationContainer, getStateFromPath, getPathFromState } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';

import RootNavigator from './src/navigation/RootNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { SiteLanguageProvider } from './src/context/SiteLanguageContext';
import { FeedProvider } from './src/context/FeedContext';
import { NotificationProvider } from './src/context/NotificationContext';
import { InteractionProvider } from './src/context/InteractionContext';
import { navigationRef } from './src/utils/navigation';
import { ThemeProvider } from './src/context/ThemeContext';
import { categoryToSlug, slugToCategory, WEB_NAV_CATEGORIES } from './src/components/web/webPortalHelpers';
import './src/lib/i18n';

const CATEGORY_SLUGS = new Set([
  ...WEB_NAV_CATEGORIES.map((c) => categoryToSlug(c)),
  'home',
  'general',
  'national',
  'international',
  'politics',
  'technology',
  'business',
  'economy',
  'policy',
  'education',
  'sports',
  'culture',
  'world',
  'watch-online',
  'science-and-tech',
  'science-tech',
  'entertainment',
  'lifestyle',
  'health',
  'opinion',
  'environment',
]);

const STATIC_PAGE_KEYS = new Set([
  'about',
  'contact',
  'editorial-policy',
  'corrections-policy',
  'privacy-policy',
  'terms',
  'advertise',
]);

function getActiveLocaleFromBrowser(): 'en' | 'ta' {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const p = window.location.pathname || '';
    if (p === '/ta' || p.startsWith('/ta/')) return 'ta';
    if (p === '/en' || p.startsWith('/en/')) return 'en';
    const m = document.cookie.match(/(?:^|;\s*)postsapp_lang=(en|ta)/);
    if (m?.[1] === 'ta') return 'ta';
  }
  return 'en';
}

const linking: any = {
  prefixes: [
    ...(Platform.OS === 'web' && typeof window !== 'undefined' ? [window.location.origin] : []),
    Linking.createURL('/'),
  ],
  config: {
    screens: {
      Home: {
        path: 'category/:initialCategory?',
        parse: {
          initialCategory: (val: string) => slugToCategory(val),
        },
        stringify: {
          initialCategory: (val: string) => categoryToSlug(val || 'HOME'),
        },
      },
      CreatorProfile: 'creator/:authorId',
      CreatorsDirectory: 'creators',
      ArticleDetail: {
        path: 'article/:slug',
        parse: {
          slug: (val: string) => {
            try {
              return decodeURIComponent(val);
            } catch {
              return val;
            }
          },
        },
      },
      Login: 'login',
      SignUp: 'signup',
      OTP: 'otp',
      AuthCallback: 'auth/callback',
      ProfileSetup: 'onboarding/profile',
      UsernameSetup: 'onboarding/username',
      ProfileImageUpload: 'onboarding/avatar',
      Explore: 'explore',
      StoryFeed: 'stories',
      StoryViewer: 'story/:storyId',
      Library: 'library',
      Search: 'search',
      Notifications: 'notifications',
      InterestsSelection: 'interests',
      Profile: 'profile',
      Settings: 'settings',
      PersonalDetails: 'settings/details',
      PrivacySecurity: 'settings/privacy',
      StaticInfo: 'info/:pageKey',
      NotFound: '*',
      CreatorDashboard: 'studio',
      CreatorAnalytics: 'studio/analytics',
      ContentEditor: 'studio/editor',
      CreatorContent: 'studio/content',
      CreatorComments: 'studio/comments',
      CreatorSettings: 'studio/settings',
      CreatorFeedback: 'studio/feedback',
      AdminOverview: 'admin',
      Splash: 'splash',
    },
  },
  getStateFromPath(path: string, options: any) {
    const queryIndex = path.indexOf('?');
    const querySuffix = queryIndex >= 0 ? path.slice(queryIndex) : '';
    const queryParams = new URLSearchParams(querySuffix.startsWith('?') ? querySuffix.slice(1) : '');

    let rawPath = (queryIndex >= 0 ? path.slice(0, queryIndex) : path).replace(/^\/+|\/+$/g, '');
    let routeLang: 'en' | 'ta' | undefined;

    if (rawPath === 'en' || rawPath.startsWith('en/')) {
      routeLang = 'en';
      rawPath = rawPath === 'en' ? '' : rawPath.slice(3);
    } else if (rawPath === 'ta' || rawPath.startsWith('ta/')) {
      routeLang = 'ta';
      rawPath = rawPath === 'ta' ? '' : rawPath.slice(3);
    } else {
      const qLang = queryParams.get('lang');
      if (qLang === 'en' || qLang === 'ta') {
        routeLang = qLang;
      }
    }

    // Collapse duplicate category prefixes (e.g. category/category/home -> category/home)
    rawPath = rawPath.replace(/^(?:category\/)+/i, 'category/').replace(/^\/+|\/+$/g, '');

    if (!rawPath || rawPath.toLowerCase() === 'home' || rawPath.toLowerCase() === 'category' || rawPath.toLowerCase() === 'category/home') {
      return { routes: [{ name: 'Home', params: { initialCategory: 'HOME', ...(routeLang ? { lang: routeLang } : {}) } }] };
    }

    const lower = rawPath.toLowerCase();

    if (lower === 'auth/callback') {
      return { routes: [{ name: 'AuthCallback' }] };
    }

    if (lower === 'onboarding/language' || lower === 'onboarding/topics') {
      return { routes: [{ name: 'UsernameSetup' }] };
    }

    if (lower.startsWith('category/')) {
      const segments = rawPath.split('/').filter(Boolean);
      const catSlug = segments[segments.length - 1] || 'home';
      return {
        routes: [{ name: 'Home', params: { initialCategory: slugToCategory(catSlug), ...(routeLang ? { lang: routeLang } : {}) } }],
      };
    }

    if (lower === 'latest' || lower === 'trending' || lower === 'most-read') {
      const mode = lower === 'most-read' ? 'popular' : lower;
      return {
        routes: [{ name: 'Home', params: { initialCategory: 'HOME', initialFeedMode: mode, ...(routeLang ? { lang: routeLang } : {}) } }],
      };
    }

    if (lower.startsWith('tag/')) {
      const tagSlug = decodeURIComponent(rawPath.slice(4));
      return {
        routes: [{ name: 'Search', params: { initialTag: tagSlug, ...(routeLang ? { lang: routeLang } : {}) } }],
      };
    }

    if (lower === 'search') {
      return {
        routes: [{
          name: 'Search',
          params: {
            initialQuery: queryParams.get('q') || '',
            initialTag: queryParams.get('tag') || '',
            initialSort: queryParams.get('sort') || '',
            ...(routeLang ? { lang: routeLang } : {}),
          },
        }],
      };
    }

    if (STATIC_PAGE_KEYS.has(lower)) {
      return {
        routes: [{ name: 'StaticInfo', params: { pageKey: lower, ...(routeLang ? { lang: routeLang } : {}) } }],
      };
    }

    if (lower === 'creators') {
      return { routes: [{ name: 'CreatorsDirectory', params: { ...(routeLang ? { lang: routeLang } : {}) } }] };
    }

    if (CATEGORY_SLUGS.has(lower)) {
      return getStateFromPath(`category/${lower}${querySuffix}`, options);
    }

    const normalizedTarget = querySuffix ? `${rawPath}${querySuffix}` : rawPath;
    const state = getStateFromPath(normalizedTarget, options);
    if (state && routeLang) {
      const routes = state.routes.map((r: any) => ({ ...r, params: { ...(r.params || {}), lang: routeLang } }));
      return { ...state, routes };
    }
    return state;
  },
  getPathFromState(state: any, options: any) {
    const activeRoute = state?.routes?.[state.index ?? state.routes.length - 1];
    const paramLang = activeRoute?.params?.lang;
    const lang: 'en' | 'ta' = paramLang === 'ta' || paramLang === 'en' ? paramLang : getActiveLocaleFromBrowser();

    if (activeRoute?.name === 'StaticInfo' && activeRoute?.params?.pageKey) {
      return `/${lang}/${activeRoute.params.pageKey}`;
    }
    if (activeRoute?.name === 'CreatorsDirectory') {
      return `/${lang}/creators`;
    }
    if (activeRoute?.name === 'Search') {
      const p = activeRoute.params || {};
      if (p.initialTag) return `/${lang}/tag/${encodeURIComponent(p.initialTag)}`;
      if (p.initialQuery) return `/${lang}/search?q=${encodeURIComponent(p.initialQuery)}`;
      return `/${lang}/search`;
    }

    if (activeRoute?.name === 'Home') {
      const rawCat = String((activeRoute.params as any)?.initialCategory || 'HOME');
      const slug = categoryToSlug(slugToCategory(rawCat));
      if (!slug || slug === 'home') {
        return `/${lang}`;
      }
      return `/${lang}/category/${slug}`;
    }

    const resolved = getPathFromState(state, options);
    const resolvedPathname = resolved.split('?')[0];
    if (resolvedPathname === '/category/home' || resolvedPathname === '/category' || resolvedPathname === '/') {
      return `/${lang}`;
    }
    if (resolved.startsWith('/article/')) {
      const clean = resolved.split('?')[0];
      return `/${lang}${clean}`;
    }
    if (
      resolved.startsWith('/en/') ||
      resolved.startsWith('/ta/') ||
      resolved === '/en' ||
      resolved === '/ta' ||
      resolved.startsWith('/auth/callback')
    ) {
      return resolved;
    }
    return `/${lang}${resolved.startsWith('/') ? resolved : `/${resolved}`}`;
  },
};

const ROUTE_PAGE_TITLES: Record<string, string> = {
  Home: 'PostsApp — Independent Digital Magazine & Wire',
  Explore: 'Explore Creators | PostsApp',
  Search: 'Search Stories | PostsApp',
  Library: 'Saved Library | PostsApp',
  Notifications: 'Notifications | PostsApp',
  CreatorProfile: 'Creator Profile | PostsApp',
  CreatorsDirectory: 'Creators Directory | PostsApp',
  Profile: 'My Profile | PostsApp',
  Settings: 'Settings | PostsApp',
  Login: 'Sign In | PostsApp',
  SignUp: 'Create Account | PostsApp',
  NotFound: 'Page Not Found | PostsApp',
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SiteLanguageProvider>
          <InteractionProvider>
            <FeedProvider>
              <NotificationProvider>
                <NavigationContainer
                  ref={navigationRef}
                  linking={linking}
                  documentTitle={{
                    formatter: (options, route) => {
                      if (options?.title) {
                        return options.title.includes('PostsApp')
                          ? options.title
                          : `${options.title} | PostsApp`;
                      }
                      if (route?.name === 'ArticleDetail') {
                        const params = (route.params || {}) as { title?: string };
                        return params.title ? `${params.title} | PostsApp` : 'PostsApp';
                      }
                      if (route?.name === 'Home') {
                        const cat = ((route.params || {}) as { initialCategory?: string }).initialCategory;
                        if (cat && cat !== 'HOME') return `${cat} | PostsApp`;
                        return ROUTE_PAGE_TITLES.Home;
                      }
                      if (route?.name === 'CreatorProfile') {
                        const authorName = ((route.params || {}) as { authorName?: string }).authorName;
                        return authorName ? `${authorName} | PostsApp` : ROUTE_PAGE_TITLES.CreatorProfile;
                      }
                      return (route?.name && ROUTE_PAGE_TITLES[route.name]) || 'PostsApp';
                    },
                  }}
                >
                  <RootNavigator />
                  <StatusBar style="auto" />
                </NavigationContainer>
              </NotificationProvider>
            </FeedProvider>
          </InteractionProvider>
        </SiteLanguageProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
