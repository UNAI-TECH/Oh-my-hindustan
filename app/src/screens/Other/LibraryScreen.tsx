import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Platform, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/Theme';
import AppBottomNavBar from '../../components/BottomNavBar';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { supabase } from '../../lib/supabaseClient';

type LibraryTab = 'liked' | 'commented' | 'reposts' | 'saved';
type FilterType = 'All' | 'Blogs' | 'Posts' | 'Videos' | 'News';

export default function LibraryScreen() {
  const navigation = useNavigation<any>();
  const { userProfile } = useAuth();
  const { unreadCount } = useNotifications();
  const [activeTab, setActiveTab] = useState<LibraryTab>('saved');
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const userId = userProfile?.id;

  const fetchSaved = async () => {
    if (!userId) return;
    setLoading(true);
    const { data } = await supabase
      .from('Save')
      .select('id, createdAt, Post:postId(id, title, category, thumbnail, createdAt)')
      .eq('userId', userId)
      .order('createdAt', { ascending: false });
    setItems((data || []).map((s: any) => ({ ...s.Post, _type: 'post' })).filter(Boolean));
    setLoading(false);
  };

  const fetchLiked = async () => {
    if (!userId) return;
    setLoading(true);
    const { data } = await supabase
      .from('Vote')
      .select('id, createdAt, Post:postId(id, title, category, thumbnail, createdAt)')
      .eq('userId', userId)
      .eq('type', 1)
      .order('createdAt', { ascending: false });
    setItems((data || []).map((v: any) => ({ ...v.Post, _type: 'post' })).filter(Boolean));
    setLoading(false);
  };

  const fetchCommented = async () => {
    if (!userId) return;
    setLoading(true);
    const { data } = await supabase
      .from('Comment')
      .select('id, content, createdAt, Post:postId(id, title, category, thumbnail)')
      .eq('userId', userId)
      .neq('content', '[SYSTEM_REPOST]')
      .order('createdAt', { ascending: false });
    setItems((data || []).map((c: any) => ({ ...c.Post, commentText: c.content, _type: 'commented' })).filter(Boolean));
    setLoading(false);
  };

  const fetchReposts = async () => {
    if (!userId) return;
    setLoading(true);
    const { data } = await supabase
      .from('Comment')
      .select('id, createdAt, Post:postId(id, title, category, thumbnail, createdAt)')
      .eq('userId', userId)
      .eq('content', '[SYSTEM_REPOST]')
      .order('createdAt', { ascending: false });
    setItems((data || []).map((r: any) => ({ ...r.Post, _type: 'post' })).filter(Boolean));
    setLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'saved') fetchSaved();
    else if (activeTab === 'liked') fetchLiked();
    else if (activeTab === 'commented') fetchCommented();
    else if (activeTab === 'reposts') fetchReposts();
  }, [activeTab, userId]);

  // Handle local filtering
  const filteredItems = items.filter(item => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Blogs' && item.category?.toLowerCase().includes('blog')) return true;
    if (activeFilter === 'Posts' && (!item.category || item.category?.toLowerCase() === 'general' || item.category?.toLowerCase() === 'politics' || item.category?.toLowerCase() === 'economy')) return true;
    if (activeFilter === 'Videos' && item.category?.toLowerCase().includes('video')) return true;
    if (activeFilter === 'News' && item.category?.toLowerCase().includes('news')) return true;

    // Fallback exact match if available
    return item.category?.toLowerCase() === activeFilter.toLowerCase();
  });

  const renderHeader = () => (
    <View style={styles.contentHeader}>
      {/* Title Section */}
      <View style={styles.titleSection}>
        <Text style={styles.mainHeading}>Your Library</Text>
      </View>

      {/* Options Section */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.optionsScroll}>
        <OptionCard icon="heart" label="Likes" bg="#FDF2F8" color="#EC4899" active={activeTab === 'liked'} onPress={() => setActiveTab('liked')} />
        <OptionCard icon="chatbubble-ellipses" label="Comments" bg="#F5F3FF" color="#8B5CF6" active={activeTab === 'commented'} onPress={() => setActiveTab('commented')} />
        <OptionCard icon="repeat" label="Reposts" bg="#ECFEFF" color="#06B6D4" active={activeTab === 'reposts'} onPress={() => setActiveTab('reposts')} />
        <OptionCard icon="bookmark" label="Saved" bg="#FEF2F2" color="#EF4444" active={activeTab === 'saved'} onPress={() => setActiveTab('saved')} />
      </ScrollView>

      {/* Recent Posts Heading & Filters */}
      <View style={styles.recentSection}>
        <Text style={styles.recentHeading}>Recent Posts</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {['All', 'Blogs', 'Posts', 'Videos', 'News'].map(f => (
            <TouchableOpacity key={f} style={[styles.filterPill, activeFilter === f && styles.filterPillActive]} onPress={() => setActiveFilter(f as FilterType)}>
              <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* JAN SAMVAD Header */}
      <View style={styles.topHeader}>
        <View style={styles.headerTitle}>
          <View style={styles.logoBox}>
            <Ionicons name="globe" size={20} color="white" />
          </View>
          <Text style={styles.headerText}>JAN SAMVAD</Text>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity onPress={() => navigation.navigate('Search')} style={styles.iconBtn}>
            <Ionicons name="search" size={24} color={Colors.Slate500} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={styles.iconBtn}>
            <Ionicons name="notifications" size={24} color={Colors.Slate500} />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#0F172A" />
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item, i) => `${item.id || 'item'}-${i}`}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="folder-open-outline" size={64} color="#CBD5E1" />
              <Text style={styles.emptyText}>Nothing here yet</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.postCard} onPress={() => navigation.navigate('ArticleDetail', { id: item.id })}>
              <View style={{ flex: 1 }}>
                <View style={styles.categoryPillItem}>
                  <Text style={styles.categoryText}>{item.category || 'General'}</Text>
                </View>
                <Text style={styles.titleText} numberOfLines={2}>{item.title || 'Untitled'}</Text>
                {item.commentText && (
                  <Text style={styles.commentText} numberOfLines={2}>💬 "{item.commentText}"</Text>
                )}
              </View>
              {item.thumbnail && (
                <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
              )}
            </TouchableOpacity>
          )}
        />
      )}

      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
        <AppBottomNavBar currentRoute="Library" onNavigate={(route) => navigation.navigate(route)} />
      </View>
    </SafeAreaView>
  );
}

const OptionCard = ({ icon, label, bg, color, active, onPress }: any) => (
  <TouchableOpacity style={[styles.optionCard, active && styles.optionCardActive]} onPress={onPress} activeOpacity={0.8}>
    <View style={[styles.iconCircle, { backgroundColor: bg }]}>
      <Ionicons name={icon} size={22} color={color} />
    </View>
    <Text style={[styles.optionLabel, active && { color: '#0F172A', fontWeight: '800' }]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FAFAFA', paddingTop: Platform.OS === 'android' ? 24 : 0 },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBox: {
    backgroundColor: Colors.PrimaryRed,
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
    color: Colors.PrimaryRed,
    letterSpacing: 1,
  },
  headerIcons: {
    flexDirection: 'row',
  },
  iconBtn: {
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
    backgroundColor: Colors.PrimaryRed,
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
  contentHeader: {
    paddingBottom: 8,
  },
  titleSection: {
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 20,
  },
  smallLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1,
    marginBottom: 4,
  },
  mainHeading: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  optionsScroll: {
    paddingHorizontal: 20,
    gap: 12,
    paddingBottom: 24,
  },
  optionCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    minWidth: 100,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
  },
  optionCardActive: {
    borderColor: '#0F172A',
    borderWidth: 1.5,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  optionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  recentSection: {
    paddingTop: 8,
  },
  recentHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  filterScroll: {
    paddingHorizontal: 20,
    gap: 10,
    paddingBottom: 16,
  },
  filterPill: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
  },
  filterPillActive: {
    backgroundColor: '#0F172A',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  filterTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  postCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  categoryPillItem: {
    backgroundColor: '#F8FAFC',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 10,
  },
  categoryText: {
    color: '#475569',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  titleText: {
    fontWeight: '800',
    fontSize: 15,
    color: '#0F172A',
    lineHeight: 22,
  },
  commentText: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 6,
    fontStyle: 'italic',
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 16,
    marginLeft: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 16,
  },
});
