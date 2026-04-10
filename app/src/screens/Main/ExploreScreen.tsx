import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, Platform, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import AppBottomNavBar from '../../components/BottomNavBar';
import MainHeader from '../../components/MainHeader';
import { useFeed } from '../../context/FeedContext';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { FeedItemType, FeedItem } from '../../types';
import { supabase } from '../../lib/supabaseClient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface FollowedCreator {
  id: string;
  username: string;
  avatarUrl: string | null;
}

export default function ExploreScreen() {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const navigation = useNavigation<any>();
  const { feedItems, isLoading: feedLoading } = useFeed();
  const { isAuthenticated, userProfile } = useAuth();
  const { unreadCount } = useNotifications();
  const [followedCreators, setFollowedCreators] = useState<FollowedCreator[]>([]);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [refreshing, setRefreshing] = useState(false);
  const filters = ['All', 'News', 'Blogs', 'Videos', 'Trending'];

  // Fetch followed creators
  const fetchFollowedCreators = useCallback(async () => {
    if (!isAuthenticated || !userProfile?.id) return;
    try {
      const { data: follows } = await supabase
        .from('Follow')
        .select('followingId')
        .eq('followerId', userProfile.id);

      if (follows && follows.length > 0) {
        const creatorIds = follows.map((f: any) => f.followingId);
        const { data: creators } = await supabase
          .from('User')
          .select('id, username, avatarUrl')
          .in('id', creatorIds);
        setFollowedCreators(creators || []);
      }
    } catch (e) {
      console.warn('Fetch followed creators error:', e);
    }
  }, [isAuthenticated, userProfile?.id]);

  useEffect(() => {
    fetchFollowedCreators();
  }, [fetchFollowedCreators]);

  // Get content from followed creators, shuffled
  const followedCreatorIds = useMemo(() => followedCreators.map(c => c.id), [followedCreators]);

  const contentFeed = useMemo(() => {
    let items = feedItems.filter(item => item.type !== FeedItemType.PROMO);

    // Filter by type
    if (selectedFilter === 'Articles') items = items.filter(it => it.type === FeedItemType.NEWS || it.type === FeedItemType.UPDATE);
    if (selectedFilter === 'Headlines') items = items.filter(it => it.type === FeedItemType.BLOG || it.type === FeedItemType.FORUM);
    if (selectedFilter === 'Videos') items = items.filter(it => it.type === FeedItemType.VIDEO || it.type === FeedItemType.DEBATE);
    if (selectedFilter === 'Trending') items = items.filter(it => it.isTrending);

    // Shuffle for random order
    return [...items].sort(() => Math.random() - 0.5);
  }, [feedItems, selectedFilter]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchFollowedCreators();
    setRefreshing(false);
  }, [fetchFollowedCreators]);

  const renderCreatorAvatar = (creator: FollowedCreator, index: number) => {
    const avatarUri = creator.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(creator.username || 'C')}&background=E53935&color=fff&size=200`;
    return (
      <TouchableOpacity
        key={`creator-${creator.id}-${index}`}
        style={styles.creatorItem}
        onPress={() => navigation.navigate('CreatorProfile', { authorId: creator.id, authorName: creator.username })}
      >
        <View style={styles.creatorAvatarRing}>
          <Image source={{ uri: avatarUri }} style={styles.creatorAvatar} />
        </View>
        <Text style={styles.creatorName} numberOfLines={1}>{creator.username || 'Creator'}</Text>
      </TouchableOpacity>
    );
  };

  const renderContentItem = ({ item, index }: { item: FeedItem; index: number }) => {
    const isVideo = item.type === FeedItemType.VIDEO || item.type === FeedItemType.DEBATE;

    return (
      <TouchableOpacity
        style={styles.contentCard}
        onPress={() => navigation.navigate('ArticleDetail', { id: item.id })}
      >
        {/* Thumbnail */}
        <View style={styles.thumbnailContainer}>
          <Image
            source={{ uri: item.thumbnail || 'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&q=80&w=800' }}
            style={styles.contentThumbnail}
          />
          {isVideo && (
            <View style={styles.playOverlay}>
              <Ionicons name="play-circle" size={42} color="rgba(255,255,255,0.9)" />
            </View>
          )}
          {isVideo && item.videoDuration && (
            <View style={styles.durationBadge}>
              <Text style={styles.durationText}>{item.videoDuration}</Text>
            </View>
          )}
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>{item.type}</Text>
          </View>
        </View>

        {/* Content Info */}
        <View style={styles.contentInfo}>
          {item.authorImage ? (
            <Image source={{ uri: item.authorImage }} style={styles.authorAvatar} />
          ) : (
            <View style={[styles.authorAvatar, { backgroundColor: colors.PrimaryRedAlpha10, justifyContent: 'center', alignItems: 'center' }]}>
              <Ionicons name="person" size={14} color={colors.PrimaryRed} />
            </View>
          )}
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.contentTitle} numberOfLines={2}>{item.title}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.authorText}>{item.authorName || 'Unknown'}</Text>
              {item.timestamp && (
                <>
                  <Text style={styles.metaDot}>•</Text>
                  <Text style={styles.metaText}>{item.timestamp}</Text>
                </>
              )}
              {item.category && (
                <>
                  <Text style={styles.metaDot}>•</Text>
                  <Text style={styles.metaText}>{item.category}</Text>
                </>
              )}
            </View>
          </View>
          <TouchableOpacity style={{ padding: 4 }}>
            <Ionicons name="ellipsis-vertical" size={16} color={colors.Slate400} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <MainHeader />

      {/* Followed Creators Row */}
      {followedCreators.length > 0 && (
        <View style={styles.creatorsSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12 }}>
            {followedCreators.map((c, idx) => renderCreatorAvatar(c, idx))}
            {/* "All" button at end */}
            <TouchableOpacity
              style={styles.creatorItem}
              onPress={() => navigation.navigate('Search')}
            >
              <View style={[styles.creatorAvatarRing, { borderColor: '#E2E8F0' }]}>
                <View style={[styles.creatorAvatar, { backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' }]}>
                  <Text style={{ fontSize: 11, fontWeight: 'bold', color: colors.Slate500 }}>All</Text>
                </View>
              </View>
              <Text style={[styles.creatorName, { color: colors.Slate400 }]}>Discover</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12 }}>
          {filters.map(filter => (
            <TouchableOpacity
              key={filter}
              style={[styles.filterChip, selectedFilter === filter && styles.filterChipActive]}
              onPress={() => setSelectedFilter(filter)}
            >
              <Text style={[styles.filterText, selectedFilter === filter && styles.filterTextActive]}>{filter}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content Feed */}
      {feedLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.PrimaryRed} />
        </View>
      ) : contentFeed.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="compass-outline" size={48} color={colors.Slate400} style={{ opacity: 0.3 }} />
          <Text style={{ color: colors.Slate500, fontSize: 16, fontWeight: '600', marginTop: 12 }}>No content found</Text>
          <Text style={{ color: colors.Slate400, fontSize: 13, marginTop: 4 }}>Follow creators to see their content here</Text>
        </View>
      ) : (
        <FlatList
          data={contentFeed}
          keyExtractor={(item, index) => `explore-${item.id}-${index}`}
          renderItem={renderContentItem}
          contentContainerStyle={{ paddingBottom: 100, paddingTop: 8 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.PrimaryRed} />
          }
        />
      )}

      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
        <AppBottomNavBar currentRoute="Explore" onNavigate={(route) => navigation.navigate(route)} />
      </View>
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FAFAFA', paddingTop: Platform.OS === 'android' ? 24 : 0 },

  // JAN SAMVAD Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBox: {
    backgroundColor: colors.PrimaryRed,
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  headerText: {
    fontWeight: '900',
    fontSize: 18,
    color: colors.PrimaryRed,
    letterSpacing: 1,
  },
  headerIcons: {
    flexDirection: 'row',
  },
  headerIconBtn: {
    padding: 8,
    marginLeft: 8,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.PrimaryRed,
    borderWidth: 1.5,
    borderColor: 'white',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 3,
  },
  badgeText: {
    color: 'white',
    fontSize: 9,
    fontWeight: 'bold' as const,
  },

  // Creators Row
  creatorsSection: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.03)',
  },
  creatorItem: {
    alignItems: 'center',
    marginHorizontal: 8,
    width: 64,
  },
  creatorAvatarRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: colors.PrimaryRedAlpha10 || '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
  },
  creatorAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  creatorName: {
    fontSize: 12,
    color: '#0F172A',
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '600',
  },

  // Filter Row
  filterRow: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.03)',
  },
  filterChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: '#F8FAFC',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  filterText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Content Card
  contentCard: {
    backgroundColor: '#FFFFFF',
    marginBottom: 20,
    marginHorizontal: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    overflow: 'hidden',
  },
  thumbnailContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 16 / 9,
  },
  contentThumbnail: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(15,23,42,0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  durationText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  typeBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    shadowColor: '#EF4444',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  typeBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  contentInfo: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'flex-start',
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  contentTitle: {
    fontWeight: '800',
    fontSize: 16,
    color: '#0F172A',
    lineHeight: 22,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    flexWrap: 'wrap',
  },
  authorText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  metaDot: {
    fontSize: 12,
    color: '#CBD5E1',
    marginHorizontal: 6,
  },
  metaText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },

  // States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
