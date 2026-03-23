import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Image,
  Platform, ActivityIndicator, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/Theme';
import { CreatorApi } from '../../api/services';

const formatTimeAgo = (iso: string) => {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  } catch { return ''; }
};

export default function CreatorCommentsScreen() {
  const navigation = useNavigation<any>();
  const [comments, setComments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchComments = async () => {
    try {
      const data = await CreatorApi.getMyComments();
      setComments(data);
    } catch (e: any) {
      console.warn('Failed to fetch comments:', e.message);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchComments(); }, []));

  const renderItem = ({ item }: any) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Image
          source={{ uri: item.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.username)}&background=E53935&color=fff&size=80` }}
          style={styles.avatar}
        />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.username}>{item.username}</Text>
          <Text style={styles.timestamp}>{formatTimeAgo(item.createdAt)}</Text>
        </View>
      </View>
      <Text style={styles.commentText}>{item.content}</Text>
      <View style={styles.postRef}>
        <Ionicons name="document-text-outline" size={14} color={Colors.Slate500} />
        <Text style={styles.postRefText} numberOfLines={1}>on: {item.postTitle}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8 }}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Comments</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={Colors.PrimaryRed} />
        </View>
      ) : comments.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="chatbubbles-outline" size={64} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>No Comments Yet</Text>
          <Text style={styles.emptySubtitle}>Comments on your content will appear here</Text>
        </View>
      ) : (
        <FlatList
          data={comments}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchComments(); }} colors={[Colors.PrimaryRed]} />}
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
  card: { backgroundColor: 'white', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E2E8F0' },
  username: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  timestamp: { fontSize: 12, color: '#94A3B8' },
  commentText: { fontSize: 14, color: '#334155', lineHeight: 22, marginBottom: 10 },
  postRef: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  postRefText: { fontSize: 12, color: Colors.Slate500, flex: 1 },
});
