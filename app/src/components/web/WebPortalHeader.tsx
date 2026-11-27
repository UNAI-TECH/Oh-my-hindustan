import React, { useState, useEffect, useRef } from 'react';
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
  ActivityIndicator,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import PostsAppLogo from '../PostsAppLogo';
import { AdData } from '../AdCard';
import { supabase } from '../../lib/supabaseClient';
import { openExternalUrl } from '../../utils/openExternalUrl';
import { useTranslation } from 'react-i18next';
import { useSiteLanguage } from '../../context/SiteLanguageContext';
import { getOrCreateVisitorId } from '../../utils/visitorId';
import { AppApi } from '../../api/services';
import {
  WEB_NAV_CATEGORIES,
  POPULAR_TAGS,
  getFormattedHeaderDate,
  buildArticleParams,
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
  const isMobile = width < 640;
  const { lang, setSiteLang } = useSiteLanguage();
  const { t } = useTranslation();

  const handleSwitchLang = (target: 'en' | 'ta') => {
    setSiteLang(target);
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const p = window.location.pathname || '/';
      const params = new URLSearchParams(window.location.search || '');
      params.delete('lang');
      const cleanSearch = params.toString();
      const searchSuffix = cleanSearch ? `?${cleanSearch}` : '';
      if (!p.includes('/article/') && (p === '/' || p === '/en' || p === '/ta' || p.startsWith('/en/') || p.startsWith('/ta/'))) {
        const nextPath = p === '/' ? `/${target}` : p.replace(/^\/(en|ta)(\/|$)/, `/${target}$2`);
        window.history.replaceState(null, '', nextPath + searchSuffix);
      }
    }
  };

  const handleAdClick = () => {
    if (!leaderboardAd) {
      onScrollToNewsletter();
      return;
    }

    // Open redirect synchronously inside the user click gesture before async tracking
    openExternalUrl(leaderboardAd.redirect_url);

    void (async () => {
      try {
        const [{ data: { session } }, visitorId] = await Promise.all([
          supabase.auth.getSession(),
          getOrCreateVisitorId(),
        ]);
        await supabase.rpc('track_ad_click', {
          p_ad_id: leaderboardAd.id,
          p_user_id: session?.user?.id || visitorId,
        });
      } catch (_) {}
    })();
  };

  return (
    <View style={styles.topWrapper}>
      {/* 1. Top Utility Bar */}
      <View style={[styles.utilityBar, isMobile && { paddingHorizontal: 12, paddingVertical: 6 }]}>
        <View style={styles.utilityInner}>
          <View style={[styles.utilityLeft, isMobile && { gap: 8 }]}>
            {!isMobile && (
              <>
                <Text style={styles.utilityDate}>{getFormattedHeaderDate()}</Text>
                <View style={styles.utilityDivider} />
              </>
            )}
            <TouchableOpacity onPress={onScrollToNewsletter}>
              <Text style={styles.utilityLink}>{t('nav.subscribe', 'Subscribe')}</Text>
            </TouchableOpacity>
            {!isMobile && (
              <TouchableOpacity onPress={() => onNavigate('StaticInfo', { pageKey: 'advertise' })}>
                <Text style={styles.utilityLink}>{t('nav.advertise', 'Advertise')}</Text>
              </TouchableOpacity>
            )}
            <View style={styles.editionPill}>
              {!isMobile && <Text style={styles.editionLabel}>{t('nav.edition', 'Edition')}: </Text>}
              <Text style={styles.editionValue}>{t('nav.all_india', 'All-India')}</Text>
            </View>
          </View>

          <View style={[styles.utilityRight, isMobile && { gap: 8 }]}>
            {!isMobile && (
              <>
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
              </>
            )}

            <View style={styles.langSwitchWrap}>
              <TouchableOpacity
                style={[styles.langBtn, lang === 'en' && styles.langBtnActive]}
                onPress={() => handleSwitchLang('en')}
              >
                <Text style={[styles.langBtnText, lang === 'en' && styles.langBtnTextActive]}>EN</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.langBtn, lang === 'ta' && styles.langBtnActive]}
                onPress={() => handleSwitchLang('ta')}
              >
                <Text style={[styles.langBtnText, lang === 'ta' && styles.langBtnTextActive]}>தமிழ்</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.utilityDivider} />

            <TouchableOpacity
              style={styles.savedBtn}
              onPress={() => onNavigate(isAuthenticated ? 'Library' : 'Login')}
            >
              <Ionicons name="star" size={12} color="#E5E7EB" />
              <Text style={styles.savedLabel}>{t('nav.saved', 'Saved')}</Text>
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
                {isAuthenticated ? (userProfile?.username || t('nav.profile', 'Account')) : t('nav.sign_in', 'Sign In')}
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
        style={[styles.masthead, isMobile && { paddingVertical: 12, paddingHorizontal: 12 }]}
      >
        <View style={[styles.mastheadInner, !isDesktopWide && styles.mastheadInnerTablet]}>
          <TouchableOpacity
            style={[styles.brandCluster, isMobile && { gap: 10 }]}
            activeOpacity={0.9}
            onPress={onSelectHome}
          >
            <View style={[styles.logoBadge, isMobile && { paddingHorizontal: 10, paddingVertical: 6 }]}>
              <PostsAppLogo variant="dark" size={isMobile ? 'sm' : 'md'} />
            </View>
            <View style={[styles.taglineBlock, { flexShrink: 1 }]}>
              <Text style={[styles.taglineTitle, isMobile && { fontSize: 10, letterSpacing: 1 }]} numberOfLines={1}>
                NEWS  •  POLICY  •  IDEAS
              </Text>
              <Text style={[styles.taglineSub, isMobile && { fontSize: 11 }]} numberOfLines={1}>
                Independent Digital Magazine & Wire
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.leaderboardSlot, !isDesktopWide && styles.leaderboardSlotTablet]}
            activeOpacity={0.85}
            onPress={handleAdClick}
          >
            {leaderboardAd && leaderboardAd.media_url ? (
              <View style={styles.leaderboardMediaWrap} pointerEvents="none">
                <Image
                  source={{ uri: leaderboardAd.media_url }}
                  style={styles.leaderboardMediaBackdrop}
                  resizeMode="cover"
                  blurRadius={16}
                />
                <View style={styles.leaderboardMediaScrim} />
                <Image
                  source={{ uri: leaderboardAd.media_url }}
                  style={styles.leaderboardMediaContain}
                  resizeMode="contain"
                />
                <View style={styles.sponsoredBadgeOverlay}>
                  <Text style={styles.sponsoredPillText}>SPONSORED</Text>
                </View>
                <View style={styles.learnMoreOverlay}>
                  <Text style={styles.learnMoreOverlayText}>LEARN MORE →</Text>
                </View>
              </View>
            ) : (
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
                      <Text style={styles.leaderboardSlotDims}>984 × 125 px →</Text>
                    </View>
                  </View>
                )}
              </LinearGradient>
            )}
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
  feedMode: 'latest' | 'trending' | 'popular' | 'articles' | 'videos';
  onChangeFeedMode: (mode: 'latest' | 'trending' | 'popular' | 'articles' | 'videos') => void;
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
  const { lang } = useSiteLanguage();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const isMobileNav = width < 768;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [livePosts, setLivePosts] = useState<any[]>([]);
  const [liveCreators, setLiveCreators] = useState<any[]>([]);
  const [liveSearching, setLiveSearching] = useState(false);
  const [liveRefreshTick, setLiveRefreshTick] = useState(0);
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const blurTimerRef = useRef<any>(null);

  useEffect(() => {
    AppApi.getBilingualCategories()
      .then((cats) => setDbCategories(cats || []))
      .catch(() => {});
  }, []);

  const navCategories = React.useMemo(() => {
    const homeItem = { key: 'HOME', label: t('nav.home', 'HOME') };
    const visible = dbCategories.filter((c) => c.nav_visible !== false && c.name_en);
    if (visible.length > 0) {
      return [
        homeItem,
        ...visible.map((c) => ({
          key: String(c.name_en).toUpperCase(),
          label: lang === 'ta' ? (c.name_ta || c.name_en) : String(c.name_en).toUpperCase(),
        })),
      ];
    }
    return WEB_NAV_CATEGORIES.map((c) => ({
      key: c,
      label: c === 'HOME' ? t('nav.home', 'HOME') : c,
    }));
  }, [dbCategories, lang, t]);

  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setLivePosts([]);
      setLiveCreators([]);
      setLiveSearching(false);
      return;
    }

    let cancelled = false;
    setLiveSearching(true);
    const safeQ = trimmed.replace(/[,()]/g, ' ').trim();

    const timer = setTimeout(async () => {
      try {
        const [rpcRes, creatorsRes] = await Promise.all([
          AppApi.searchArticlesRpc({
            query: trimmed,
            language: lang,
            sort: 'relevance',
            limit: 6,
          }).catch(async () => {
            const fallback = await supabase
              .from('Post')
              .select('id, slug, title, type, category, custom_category, thumbnail, createdAt, author:User!authorId(id, username, channel_name)')
              .eq('status', 'PUBLISHED')
              .or('is_active.eq.true,is_active.is.null')
              .or(`title.ilike.%${safeQ}%,category.ilike.%${safeQ}%,content.ilike.%${safeQ}%`)
              .order('createdAt', { ascending: false })
              .limit(6);
            return { items: fallback.data || [], total: 0 };
          }),
          supabase
            .from('User')
            .select('id, username, channel_name, "avatarUrl", role')
            .in('role', ['ANALYST', 'CREATOR'])
            .or(`username.ilike.%${safeQ}%,channel_name.ilike.%${safeQ}%`)
            .limit(3),
        ]);

        if (!cancelled) {
          const normalizedPosts = (rpcRes.items || []).map((p: any) => ({
            ...p,
            author: p.author || {
              id: p.author_id || p.authorId,
              username: p.author_username || 'PostsApp',
              channel_name: p.author_name || p.author_username,
            },
          }));
          setLivePosts(normalizedPosts);
          setLiveCreators(creatorsRes.data || []);
        }
      } catch (_) {
        if (!cancelled) {
          setLivePosts([]);
          setLiveCreators([]);
        }
      } finally {
        if (!cancelled) setLiveSearching(false);
      }
    }, 180);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery, liveRefreshTick, lang]);

  // Keep open search results synced in real time when posts are created or updated
  useEffect(() => {
    if (!searchQuery.trim()) return;
    const channel = supabase
      .channel('web-header-live-search')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Post' }, () => {
        setLiveRefreshTick((t) => t + 1);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [Boolean(searchQuery.trim())]);

  const showLiveDropdown = searchFocused && searchQuery.trim().length > 0;

  const handleSelectLivePost = (post: any) => {
    if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
    setSearchFocused(false);
    onNavigate('ArticleDetail', buildArticleParams(post));
  };

  const handleSelectLiveCreator = (creator: any) => {
    if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
    setSearchFocused(false);
    const authorName = creator.channel_name || creator.username || 'Creator';
    onNavigate('CreatorProfile', { authorId: creator.id, authorName });
  };

  return (
    <View style={[styles.stickyNav, isMobileNav && { paddingHorizontal: 10 }]}>
      <View style={styles.stickyNavInner}>
        <View style={styles.navLeft}>
          <TouchableOpacity
            style={[styles.hamburgerBtn, isMobileNav && { paddingRight: 10 }]}
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
            {navCategories.map((cat) => {
              const isActive = activeCategory.toUpperCase() === cat.key;
              return (
                <TouchableOpacity
                  key={cat.key}
                  style={[styles.navTab, isMobileNav && { paddingHorizontal: 10 }, isActive && styles.navTabActive]}
                  onPress={() => onSelectCategory(cat.key)}
                >
                  <Text style={[styles.navTabText, isMobileNav && { fontSize: 11 }, isActive && styles.navTabTextActive]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.navRight}>
          {isMobileNav ? (
            <TouchableOpacity
              onPress={() => setMobileSearchOpen((v) => !v)}
              style={{
                width: 36,
                height: 36,
                borderRadius: 6,
                backgroundColor: mobileSearchOpen ? '#D4191F' : '#2A2A2A',
                justifyContent: 'center',
                alignItems: 'center',
              }}
              accessibilityLabel="Toggle search"
            >
              <Ionicons name={mobileSearchOpen ? 'close' : 'search'} size={17} color="#FFFFFF" />
            </TouchableOpacity>
          ) : (
            <View style={styles.searchContainer}>
              <View style={[styles.searchBox, showLiveDropdown && styles.searchBoxFocused]}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search news..."
                  placeholderTextColor="#9CA3AF"
                  value={searchQuery}
                  onChangeText={(q) => {
                    onChangeSearch(q);
                    setSearchFocused(true);
                  }}
                  onFocus={() => {
                    if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
                    setSearchFocused(true);
                  }}
                  onBlur={() => {
                    blurTimerRef.current = setTimeout(() => setSearchFocused(false), 220);
                  }}
                  onSubmitEditing={() => {
                    setSearchFocused(false);
                    onSubmitSearch();
                  }}
                  returnKeyType="search"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity
                    onPress={() => onChangeSearch('')}
                    style={{ marginRight: 6 }}
                    accessibilityLabel="Clear search"
                  >
                    <Ionicons name="close-circle" size={15} color="#9CA3AF" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => {
                    setSearchFocused(false);
                    onSubmitSearch();
                  }}
                >
                  <Ionicons name="search" size={16} color="#9CA3AF" />
                </TouchableOpacity>
              </View>

              {showLiveDropdown && (
                <View style={styles.liveSearchDropdown}>
                  <View style={styles.liveSearchHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <View style={styles.livePulseDot} />
                      <Text style={styles.liveSearchTitle}>LIVE RESULTS</Text>
                    </View>
                    {liveSearching ? (
                      <ActivityIndicator size="small" color="#D4191F" />
                    ) : (
                      <Text style={styles.liveSearchCount}>
                        {livePosts.length + liveCreators.length} found
                      </Text>
                    )}
                  </View>

                  <ScrollView
                    style={{ maxHeight: 340 }}
                    keyboardShouldPersistTaps="handled"
                    nestedScrollEnabled
                  >
                    {liveCreators.length > 0 && (
                      <View style={styles.liveSectionBlock}>
                        <Text style={styles.liveSectionLabel}>CREATORS</Text>
                        {liveCreators.map((c) => {
                          const displayName = c.channel_name || c.username || 'Creator';
                          return (
                            <TouchableOpacity
                              key={`live-c-${c.id}`}
                              style={styles.liveResultRow}
                              onPress={() => handleSelectLiveCreator(c)}
                            >
                              {c.avatarUrl ? (
                                <Image source={{ uri: c.avatarUrl }} style={styles.liveCreatorAvatar} />
                              ) : (
                                <View style={[styles.liveCreatorAvatar, styles.liveThumbFallback]}>
                                  <Ionicons name="person" size={14} color="#D4191F" />
                                </View>
                              )}
                              <View style={{ flex: 1 }}>
                                <Text style={styles.liveResultTitle} numberOfLines={1}>
                                  {displayName}
                                </Text>
                                {c.username && (
                                  <Text style={styles.liveResultMeta}>@{c.username}</Text>
                                )}
                              </View>
                              <Ionicons name="chevron-forward" size={14} color="#6B7280" />
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}

                    {livePosts.length > 0 && (
                      <View style={styles.liveSectionBlock}>
                        <Text style={styles.liveSectionLabel}>STORIES</Text>
                        {livePosts.map((post) => {
                          const catLabel =
                            post.category === 'custom' && post.custom_category
                              ? post.custom_category
                              : post.category || 'NEWS';
                          const authorLabel =
                            post.author?.channel_name || post.author?.username || 'PostsApp';
                          return (
                            <TouchableOpacity
                              key={`live-p-${post.id}`}
                              style={styles.liveResultRow}
                              onPress={() => handleSelectLivePost(post)}
                            >
                              {post.thumbnail ? (
                                <Image source={{ uri: post.thumbnail }} style={styles.livePostThumb} />
                              ) : (
                                <View style={[styles.livePostThumb, styles.liveThumbFallback]}>
                                  <Ionicons name="newspaper-outline" size={16} color="#9CA3AF" />
                                </View>
                              )}
                              <View style={{ flex: 1 }}>
                                <Text style={styles.livePostCat} numberOfLines={1}>
                                  {String(catLabel).toUpperCase()}
                                </Text>
                                <Text style={styles.liveResultTitle} numberOfLines={2}>
                                  {post.title}
                                </Text>
                                <Text style={styles.liveResultMeta} numberOfLines={1}>
                                  {authorLabel}
                                </Text>
                              </View>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}

                    {!liveSearching && livePosts.length === 0 && liveCreators.length === 0 && (
                      <View style={styles.liveEmptyState}>
                        <Ionicons name="search-outline" size={22} color="#6B7280" />
                        <Text style={styles.liveEmptyText}>
                          No matching stories found for "{searchQuery.trim()}"
                        </Text>
                      </View>
                    )}
                  </ScrollView>

                  <TouchableOpacity
                    style={styles.liveFooterBtn}
                    onPress={() => {
                      if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
                      setSearchFocused(false);
                      onSubmitSearch();
                    }}
                  >
                    <Text style={styles.liveFooterBtnText}>
                      View all results for "{searchQuery.trim()}" →
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {!isMobileNav && (
            <TouchableOpacity
              style={styles.watchOnlineBtn}
              onPress={onPressWatchOnline}
            >
              <Ionicons name="play" size={11} color="#FFFFFF" />
              <Text style={styles.watchOnlineText}>{t('nav.watch_online', 'WATCH ONLINE')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {isMobileNav && mobileSearchOpen && (
        <View style={{ paddingBottom: 10, paddingTop: 4 }}>
          <View style={[styles.searchBox, { width: '100%' }]}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search news, topics, creators..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={onChangeSearch}
              onSubmitEditing={() => {
                setMobileSearchOpen(false);
                onSubmitSearch();
              }}
              returnKeyType="search"
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => onChangeSearch('')} style={{ marginRight: 8 }}>
                <Ionicons name="close-circle" size={16} color="#9CA3AF" />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => {
                setMobileSearchOpen(false);
                onSubmitSearch();
              }}
            >
              <Ionicons name="search" size={17} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Slide-over Sidebar Drawer */}
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
                { label: 'Creators Directory', icon: 'people-outline', route: 'CreatorsDirectory' },
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
                { label: 'About PostsApp', icon: 'information-circle-outline', route: 'StaticInfo', params: { pageKey: 'about' } },
                { label: 'Advertise', icon: 'megaphone-outline', route: 'StaticInfo', params: { pageKey: 'advertise' } },
              ].map((item: any) => (
                <TouchableOpacity
                  key={`${item.route}-${item.label}`}
                  style={styles.drawerItem}
                  onPress={() => {
                    setDrawerOpen(false);
                    if (item.route === 'Home') {
                      onSelectCategory('HOME');
                    } else {
                      onNavigate(item.route, item.params);
                    }
                  }}
                >
                  <Ionicons name={item.icon as any} size={18} color="#D1D5DB" />
                  <Text style={styles.drawerItemText}>{item.label}</Text>
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                style={styles.drawerItem}
                onPress={() => {
                  setDrawerOpen(false);
                  onPressWatchOnline();
                }}
              >
                <Ionicons name="logo-youtube" size={18} color="#EF4444" />
                <Text style={styles.drawerItemText}>{t('nav.watch_online', 'Watch Online')}</Text>
              </TouchableOpacity>

              <Text style={[styles.drawerSectionTitle, { marginTop: 20 }]}>FEED FILTERS</Text>
              {(
                [
                  { key: 'latest', label: t('common.latest', 'Latest') },
                  { key: 'trending', label: t('common.trending', 'Trending') },
                  { key: 'popular', label: t('common.most_read', 'Most Read') },
                  { key: 'articles', label: t('common.articles', 'Articles') },
                  { key: 'videos', label: t('common.videos', 'Videos') },
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
  const { lang } = useSiteLanguage();
  const { t } = useTranslation();
  const [dbTags, setDbTags] = useState<Array<{ key: string; label: string }>>([]);

  useEffect(() => {
    AppApi.getPopularTags(14)
      .then((rows) => {
        if (rows && rows.length > 0) {
          setDbTags(
            rows.map((r: any) => {
              const rawName = (lang === 'ta' ? (r.name_ta || r.name_en) : r.name_en) || r.slug_en;
              const normalized = `#${String(r.slug_en || r.name_en || rawName).replace(/^#/, '')}`;
              const display = rawName.startsWith('#') ? rawName : `#${rawName}`;
              return { key: normalized, label: display };
            })
          );
        }
      })
      .catch(() => {});
  }, [lang]);

  const tagsToRender =
    dbTags.length > 0
      ? dbTags
      : POPULAR_TAGS.map((tg) => ({ key: tg, label: tg }));

  return (
    <View style={styles.tagsBar}>
      <View style={styles.tagsInner}>
        <View style={styles.tagsLabelWrap}>
          <View style={styles.tagsDot} />
          <Text style={styles.tagsLabel}>{t('editorial.popular_tags', 'Popular Tags')}</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagsList}>
          {tagsToRender.map((tag) => {
            const isSelected = activeTag === tag.key;
            return (
              <TouchableOpacity
                key={tag.key}
                style={styles.tagItem}
                onPress={() => onSelectTag(tag.key)}
              >
                <Text style={[styles.tagText, isSelected && styles.tagTextActive]}>
                  {tag.label}
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
  langSwitchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#262626',
    borderRadius: 4,
    padding: 2,
    gap: 2,
  },
  langBtn: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 3,
  },
  langBtnActive: {
    backgroundColor: '#D4191F',
  },
  langBtnText: {
    color: '#A3A3A3',
    fontSize: 11,
    fontWeight: '700',
  },
  langBtnTextActive: {
    color: '#FFFFFF',
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
    width: '100%',
    maxWidth: 820,
    aspectRatio: 984 / 125,
    minHeight: 68,
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  leaderboardSlotTablet: {
    flex: 0,
    width: '100%',
    maxWidth: '100%',
  },
  leaderboardMediaWrap: {
    flex: 1,
    width: '100%',
    height: '100%',
    position: 'relative',
    backgroundColor: '#141414',
    justifyContent: 'center',
    alignItems: 'center',
  },
  leaderboardMediaBackdrop: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    opacity: 0.35,
  },
  leaderboardMediaScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 15, 15, 0.42)',
  },
  leaderboardMediaContain: {
    width: '100%',
    height: '100%',
  },
  sponsoredBadgeOverlay: {
    position: 'absolute',
    top: 6,
    left: 8,
    backgroundColor: 'rgba(212, 25, 31, 0.92)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  learnMoreOverlay: {
    position: 'absolute',
    bottom: 6,
    right: 8,
    backgroundColor: 'rgba(20, 20, 20, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 3,
  },
  learnMoreOverlayText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
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
    position: 'relative',
    zIndex: 250,
  },
  searchContainer: {
    position: 'relative',
    zIndex: 300,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 4,
    paddingHorizontal: 12,
    height: 36,
    width: 210,
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  searchBoxFocused: {
    borderColor: '#D4191F',
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 12,
    outlineStyle: 'none' as any,
  },
  liveSearchDropdown: {
    position: 'absolute',
    top: 42,
    right: 0,
    width: 370,
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 16,
    zIndex: 999,
    overflow: 'hidden',
  },
  liveSearchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#181818',
    borderBottomWidth: 1,
    borderBottomColor: '#262626',
  },
  livePulseDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  liveSearchTitle: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  liveSearchCount: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '600',
  },
  liveSectionBlock: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  liveSectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.7,
    color: '#9CA3AF',
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  liveResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  liveCreatorAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  livePostThumb: {
    width: 56,
    height: 42,
    borderRadius: 4,
    backgroundColor: '#F3F4F6',
  },
  liveThumbFallback: {
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  livePostCat: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D4191F',
    letterSpacing: 0.4,
  },
  liveResultTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 17,
  },
  liveResultMeta: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  liveEmptyState: {
    padding: 24,
    alignItems: 'center',
    gap: 6,
  },
  liveEmptyText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  liveFooterBtn: {
    backgroundColor: '#F9FAFB',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  liveFooterBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D4191F',
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
