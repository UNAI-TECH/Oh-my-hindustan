import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Platform, Linking, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/Theme';
import AppBottomNavBar from '../../components/BottomNavBar';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { userProfile, logout, isAuthenticated } = useAuth();
  const [selectedTab, setSelectedTab] = useState('Posts');
  const [stats, setStats] = useState({ posts: 0, saved: 0, following: 0, followers: 0 });
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const tabs = ['Posts', 'Saved', 'Following'];

  // Fetch real stats from the database
  useEffect(() => {
    const fetchStats = async () => {
      if (!userProfile?.id) return;
      try {
        const [postsRes, savedRes, followingRes, followersRes] = await Promise.all([
          supabase.from('Post').select('id', { count: 'exact', head: true }).eq('authorId', userProfile.id),
          supabase.from('Save').select('id', { count: 'exact', head: true }).eq('userId', userProfile.id),
          supabase.from('Follow').select('id', { count: 'exact', head: true }).eq('followerId', userProfile.id),
          supabase.from('Follow').select('id', { count: 'exact', head: true }).eq('followingId', userProfile.id),
        ]);
        setStats({
          posts: postsRes.count || 0,
          saved: savedRes.count || 0,
          following: followingRes.count || 0,
          followers: followersRes.count || 0,
        });
      } catch (e) {
        console.warn('Failed to fetch profile stats:', e);
      } finally {
        setIsLoadingStats(false);
      }
    };
    fetchStats();
  }, [userProfile?.id]);

  const handleLogout = async () => {
    await logout();
    navigation.reset({ index: 0, routes: [{ name: 'Splash' }] });
  };

  const displayName = userProfile?.username || userProfile?.email?.split('@')[0] || 'User';
  const avatarUrl = userProfile?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=E53935&color=fff&size=200`;
  const email = userProfile?.email || '';
  const phone = userProfile?.phone || '';
  const bio = userProfile?.bio || 'Citizen of Oh My Hindustan';
  const role = userProfile?.role || 'CITIZEN';
  const language = userProfile?.preferred_language || 'English';
  const topics = userProfile?.selected_topics || [];

  const formatStat = (n: number) => {
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
    return n.toString();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8 }}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={{ padding: 8 }}>
          <Ionicons name="settings-outline" size={24} color="black" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} bounces={false}>
        {/* Cover + Avatar */}
        <View style={{ width: '100%', paddingBottom: 80 }}>
          <LinearGradient
            colors={[Colors.DeepCrimson, Colors.WarmOrange]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={{ width: '100%', height: 160 }}
          />
          <View style={styles.avatarContainer}>
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          </View>
        </View>

        {/* Name & Bio */}
        <View style={{ alignItems: 'center', paddingHorizontal: 16 }}>
          <Text style={{ fontWeight: 'bold', fontSize: 24 }}>@{displayName}</Text>
          <Text style={{ color: Colors.Slate500, fontSize: 14, marginTop: 4 }}>{email}</Text>
          {phone ? <Text style={{ color: Colors.Slate500, fontSize: 14, marginTop: 2 }}>{phone}</Text> : null}
          <Text style={{ color: Colors.Slate500, fontSize: 13, marginTop: 6, textAlign: 'center' }}>{bio}</Text>
          <View style={styles.roleBadge}>
            <Ionicons name={role === 'CITIZEN' ? 'person' : 'megaphone'} size={12} color={Colors.PrimaryRed} />
            <Text style={styles.roleText}>{role}</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <ProfileStatCard value={isLoadingStats ? '...' : formatStat(stats.posts)} label="Posts" />
          <ProfileStatCard value={isLoadingStats ? '...' : formatStat(stats.saved)} label="Saved" />
          <ProfileStatCard value={isLoadingStats ? '...' : formatStat(stats.following)} label="Following" />
          <ProfileStatCard value={isLoadingStats ? '...' : formatStat(stats.followers)} label="Followers" />
        </View>

        {/* User Preferences */}
        <View style={styles.preferencesContainer}>
          <Text style={styles.sectionTitle}>My Preferences</Text>
          <View style={styles.preferenceRow}>
            <Ionicons name="language" size={20} color={Colors.Slate500} />
            <Text style={styles.preferenceText}>Language: <Text style={{fontWeight: '600', color: Colors.PrimaryRed}}>{language}</Text></Text>
          </View>
          {topics.length > 0 && (
            <View style={{marginTop: 12}}>
              <Text style={styles.preferenceText}>Interested Topics:</Text>
              <View style={styles.topicsWrapper}>
                {topics.map((topic: string) => (
                  <View key={topic} style={styles.topicBadge}>
                    <Text style={styles.topicText}>{topic}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Creator Action */}
        <TouchableOpacity 
          style={[styles.creatorAction, { backgroundColor: '#F0F9FF', borderColor: '#BAE6FD' }]} 
          onPress={() => Linking.openURL('https://creators-ohmy.vercel.app/')}
        >
          <View style={[styles.creatorIconBox, { backgroundColor: '#0284C7' }]}>
            <Ionicons name="rocket" size={20} color="white" />
          </View>
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#0369A1' }}>Join as Creator</Text>
            <Text style={{ color: '#0EA5E9', fontSize: 12, marginTop: 2 }}>Become a voice for the nation!</Text>
          </View>
          <Ionicons name="open-outline" size={20} color="#0284C7" />
        </TouchableOpacity>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#DC2626" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
        <AppBottomNavBar currentRoute="Profile" onNavigate={(route) => navigation.navigate(route)} />
      </View>
    </SafeAreaView>
  );
}

const ProfileStatCard = ({ value, label }: any) => (
  <View style={styles.statCard}>
    <Text style={{ fontSize: 20, fontWeight: 'bold' }}>{value}</Text>
    <Text style={{ fontSize: 10, color: Colors.Slate400, marginTop: 4 }}>{label.toUpperCase()}</Text>
  </View>
);

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: 'white', paddingTop: Platform.OS === 'android' ? 24 : 0 },
  header: { padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', zIndex: 10 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  avatarContainer: { position: 'absolute', bottom: 16, width: '100%', alignItems: 'center' },
  avatar: { width: 128, height: 128, borderRadius: 64, borderWidth: 4, borderColor: 'white' },
  roleBadge: { 
    flexDirection: 'row', alignItems: 'center', marginTop: 10, 
    backgroundColor: 'rgba(229, 57, 53, 0.08)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    gap: 6,
  },
  roleText: { fontSize: 12, fontWeight: '700', color: Colors.PrimaryRed, textTransform: 'uppercase', letterSpacing: 1 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, marginTop: 24 },
  statCard: { flex: 1, backgroundColor: '#F8FAFC', padding: 12, borderRadius: 12, alignItems: 'center', marginHorizontal: 4, borderWidth: 1, borderColor: '#E2E8F0' },
  creatorAction: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginVertical: 16, padding: 16, borderRadius: 16, borderWidth: 1 },
  creatorIconBox: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  logoutButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginHorizontal: 16, marginTop: 8, marginBottom: 16, padding: 16,
    borderRadius: 16, borderWidth: 1.5, borderColor: '#FCA5A5', backgroundColor: '#FEF2F2',
    gap: 10,
  },
  logoutText: { fontSize: 16, fontWeight: '700', color: '#DC2626' },
  preferencesContainer: {
    paddingHorizontal: 16,
    marginTop: 24,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  preferenceText: {
    fontSize: 15,
    color: Colors.Slate600,
  },
  topicsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  topicBadge: {
    backgroundColor: 'rgba(229, 57, 53, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  topicText: {
    color: Colors.PrimaryRed,
    fontSize: 13,
    fontWeight: '600',
  },
});
