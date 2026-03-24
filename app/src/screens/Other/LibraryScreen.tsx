import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/Theme';
import AppBottomNavBar from '../../components/BottomNavBar';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';

type LibraryTab = 'grid' | 'saved' | 'following' | 'liked' | 'commented';

export default function LibraryScreen() {
  const navigation = useNavigation<any>();
  const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<LibraryTab>('grid');
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

  const fetchFollowing = async () => {
    if (!userId) return;
    setLoading(true);
    const { data } = await supabase
      .from('Follow')
      .select('id, createdAt, following:followingId(id, username, avatarUrl, bio)')
      .eq('followerId', userId)
      .order('createdAt', { ascending: false });
    setItems((data || []).map((f: any) => ({ ...f.following, _type: 'user' })).filter(Boolean));
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
      .order('createdAt', { ascending: false });
    setItems((data || []).map((c: any) => ({ ...c.Post, commentText: c.content, _type: 'commented' })).filter(Boolean));
    setLoading(false);
  };

  const openTab = (tab: LibraryTab) => {
    setActiveTab(tab);
    if (tab === 'saved') fetchSaved();
    else if (tab === 'following') fetchFollowing();
    else if (tab === 'liked') fetchLiked();
    else if (tab === 'commented') fetchCommented();
  };

  if (activeTab === 'grid') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Library</Text>
        </View>

        <View style={styles.gridContainer}>
          <View style={styles.gridRow}>
            <GridBox icon="bookmark" label="Saved" color="#EF4444" bg="#FEF2F2" onPress={() => openTab('saved')} />
            <GridBox icon="people" label="Following" color="#3B82F6" bg="#EFF6FF" onPress={() => openTab('following')} />
          </View>
          <View style={styles.gridRow}>
            <GridBox icon="heart" label="Liked" color="#EC4899" bg="#FDF2F8" onPress={() => openTab('liked')} />
            <GridBox icon="chatbubbles" label="Commented" color="#8B5CF6" bg="#F5F3FF" onPress={() => openTab('commented')} />
          </View>
        </View>

        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
          <AppBottomNavBar currentRoute="Library" onNavigate={(route) => navigation.navigate(route)} />
        </View>
      </SafeAreaView>
    );
  }

  // Sub-list view
  const tabTitle = activeTab === 'saved' ? 'Saved' : activeTab === 'following' ? 'Following' : activeTab === 'liked' ? 'Liked' : 'Commented';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.subHeader}>
        <TouchableOpacity onPress={() => { setActiveTab('grid'); setItems([]); }} style={{ padding: 8 }}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{tabTitle}</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={Colors.PrimaryRed} />
        </View>
      ) : items.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name="folder-open-outline" size={64} color={Colors.Slate400} style={{ opacity: 0.3 }} />
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: Colors.Slate500, marginTop: 16 }}>Nothing here yet</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item, i) => item.id || String(i)}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          renderItem={({ item }) => {
            if (item._type === 'user') {
              return (
                <TouchableOpacity style={styles.userCard} onPress={() => navigation.navigate('CreatorProfile', { authorId: item.id })}>
                  <Image
                    source={{ uri: item.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.username)}&background=E53935&color=fff` }}
                    style={styles.userAvatar}
                  />
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={{ fontWeight: 'bold', fontSize: 16 }}>@{item.username}</Text>
                    {item.bio && <Text style={{ color: Colors.Slate500, fontSize: 13, marginTop: 2 }} numberOfLines={1}>{item.bio}</Text>}
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={Colors.Slate400} />
                </TouchableOpacity>
              );
            }
            return (
              <TouchableOpacity style={styles.postCard} onPress={() => navigation.navigate('ArticleDetail', { id: item.id })}>
                <View style={{ flex: 1 }}>
                  <View style={styles.categoryPill}>
                    <Text style={styles.categoryText}>{item.category || 'General'}</Text>
                  </View>
                  <Text style={styles.titleText} numberOfLines={2}>{item.title}</Text>
                  {item.commentText && (
                    <Text style={{ color: Colors.Slate500, fontSize: 13, marginTop: 6 }} numberOfLines={2}>💬 "{item.commentText}"</Text>
                  )}
                </View>
                {item.thumbnail && (
                  <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}

      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
        <AppBottomNavBar currentRoute="Library" onNavigate={(route) => navigation.navigate(route)} />
      </View>
    </SafeAreaView>
  );
}

const GridBox = ({ icon, label, color, bg, onPress }: any) => (
  <TouchableOpacity style={[styles.gridBox, { backgroundColor: bg }]} onPress={onPress} activeOpacity={0.7}>
    <Ionicons name={icon} size={32} color={color} />
    <Text style={[styles.gridLabel, { color }]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC', paddingTop: Platform.OS === 'android' ? 24 : 0 },
  header: { padding: 16, backgroundColor: 'white', elevation: 2 },
  subHeader: { padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', elevation: 2 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  gridContainer: { flex: 1, padding: 20, justifyContent: 'center', gap: 16 },
  gridRow: { flexDirection: 'row', gap: 16 },
  gridBox: {
    flex: 1, aspectRatio: 1, borderRadius: 20, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)', elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6,
  },
  gridLabel: { fontSize: 15, fontWeight: 'bold', marginTop: 10 },
  postCard: {
    flexDirection: 'row', backgroundColor: 'white', padding: 16,
    borderRadius: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
  userCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 16,
    borderRadius: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
  userAvatar: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: '#E2E8F0' },
  categoryPill: { backgroundColor: Colors.PrimaryRedAlpha10, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, marginBottom: 8 },
  categoryText: { color: Colors.PrimaryRed, fontSize: 10, fontWeight: 'bold' },
  titleText: { fontWeight: 'bold', fontSize: 16 },
  thumbnail: { width: 80, height: 80, borderRadius: 8, marginLeft: 16 },
});
