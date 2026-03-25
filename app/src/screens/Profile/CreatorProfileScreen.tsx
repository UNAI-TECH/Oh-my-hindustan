import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Platform, Modal, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/Theme';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { AppApi } from '../../api/services';
import { generateUUID } from '../../utils/uuid';

export default function CreatorProfileScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { authorId, authorName: paramAuthorName } = route.params || {};
  const { userProfile } = useAuth();

  const [creator, setCreator] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [postCount, setPostCount] = useState(0);
  const [isFollowed, setIsFollowed] = useState(false);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const fetchCreatorData = async () => {
      if (!authorId) { setLoading(false); return; }
      try {
        // Fetch creator profile
        const { data: user } = await supabase.from('User').select('*').eq('id', authorId).single();
        setCreator(user);

        // Fetch posts by this creator
        const { data: creatorPosts } = await supabase
          .from('Post')
          .select('*, Vote(type), Comment(id)')
          .eq('authorId', authorId)
          .order('createdAt', { ascending: false });
        setPosts(creatorPosts || []);
        setPostCount(creatorPosts?.length || 0);

        // Fetch follower count
        const { count } = await supabase.from('Follow').select('id', { count: 'exact', head: true }).eq('followingId', authorId);
        setFollowerCount(count || 0);

        // Check if current user follows this creator
        if (userProfile?.id) {
          const { data: followData } = await supabase.from('Follow').select('id').eq('followerId', userProfile.id).eq('followingId', authorId).maybeSingle();
          setIsFollowed(!!followData);
        }
      } catch (e) {
        console.warn('Failed to fetch creator data:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchCreatorData();
  }, [authorId, userProfile?.id]);

  const handleFollow = async () => {
    if (!userProfile?.id || !authorId) { Alert.alert('Login Required', 'Please login to follow creators'); return; }
    try {
      if (isFollowed) {
        const { error } = await supabase.from('Follow').delete().eq('followerId', userProfile.id).eq('followingId', authorId);
        if (error) throw error;
        setFollowerCount(c => Math.max(0, c - 1));
      } else {
        const { error } = await supabase.from('Follow').insert({
          id: generateUUID(),
          followerId: userProfile.id,
          followingId: authorId,
        });
        if (error) throw error;
        setFollowerCount(c => c + 1);
        // Notify creator
        await supabase.from('Notification').insert({
          id: generateUUID(),
          userId: authorId,
          type: 'FOLLOW',
          title: 'New Follower',
          message: `${userProfile.username || 'Someone'} started following you`,
          targetId: userProfile.id,
          createdAt: new Date().toISOString(),
        });
      }
      setIsFollowed(!isFollowed);
    } catch (e: any) { Alert.alert('Follow Failed', e?.message || 'Could not follow creator'); }
  };

  const displayName = creator?.username || paramAuthorName || 'Creator';
  const avatarUrl = creator?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=E53935&color=fff&size=200`;
  const bio = creator?.bio || 'Content Creator';
  const coverUrl = creator?.coverUrl || null;

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={Colors.PrimaryRed} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8 }}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Creator</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} bounces={false}>
        {/* Cover Banner + Avatar */}
        {coverUrl ? (
          <View style={{ width: '100%', paddingBottom: 60 }}>
            <Image source={{ uri: coverUrl }} style={{ width: '100%', height: 160 }} />
            <View style={{ position: 'absolute', bottom: 0, width: '100%', alignItems: 'center' }}>
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            </View>
          </View>
        ) : (
          <View style={{ width: '100%', paddingBottom: 60 }}>
            <LinearGradient
              colors={[Colors.DeepCrimson, Colors.WarmOrange]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={{ width: '100%', height: 160 }}
            />
            <View style={{ position: 'absolute', bottom: 0, width: '100%', alignItems: 'center' }}>
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            </View>
          </View>
        )}

        <View style={{ alignItems: 'center', paddingTop: 12 }}>
          <Text style={{ fontWeight: 'bold', fontSize: 24 }}>@{displayName}</Text>
          <Text style={{ color: Colors.Slate500, fontSize: 14, marginTop: 4, textAlign: 'center', paddingHorizontal: 32 }}>{bio}</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{postCount}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <View style={[styles.statItem, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#E2E8F0' }]}>
            <Text style={styles.statNum}>{followerCount}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{posts.reduce((sum, p) => sum + (p.Vote?.length || 0), 0)}</Text>
            <Text style={styles.statLabel}>Likes</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.followBtn, isFollowed ? styles.followingBtn : styles.notFollowingBtn]}
          onPress={handleFollow}
        >
          <Ionicons name={isFollowed ? 'checkmark' : 'person-add'} size={18} color={isFollowed ? 'black' : 'white'} />
          <Text style={{ fontWeight: 'bold', color: isFollowed ? 'black' : 'white', marginLeft: 8 }}>
            {isFollowed ? 'Following' : 'Follow'}
          </Text>
        </TouchableOpacity>

        <Text style={{ paddingHorizontal: 24, fontSize: 20, fontWeight: 'bold', marginTop: 32, marginBottom: 16 }}>Publications</Text>

        <View style={{ paddingHorizontal: 16, gap: 16 }}>
          {posts.length === 0 ? (
            <View style={{ padding: 48, alignItems: 'center' }}>
              <Ionicons name="document-text-outline" size={48} color={Colors.Slate400} style={{ opacity: 0.4 }} />
              <Text style={{ color: Colors.Slate500, marginTop: 12 }}>No posts yet</Text>
            </View>
          ) : (
            posts.map((item, idx) => (
              <TouchableOpacity 
                key={`post-${item.id}-${idx}`} 
                style={styles.postCard}
                onPress={() => navigation.navigate('ArticleDetail', { id: item.id })}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                  <Image source={{ uri: avatarUrl }} style={{ width: 24, height: 24, borderRadius: 12 }} />
                  <Text style={{ fontWeight: 'bold', fontSize: 12, marginLeft: 8 }}>@{displayName}</Text>
                  <Text style={{ fontSize: 12, color: 'gray' }}> • {item.category || 'General'}</Text>
                </View>
                {item.thumbnail && (
                  <Image source={{ uri: item.thumbnail }} style={{ width: '100%', height: 160, borderRadius: 10, marginBottom: 10 }} />
                )}
                <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{item.title}</Text>
                {item.content && (
                  <Text style={{ fontSize: 13, color: 'gray', marginTop: 6 }} numberOfLines={2}>{item.content}</Text>
                )}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
                  <Ionicons name="heart-outline" size={16} color="gray" />
                  <Text style={{ color: 'gray', marginLeft: 4, marginRight: 16 }}>{item.Vote?.length || 0}</Text>
                  <Ionicons name="chatbubble-outline" size={16} color="gray" />
                  <Text style={{ color: 'gray', marginLeft: 4 }}>{item.Comment?.length || 0}</Text>
                  <View style={{ flex: 1 }} />
                  <Text style={{ fontSize: 11, color: Colors.Slate400 }}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>


    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: 'white', paddingTop: Platform.OS === 'android' ? 24 : 0 },
  header: { padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', zIndex: 10 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: Colors.PrimaryRed },
  statsRow: { 
    flexDirection: 'row', marginHorizontal: 24, marginTop: 20, 
    backgroundColor: '#F8FAFC', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0',
  },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: 16 },
  statNum: { fontWeight: 'bold', fontSize: 20 },
  statLabel: { fontSize: 12, color: Colors.Slate500, marginTop: 2 },
  followBtn: { 
    flexDirection: 'row', marginHorizontal: 24, marginTop: 20, height: 48, 
    borderRadius: 24, justifyContent: 'center', alignItems: 'center',
  },
  followingBtn: { backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
  notFollowingBtn: { backgroundColor: Colors.PrimaryRed },
  postCard: { padding: 16, backgroundColor: 'white', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  bottomSheet: { backgroundColor: 'white', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, paddingBottom: 32 },
  sheetItem: { paddingVertical: 16 },
});
