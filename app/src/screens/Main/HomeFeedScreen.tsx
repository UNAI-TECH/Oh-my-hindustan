import React, { useState, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, ScrollView, TouchableOpacity, Image, Share, ActivityIndicator, Platform, RefreshControl, Linking, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { useAppTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import AppBottomNavBar from '../../components/BottomNavBar';
import MainHeader from '../../components/MainHeader';
import { useFeed, mapPostToFeedItem } from '../../context/FeedContext';
import { AppApi } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { FeedItemType, FeedItem } from '../../types';
import { LinearGradient } from 'expo-linear-gradient';
import { useInteraction } from '../../context/InteractionContext';
import { supabase } from '../../lib/supabaseClient';
import AdCard, { AdData } from '../../components/AdCard';
import { useTranslation } from 'react-i18next';
import {
  WebTopMasthead,
  WebStickyNavBar,
  WebPopularTagsBar,
} from '../../components/web/WebPortalHeader';
import WebBreakingTicker from '../../components/web/WebBreakingTicker';
import WebHeroSection from '../../components/web/WebHeroSection';
import WebFeaturedPosts from '../../components/web/WebFeaturedPosts';
import WebExpressPosts from '../../components/web/WebExpressPosts';
import WebPortalFooter from '../../components/web/WebPortalFooter';
import {
  matchesEditorialCategory,
  categoryToSlug,
  slugToCategory,
  buildArticleParams,
} from '../../components/web/webPortalHelpers';
import { openExternalUrl } from '../../utils/openExternalUrl';
import { useSiteLanguage } from '../../context/SiteLanguageContext';
import { getOrCreateVisitorId } from '../../utils/visitorId';
import WebHeadSeo from '../../seo/WebHeadSeo';
import { buildHomeSeoConfig } from '../../seo/seoUtils';

const AD_MARKER = '__AD_PLACEHOLDER__';
const APP_DOWNLOAD_URL = 'https://play.google.com/store/apps/details?id=com.unai.antigravity';
const YOUTUBE_CHANNEL_URL = 'https://www.youtube.com/@postsapp';

export default function HomeFeedScreen() {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { t } = useTranslation();
  const { lang } = useSiteLanguage();
  const { feedItems, isLoading, isRefreshing, refreshFeed, loadMoreFeed, hasMore, sortBy, setSortBy } = useFeed();
  const { userProfile, isAuthenticated, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const { width } = useWindowDimensions();
  const isWebDesktop = Platform.OS === 'web';
  const numColumns = width >= 768 ? 2 : 1;
  const maxWidth = width >= 768 ? 1024 : '100%';
  
  const [activeTab, setActiveTab] = useState('For you');
  const [activeAds, setActiveAds] = useState<AdData[]>([]);
  const [savedCount, setSavedCount] = useState(0);
  const [webCategory, setWebCategory] = useState(() => slugToCategory(route.params?.initialCategory));
  const [webSearchQuery, setWebSearchQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [webFeedMode, setWebFeedMode] = useState<'latest' | 'trending' | 'popular' | 'articles' | 'videos'>('latest');
  const [categoryPoolItems, setCategoryPoolItems] = useState<FeedItem[]>([]);
  const [categorySyncTick, setCategorySyncTick] = useState(0);
  const [homepageConfig, setHomepageConfig] = useState<any | null>(null);
  const webScrollRef = useRef<ScrollView>(null);
  const loggedLeaderboardAdId = useRef<string | null>(null);
  const tabs = ['For you', 'Trending', 'Headlines', 'Articles', 'Videos'];

  React.useEffect(() => {
    AppApi.getHomepageConfig(lang).then(setHomepageConfig).catch(() => {});
  }, [lang]);

  React.useEffect(() => {
    const initCat = route.params?.initialCategory;
    if (initCat) {
      setWebCategory(slugToCategory(initCat));
      setActiveTag(null);
      webScrollRef.current?.scrollTo({ y: 0, animated: false });
    }
    const initMode = route.params?.initialFeedMode;
    if (initMode) {
      setWebFeedMode(initMode);
      if (initMode === 'trending') setSortBy('trending');
      else if (initMode === 'popular') setSortBy('popular');
      else if (initMode === 'latest') setSortBy('latest');
    }
  }, [route.params?.initialCategory, route.params?.initialFeedMode]);

  React.useEffect(() => {
    if (activeTab === 'For you' && sortBy !== 'latest') {
      setSortBy('latest');
    } else if (activeTab === 'Trending' && sortBy !== 'trending') {
      setSortBy('trending');
    }
  }, [activeTab]);

  React.useEffect(() => {
    const fetchAds = async () => {
      const { data } = await supabase.from('ads').select('*').eq('status', 'active');
      if (data) setActiveAds(data as AdData[]);
    };
    fetchAds();
    
    const channel = supabase.channel('home-feed-ads')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ads', filter: 'status=eq.active' }, fetchAds)
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, []);

  // Keep saved count and active navbar category pool synced in real time
  React.useEffect(() => {
    if (!userProfile?.id) {
      setSavedCount(0);
      return;
    }
    const fetchSaved = () => {
      supabase
        .from('Save')
        .select('id', { count: 'exact', head: true })
        .eq('userId', userProfile.id)
        .then(({ count }) => {
          if (typeof count === 'number') setSavedCount(count);
        });
    };
    fetchSaved();
    const saveChannel = supabase
      .channel(`home-saves-${userProfile.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Save', filter: `userId=eq.${userProfile.id}` }, fetchSaved)
      .subscribe();
    return () => {
      supabase.removeChannel(saveChannel);
    };
  }, [userProfile?.id]);

  React.useEffect(() => {
    if (!isWebDesktop || webCategory === 'HOME') {
      setCategoryPoolItems([]);
      return;
    }
    let cancelled = false;
    AppApi.getHomeFeed(1, 60, sortBy)
      .then((res) => {
        if (!cancelled && res?.data) {
          setCategoryPoolItems(res.data.map(mapPostToFeedItem));
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [isWebDesktop, webCategory, sortBy, categorySyncTick]);

  React.useEffect(() => {
    if (!isWebDesktop || webCategory === 'HOME') return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const triggerSync = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => setCategorySyncTick((t) => t + 1), 250);
    };
    const channel = supabase
      .channel('home-category-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Post' }, triggerSync)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Vote' }, triggerSync)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Comment' }, triggerSync)
      .subscribe();

    return () => {
      if (timer) clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [isWebDesktop, webCategory]);

  useFocusEffect(
    React.useCallback(() => {
      refreshFeed();
      if (userProfile?.id) {
        supabase
          .from('Save')
          .select('id', { count: 'exact', head: true })
          .eq('userId', userProfile.id)
          .then(({ count }) => {
            if (typeof count === 'number') setSavedCount(count);
          });
      } else {
        setSavedCount(0);
      }
    }, [userProfile?.id])
  );

  // 1. Define Viewability Configuration for high-performance impression tracking
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50 // Ad must be at least 50% visible to count
  }).current;

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: any[] }) => {
    viewableItems.forEach(async (item) => {
      // Check if the item is an ad
      if (item.item?.__isAd && item.isViewable) {
        try {
          const [{ data: { session } }, visitorId] = await Promise.all([
            supabase.auth.getSession(),
            getOrCreateVisitorId(),
          ]);
          // Log impression via high-performance RPC (handles budget logic atomically)
          await supabase.rpc('track_ad_impression', {
            p_ad_id: item.item.id,
            p_user_id: session?.user?.id || visitorId,
          });
        } catch (err) {
          console.warn('Ad impression tracking failed:', err);
        }
      }
    });
  }).current;

  const handleTabPress = (tab: string) => {
    setActiveTab(tab);
  };

  const onShare = async (item: FeedItem) => {
    try {
      await Share.share({
        message: `${item.title}\n\nRead more on PostsApp:\nhttps://postsapp.com/post/${item.id}\n\nDownload the app: ${APP_DOWNLOAD_URL}`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const currentTabItems = useMemo(() => {
    if (activeTab === 'Trending' || activeTab === 'For you') return feedItems;
    if (activeTab === 'Articles') return feedItems.filter(it => [FeedItemType.NEWS, FeedItemType.UPDATE, FeedItemType.POLICY_TYPE, FeedItemType.PROMO].includes(it.type));
    if (activeTab === 'Videos') return feedItems.filter(it => [FeedItemType.VIDEO, FeedItemType.DEBATE, FeedItemType.PROMO].includes(it.type));
    return feedItems;
  }, [feedItems, activeTab]);

  // Interleave ad placeholders after every 5 real posts
  const feedWithAds = useMemo(() => {
    if (currentTabItems.length < 5 || activeAds.length === 0) return currentTabItems;
    const result: (FeedItem | AdData)[] = [];
    currentTabItems.forEach((item, index) => {
      result.push(item);
      if ((index + 1) % 5 === 0 && index < currentTabItems.length - 1) {
        // Deterministically pick an ad based on index to prevent flickering on re-renders
        const adIndex = Math.floor((index / 5)) % activeAds.length;
        const randomAd: AdData = {
          ...activeAds[adIndex],
          __isAd: true,
        };
        result.push(randomAd);
      }
    });
    return result;
  }, [currentTabItems, activeAds]);

  // Web editorial filtering and section slicing
  const filteredWebItems = useMemo(() => {
    const sourcePool = webCategory !== 'HOME' && categoryPoolItems.length > 0
      ? [...categoryPoolItems, ...feedItems.filter((fi) => !categoryPoolItems.some((cp) => cp.id === fi.id))]
      : feedItems;
    let items = sourcePool.filter((it) => it.type !== FeedItemType.PROMO);

    if (webFeedMode === 'articles') {
      items = items.filter((it) =>
        [FeedItemType.NEWS, FeedItemType.UPDATE, FeedItemType.POLICY_TYPE, FeedItemType.BLOG].includes(it.type)
      );
    } else if (webFeedMode === 'videos') {
      items = items.filter((it) =>
        [FeedItemType.VIDEO, FeedItemType.DEBATE].includes(it.type) || !!it.videoUrl
      );
    }

    if (webCategory !== 'HOME') {
      items = items.filter((it) => matchesEditorialCategory(it, webCategory));
    }

    if (activeTag) {
      const cleanTag = activeTag.replace(/^#/, '').toLowerCase();
      items = items.filter((it) => {
        const hay = `${it.title} ${it.category || ''} ${(it.hashtags || []).join(' ')}`.toLowerCase();
        return hay.includes(cleanTag);
      });
    }

    if (webSearchQuery.trim().length > 0) {
      const q = webSearchQuery.trim().toLowerCase();
      items = items.filter(
        (it) =>
          it.title.toLowerCase().includes(q) ||
          (it.category || '').toLowerCase().includes(q) ||
          (it.authorName || '').toLowerCase().includes(q) ||
          (it.excerpt || '').toLowerCase().includes(q)
      );
    }

    return items;
  }, [feedItems, categoryPoolItems, webFeedMode, webCategory, activeTag, webSearchQuery]);

  const webSections = useMemo(() => {
    const pool = filteredWebItems;
    const breakingFlagged = pool.filter((it) => it.is_breaking);
    const breakingItems = (breakingFlagged.length > 0 ? breakingFlagged : pool).slice(0, 5);

    const featuredFlagged = pool.filter((it) => it.is_featured);
    const mainNews =
      featuredFlagged.find((it) => !!it.thumbnail) ||
      pool.find((it) => !!it.thumbnail) ||
      featuredFlagged[0] ||
      pool[0] ||
      null;
    const withoutMain = pool.filter((it) => it.id !== mainNews?.id);

    const trendingNow = [...pool]
      .sort(
        (a, b) =>
          (b.isTrending ? 10000 : 0) +
          (b.viewCount || 0) +
          (b.upvoteCount || 0) -
          ((a.isTrending ? 10000 : 0) + (a.viewCount || 0) + (a.upvoteCount || 0))
      )
      .slice(0, 4);

    const editorsFlagged = withoutMain.filter((it) => it.is_editors_pick);
    const editorsPicks =
      editorsFlagged.length >= 3
        ? editorsFlagged.slice(0, 3)
        : [...editorsFlagged, ...withoutMain.filter((it) => !it.is_editors_pick)].slice(0, 3);

    const usedIds = new Set<string>([
      ...(mainNews ? [mainNews.id] : []),
      ...editorsPicks.map((i) => i.id),
    ]);
    const remainingForFeatured = [
      ...featuredFlagged.filter((it) => !usedIds.has(it.id)),
      ...pool.filter((it) => !usedIds.has(it.id) && !it.is_featured),
    ];
    const featuredItems =
      remainingForFeatured.length >= 4
        ? remainingForFeatured.slice(0, 4)
        : pool.slice(0, 4);

    featuredItems.forEach((i) => usedIds.add(i.id));
    const remainingForExpress = pool.filter((it) => !usedIds.has(it.id));
    const expressPool = remainingForExpress.length >= 5 ? remainingForExpress : pool;
    const expressOneItems = expressPool.slice(0, 5);
    const expressTwoItems =
      expressPool.length > 5 ? expressPool.slice(5, 9) : pool.slice(0, 4);
    const extraItems = pool.slice(16);

    return {
      breakingItems,
      mainNews,
      trendingNow,
      editorsPicks,
      featuredItems,
      expressOneItems,
      expressTwoItems,
      extraItems,
    };
  }, [filteredWebItems]);

  const homeSeoConfig = useMemo(
    () => (Platform.OS === 'web' ? buildHomeSeoConfig(lang) : null),
    [lang]
  );

  const isSectionVisible = React.useCallback(
    (sectionKey: string) => {
      const sections = Array.isArray(homepageConfig?.sections) ? homepageConfig.sections : [];
      if (sections.length === 0) return true;
      const found = sections.find((s: any) => s.key === sectionKey);
      return found ? found.visible !== false : true;
    },
    [homepageConfig]
  );

  const leaderboardAd = activeAds[0] ? { ...activeAds[0], __isAd: true as const } : null;

  React.useEffect(() => {
    if (!isWebDesktop || !leaderboardAd?.id) return;
    if (loggedLeaderboardAdId.current === leaderboardAd.id) return;
    loggedLeaderboardAdId.current = leaderboardAd.id;
    (async () => {
      try {
        const [{ data: { session } }, visitorId] = await Promise.all([
          supabase.auth.getSession(),
          getOrCreateVisitorId(),
        ]);
        await supabase.rpc('track_ad_impression', {
          p_ad_id: leaderboardAd.id,
          p_user_id: session?.user?.id || visitorId,
        });
      } catch (_) {}
    })();
  }, [isWebDesktop, leaderboardAd?.id]);

  const handleWebSelectCategory = (cat: string) => {
    setWebCategory(cat);
    setActiveTag(null);
    navigation.setParams({ initialCategory: categoryToSlug(cat) });
    webScrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const handleWebSelectTag = (tag: string) => {
    setActiveTag((prev) => (prev === tag ? null : tag));
    setWebCategory('HOME');
  };

  const handleWebFeedMode = (mode: 'latest' | 'trending' | 'popular' | 'articles' | 'videos') => {
    setWebFeedMode(mode);
    if (mode === 'trending') setSortBy('trending');
    else if (mode === 'popular') setSortBy('popular');
    else if (mode === 'latest') setSortBy('latest');
  };

  const handleWebPressItem = (item: FeedItem) => {
    if (item.type !== FeedItemType.PROMO) {
      navigation.navigate('ArticleDetail', buildArticleParams(item));
    }
  };

  if (isWebDesktop) {
    const hasActiveWebFilter =
      webCategory !== 'HOME' || !!activeTag || webSearchQuery.trim().length > 0 || webFeedMode !== 'latest';

    return (
      <View style={{ flex: 1, backgroundColor: '#F5F5F7' }}>
        <WebHeadSeo config={homeSeoConfig} />
        <ScrollView
          ref={webScrollRef}
          style={{ flex: 1, backgroundColor: '#F5F5F7' }}
          contentContainerStyle={{ minHeight: '100%' }}
        >
          <WebTopMasthead
          onSelectHome={() => {
            setWebCategory('HOME');
            setActiveTag(null);
            setWebSearchQuery('');
            setWebFeedMode('latest');
            setSortBy('latest');
            navigation.setParams({ initialCategory: 'home' });
          }}
          onNavigate={(route, params) => navigation.navigate(route, params)}
          savedCount={savedCount}
          userProfile={userProfile}
          isAuthenticated={isAuthenticated}
          onScrollToNewsletter={() => webScrollRef.current?.scrollToEnd({ animated: true })}
          leaderboardAd={leaderboardAd}
        />

        <WebStickyNavBar
          activeCategory={webCategory}
          onSelectCategory={handleWebSelectCategory}
          searchQuery={webSearchQuery}
          onChangeSearch={setWebSearchQuery}
          onSubmitSearch={() => {
            if (webSearchQuery.trim().length > 0 && filteredWebItems.length === 0) {
              navigation.navigate('Search');
            }
          }}
          onPressWatchOnline={() => openExternalUrl(YOUTUBE_CHANNEL_URL)}
          onNavigate={(route, params) => navigation.navigate(route, params)}
          unreadNotifications={unreadCount}
          isAuthenticated={isAuthenticated}
          onLogout={logout}
          feedMode={webFeedMode}
          onChangeFeedMode={handleWebFeedMode}
        />

        <View style={{ flex: 1 }}>
          <WebPopularTagsBar activeTag={activeTag} onSelectTag={handleWebSelectTag} />

          {hasActiveWebFilter && (
            <View style={styles.webFilterBanner}>
              <Text style={styles.webFilterText}>
                Showing {filteredWebItems.length} stories
                {webCategory !== 'HOME' ? ` in ${webCategory.replace('_', ' ')}` : ''}
                {activeTag ? ` • ${activeTag}` : ''}
                {webSearchQuery.trim() ? ` • "${webSearchQuery.trim()}"` : ''}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setWebCategory('HOME');
                  setActiveTag(null);
                  setWebSearchQuery('');
                  handleWebFeedMode('latest');
                }}
              >
                <Text style={styles.webFilterReset}>Reset Filters</Text>
              </TouchableOpacity>
            </View>
          )}

          {isLoading && filteredWebItems.length === 0 ? (
            <View style={{ maxWidth: 1280, width: '100%', alignSelf: 'center', padding: 24 }}>
              <ActivityIndicator size="large" color={colors.PrimaryRed} style={{ marginVertical: 48 }} />
            </View>
          ) : filteredWebItems.length === 0 ? (
            <View style={{ maxWidth: 1280, width: '100%', alignSelf: 'center', padding: 48, alignItems: 'center' }}>
              <Ionicons name="newspaper-outline" size={48} color="#9CA3AF" />
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827', marginTop: 12 }}>
                No matching stories found
              </Text>
              <TouchableOpacity
                style={{ marginTop: 14, backgroundColor: '#D4191F', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 4 }}
                onPress={() => {
                  setWebCategory('HOME');
                  setActiveTag(null);
                  setWebSearchQuery('');
                  handleWebFeedMode('latest');
                }}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 13 }}>View All Stories</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {isSectionVisible('breaking') && (
                <WebBreakingTicker
                  items={webSections.breakingItems}
                  onPressItem={handleWebPressItem}
                />
              )}

              {isSectionVisible('hero') && (
                <WebHeroSection
                  editorsPicks={webSections.editorsPicks}
                  mainNews={webSections.mainNews}
                  trendingNow={webSections.trendingNow}
                  onPressItem={handleWebPressItem}
                />
              )}

              {isSectionVisible('featured') && (
                <WebFeaturedPosts
                  items={webSections.featuredItems}
                  onPressItem={handleWebPressItem}
                  onPressViewAll={() => navigation.navigate('Explore')}
                />
              )}

              {isSectionVisible('latest') && (
                <WebExpressPosts
                  expressOneItems={webSections.expressOneItems}
                  expressTwoItems={webSections.expressTwoItems}
                  extraItems={webSections.extraItems}
                  activeAds={activeAds}
                  onPressItem={handleWebPressItem}
                  hasMore={hasMore}
                  isLoading={isLoading}
                  onLoadMore={loadMoreFeed}
                />
              )}
            </>
          )}

          <WebPortalFooter
            onSelectCategory={handleWebSelectCategory}
            onNavigate={(route, params) => navigation.navigate(route, params)}
          />
        </View>
      </ScrollView>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <WebHeadSeo config={homeSeoConfig} />
      <MainHeader />

      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
          {tabs.map(tab => (
            <TouchableOpacity 
              key={tab} 
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => handleTabPress(tab)}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {tab === 'Trending' && (
                  <Ionicons 
                    name="flame" 
                    size={14} 
                    color={activeTab === 'Trending' ? colors.PrimaryRed : colors.Slate500} 
                    style={{ marginRight: 4 }} 
                  />
                )}
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {isLoading && currentTabItems.length === 0 ? (
        <ScrollView style={{ padding: 16 }}>
          {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
        </ScrollView>
      ) : currentTabItems.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Text style={{ color: colors.Slate500, textAlign: 'center' }}>No content found for "{activeTab}" yet.</Text>
        </View>
      ) : (
        <FlatList
          key={numColumns}
          data={feedWithAds}
          numColumns={numColumns}
          keyExtractor={(item, index) => `${(item as any).id}-${index}`}
          contentContainerStyle={{ alignSelf: 'center', width: '100%', maxWidth, paddingHorizontal: 16, paddingBottom: 24 }}
          columnWrapperStyle={numColumns > 1 ? { gap: 12 } : undefined}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          onEndReached={loadMoreFeed}
          onEndReachedThreshold={0.5}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          ListFooterComponent={() => (
            <>
              {isLoading && hasMore ? (
                <ActivityIndicator size="small" color={colors.PrimaryRed} style={{ marginVertical: 20 }} />
              ) : null}
              {Platform.OS === 'web' && !hasMore ? (
                <View style={{ marginHorizontal: -16, marginTop: 24 }}>
                  <WebPortalFooter
                    onSelectCategory={handleWebSelectCategory}
                    onNavigate={(route, params) => navigation.navigate(route, params)}
                  />
                </View>
              ) : null}
            </>
          )}
          refreshControl={
            <RefreshControl 
              refreshing={isRefreshing} 
              onRefresh={refreshFeed} 
              colors={[colors.PrimaryRed]} 
              tintColor={colors.PrimaryRed}
            />
          }
          renderItem={({ item, index }) => {
            // Render ad placeholder
            if ((item as any).__isAd) {
              return (
                <View style={{ flex: 1, maxWidth: numColumns > 1 ? '50%' : '100%' }}>
                  <AdCard ad={item as AdData} />
                </View>
              );
            }
            const feedItem = item as FeedItem;
            return (
              <View style={{ flex: 1, maxWidth: numColumns > 1 ? '50%' : '100%' }}>
                <FeedCard 
                  item={feedItem} 
                  onClick={() => {
                    if (feedItem.type !== FeedItemType.PROMO) {
                      navigation.navigate('ArticleDetail', buildArticleParams(feedItem));
                    }
                  }}
                  onShare={() => onShare(feedItem)}
                />
              </View>
            );
          }}
        />
      )}

      <View>
        <AppBottomNavBar 
          currentRoute="Home" 
          onNavigate={(route) => navigation.navigate(route)} 
          onDoubleTapHome={refreshFeed}
        />
      </View>
    </SafeAreaView>
  );
}

const formatCount = (n: number): string => {
  if (n >= 10000) return `${(n / 1000).toFixed(1)}K`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
};

const FeedCard = ({ item, onClick, onShare }: { item: FeedItem, onClick: () => void, onShare: () => void }) => {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const { likes, toggleLike } = useInteraction();
  
  const isLiked = !!likes[item.id];
  const upvotes = item.upvoteCount + (isLiked ? 1 : 0);
  const downvotes = item.downvoteCount || 0;
  const commentCount = item.comments || 0;
  const viewCount = item.viewCount || 0;

  return (
    <TouchableOpacity style={styles.card} onPress={onClick} activeOpacity={0.8}>
      <View style={{ padding: 16 }}>
        {item.type === FeedItemType.PROMO ? (
          <View style={{ backgroundColor: colors.PrimaryRed, padding: 24, borderRadius: 12, alignItems: 'center' }}>
             <Ionicons name="mail" size={40} color="white" />
             <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold', marginVertical: 12, textAlign: 'center' }}>{item.title}</Text>
             <View style={{ backgroundColor: 'white', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 }}>
               <Text style={{ color: colors.PrimaryRed, fontWeight: 'bold' }}>Join Newsletter</Text>
             </View>
          </View>
        ) : (
          <View>
            <View style={{ width: '100%', aspectRatio: 16/9, borderRadius: 8, overflow: 'hidden', marginBottom: 12 }}>
              <Image source={{ uri: item.thumbnail }} style={{ flex: 1 }} />
              {item.type === FeedItemType.VIDEO || item.type === FeedItemType.DEBATE ? (
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' }}>
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.9)', width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' }}>
                    <Ionicons name="play" size={24} color={colors.PrimaryRed} style={{ marginLeft: 4 }} />
                  </View>
                </View>
              ) : null}
            </View>
            
            <View>
              <View style={{ backgroundColor: colors.PrimaryRedAlpha10, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, marginBottom: 8 }}>
                <Text style={{ color: colors.PrimaryRed, fontSize: 10, fontWeight: 'bold' }}>{item.category?.toUpperCase() || 'NEWS'}</Text>
              </View>
              <Text style={{ fontWeight: 'bold', fontSize: 18, color: colors.DarkText }} numberOfLines={3}>{item.title}</Text>
            </View>
            
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
               {item.authorImage ? (
                 <Image source={{ uri: item.authorImage }} style={{ width: 28, height: 28, borderRadius: 14 }} />
               ) : (
                 <Ionicons name="person-circle" size={28} color={colors.Slate400} />
               )}
               <View style={{ flex: 1, marginLeft: 8 }}>
                 <Text style={{ color: colors.Slate500, fontSize: 12 }}>{item.authorName} • {item.timestamp}</Text>
               </View>
            </View>
            
            <View style={styles.engagementBar}>
              <TouchableOpacity onPress={() => toggleLike(item.id)} style={styles.engagementItem}>
                <Ionicons name={isLiked ? "heart" : "heart-outline"} size={20} color={isLiked ? colors.PrimaryRed : colors.Slate500} />
                <Text style={styles.engagementCount}>{formatCount(upvotes)}</Text>
              </TouchableOpacity>
              <View style={styles.engagementItem}>
                <Ionicons name="chatbubble-outline" size={18} color={colors.Slate500} />
                <Text style={styles.engagementCount}>{formatCount(commentCount)}</Text>
              </View>
              <View style={styles.engagementItem}>
                <Ionicons name="eye-outline" size={16} color={colors.Slate500} />
                <Text style={styles.engagementCount}>{formatCount(viewCount)}</Text>
              </View>
              <View style={{ flex: 1 }} />
              <TouchableOpacity onPress={onShare} style={{ padding: 4, marginRight: 8 }}>
                <Ionicons name="share-social-outline" size={20} color={colors.Slate500} />
              </TouchableOpacity>
              <View style={{ backgroundColor: colors.Slate100, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 }}>
                 <Text style={{ color: colors.PrimaryRed, fontSize: 12, fontWeight: 'bold' }}>Read More</Text>
              </View>
            </View>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

// Ad Placeholder Card (Instagram-style sponsored post)
const AdPlaceholderCard = () => {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  return (
  <View style={styles.adCard}>
    <View style={styles.adHeader}>
      <View style={styles.adLogoBox}>
        <Ionicons name="megaphone" size={16} color="white" />
      </View>
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={styles.adBrandName}>PostsApp</Text>
        <Text style={styles.adSponsoredLabel}>Sponsored</Text>
      </View>
      <Ionicons name="ellipsis-horizontal" size={18} color={colors.Slate400} />
    </View>
    <View style={styles.adBanner}>
      <LinearGradient
        colors={[colors.PrimaryRed, colors.DeepCrimson, '#991111']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.adGradient}
      >
        <Ionicons name="newspaper-outline" size={36} color="rgba(255,255,255,0.9)" />
        <Text style={styles.adHeadline}>Stay Informed, Stay Empowered</Text>
        <Text style={styles.adSubtext}>Your daily dose of news, analysis & debate</Text>
      </LinearGradient>
    </View>
    <View style={styles.adFooter}>
      <TouchableOpacity 
        style={styles.adCTAButton}
        onPress={() => Linking.openURL(APP_DOWNLOAD_URL)}
      >
        <Text style={styles.adCTAText}>Learn More</Text>
      </TouchableOpacity>
      <View style={styles.adEngagement}>
        <Ionicons name="heart-outline" size={18} color={colors.Slate400} />
        <Ionicons name="chatbubble-outline" size={16} color={colors.Slate400} style={{ marginLeft: 16 }} />
        <Ionicons name="share-social-outline" size={18} color={colors.Slate400} style={{ marginLeft: 16 }} />
      </View>
    </View>
  </View>
)};

// Skeleton Loader Card
const SkeletonCard = () => {
  const { colors } = useAppTheme();
  return (
    <View style={{ backgroundColor: colors.SurfaceWhite, borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }}>
      <View style={{ width: '100%', aspectRatio: 16/9, backgroundColor: '#E2E8F0', borderRadius: 8, marginBottom: 12 }} />
      <View style={{ width: 60, height: 16, backgroundColor: '#E2E8F0', borderRadius: 4, marginBottom: 8 }} />
      <View style={{ width: '90%', height: 20, backgroundColor: '#E2E8F0', borderRadius: 4, marginBottom: 6 }} />
      <View style={{ width: '70%', height: 20, backgroundColor: '#E2E8F0', borderRadius: 4, marginBottom: 16 }} />
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#E2E8F0' }} />
        <View style={{ width: 120, height: 14, backgroundColor: '#E2E8F0', borderRadius: 4, marginLeft: 8 }} />
      </View>
    </View>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.SurfaceWhite,
    paddingTop: Platform.OS === 'android' ? 24 : 0
  },
  tabsContainer: {
    backgroundColor: colors.SurfaceWhite,
    paddingVertical: 12
  },
  tab: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8
  },
  tabActive: {
    backgroundColor: colors.PrimaryRedAlpha10,
    borderColor: colors.PrimaryRed,
    borderWidth: 1
  },
  tabText: {
    color: colors.Slate500,
    fontWeight: 'bold',
    fontSize: 12
  },
  tabTextActive: {
    color: colors.PrimaryRed
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  card: {
    backgroundColor: colors.SurfaceWhite,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  engagementBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  engagementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  engagementCount: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.Slate500,
    marginLeft: 3,
    marginRight: 4,
  },
  // Ad Placeholder Styles
  adCard: {
    backgroundColor: colors.SurfaceWhite,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  adHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  adLogoBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.PrimaryRed,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adBrandName: { fontWeight: 'bold', fontSize: 14, color: colors.DarkText },
  adSponsoredLabel: { fontSize: 11, color: colors.Slate400 },
  adBanner: { width: '100%', aspectRatio: 16 / 9 },
  adGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  adHeadline: {
    color: 'white',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 12,
  },
  adSubtext: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
  },
  adFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  adCTAButton: {
    backgroundColor: colors.PrimaryRed,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  adCTAText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 13,
  },
  adEngagement: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  webFilterBanner: {
    maxWidth: 1280,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 20,
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  webFilterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  webFilterReset: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D4191F',
  },
});
