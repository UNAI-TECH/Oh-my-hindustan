import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { supabase } from '../../lib/supabaseClient';
import { AdData } from '../AdCard';
import { WebTopMasthead, WebStickyNavBar } from './WebPortalHeader';
import WebPortalFooter from './WebPortalFooter';
import { categoryToSlug } from './webPortalHelpers';

interface WebPageShellProps {
  children: React.ReactNode;
  activeCategory?: string;
  maxWidth?: number;
  refreshing?: boolean;
  onRefresh?: () => void;
  initialSearch?: string;
  onSearchSubmitOverride?: (query: string) => void;
}

/**
 * Shared desktop/tablet web shell providing the PostsApp utility bar,
 * crimson masthead, sticky navigation bar, centered content container,
 * and dark editorial footer across secondary pages.
 */
export default function WebPageShell({
  children,
  activeCategory = '',
  maxWidth = 1280,
  refreshing = false,
  onRefresh,
  initialSearch = '',
  onSearchSubmitOverride,
}: WebPageShellProps) {
  const navigation = useNavigation<any>();
  const { userProfile, isAuthenticated, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const scrollRef = useRef<ScrollView>(null);

  const [savedCount, setSavedCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [leaderboardAd, setLeaderboardAd] = useState<AdData | null>(null);

  useEffect(() => {
    setSearchQuery(initialSearch);
  }, [initialSearch]);

  useEffect(() => {
    if (!userProfile?.id) {
      setSavedCount(0);
      return;
    }

    const fetchSavedCount = () => {
      supabase
        .from('Save')
        .select('id', { count: 'exact', head: true })
        .eq('userId', userProfile.id)
        .then(({ count }) => {
          if (typeof count === 'number') setSavedCount(count);
        });
    };

    fetchSavedCount();
    const channel = supabase
      .channel(`web-shell-saves-${userProfile.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Save', filter: `userId=eq.${userProfile.id}` }, fetchSavedCount)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userProfile?.id]);

  useEffect(() => {
    supabase
      .from('ads')
      .select('*')
      .eq('status', 'active')
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setLeaderboardAd({ ...(data[0] as AdData), __isAd: true });
        }
      });
  }, []);

  const handleSelectCategory = (cat: string) => {
    navigation.navigate('Home', { initialCategory: categoryToSlug(cat) });
  };

  const handleSearchSubmit = () => {
    if (onSearchSubmitOverride) {
      onSearchSubmitOverride(searchQuery);
    } else {
      navigation.navigate('Search', { initialQuery: searchQuery.trim() });
    }
  };

  return (
    <ScrollView
      ref={scrollRef}
      stickyHeaderIndices={[1]}
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4191F" />
        ) : undefined
      }
    >
      <WebTopMasthead
        onSelectHome={() => navigation.navigate('Home', { initialCategory: 'home' })}
        onNavigate={(route, params) => navigation.navigate(route, params)}
        savedCount={savedCount}
        userProfile={userProfile}
        isAuthenticated={isAuthenticated}
        onScrollToNewsletter={() => scrollRef.current?.scrollToEnd({ animated: true })}
        leaderboardAd={leaderboardAd}
      />

      <WebStickyNavBar
        activeCategory={activeCategory}
        onSelectCategory={handleSelectCategory}
        searchQuery={searchQuery}
        onChangeSearch={setSearchQuery}
        onSubmitSearch={handleSearchSubmit}
        onPressWatchOnline={() => navigation.navigate('Home', { initialCategory: 'watch-online' })}
        onNavigate={(route, params) => navigation.navigate(route, params)}
        unreadNotifications={unreadCount}
        isAuthenticated={isAuthenticated}
        onLogout={logout}
        feedMode="latest"
        onChangeFeedMode={(mode) => navigation.navigate('Home', { initialFeedMode: mode })}
      />

      <View style={styles.bodyOuter}>
        <View style={[styles.bodyInner, { maxWidth }]}>
          {children}
        </View>
      </View>

      <WebPortalFooter
        onSelectCategory={handleSelectCategory}
        onNavigate={(route) => navigation.navigate(route)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  scrollContent: {
    minHeight: '100%',
  },
  bodyOuter: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  bodyInner: {
    width: '100%',
    alignSelf: 'center',
    flex: 1,
  },
});
