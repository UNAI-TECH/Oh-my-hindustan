import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, Platform, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../theme/Theme';
import { Ionicons } from '@expo/vector-icons';
import AppBottomNavBar from '../../components/BottomNavBar';
import { useFeed } from '../../context/FeedContext';
import { useAuth } from '../../context/AuthContext';
import { FeedItemType, FeedItem } from '../../types';
import { supabase } from '../../lib/supabaseClient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface FollowedCreator {
  id: string;
  username: string;
  avatarUrl: string | null;
}

export default function ExploreScreen() {
  const navigation = useNavigation<any>();
  const { feedItems, isLoading: feedLoading } = useFeed();
  const { isAuthenticated, userProfile } = useAuth();
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
    if (selectedFilter === 'News') items = items.filter(it => it.type === FeedItemType.NEWS || it.type === FeedItemType.UPDATE);
    if (selectedFilter === 'Blogs') items = items.filter(it => it.type === FeedItemType.BLOG || it.type === FeedItemType.FORUM);
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
            <View style={[styles.authorAvatar, { backgroundColor: Colors.PrimaryRedAlpha10, justifyContent: 'center', alignItems: 'center' }]}>
              <Ionicons name="person" size={14} color={Colors.PrimaryRed} />
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
            <Ionicons name="ellipsis-vertical" size={16} color={Colors.Slate400} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
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
              <View style={[styles.creatorAvatarRing, { borderColor: Colors.Slate300 }]}>
                <View style={[styles.creatorAvatar, { backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' }]}>
                  <Text style={{ fontSize: 11, fontWeight: 'bold', color: Colors.Slate500 }}>All</Text>
                </View>
              </View>
              <Text style={[styles.creatorName, { color: Colors.Slate400 }]}>Discover</Text>
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
          <ActivityIndicator size="large" color={Colors.PrimaryRed} />
        </View>
      ) : contentFeed.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="compass-outline" size={48} color={Colors.Slate400} style={{ opacity: 0.3 }} />
          <Text style={{ color: Colors.Slate500, fontSize: 16, fontWeight: '600', marginTop: 12 }}>No content found</Text>
          <Text style={{ color: Colors.Slate400, fontSize: 13, marginTop: 4 }}>Follow creators to see their content here</Text>
        </View>
      ) : (
        <FlatList
          data={contentFeed}
          keyExtractor={(item, index) => `explore-${item.id}-${index}`}
          renderItem={renderContentItem}
          contentContainerStyle={{ paddingBottom: 100, paddingTop: 8 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.PrimaryRed} />
          }
        />
      )}

      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
        <AppBottomNavBar currentRoute="Explore" onNavigate={(route) => navigation.navigate(route)} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FAFAFA', paddingTop: Platform.OS === 'android' ? 24 : 0 },
  
  // Creators Row
  creatorsSection: {
    backgroundColor: 'white',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  creatorItem: {
    alignItems: 'center',
    marginHorizontal: 6,
    width: 68,
  },
  creatorAvatarRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2.5,
    borderColor: Colors.PrimaryRed,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
  },
  creatorAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  creatorName: {
    fontSize: 11,
    color: '#1E293B',
    marginTop: 5,
    textAlign: 'center',
    fontWeight: '500',
  },

  // Filter Row
  filterRow: {
    backgroundColor: 'white',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#1E293B',
  },
  filterText: {
    color: Colors.Slate600,
    fontSize: 14,
    fontWeight: '500',
  },
  filterTextActive: {
    color: 'white',
    fontWeight: '600',
  },

  // Content Card
  contentCard: {
    backgroundColor: 'white',
    marginBottom: 12,
  },
  thumbnailContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 16 / 9,
  },
  contentThumbnail: {
    width: '100%',
    height: '100%',
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
  typeBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: Colors.PrimaryRed,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  typeBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  contentInfo: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'flex-start',
  },
  authorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  contentTitle: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#1E293B',
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    flexWrap: 'wrap',
  },
  authorText: {
    fontSize: 12,
    color: Colors.Slate500,
    fontWeight: '500',
  },
  metaDot: {
    fontSize: 12,
    color: Colors.Slate400,
    marginHorizontal: 4,
  },
  metaText: {
    fontSize: 12,
    color: Colors.Slate400,
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
