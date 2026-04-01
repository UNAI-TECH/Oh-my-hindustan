import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Platform, ActivityIndicator, ScrollView, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';
import AppBottomNavBar from '../../components/BottomNavBar';
import MainHeader from '../../components/MainHeader';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { supabase } from '../../lib/supabaseClient';

type LibraryTab = 'saved' | 'liked' | 'commented';
type FilterType = 'All' | 'Blogs' | 'Posts' | 'Videos' | 'News';

const TAB_CONFIG: { key: LibraryTab; icon: string; label: string; color: string; bg: string }[] = [
  { key: 'saved', icon: 'bookmark', label: 'Saved', color: '#EF4444', bg: '#FEF2F2' },
  { key: 'liked', icon: 'heart', label: 'Liked', color: '#EC4899', bg: '#FDF2F8' },
  { key: 'commented', icon: 'chatbubble-ellipses', label: 'Comments', color: '#8B5CF6', bg: '#F5F3FF' },
];

export default function LibraryScreen() {
  const { colors } = useAppTheme();
  const navigation = useNavigation<any>();
  const { userProfile } = useAuth();
  const { unreadCount } = useNotifications();
  const [activeTab, setActiveTab] = useState<LibraryTab>('saved');
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const numColumns = isTablet ? 2 : 1;

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

  const activeFetch = React.useCallback(() => {
    if (activeTab === 'saved') fetchSaved();
    else if (activeTab === 'liked') fetchLiked();
    else if (activeTab === 'commented') fetchCommented();
  }, [activeTab, userId]);

  useEffect(() => { activeFetch(); }, [activeFetch]);
  useFocusEffect(React.useCallback(() => { activeFetch(); }, [activeFetch]));

  const filteredItems = items.filter(item => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Blogs' && item.category?.toLowerCase().includes('blog')) return true;
    if (activeFilter === 'Posts' && (!item.category || item.category?.toLowerCase() === 'general' || item.category?.toLowerCase() === 'politics' || item.category?.toLowerCase() === 'economy')) return true;
    if (activeFilter === 'Videos' && item.category?.toLowerCase().includes('video')) return true;
    if (activeFilter === 'News' && item.category?.toLowerCase().includes('news')) return true;
    return item.category?.toLowerCase() === activeFilter.toLowerCase();
  });

  const activeTabConfig = TAB_CONFIG.find(t => t.key === activeTab)!;

  const renderHeader = () => (
    <View style={{ paddingBottom: 4 }}>
      {/* Page Title */}
      <View style={{ paddingHorizontal: 20, marginTop: 8, marginBottom: 16 }}>
        <Text style={{ fontSize: 28, fontWeight: '800', color: '#0F172A', letterSpacing: -0.5 }}>Your Library</Text>
      </View>

      {/* Tab Selector — Compact inline row */}
      <View style={{
        flexDirection: 'row',
        paddingHorizontal: 16,
        marginBottom: 16,
        gap: 10,
      }}>
        {TAB_CONFIG.map(tab => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.8}
              style={{
                flex: isTablet ? 1 : undefined,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                paddingVertical: 12,
                paddingHorizontal: 16,
                backgroundColor: isActive ? tab.bg : '#fff',
                borderRadius: 14,
                borderWidth: isActive ? 1.5 : 1,
                borderColor: isActive ? tab.color : '#E2E8F0',
                ...(Platform.OS === 'ios' ? {
                  shadowColor: '#000',
                  shadowOpacity: 0.04,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 2 },
                } : { elevation: isActive ? 2 : 1 }),
              }}
            >
              <View style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: isActive ? tab.color + '20' : '#F1F5F9',
                justifyContent: 'center',
                alignItems: 'center',
              }}>
                <Ionicons name={tab.icon as any} size={18} color={isActive ? tab.color : '#94A3B8'} />
              </View>
              <Text style={{
                fontSize: 14,
                fontWeight: isActive ? '700' : '600',
                color: isActive ? tab.color : '#64748B',
              }}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Active section heading with count */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ width: 4, height: 20, backgroundColor: activeTabConfig.color, borderRadius: 2 }} />
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A' }}>
            {activeTabConfig.label}
          </Text>
          <View style={{ backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748B' }}>{filteredItems.length}</Text>
          </View>
        </View>
      </View>

      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingBottom: 12 }}>
        {(['All', 'Blogs', 'Posts', 'Videos', 'News'] as FilterType[]).map(f => (
          <TouchableOpacity
            key={f}
            style={{
              paddingHorizontal: 18,
              paddingVertical: 8,
              borderRadius: 20,
              backgroundColor: activeFilter === f ? '#0F172A' : '#F1F5F9',
            }}
            onPress={() => setActiveFilter(f)}
          >
            <Text style={{
              fontSize: 13,
              fontWeight: activeFilter === f ? '700' : '600',
              color: activeFilter === f ? '#FFFFFF' : '#475569',
            }}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FAFAFA', paddingTop: Platform.OS === 'android' ? 24 : 0 }}>
      <MainHeader />

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={activeTabConfig.color} />
        </View>
      ) : (
        <FlatList
          key={numColumns}
          numColumns={numColumns}
          data={filteredItems}
          keyExtractor={(item, i) => `${item.id || 'item'}-${activeTab}-${i}`}
          contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: isTablet ? 8 : 0 }}
          columnWrapperStyle={numColumns > 1 ? { paddingHorizontal: 12, gap: 12 } : undefined}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: 48, paddingBottom: 48 }}>
              <View style={{
                width: 80, height: 80, borderRadius: 40,
                backgroundColor: activeTabConfig.bg,
                justifyContent: 'center', alignItems: 'center',
                marginBottom: 16,
              }}>
                <Ionicons name={activeTabConfig.icon as any} size={36} color={activeTabConfig.color} />
              </View>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#0F172A', marginBottom: 6 }}>
                No {activeTabConfig.label.toLowerCase()} yet
              </Text>
              <Text style={{ fontSize: 14, color: '#94A3B8', textAlign: 'center', paddingHorizontal: 48 }}>
                {activeTab === 'saved' ? 'Posts you save will appear here' :
                 activeTab === 'liked' ? 'Posts you like will appear here' :
                 'Your comments will appear here'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={{
                flex: isTablet ? 1 : undefined,
                flexDirection: 'row',
                backgroundColor: '#FFFFFF',
                padding: 14,
                marginHorizontal: isTablet ? 0 : 16,
                marginBottom: 12,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: '#F1F5F9',
                ...(Platform.OS === 'ios' ? {
                  shadowColor: '#000',
                  shadowOpacity: 0.04,
                  shadowRadius: 12,
                  shadowOffset: { width: 0, height: 4 },
                } : { elevation: 2 }),
              }}
              onPress={() => navigation.navigate('ArticleDetail', { id: item.id })}
              activeOpacity={0.7}
            >
              <View style={{ flex: 1 }}>
                <View style={{
                  backgroundColor: '#F8FAFC',
                  alignSelf: 'flex-start',
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 10,
                  marginBottom: 8,
                }}>
                  <Text style={{ color: '#475569', fontSize: 10, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                    {item.category || 'General'}
                  </Text>
                </View>
                <Text style={{ fontWeight: '700', fontSize: 15, color: '#0F172A', lineHeight: 22 }} numberOfLines={2}>
                  {item.title || 'Untitled'}
                </Text>
                {item.commentText && (
                  <Text style={{ color: '#64748B', fontSize: 13, marginTop: 6, fontStyle: 'italic' }} numberOfLines={2}>
                    💬 "{item.commentText}"
                  </Text>
                )}
              </View>
              {item.thumbnail && (
                <Image source={{ uri: item.thumbnail }} style={{
                  width: 76,
                  height: 76,
                  borderRadius: 14,
                  marginLeft: 14,
                }} />
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
