import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import PostsAppLogo from '../PostsAppLogo';

interface WebStudioShellProps {
  children: React.ReactNode;
  activeRoute: string;
  title: string;
  headerRight?: React.ReactNode;
  mode?: 'creator' | 'admin';
  maxWidth?: number;
}

const CREATOR_NAV = [
  { label: 'Overview', icon: 'grid-outline', route: 'CreatorDashboard' },
  { label: 'Analytics', icon: 'trending-up-outline', route: 'CreatorAnalytics' },
  { label: 'Content', icon: 'document-text-outline', route: 'CreatorContent' },
  { label: 'Comments', icon: 'chatbubble-outline', route: 'CreatorComments' },
  { label: 'Subtitles', icon: 'language-outline', route: 'CreatorSubtitles' },
  { label: 'Earn', icon: 'cash-outline', route: 'CreatorEarn' },
  { label: 'Settings', icon: 'settings-outline', route: 'CreatorSettings' },
  { label: 'Feedback', icon: 'paper-plane-outline', route: 'CreatorFeedback' },
];

const ADMIN_NAV = [
  { label: 'Governance Overview', icon: 'business-outline', route: 'AdminOverview' },
  { label: 'Platform Economics', icon: 'cash-outline', route: 'AdminMonetization' },
];

export default function WebStudioShell({
  children,
  activeRoute,
  title,
  headerRight,
  mode = 'creator',
  maxWidth = 1120,
}: WebStudioShellProps) {
  const navigation = useNavigation<any>();
  const { userProfile, logout } = useAuth();

  const displayName = userProfile?.username || userProfile?.email?.split('@')[0] || 'Creator';
  const avatarUrl =
    userProfile?.avatarUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=D4191F&color=fff&size=200`;

  const navItems = mode === 'admin' ? ADMIN_NAV : CREATOR_NAV;

  return (
    <View style={styles.root}>
      {/* Left Dark Sidebar */}
      <View style={styles.sidebar}>
        <View style={styles.brandHeader}>
          <PostsAppLogo variant="dark" size="sm" />
          <View style={styles.modeBadge}>
            <Text style={styles.modeBadgeText}>{mode === 'admin' ? 'ADMIN' : 'STUDIO'}</Text>
          </View>
        </View>

        <View style={styles.userCard}>
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          <View style={{ flex: 1 }}>
            <Text style={styles.userName} numberOfLines={1}>{displayName}</Text>
            <Text style={styles.userRole}>{userProfile?.role || (mode === 'admin' ? 'ADMIN' : 'CREATOR')}</Text>
          </View>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: 8 }}>
          {navItems.map((item) => {
            const isActive = activeRoute === item.route;
            return (
              <TouchableOpacity
                key={item.route}
                style={[styles.navItem, isActive && styles.navItemActive]}
                onPress={() => {
                  if (!isActive) navigation.navigate(item.route);
                }}
              >
                <Ionicons
                  name={item.icon as any}
                  size={18}
                  color={isActive ? '#FFFFFF' : '#A3A3A3'}
                />
                <Text style={[styles.navItemText, isActive && styles.navItemTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.sidebarFooter}>
          <TouchableOpacity style={styles.footerBtn} onPress={() => navigation.navigate('Home')}>
            <Ionicons name="newspaper-outline" size={17} color="#D4D4D4" />
            <Text style={styles.footerBtnText}>Back to PostsApp</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.footerBtn}
            onPress={async () => {
              await logout();
              navigation.reset({ index: 0, routes: [{ name: 'Splash' }] });
            }}
          >
            <Ionicons name="log-out-outline" size={17} color="#F87171" />
            <Text style={[styles.footerBtnText, { color: '#F87171' }]}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content Workspace */}
      <View style={styles.main}>
        <View style={styles.topBar}>
          <View style={styles.topBarInner}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={styles.titleDash} />
              <Text style={styles.topBarTitle}>{title}</Text>
            </View>
            {headerRight ? <View style={styles.topBarRight}>{headerRight}</View> : null}
          </View>
        </View>

        <ScrollView style={styles.contentScroll} contentContainerStyle={styles.contentWrap}>
          <View style={{ maxWidth, width: '100%', alignSelf: 'center' }}>{children}</View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F5F5F7',
  },
  sidebar: {
    width: 248,
    backgroundColor: '#141414',
    borderRightWidth: 1,
    borderRightColor: '#262626',
    padding: 16,
  },
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#262626',
  },
  modeBadge: {
    backgroundColor: '#D4191F',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 3,
  },
  modeBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#262626',
    marginBottom: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#D4191F',
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  userRole: {
    color: '#9CA3AF',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginBottom: 4,
  },
  navItemActive: {
    backgroundColor: '#D4191F',
  },
  navItemText: {
    color: '#D4D4D4',
    fontSize: 13,
    fontWeight: '600',
  },
  navItemTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  sidebarFooter: {
    borderTopWidth: 1,
    borderTopColor: '#262626',
    paddingTop: 12,
    gap: 4,
  },
  footerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  footerBtnText: {
    color: '#D4D4D4',
    fontSize: 13,
    fontWeight: '600',
  },
  main: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  topBar: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  topBarInner: {
    maxWidth: 1120,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleDash: {
    width: 14,
    height: 3,
    backgroundColor: '#D4191F',
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  contentScroll: {
    flex: 1,
  },
  contentWrap: {
    padding: 28,
    paddingBottom: 56,
  },
});
