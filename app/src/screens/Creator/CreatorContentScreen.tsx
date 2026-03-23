import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Image,
  Platform, Alert, ActivityIndicator, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/Theme';
import { CreatorApi } from '../../api/services';

const TYPE_COLORS: Record<string, string> = {
  BLOG: '#8B5CF6',
  NEWS: '#0EA5E9',
  VIDEO: '#EF4444',
  FORUM: '#F59E0B',
  DEBATE: '#10B981',
  UPDATE: '#6366F1',
};

const formatDate = (iso: string) => {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return ''; }
};

export default function CreatorContentScreen() {
  const navigation = useNavigation<any>();
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPosts = async () => {
    try {
      const myPosts = await CreatorApi.getMyPosts();
      setPosts(myPosts);
    } catch (e: any) {
      console.warn('Failed to fetch posts:', e.message);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchPosts(); }, []));

  const handleDelete = (postId: string, title: string) => {
    Alert.alert('Delete Content', `Are you sure you want to delete "${title}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await CreatorApi.deletePost(postId);
            setPosts(prev => prev.filter(p => p.id !== postId));
          } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to delete');
          }
        }
      }
    ]);
  };

  const renderItem = ({ item }: any) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.typeBadge, { backgroundColor: (TYPE_COLORS[item.type] || '#6366F1') + '1A' }]}>
          <Text style={[styles.typeText, { color: TYPE_COLORS[item.type] || '#6366F1' }]}>
            {item.type}
          </Text>
        </View>
        <TouchableOpacity onPress={() => handleDelete(item.id, item.title)} style={{ padding: 4 }}>
          <Ionicons name="trash-outline" size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
      <Text style={styles.cardExcerpt} numberOfLines={2}>{item.content?.substring(0, 120)}...</Text>

      <View style={styles.cardFooter}>
        <View style={styles.cardStat}>
          <Ionicons name="heart" size={14} color={Colors.PrimaryRed} />
          <Text style={styles.cardStatText}>{item.voteCount}</Text>
        </View>
        <View style={styles.cardStat}>
          <Ionicons name="chatbubble" size={14} color={Colors.Slate500} />
          <Text style={styles.cardStatText}>{item.commentCount}</Text>
        </View>
        <View style={styles.cardStat}>
          <Ionicons name="folder" size={14} color={Colors.Slate500} />
          <Text style={styles.cardStatText}>{item.category}</Text>
        </View>
        <Text style={styles.cardDate}>{formatDate(item.createdAt)}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8 }}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Content</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={Colors.PrimaryRed} />
        </View>
      ) : posts.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="document-text-outline" size={64} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>No Content Yet</Text>
          <Text style={styles.emptySubtitle}>Start creating to see your content here</Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchPosts(); }} colors={[Colors.PrimaryRed]} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC', paddingTop: Platform.OS === 'android' ? 24 : 0 },
  header: { padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white' },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', marginTop: 16, color: '#334155' },
  emptySubtitle: { fontSize: 14, color: '#94A3B8', marginTop: 8, textAlign: 'center' },
  card: {
    backgroundColor: 'white', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  typeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1E293B', marginBottom: 6 },
  cardExcerpt: { fontSize: 13, color: '#64748B', lineHeight: 20, marginBottom: 12 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardStatText: { fontSize: 12, color: Colors.Slate500 },
  cardDate: { fontSize: 12, color: '#94A3B8', marginLeft: 'auto' },
});
