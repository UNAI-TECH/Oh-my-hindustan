import React from 'react';
import { StyleSheet, Platform } from 'react-native';
import { NavigationContainer, getStateFromPath, getPathFromState } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';

import RootNavigator from './src/navigation/RootNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { FeedProvider } from './src/context/FeedContext';
import { NotificationProvider } from './src/context/NotificationContext';
import { InteractionProvider } from './src/context/InteractionContext';
import { navigationRef } from './src/utils/navigation';
import { ThemeProvider } from './src/context/ThemeContext';
import { categoryToSlug, slugToCategory, WEB_NAV_CATEGORIES } from './src/components/web/webPortalHelpers';
import './src/lib/i18n';

const CATEGORY_SLUGS = new Set([
  ...WEB_NAV_CATEGORIES.map((c) => categoryToSlug(c)),
  'watch-online',
  'science-and-tech',
]);

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
      ProfileSetup: 'onboarding/profile',
      UsernameSetup: 'onboarding/username',
      LanguageSelection: 'onboarding/language',
      TopicSelection: 'onboarding/topics',
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
      CreatorDashboard: 'studio',
      CreatorAnalytics: 'studio/analytics',
      ContentEditor: 'studio/editor',
      CreatorContent: 'studio/content',
      CreatorComments: 'studio/comments',
      CreatorSubtitles: 'studio/subtitles',
      CreatorEarn: 'studio/earn',
      CreatorSettings: 'studio/settings',
      CreatorFeedback: 'studio/feedback',
      AdminOverview: 'admin',
      AdminMonetization: 'admin/economics',
      Splash: 'splash',
    },
  },
  getStateFromPath(path: string, options: any) {
    const cleanPath = path.split('?')[0].replace(/^\/+|\/+$/g, '');
    if (!cleanPath) {
      return { routes: [{ name: 'Home', params: { initialCategory: 'HOME' } }] };
    }
    const queryIndex = path.indexOf('?');
    const querySuffix = queryIndex >= 0 ? path.slice(queryIndex) : '';
    if (CATEGORY_SLUGS.has(cleanPath.toLowerCase())) {
      return getStateFromPath(`category/${cleanPath.toLowerCase()}${querySuffix}`, options);
    }
    return getStateFromPath(path, options);
  },
  getPathFromState(state: any, options: any) {
    const resolved = getPathFromState(state, options);
    if (resolved === '/category/home' || resolved === '/category') {
      return '/';
    }
    if (resolved.startsWith('/article/')) {
      return resolved.split('?')[0];
    }
    return resolved;
  },
};

const ROUTE_PAGE_TITLES: Record<string, string> = {
  Home: 'PostsApp — Independent Digital Magazine & Wire',
  Explore: 'Explore Creators | PostsApp',
  Search: 'Search Stories | PostsApp',
  Library: 'Saved Library | PostsApp',
  Notifications: 'Notifications | PostsApp',
  CreatorProfile: 'Creator Profile | PostsApp',
  Profile: 'My Profile | PostsApp',
  Settings: 'Settings | PostsApp',
  Login: 'Sign In | PostsApp',
  SignUp: 'Create Account | PostsApp',
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
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
