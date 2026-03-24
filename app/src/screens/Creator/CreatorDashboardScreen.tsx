import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Platform,
  Modal, ActivityIndicator, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/Theme';
import { CreatorApi } from '../../api/services';
import { useAuth } from '../../context/AuthContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SIDEBAR_ITEMS = [
  { label: 'Dashboard', icon: 'grid-outline', route: 'CreatorDashboard' },
  { label: 'Analytics', icon: 'trending-up-outline', route: 'CreatorAnalytics' },
  { label: 'Content', icon: 'document-text-outline', route: 'CreatorContent' },
  { label: 'Comments', icon: 'chatbubble-outline', route: 'CreatorComments' },
  { label: 'Subtitles', icon: 'language-outline', route: 'CreatorSubtitles' },
  { label: 'Earn', icon: 'cash-outline', route: 'CreatorEarn' },
  { label: 'divider', icon: '', route: '' },
  { label: 'Settings', icon: 'settings-outline', route: 'CreatorSettings' },
  { label: 'Send Feedback', icon: 'paper-plane-outline', route: 'CreatorFeedback' },
  { label: 'Logout', icon: 'log-out-outline', route: 'Logout' },
];

const CREATE_OPTIONS = [
  { label: 'Blog', type: 'BLOG', icon: 'document-text', color: '#8B5CF6', desc: 'Write an article or story' },
  { label: 'News', type: 'NEWS', icon: 'newspaper', color: '#0EA5E9', desc: 'Share breaking news or updates' },
  { label: 'Video', type: 'VIDEO', icon: 'videocam', color: '#EF4444', desc: 'Upload a video report' },
];

export default function CreatorDashboardScreen() {
  const navigation = useNavigation<any>();
  const { userProfile, logout } = useAuth();

  const [showSidebar, setShowSidebar] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [stats, setStats] = useState({ totalPosts: 0, totalComments: 0, totalVotes: 0, totalFollowers: 0 });
  const [recentPosts, setRecentPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const displayName = userProfile?.username || userProfile?.email?.split('@')[0] || 'Creator';
  const avatarUrl = userProfile?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=E53935&color=fff&size=200`;

  const fetchDashboardData = async () => {
    try {
      const [statsData, posts] = await Promise.all([
        CreatorApi.getMyStats(),
        CreatorApi.getMyPosts(),
      ]);
      setStats(statsData);
      setRecentPosts(posts.slice(0, 5));
    } catch (e: any) {
      console.warn('Dashboard fetch error:', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(useCallback(() => {
    setIsLoading(true);
    fetchDashboardData();
  }, []));

  const handleSidebarNav = async (route: string) => {
    setShowSidebar(false);
    if (route === 'Logout') {
      await logout();
      navigation.reset({ index: 0, routes: [{ name: 'Splash' }] });
    } else if (route === 'CreatorDashboard') {
      // Already here
    } else {
      navigation.navigate(route);
    }
  };

  const handleCreate = (type: string) => {
    setShowCreateModal(false);
    navigation.navigate('ContentEditor', { contentType: type });
  };

  const formatStat = (n: number) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toString();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => setShowSidebar(true)} style={{ padding: 4, marginRight: 8 }}>
            <Ionicons name="menu" size={26} color="#1E293B" />
          </TouchableOpacity>
          <View style={styles.logoRow}>
            <View style={styles.logoBox}>
              <Ionicons name="play" size={16} color="white" />
            </View>
            <Text style={styles.headerTitle}>Creator Studio</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => setShowCreateModal(true)} style={styles.createBtn}>
            <Ionicons name="add" size={18} color="white" />
            <Text style={styles.createBtnText}>CREATE</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={{ marginLeft: 10 }}>
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {/* Welcome */}
        <View style={{ marginBottom: 24 }}>
          <Text style={styles.welcomeText}>Welcome back, {displayName}</Text>
          <Text style={styles.welcomeSubtext}>Here's your creator dashboard overview</Text>
        </View>

        {isLoading ? (
          <View style={{ padding: 60, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={Colors.PrimaryRed} />
          </View>
        ) : (
          <>
            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <StatCard icon="document-text" label="Total Posts" value={formatStat(stats.totalPosts)} color="#8B5CF6" />
              <StatCard icon="heart" label="Total Votes" value={formatStat(stats.totalVotes)} color={Colors.PrimaryRed} />
              <StatCard icon="chatbubble" label="Comments" value={formatStat(stats.totalComments)} color="#0EA5E9" />
              <StatCard icon="people" label="Followers" value={formatStat(stats.totalFollowers)} color="#10B981" />
            </View>

            {/* Quick Actions */}
            <Text style={styles.sectionTitle}>Quick Create</Text>
            <View style={styles.quickActions}>
              {CREATE_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.type}
                  style={styles.quickActionCard}
                  onPress={() => handleCreate(opt.type)}
                >
                  <View style={[styles.quickActionIcon, { backgroundColor: opt.color + '15' }]}>
                    <Ionicons name={opt.icon as any} size={24} color={opt.color} />
                  </View>
                  <Text style={styles.quickActionLabel}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Recent Content */}
            <Text style={styles.sectionTitle}>Recent Content</Text>
            {recentPosts.length === 0 ? (
              <View style={styles.emptyBox}>
                <Ionicons name="create-outline" size={40} color="#CBD5E1" />
                <Text style={styles.emptyText}>No content published yet</Text>
                <Text style={styles.emptySubtext}>Tap CREATE to publish your first piece!</Text>
              </View>
            ) : (
              recentPosts.map((post, idx) => (
                <View key={`recent-${post.id}-${idx}`} style={styles.recentCard}>
                  <View style={[styles.recentTypeBadge, { backgroundColor: (TYPE_COLORS[post.type] || '#6366F1') + '15' }]}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: TYPE_COLORS[post.type] || '#6366F1' }}>{post.type}</Text>
                  </View>
                  <Text style={styles.recentTitle} numberOfLines={1}>{post.title}</Text>
                  <View style={styles.recentStats}>
                    <Text style={styles.recentStatText}>
                      <Ionicons name="heart" size={12} color={Colors.Slate500} /> {post.voteCount}
                    </Text>
                    <Text style={styles.recentStatText}>
                      <Ionicons name="chatbubble" size={12} color={Colors.Slate500} /> {post.commentCount}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>

      {/* Sidebar Drawer */}
      {showSidebar && (
        <Modal transparent animationType="fade" visible={showSidebar} onRequestClose={() => setShowSidebar(false)}>
          <View style={styles.sidebarOverlay}>
            <TouchableOpacity style={styles.sidebarDismiss} onPress={() => setShowSidebar(false)} activeOpacity={1} />
            <View style={styles.sidebar}>
              {/* Sidebar Header */}
              <View style={styles.sidebarHeader}>
                <Image source={{ uri: avatarUrl }} style={styles.sidebarAvatar} />
                <Text style={styles.sidebarName}>{displayName}</Text>
                <Text style={styles.sidebarRole}>{userProfile?.role || 'Creator'}</Text>
              </View>

              <ScrollView style={{ flex: 1 }}>
                {SIDEBAR_ITEMS.map((item, idx) => {
                  if (item.label === 'divider') {
                    return <View key={`div-${idx}`} style={styles.sidebarDivider} />;
                  }
                  const isActive = item.route === 'CreatorDashboard';
                  const isLogout = item.label === 'Logout';
                  return (
                    <TouchableOpacity
                      key={item.route}
                      style={[styles.sidebarItem, isActive && styles.sidebarItemActive]}
                      onPress={() => handleSidebarNav(item.route)}
                    >
                      <Ionicons
                        name={item.icon as any}
                        size={22}
                        color={isLogout ? '#EF4444' : isActive ? Colors.PrimaryRed : '#475569'}
                      />
                      <Text style={[
                        styles.sidebarItemText,
                        isActive && { color: Colors.PrimaryRed, fontWeight: '700' },
                        isLogout && { color: '#EF4444' }
                      ]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <TouchableOpacity style={styles.sidebarExit} onPress={() => { setShowSidebar(false); navigation.navigate('Home'); }}>
                <Ionicons name="arrow-back-circle-outline" size={22} color={Colors.Slate500} />
                <Text style={styles.sidebarExitText}>Back to App</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Create Options Modal */}
      {showCreateModal && (
        <Modal transparent animationType="slide" visible={showCreateModal} onRequestClose={() => setShowCreateModal(false)}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowCreateModal(false)}>
            <View style={styles.createSheet}>
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>Create New Content</Text>
              <Text style={styles.sheetSubtitle}>Choose what you'd like to create</Text>

              {CREATE_OPTIONS.map(opt => (
                <TouchableOpacity key={opt.type} style={styles.createOption} onPress={() => handleCreate(opt.type)}>
                  <View style={[styles.createOptionIcon, { backgroundColor: opt.color + '15' }]}>
                    <Ionicons name={opt.icon as any} size={28} color={opt.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.createOptionLabel}>{opt.label}</Text>
                    <Text style={styles.createOptionDesc}>{opt.desc}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const TYPE_COLORS: Record<string, string> = {
  BLOG: '#8B5CF6', NEWS: '#0EA5E9', VIDEO: '#EF4444',
  FORUM: '#F59E0B', DEBATE: '#10B981', UPDATE: '#6366F1',
};

const StatCard = ({ icon, label, value, color }: any) => (
  <View style={styles.statCard}>
    <View style={[styles.statIconBox, { backgroundColor: color + '15' }]}>
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC', paddingTop: Platform.OS === 'android' ? 24 : 0 },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 12, paddingHorizontal: 16, backgroundColor: 'white',
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  logoRow: { flexDirection: 'row', alignItems: 'center' },
  logoBox: {
    backgroundColor: Colors.PrimaryRed, width: 28, height: 28, borderRadius: 8,
    justifyContent: 'center', alignItems: 'center', marginRight: 8,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  createBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.PrimaryRed, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
  },
  createBtnText: { color: 'white', fontWeight: '800', fontSize: 12, letterSpacing: 0.5 },
  avatar: { width: 32, height: 32, borderRadius: 16, borderWidth: 1.5, borderColor: '#E2E8F0' },

  // Welcome
  welcomeText: { fontSize: 24, fontWeight: 'bold', color: '#1E293B' },
  welcomeSubtext: { fontSize: 14, color: '#64748B', marginTop: 4 },

  // Stats
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 28 },
  statCard: {
    width: (SCREEN_WIDTH - 44) / 2, backgroundColor: 'white', borderRadius: 16,
    padding: 16, borderWidth: 1, borderColor: '#E2E8F0',
  },
  statIconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  statValue: { fontSize: 28, fontWeight: '800', color: '#1E293B' },
  statLabel: { fontSize: 12, color: '#64748B', marginTop: 4, fontWeight: '500' },

  // Section
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B', marginBottom: 14 },

  // Quick Actions
  quickActions: { flexDirection: 'row', gap: 12, marginBottom: 28 },
  quickActionCard: {
    flex: 1, backgroundColor: 'white', borderRadius: 16, padding: 16,
    alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0',
  },
  quickActionIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  quickActionLabel: { fontSize: 14, fontWeight: '700', color: '#1E293B' },

  // Recent
  recentCard: {
    backgroundColor: 'white', borderRadius: 12, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  recentTypeBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginBottom: 6 },
  recentTitle: { fontSize: 15, fontWeight: '600', color: '#1E293B', marginBottom: 8 },
  recentStats: { flexDirection: 'row', gap: 16 },
  recentStatText: { fontSize: 12, color: '#64748B' },

  // Empty
  emptyBox: {
    backgroundColor: 'white', borderRadius: 16, padding: 40, alignItems: 'center',
    borderWidth: 1, borderColor: '#E2E8F0', borderStyle: 'dashed',
  },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#94A3B8', marginTop: 12 },
  emptySubtext: { fontSize: 13, color: '#CBD5E1', marginTop: 4 },

  // Sidebar
  sidebarOverlay: { flex: 1, flexDirection: 'row' },
  sidebarDismiss: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sidebar: {
    position: 'absolute', left: 0, top: 0, bottom: 0, width: SCREEN_WIDTH * 0.75,
    backgroundColor: 'white', paddingTop: Platform.OS === 'android' ? 40 : 60,
    elevation: 20, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 20,
  },
  sidebarHeader: { paddingHorizontal: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  sidebarAvatar: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: Colors.PrimaryRed + '30' },
  sidebarName: { fontSize: 18, fontWeight: '700', marginTop: 12, color: '#1E293B' },
  sidebarRole: { fontSize: 13, color: '#64748B', textTransform: 'uppercase', fontWeight: '600', letterSpacing: 0.5 },
  sidebarDivider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 8, marginHorizontal: 20 },
  sidebarItem: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 14, paddingHorizontal: 20,
  },
  sidebarItemActive: { backgroundColor: Colors.PrimaryRed + '08' },
  sidebarItemText: { fontSize: 15, color: '#475569', fontWeight: '500' },
  sidebarExit: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 20, borderTopWidth: 1, borderTopColor: '#F1F5F9',
  },
  sidebarExitText: { fontSize: 14, color: Colors.Slate500, fontWeight: '500' },

  // Create Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  createSheet: {
    backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
  },
  sheetHandle: {
    width: 40, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2,
    alignSelf: 'center', marginBottom: 20,
  },
  sheetTitle: { fontSize: 22, fontWeight: 'bold', color: '#1E293B' },
  sheetSubtitle: { fontSize: 14, color: '#64748B', marginBottom: 20 },
  createOption: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    padding: 16, borderRadius: 16, backgroundColor: '#F8FAFC',
    borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 10,
  },
  createOptionIcon: { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  createOptionLabel: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  createOptionDesc: { fontSize: 13, color: '#64748B', marginTop: 2 },
});
