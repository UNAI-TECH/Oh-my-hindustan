import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, FlatList, Image, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';
import { FeedItemType, FeedItem } from '../../types';
import { useFeed } from '../../context/FeedContext';
import { supabase } from '../../lib/supabaseClient';

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
  const { feedItems } = useFeed();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [creators, setCreators] = useState<CreatorResult[]>([]);
  const [searchingCreators, setSearchingCreators] = useState(false);
  const filters = ['All', 'Creators', 'News', 'Blogs', 'Videos'];

  // Search creators from Supabase when query changes
  useEffect(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q.length < 2) {
      setCreators([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setSearchingCreators(true);
      try {
        const { data, error } = await supabase
          .from('User')
          .select('id, username, channel_name, "avatarUrl", bio, role')
          .in('role', ['ANALYST', 'CREATOR'])
          .or(`username.ilike.%${q}%,channel_name.ilike.%${q}%`)
          .limit(10);
        if (error) console.warn('Creator search error:', error);
        setCreators(data || []);
      } catch (e) {
        console.warn('Creator search error:', e);
      } finally {
        setSearchingCreators(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const filteredPosts = useMemo(() => {
    if (selectedFilter === 'Creators') return [];
    return feedItems.filter(item => {
      const q = searchQuery.toLowerCase();
      const matchesQuery = !q || item.title.toLowerCase().includes(q) || 
                           (item.excerpt?.toLowerCase().includes(q)) || 
                           (item.authorName?.toLowerCase().includes(q));
      
      let matchesFilter = true;
      if (selectedFilter === 'News') matchesFilter = item.type === FeedItemType.NEWS;
      if (selectedFilter === 'Blogs') matchesFilter = item.type === FeedItemType.BLOG;
      if (selectedFilter === 'Videos') matchesFilter = item.type === FeedItemType.VIDEO;

      return matchesQuery && matchesFilter && item.type !== FeedItemType.PROMO;
    });
  }, [searchQuery, selectedFilter, feedItems]);

  const showCreators = selectedFilter === 'All' || selectedFilter === 'Creators';

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

      <ScrollView style={{ flex: 1, backgroundColor: '#FFF9F2' }} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {/* Creator Results */}
        {showCreators && creators.length > 0 && (
          <View style={{ marginBottom: 20 }}>
            <Text style={styles.sectionTitle}>Creators</Text>
            {creators.map((creator: any, idx) => {
              const nameDisplay = creator.channel_name || creator.username || 'creator';
              const avatarUri = creator.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(nameDisplay)}&background=E53935&color=fff&size=200`;
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
              <TouchableOpacity key={`post-${item.id}-${idx}`} style={styles.postCard} onPress={() => navigation.navigate('ArticleDetail', { id: item.id })}>
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
});
