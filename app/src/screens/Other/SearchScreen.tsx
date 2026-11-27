import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, FlatList, Image, Platform, ActivityIndicator, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';
import WebPageShell from '../../components/web/WebPageShell';
import { formatCardExcerpt, buildArticleParams } from '../../components/web/webPortalHelpers';
import { FeedItemType, FeedItem } from '../../types';
import { useFeed } from '../../context/FeedContext';
import { supabase } from '../../lib/supabaseClient';
import { AppApi } from '../../api/services';
import { useSiteLanguage } from '../../context/SiteLanguageContext';
import WebHeadSeo from '../../seo/WebHeadSeo';
import { SITE_URL } from '../../seo/seoUtils';

interface CreatorResult {
  id: string;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  role: string;
}

export default function SearchScreen() {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { width } = useWindowDimensions();
  const isWebDesktop = Platform.OS === 'web' && width >= 768;
  const { feedItems } = useFeed();
  const { lang } = useSiteLanguage();
  const initialTagParam = route.params?.initialTag ? String(route.params.initialTag).replace(/^#/, '') : '';
  const [searchQuery, setSearchQuery] = useState(route.params?.initialQuery || initialTagParam || '');
  const [langFilter, setLangFilter] = useState<'all' | 'en' | 'ta'>(lang);
  const [sortFilter, setSortFilter] = useState<'relevance' | 'latest' | 'trending' | 'popular'>(
    route.params?.initialSort === 'trending' || route.params?.initialSort === 'popular'
      ? route.params.initialSort
      : 'relevance'
  );

  useEffect(() => {
    if (typeof route.params?.initialQuery === 'string') {
      setSearchQuery(route.params.initialQuery);
    } else if (typeof route.params?.initialTag === 'string') {
      setSearchQuery(route.params.initialTag.replace(/^#/, ''));
    }
  }, [route.params?.initialQuery, route.params?.initialTag]);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [creators, setCreators] = useState<CreatorResult[]>([]);
  const [remotePosts, setRemotePosts] = useState<FeedItem[]>([]);
  const [searchingCreators, setSearchingCreators] = useState(false);
  const [liveSyncTick, setLiveSyncTick] = useState(0);
  const filters = ['All', 'Creators', 'News', 'Blogs', 'Videos'];

  // Live Supabase search via search_articles RPC for posts + creator lookup
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 1 && sortFilter === 'relevance') {
      setCreators([]);
      setRemotePosts([]);
      return;
    }

    let cancelled = false;
    const safeQ = q.replace(/[,()]/g, ' ').trim();
    const timeoutId = setTimeout(async () => {
      setSearchingCreators(true);
      try {
        const rpcType =
          selectedFilter === 'News'
            ? 'NEWS'
            : selectedFilter === 'Blogs'
            ? 'BLOG'
            : selectedFilter === 'Videos'
            ? 'VIDEO'
            : null;

        const [creatorRes, rpcRes] = await Promise.all([
          q.length >= 2
            ? supabase
                .from('User')
                .select('id, username, channel_name, "avatarUrl", bio, role')
                .in('role', ['ANALYST', 'CREATOR'])
                .or(`username.ilike.%${safeQ}%,channel_name.ilike.%${safeQ}%`)
                .limit(10)
            : Promise.resolve({ data: [], error: null }),
          AppApi.searchArticlesRpc({
            query: q || undefined,
            language: langFilter === 'all' ? null : langFilter,
            type: rpcType,
            sort: q ? sortFilter : sortFilter === 'relevance' ? 'latest' : sortFilter,
            limit: 24,
          }).catch(async () => {
            const fallback = await supabase
              .from('Post')
              .select('id, slug, title, content, type, language, thumbnail, category, custom_category, createdAt, author:User!authorId(id, username, channel_name, avatarUrl)')
              .eq('status', 'PUBLISHED')
              .or('is_active.eq.true,is_active.is.null')
              .or(`title.ilike.%${safeQ}%,category.ilike.%${safeQ}%,content.ilike.%${safeQ}%`)
              .order('createdAt', { ascending: false })
              .limit(20);
            return { items: fallback.data || [], total: 0 };
          }),
        ]);

        if (cancelled) return;
        if (creatorRes.error) console.warn('Creator search error:', creatorRes.error);
        setCreators(creatorRes.data || []);

        const mappedPosts: FeedItem[] = (rpcRes.items || []).map((p: any) => ({
          id: p.id,
          slug: p.slug || null,
          language: p.language === 'ta' ? 'ta' : 'en',
          type: (p.type as FeedItemType) || FeedItemType.NEWS,
          title: p.title,
          subtitle: 'PostsApp',
          authorName: p.author_name || p.author?.channel_name || p.author?.username || p.author_username || 'Creator',
          authorImage: p.author_avatar || p.author?.avatarUrl || '',
          authorId: p.author_id || p.author?.id || null,
          thumbnail: p.thumbnail || null,
          category: p.category === 'custom' && p.custom_category ? p.custom_category : (p.category || 'General'),
          timestamp: '',
          votes: p.upvote_count || 0,
          comments: 0,
          viewCount: p.views_count || 0,
          excerpt: p.short_description || formatCardExcerpt(p.content, 160) || null,
          content: p.content,
        }));
        setRemotePosts(mappedPosts);
      } catch (e) {
        console.warn('Realtime search error:', e);
      } finally {
        if (!cancelled) setSearchingCreators(false);
      }
    }, 200);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [searchQuery, langFilter, sortFilter, selectedFilter, liveSyncTick]);

  // Keep search screen synced when posts change in Supabase
  useEffect(() => {
    if (!searchQuery.trim()) return;
    const channel = supabase
      .channel('search-screen-realtime-posts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Post' }, () => {
        setLiveSyncTick((v) => v + 1);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [Boolean(searchQuery.trim())]);

  const filteredPosts = useMemo(() => {
    if (selectedFilter === 'Creators') return [];
    const q = searchQuery.trim().toLowerCase();
    const combined = q ? [...remotePosts, ...feedItems] : feedItems;
    const seen = new Set<string>();

    return combined.filter(item => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);

      const matchesQuery = !q || item.title.toLowerCase().includes(q) ||
                           (item.excerpt?.toLowerCase().includes(q)) ||
                           (item.category?.toLowerCase().includes(q)) ||
                           (item.authorName?.toLowerCase().includes(q));

      let matchesFilter = true;
      if (selectedFilter === 'News') matchesFilter = item.type === FeedItemType.NEWS;
      if (selectedFilter === 'Blogs') matchesFilter = item.type === FeedItemType.BLOG;
      if (selectedFilter === 'Videos') matchesFilter = item.type === FeedItemType.VIDEO;

      return matchesQuery && matchesFilter && item.type !== FeedItemType.PROMO;
    });
  }, [searchQuery, selectedFilter, feedItems, remotePosts]);

  const showCreators = selectedFilter === 'All' || selectedFilter === 'Creators';
  const searchSeoConfig = useMemo(
    () =>
      Platform.OS === 'web'
        ? {
            title: searchQuery.trim() ? `Search: ${searchQuery.trim()} | PostsApp` : 'Search | PostsApp',
            description: 'Search English and Tamil news, policy analyses, videos, and creators on PostsApp.',
            canonicalUrl: `${SITE_URL}/${lang}/search`,
            lang,
            robots: 'noindex, follow',
          }
        : null,
    [searchQuery, lang]
  );

  if (isWebDesktop) {
    return (
      <WebPageShell
        maxWidth={1280}
        initialSearch={searchQuery}
        onSearchSubmitOverride={(q) => setSearchQuery(q)}
      >
        <WebHeadSeo config={searchSeoConfig} />
        <View style={styles.webSearchCard}>
          <View style={styles.webSearchRow}>
            <Ionicons name="search" size={20} color={colors.PrimaryRed} />
            <TextInput
              style={styles.webSearchInput}
              placeholder="Search creators, news, blogs, videos..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>

          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 14, alignItems: 'center' }}>
            {filters.map(filter => (
              <TouchableOpacity
                key={filter}
                onPress={() => setSelectedFilter(filter)}
                style={[styles.webFilterChip, selectedFilter === filter && styles.webFilterChipActive]}
              >
                <Text style={[styles.webFilterText, selectedFilter === filter && styles.webFilterTextActive]}>
                  {filter}
                </Text>
              </TouchableOpacity>
            ))}
            <View style={{ width: 1, height: 18, backgroundColor: '#E5E7EB', marginHorizontal: 4 }} />
            {(
              [
                { key: 'all', label: 'All Lang' },
                { key: 'en', label: 'EN' },
                { key: 'ta', label: 'தமிழ்' },
              ] as const
            ).map((lf) => (
              <TouchableOpacity
                key={lf.key}
                onPress={() => setLangFilter(lf.key)}
                style={[styles.webFilterChip, langFilter === lf.key && styles.webFilterChipActive]}
              >
                <Text style={[styles.webFilterText, langFilter === lf.key && styles.webFilterTextActive]}>
                  {lf.label}
                </Text>
              </TouchableOpacity>
            ))}
            <View style={{ width: 1, height: 18, backgroundColor: '#E5E7EB', marginHorizontal: 4 }} />
            {(
              [
                { key: 'relevance', label: 'Relevance' },
                { key: 'latest', label: 'Latest' },
                { key: 'trending', label: 'Trending' },
                { key: 'popular', label: 'Most Read' },
              ] as const
            ).map((sf) => (
              <TouchableOpacity
                key={sf.key}
                onPress={() => setSortFilter(sf.key)}
                style={[styles.webFilterChip, sortFilter === sf.key && styles.webFilterChipActive]}
              >
                <Text style={[styles.webFilterText, sortFilter === sf.key && styles.webFilterTextActive]}>
                  {sf.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {showCreators && creators.length > 0 && (
          <View style={{ marginBottom: 28 }}>
            <View style={styles.webSectionRow}>
              <View style={styles.webDash} />
              <Text style={styles.webSectionTitle}>Creators</Text>
            </View>
            <View style={styles.webResultsGrid}>
              {creators.map((creator: any, idx) => {
                const nameDisplay = creator.channel_name || creator.username || 'creator';
                const avatarUri = creator.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(nameDisplay)}&background=D4191F&color=fff&size=200`;
                return (
                  <TouchableOpacity
                    key={`creator-web-${creator.id}-${idx}`}
                    style={[styles.creatorCard, styles.webResultHalf]}
                    onPress={() => navigation.navigate('CreatorProfile', { authorId: creator.id, authorName: nameDisplay })}
                  >
                    <Image source={{ uri: avatarUri }} style={styles.creatorAvatar} />
                    <View style={{ flex: 1, marginLeft: 14 }}>
                      <Text style={styles.creatorName}>{nameDisplay}</Text>
                      {creator.username && (
                        <Text style={{ fontSize: 12, color: colors.Slate400, marginTop: 2 }}>@{creator.username}</Text>
                      )}
                      <Text style={styles.creatorBio} numberOfLines={1}>{creator.bio || 'Content Creator'}</Text>
                    </View>
                    <View style={styles.creatorBadge}>
                      <Ionicons name="person" size={12} color={colors.PrimaryRed} />
                      <Text style={{ fontSize: 11, color: colors.PrimaryRed, fontWeight: '600', marginLeft: 4 }}>Creator</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {showCreators && searchingCreators && searchQuery.length >= 2 && (
          <View style={{ alignItems: 'center', paddingVertical: 16 }}>
            <ActivityIndicator size="small" color={colors.PrimaryRed} />
          </View>
        )}

        {selectedFilter !== 'Creators' && filteredPosts.length > 0 && (
          <View>
            <View style={styles.webSectionRow}>
              <View style={styles.webDash} />
              <Text style={styles.webSectionTitle}>Stories ({filteredPosts.length})</Text>
            </View>
            <View style={styles.webResultsGrid}>
              {filteredPosts.map((item, idx) => (
                <TouchableOpacity
                  key={`post-web-${item.id}-${idx}`}
                  style={[styles.postCard, styles.webResultHalf, { marginBottom: 0, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 6, shadowOpacity: 0.03 }]}
                  onPress={() => navigation.navigate('ArticleDetail', buildArticleParams(item))}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 16 }}>
                    <View style={{ flex: 1 }}>
                      <View style={styles.categoryPill}>
                        <Text style={styles.categoryText}>{item.category || 'NEWS'}</Text>
                      </View>
                      <Text style={styles.titleText} numberOfLines={3}>{item.title}</Text>
                      {item.authorName && (
                        <Text style={{ fontSize: 12, color: colors.Slate400, marginTop: 6 }}>by {item.authorName}</Text>
                      )}
                    </View>
                    {item.thumbnail && (
                      <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {!searchingCreators && creators.length === 0 && filteredPosts.length === 0 && searchQuery.length > 0 && (
          <View style={styles.webEmptyBox}>
            <Ionicons name="search-outline" size={56} color={colors.Slate400} style={{ opacity: 0.4 }} />
            <Text style={{ fontSize: 18, color: '#111827', marginTop: 14, fontWeight: '700' }}>No results found</Text>
            <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>Try a different search term</Text>
          </View>
        )}

        {searchQuery.length === 0 && filteredPosts.length === 0 && (
          <View style={styles.webEmptyBox}>
            <Ionicons name="search" size={48} color={colors.Slate400} style={{ opacity: 0.3 }} />
            <Text style={{ fontSize: 16, color: '#6B7280', marginTop: 12 }}>Search for creators, news, blogs...</Text>
          </View>
        )}
      </WebPageShell>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8 }}>
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={colors.PrimaryRed} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search creators, blogs, news..."
              placeholderTextColor={colors.Slate400}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                 <Ionicons name="close-circle" size={20} color={colors.Slate400} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
          {filters.map(filter => (
            <TouchableOpacity 
              key={filter} 
              onPress={() => setSelectedFilter(filter)}
              style={[styles.filterChip, selectedFilter === filter && styles.filterChipActive]}
            >
              <Text style={[styles.filterText, selectedFilter === filter && styles.filterTextActive]}>{filter}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={{ flex: 1, backgroundColor: '#F5F5F7' }} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {/* Creator Results */}
        {showCreators && creators.length > 0 && (
          <View style={{ marginBottom: 20 }}>
            <Text style={styles.sectionTitle}>Creators</Text>
            {creators.map((creator: any, idx) => {
              const nameDisplay = creator.channel_name || creator.username || 'creator';
              const avatarUri = creator.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(nameDisplay)}&background=D4191F&color=fff&size=200`;
              return (
                <TouchableOpacity 
                  key={`creator-${creator.id}-${idx}`}
                  style={styles.creatorCard}
                  onPress={() => navigation.navigate('CreatorProfile', { authorId: creator.id, authorName: nameDisplay })}
                >
                  <Image source={{ uri: avatarUri }} style={styles.creatorAvatar} />
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={styles.creatorName}>{nameDisplay}</Text>
                    {creator.username && (
                      <Text style={{ fontSize: 12, color: colors.Slate400, marginTop: 2 }}>@{creator.username}</Text>
                    )}
                    <Text style={styles.creatorBio} numberOfLines={1}>{creator.bio || 'Content Creator'}</Text>
                  </View>
                  <View style={styles.creatorBadge}>
                    <Ionicons name="person" size={12} color={colors.PrimaryRed} />
                    <Text style={{ fontSize: 11, color: colors.PrimaryRed, fontWeight: '600', marginLeft: 4 }}>
                      Creator
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {showCreators && searchingCreators && searchQuery.length >= 2 && (
          <View style={{ alignItems: 'center', paddingVertical: 12 }}>
            <ActivityIndicator size="small" color={colors.PrimaryRed} />
          </View>
        )}

        {/* Post Results */}
        {selectedFilter !== 'Creators' && filteredPosts.length > 0 && (
          <View>
            {showCreators && creators.length > 0 && <Text style={styles.sectionTitle}>Posts</Text>}
            {filteredPosts.map((item, idx) => (
              <TouchableOpacity key={`post-${item.id}-${idx}`} style={styles.postCard} onPress={() => navigation.navigate('ArticleDetail', buildArticleParams(item))}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 16 }}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.categoryPill}>
                      <Text style={styles.categoryText}>{item.category || 'NEWS'}</Text>
                    </View>
                    <Text style={styles.titleText} numberOfLines={3}>{item.title}</Text>
                    {item.authorName && (
                      <Text style={{ fontSize: 12, color: colors.Slate400, marginTop: 6 }}>by {item.authorName}</Text>
                    )}
                  </View>
                  {item.thumbnail && (
                    <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Empty State */}
        {!searchingCreators && creators.length === 0 && filteredPosts.length === 0 && searchQuery.length > 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={64} color={colors.Slate400} style={{ opacity: 0.3 }} />
            <Text style={{ fontSize: 18, color: colors.Slate500, marginTop: 16, fontWeight: 'bold' }}>No results found</Text>
            <Text style={{ fontSize: 14, color: colors.Slate400, marginTop: 4 }}>Try a different search term</Text>
          </View>
        )}

        {/* Initial State */}
        {searchQuery.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="search" size={48} color={colors.Slate400} style={{ opacity: 0.2 }} />
            <Text style={{ fontSize: 16, color: colors.Slate400, marginTop: 12 }}>Search for creators, news, blogs...</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: 'white', paddingTop: Platform.OS === 'android' ? 24 : 0 },
  header: { padding: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 12, paddingHorizontal: 12, height: 48, marginLeft: 8 },
  searchInput: { flex: 1, marginHorizontal: 8, fontSize: 16, color: 'black' },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F1F5F9', marginRight: 8 },
  filterChipActive: { backgroundColor: colors.PrimaryRed },
  filterText: { color: colors.Slate500, fontSize: 14 },
  filterTextActive: { color: 'white' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1E293B', marginBottom: 12 },
  creatorCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 16,
    padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#E2E8F0',
  },
  creatorAvatar: { width: 52, height: 52, borderRadius: 26, borderWidth: 2, borderColor: colors.PrimaryRed + '30' },
  creatorName: { fontWeight: 'bold', fontSize: 15, color: '#1E293B' },
  creatorBio: { fontSize: 13, color: colors.Slate500, marginTop: 2 },
  creatorBadge: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.PrimaryRedAlpha10,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12,
  },
  postCard: { backgroundColor: 'white', borderRadius: 12, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  categoryPill: { backgroundColor: colors.PrimaryRedAlpha10, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, marginBottom: 8 },
  categoryText: { color: colors.PrimaryRed, fontSize: 10, fontWeight: 'bold' },
  titleText: { fontWeight: 'bold', fontSize: 16 },
  thumbnail: { width: 80, height: 80, borderRadius: 8, marginLeft: 16 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 80 },
  webSearchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 18,
    marginBottom: 24,
  },
  webSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    paddingHorizontal: 14,
    height: 46,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  webSearchInput: {
    flex: 1,
    marginHorizontal: 10,
    fontSize: 15,
    color: '#111827',
    outlineStyle: 'none' as any,
  },
  webFilterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 4,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  webFilterChipActive: {
    backgroundColor: '#D4191F',
    borderColor: '#D4191F',
  },
  webFilterText: {
    color: '#374151',
    fontSize: 12,
    fontWeight: '700',
  },
  webFilterTextActive: {
    color: '#FFFFFF',
  },
  webSectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  webDash: {
    width: 14,
    height: 3,
    backgroundColor: '#D4191F',
  },
  webSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  webResultsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  webResultHalf: {
    flexBasis: '48%',
    flexGrow: 1,
    minWidth: 280,
    marginBottom: 0,
  },
  webEmptyBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 64,
    alignItems: 'center',
  },
});
