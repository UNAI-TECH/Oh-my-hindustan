import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Modal,
  Linking,
  Image,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import PostsAppLogo from '../PostsAppLogo';
import { AdData } from '../AdCard';
import { supabase } from '../../lib/supabaseClient';
import {
  WEB_NAV_CATEGORIES,
  POPULAR_TAGS,
  getFormattedHeaderDate,
} from './webPortalHelpers';

interface WebTopMastheadProps {
  onSelectHome: () => void;
  onNavigate: (route: string, params?: any) => void;
  savedCount: number;
  userProfile: any;
  isAuthenticated: boolean;
  onScrollToNewsletter: () => void;
  leaderboardAd?: AdData | null;
}

export function WebTopMasthead({
  onSelectHome,
  onNavigate,
  savedCount,
  userProfile,
  isAuthenticated,
  onScrollToNewsletter,
  leaderboardAd,
}: WebTopMastheadProps) {
  const { width } = useWindowDimensions();
  const isDesktopWide = width >= 1024;

  const handleAdClick = async () => {
    if (!leaderboardAd) {
      onScrollToNewsletter();
      return;
    }
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await supabase.rpc('track_ad_click', {
        p_ad_id: leaderboardAd.id,
        p_user_id: session?.user?.id || 'anonymous',
      });
    } catch (_) {}
    if (leaderboardAd.redirect_url) {
      Linking.openURL(leaderboardAd.redirect_url);
    }
  };

  return (
    <View style={styles.topWrapper}>
      {/* 1. Top Utility Bar */}
      <View style={styles.utilityBar}>
        <View style={styles.utilityInner}>
          <View style={styles.utilityLeft}>
            <Text style={styles.utilityDate}>{getFormattedHeaderDate()}</Text>
            <View style={styles.utilityDivider} />
            <TouchableOpacity onPress={onScrollToNewsletter}>
              <Text style={styles.utilityLink}>Subscribe</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onNavigate(isAuthenticated ? 'Settings' : 'Login')}>
              <Text style={styles.utilityLink}>Advertise</Text>
            </TouchableOpacity>
            <View style={styles.editionPill}>
              <Text style={styles.editionLabel}>Edition: </Text>
              <Text style={styles.editionValue}>All-India</Text>
            </View>
          </View>

          <View style={styles.utilityRight}>
            <View style={styles.socialGroup}>
              <TouchableOpacity onPress={() => Linking.openURL('https://facebook.com')}>
                <Ionicons name="logo-facebook" size={13} color="#A3A3A3" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => Linking.openURL('https://x.com')}>
                <Ionicons name="logo-twitter" size={13} color="#A3A3A3" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => Linking.openURL('https://instagram.com')}>
                <Ionicons name="logo-instagram" size={13} color="#A3A3A3" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => Linking.openURL('https://linkedin.com')}>
                <Ionicons name="logo-linkedin" size={13} color="#A3A3A3" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => Linking.openURL('https://youtube.com')}>
                <Ionicons name="logo-youtube" size={13} color="#A3A3A3" />
              </TouchableOpacity>
            </View>

            <View style={styles.utilityDivider} />

            <TouchableOpacity
              style={styles.savedBtn}
              onPress={() => onNavigate(isAuthenticated ? 'Library' : 'Login')}
            >
              <Ionicons name="star" size={12} color="#E5E7EB" />
              <Text style={styles.savedLabel}>Saved</Text>
              <View style={styles.savedBadge}>
                <Text style={styles.savedBadgeText}>{savedCount}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.authUtilityBtn}
              onPress={() => onNavigate(isAuthenticated ? 'Profile' : 'Login')}
            >
              <Ionicons name="person-circle-outline" size={15} color="#E5E7EB" />
              <Text style={styles.authUtilityText}>
                {isAuthenticated ? (userProfile?.username || 'Account') : 'Sign In'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* 2. Crimson Masthead + Leaderboard Ad Slot */}
      <LinearGradient
        colors={['#C4161C', '#9E1111']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.masthead}
      >
        <View style={[styles.mastheadInner, !isDesktopWide && styles.mastheadInnerTablet]}>
          <TouchableOpacity
            style={styles.brandCluster}
            activeOpacity={0.9}
            onPress={onSelectHome}
          >
            <View style={styles.logoBadge}>
              <PostsAppLogo variant="dark" size="md" />
            </View>
            <View style={styles.taglineBlock}>
              <Text style={styles.taglineTitle}>NEWS  •  POLICY  •  IDEAS</Text>
              <Text style={styles.taglineSub}>Independent Digital Magazine & Wire</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.leaderboardSlot}
            activeOpacity={0.85}
            onPress={handleAdClick}
          >
            <LinearGradient
              colors={['rgba(20, 20, 20, 0.52)', 'rgba(130, 12, 16, 0.48)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.leaderboardGradient}
            >
              {leaderboardAd ? (
                <View style={styles.leaderboardContent}>
                  <View style={styles.sponsoredPill}>
                    <Text style={styles.sponsoredPillText}>SPONSORED</Text>
                  </View>
                  <View style={styles.leaderboardTextWrap}>
                    <Text style={styles.leaderboardHeadline} numberOfLines={1}>
                      {leaderboardAd.title}
                    </Text>
                    <Text style={styles.leaderboardDesc} numberOfLines={1}>
                      {leaderboardAd.description || leaderboardAd.advertiser_name}
                    </Text>
                  </View>
                  {leaderboardAd.media_url ? (
                    <Image
                      source={{ uri: leaderboardAd.media_url }}
                      style={styles.leaderboardThumb}
                    />
                  ) : null}
                  <Text style={styles.leaderboardMeta}>LEARN MORE →</Text>
                </View>
              ) : (
                <View style={styles.leaderboardContent}>
                  <View style={styles.sponsoredPill}>
                    <Text style={styles.sponsoredPillText}>SPONSORED</Text>
                  </View>
                  <View style={styles.leaderboardTextWrap}>
                    <Text style={styles.leaderboardTitleRow} numberOfLines={1}>
                      <Text style={styles.leaderboardWhite}>BANNER </Text>
                      <Text style={styles.leaderboardAccent}>ADVERTISEMENT</Text>
                    </Text>
                    <Text style={styles.leaderboardDesc} numberOfLines={1}>
                      PostsApp Annual Policy & Infrastructure Conclave 2026 — Register Now
                    </Text>
                  </View>
                  <View style={styles.leaderboardSlotRight}>
                    <Text style={styles.leaderboardSlotLabel}>LEADERBOARD SLOT</Text>
                    <Text style={styles.leaderboardSlotDims}>930 × 110 px →</Text>
                  </View>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
}

interface WebStickyNavBarProps {
  activeCategory: string;
  onSelectCategory: (category: string) => void;
  searchQuery: string;
  onChangeSearch: (q: string) => void;
  onSubmitSearch: () => void;
  onPressWatchOnline: () => void;
  onNavigate: (route: string, params?: any) => void;
  unreadNotifications: number;
  isAuthenticated: boolean;
  onLogout: () => Promise<void>;
  feedMode: 'latest' | 'trending' | 'articles' | 'videos';
  onChangeFeedMode: (mode: 'latest' | 'trending' | 'articles' | 'videos') => void;
}

export function WebStickyNavBar({
  activeCategory,
  onSelectCategory,
  searchQuery,
  onChangeSearch,
  onSubmitSearch,
  onPressWatchOnline,
  onNavigate,
  unreadNotifications,
  isAuthenticated,
  onLogout,
  feedMode,
  onChangeFeedMode,
}: WebStickyNavBarProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <View style={styles.stickyNav}>
      <View style={styles.stickyNavInner}>
        <View style={styles.navLeft}>
          <TouchableOpacity
            style={styles.hamburgerBtn}
            onPress={() => setDrawerOpen(true)}
            accessibilityLabel="Open navigation menu"
          >
            <Ionicons name="menu" size={22} color="#FFFFFF" />
          </TouchableOpacity>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.navCategories}
          >
            {WEB_NAV_CATEGORIES.map((cat) => {
              const isActive = activeCategory.toUpperCase() === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.navTab, isActive && styles.navTabActive]}
                  onPress={() => onSelectCategory(cat)}
                >
                  <Text style={[styles.navTabText, isActive && styles.navTabTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.navRight}>
          <View style={styles.searchBox}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search news..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={onChangeSearch}
              onSubmitEditing={onSubmitSearch}
              returnKeyType="search"
            />
            <TouchableOpacity onPress={onSubmitSearch}>
              <Ionicons name="search" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.watchOnlineBtn}
            onPress={onPressWatchOnline}
          >
            <Ionicons name="play" size={11} color="#FFFFFF" />
            <Text style={styles.watchOnlineText}>WATCH ONLINE</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Slide-over Navigation Drawer for all app features */}
      <Modal
        visible={drawerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setDrawerOpen(false)}
      >
        <View style={styles.drawerOverlay}>
          <View style={styles.drawerPanel}>
            <View style={styles.drawerHeader}>
              <PostsAppLogo variant="dark" size="sm" />
              <TouchableOpacity onPress={() => setDrawerOpen(false)}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: 12 }}>
              <Text style={styles.drawerSectionTitle}>NAVIGATION</Text>
              {[
                { label: 'Home Portal', icon: 'home-outline', route: 'Home' },
                { label: 'Explore Creators', icon: 'compass-outline', route: 'Explore' },
                { label: '24h Stories', icon: 'aperture-outline', route: 'StoryFeed' },
                { label: 'Saved Library', icon: 'bookmark-outline', route: 'Library' },
                { label: 'Search All', icon: 'search-outline', route: 'Search' },
                {
                  label: unreadNotifications > 0 ? `Notifications (${unreadNotifications})` : 'Notifications',
                  icon: 'notifications-outline',
                  route: 'Notifications',
                },
                { label: 'My Profile', icon: 'person-outline', route: 'Profile' },
                { label: 'Settings', icon: 'settings-outline', route: 'Settings' },
              ].map((item) => (
                <TouchableOpacity
                  key={item.route}
                  style={styles.drawerItem}
                  onPress={() => {
                    setDrawerOpen(false);
                    if (item.route === 'Home') {
                      onSelectCategory('HOME');
                    } else {
                      onNavigate(item.route);
                    }
                  }}
                >
                  <Ionicons name={item.icon as any} size={18} color="#D1D5DB" />
                  <Text style={styles.drawerItemText}>{item.label}</Text>
                </TouchableOpacity>
              ))}

              <Text style={[styles.drawerSectionTitle, { marginTop: 20 }]}>FEED FILTERS</Text>
              {(
                [
                  { key: 'latest', label: 'For you (Latest)' },
                  { key: 'trending', label: 'Trending Stories' },
                  { key: 'articles', label: 'Articles Only' },
                  { key: 'videos', label: 'Videos & Debates' },
                ] as const
              ).map((m) => (
                <TouchableOpacity
                  key={m.key}
                  style={[styles.drawerItem, feedMode === m.key && styles.drawerItemActive]}
                  onPress={() => {
                    onChangeFeedMode(m.key);
                    setDrawerOpen(false);
                  }}
                >
                  <Ionicons
                    name={feedMode === m.key ? 'radio-button-on' : 'radio-button-off'}
                    size={16}
                    color={feedMode === m.key ? '#D4191F' : '#9CA3AF'}
                  />
                  <Text
                    style={[
                      styles.drawerItemText,
                      feedMode === m.key && { color: '#FFFFFF', fontWeight: '700' },
                    ]}
                  >
                    {m.label}
                  </Text>
                </TouchableOpacity>
              ))}

              <View style={styles.drawerFooter}>
                {isAuthenticated ? (
                  <TouchableOpacity
                    style={styles.drawerAuthBtn}
                    onPress={async () => {
                      setDrawerOpen(false);
                      await onLogout();
                      onNavigate('Login');
                    }}
                  >
                    <Ionicons name="log-out-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.drawerAuthText}>Log Out</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.drawerAuthBtn}
                    onPress={() => {
                      setDrawerOpen(false);
                      onNavigate('Login');
                    }}
                  >
                    <Ionicons name="log-in-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.drawerAuthText}>Sign In / Join PostsApp</Text>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          </View>
          <TouchableOpacity
            style={styles.drawerBackdrop}
            activeOpacity={1}
            onPress={() => setDrawerOpen(false)}
          />
        </View>
      </Modal>
    </View>
  );
}

export function WebPopularTagsBar({
  activeTag,
  onSelectTag,
}: {
  activeTag: string | null;
  onSelectTag: (tag: string) => void;
}) {
  return (
    <View style={styles.tagsBar}>
      <View style={styles.tagsInner}>
        <View style={styles.tagsLabelWrap}>
          <View style={styles.tagsDot} />
          <Text style={styles.tagsLabel}>Popular Tags</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagsList}>
          {POPULAR_TAGS.map((tag) => {
            const isSelected = activeTag === tag;
            return (
              <TouchableOpacity
                key={tag}
                style={styles.tagItem}
                onPress={() => onSelectTag(tag)}
              >
                <Text style={[styles.tagText, isSelected && styles.tagTextActive]}>
                  {tag}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topWrapper: {
    width: '100%',
  },
  utilityBar: {
    backgroundColor: '#141414',
    borderBottomWidth: 1,
    borderBottomColor: '#262626',
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  utilityInner: {
    maxWidth: 1280,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  utilityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 14,
  },
  utilityDate: {
    color: '#A3A3A3',
    fontSize: 12,
    fontWeight: '500',
  },
  utilityDivider: {
    width: 1,
    height: 12,
    backgroundColor: '#333333',
  },
  utilityLink: {
    color: '#D4D4D4',
    fontSize: 12,
    fontWeight: '500',
  },
  editionPill: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editionLabel: {
    color: '#A3A3A3',
    fontSize: 12,
  },
  editionValue: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  utilityRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  socialGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  savedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  savedLabel: {
    color: '#E5E7EB',
    fontSize: 12,
    fontWeight: '600',
  },
  savedBadge: {
    backgroundColor: '#D4191F',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 3,
    minWidth: 18,
    alignItems: 'center',
  },
  savedBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  authUtilityBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingLeft: 8,
    borderLeftWidth: 1,
    borderLeftColor: '#333333',
  },
  authUtilityText: {
    color: '#E5E7EB',
    fontSize: 12,
    fontWeight: '600',
  },
  masthead: {
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  mastheadInner: {
    maxWidth: 1280,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 24,
  },
  mastheadInnerTablet: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 16,
  },
  brandCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flexShrink: 0,
  },
  logoBadge: {
    backgroundColor: '#141414',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  taglineBlock: {
    justifyContent: 'center',
  },
  taglineTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  taglineSub: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 12,
    marginTop: 3,
  },
  leaderboardSlot: {
    flex: 1,
    maxWidth: 740,
    minHeight: 82,
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  leaderboardGradient: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 14,
    justifyContent: 'center',
  },
  leaderboardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  sponsoredPill: {
    backgroundColor: '#D4191F',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 3,
  },
  sponsoredPillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  leaderboardTextWrap: {
    flex: 1,
  },
  leaderboardTitleRow: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  leaderboardWhite: {
    color: '#FFFFFF',
  },
  leaderboardAccent: {
    color: '#DC2626',
  },
  leaderboardHeadline: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  leaderboardDesc: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    marginTop: 3,
  },
  leaderboardThumb: {
    width: 72,
    height: 48,
    borderRadius: 4,
  },
  leaderboardMeta: {
    color: '#FCA5A5',
    fontSize: 11,
    fontWeight: '700',
  },
  leaderboardSlotRight: {
    alignItems: 'flex-end',
  },
  leaderboardSlotLabel: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  leaderboardSlotDims: {
    color: '#FCA5A5',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  stickyNav: {
    backgroundColor: '#181818',
    borderBottomWidth: 1,
    borderBottomColor: '#262626',
    paddingHorizontal: 20,
    zIndex: 100,
    width: '100%',
  },
  stickyNavInner: {
    maxWidth: 1280,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 50,
    gap: 12,
  },
  navLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minHeight: 50,
  },
  hamburgerBtn: {
    paddingRight: 16,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navCategories: {
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: 50,
  },
  navTab: {
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 50,
  },
  navTabActive: {
    backgroundColor: '#D4191F',
  },
  navTabText: {
    color: '#E5E7EB',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  navTabTextActive: {
    color: '#FFFFFF',
  },
  navRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 7,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 4,
    paddingHorizontal: 12,
    height: 36,
    width: 190,
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 12,
    outlineStyle: 'none' as any,
  },
  watchOnlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#D4191F',
    paddingHorizontal: 14,
    height: 36,
    borderRadius: 4,
  },
  watchOnlineText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  tagsBar: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  tagsInner: {
    maxWidth: 1280,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  tagsLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tagsDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D4191F',
  },
  tagsLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
  },
  tagsList: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  tagItem: {
    paddingVertical: 2,
  },
  tagText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '500',
  },
  tagTextActive: {
    color: '#D4191F',
    fontWeight: '700',
  },
  drawerOverlay: {
    flex: 1,
    flexDirection: 'row',
  },
  drawerPanel: {
    width: 300,
    backgroundColor: '#141414',
    height: '100%',
    paddingHorizontal: 20,
    paddingTop: 20,
    borderRightWidth: 1,
    borderRightColor: '#262626',
  },
  drawerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#262626',
    marginBottom: 12,
  },
  drawerSectionTitle: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  drawerItemActive: {
    backgroundColor: '#262626',
  },
  drawerItemText: {
    color: '#E5E7EB',
    fontSize: 14,
    fontWeight: '500',
  },
  drawerFooter: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#262626',
  },
  drawerAuthBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#D4191F',
    paddingVertical: 12,
    borderRadius: 6,
  },
  drawerAuthText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
