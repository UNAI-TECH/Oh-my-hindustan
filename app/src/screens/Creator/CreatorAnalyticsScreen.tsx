import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';
import { CreatorApi } from '../../api/services';

export default function CreatorAnalyticsScreen() {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const navigation = useNavigation<any>();
  const [stats, setStats] = useState({ totalPosts: 0, totalComments: 0, totalVotes: 0, totalFollowers: 0 });
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('7d');

  const fetchData = async () => {
    try {
      const [statsData, postsData] = await Promise.all([
        CreatorApi.getMyStats(),
        CreatorApi.getMyPosts(),
      ]);
      setStats(statsData);
      setPosts(postsData);
    } catch (e: any) {
      console.warn('Analytics fetch error:', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(useCallback(() => {
    setIsLoading(true);
    fetchData();
  }, []));

  const formatStat = (n: number) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toString();
  };

  // Compute top performing content
  const topPosts = [...posts].sort((a, b) => (b.voteCount + b.commentCount) - (a.voteCount + a.commentCount)).slice(0, 5);

  // Compute type distribution
  const typeDistribution = posts.reduce((acc: Record<string, number>, p) => {
    acc[p.type] = (acc[p.type] || 0) + 1;
    return acc;
  }, {});

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8 }}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analytics</Text>
        <View style={{ width: 36 }} />
      </View>

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.PrimaryRed} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
          {/* Period Selector */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            {['7d', '30d', '90d', 'All Time'].map((label, i) => (
              <TouchableOpacity
                key={label}
                style={[styles.dateChip, selectedPeriod === label && styles.dateChipActive]}
                onPress={() => setSelectedPeriod(label)}
              >
                <Text style={[styles.dateText, selectedPeriod === label && styles.dateTextActive]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Summary Stats */}
          <View style={{ gap: 12 }}>
            <View style={styles.row}>
              <SmallStatCard label="Total Content" value={formatStat(stats.totalPosts)} icon="document-text" color="#8B5CF6" />
              <SmallStatCard label="Engagement" value={formatStat(stats.totalVotes)} icon="heart" color={colors.PrimaryRed} />
            </View>
            <View style={styles.row}>
              <SmallStatCard label="Comments" value={formatStat(stats.totalComments)} icon="chatbubble" color="#0EA5E9" />
              <SmallStatCard label="Followers" value={formatStat(stats.totalFollowers)} icon="people" color="#10B981" />
            </View>
          </View>

          {/* Content Distribution */}
          <View style={styles.chartCard}>
            <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 24 }}>Content Distribution</Text>
            {Object.entries(typeDistribution).length === 0 ? (
              <Text style={{ color: '#94A3B8', textAlign: 'center', padding: 20 }}>No content published yet</Text>
            ) : (
              Object.entries(typeDistribution).map(([type, count]) => {
                const total = posts.length || 1;
                const percent = Math.round(((count as number) / total) * 100);
                return (
                  <View key={type} style={{ marginBottom: 16 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text style={{ fontSize: 14, fontWeight: '600' }}>{type}</Text>
                      <Text style={{ fontSize: 14, color: colors.Slate500 }}>{String(count)} ({percent}%)</Text>
                    </View>
                    <View style={{ width: '100%', height: 8, backgroundColor: colors.PrimaryRedAlpha10, borderRadius: 4, overflow: 'hidden' }}>
                      <View style={{ width: `${percent}%`, height: '100%', backgroundColor: TYPE_COLORS[type] || colors.PrimaryRed }} />
                    </View>
                  </View>
                );
              })
            )}
          </View>

          {/* Top Performing */}
          <View style={styles.chartCard}>
            <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 16 }}>Top Performing Content</Text>
            {topPosts.length === 0 ? (
              <Text style={{ color: '#94A3B8', textAlign: 'center', padding: 20 }}>No content to analyze yet</Text>
            ) : (
              topPosts.map((post, idx) => (
                <View key={post.id} style={styles.topPostRow}>
                  <Text style={styles.topPostRank}>#{idx + 1}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.topPostTitle} numberOfLines={1}>{post.title}</Text>
                    <Text style={styles.topPostStats}>
                      {post.voteCount} votes • {post.commentCount} comments
                    </Text>
                  </View>
                  <View style={[styles.topPostTypeBadge, { backgroundColor: (TYPE_COLORS[post.type] || '#6366F1') + '15' }]}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: TYPE_COLORS[post.type] || '#6366F1' }}>{post.type}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const TYPE_COLORS: Record<string, string> = {
  BLOG: '#8B5CF6', NEWS: '#0EA5E9', VIDEO: '#EF4444',
  FORUM: '#F59E0B', DEBATE: '#10B981', UPDATE: '#6366F1',
};

const SmallStatCard = ({ label, value, icon, color }: any) => {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  return (
  <View style={styles.statCard}>
    <View style={[styles.statIconBox, { backgroundColor: color + '15' }]}>
      <Ionicons name={icon} size={18} color={color} />
    </View>
    <Text style={{ fontSize: 12, color: colors.Slate500, letterSpacing: 0.5, marginTop: 10 }}>{label.toUpperCase()}</Text>
    <Text style={{ fontSize: 24, fontWeight: 'bold', marginTop: 4 }}>{value}</Text>
  </View>
)};

const getStyles = (colors: any) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC', paddingTop: Platform.OS === 'android' ? 24 : 0 },
  header: { padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white' },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  dateChip: { backgroundColor: '#F1F5F9', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 8, marginRight: 8 },
  dateChipActive: { backgroundColor: colors.PrimaryRed },
  dateText: { color: colors.Slate500, fontWeight: 'bold', fontSize: 14 },
  dateTextActive: { color: 'white' },
  row: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, backgroundColor: 'white', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  statIconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  chartCard: { backgroundColor: 'white', borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9', padding: 20, marginTop: 24 },
  topPostRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  topPostRank: { fontSize: 16, fontWeight: '800', color: colors.PrimaryRed, width: 30 },
  topPostTitle: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  topPostStats: { fontSize: 12, color: '#64748B', marginTop: 2 },
  topPostTypeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
});
