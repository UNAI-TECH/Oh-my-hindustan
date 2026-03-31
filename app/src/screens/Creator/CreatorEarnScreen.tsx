import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../lib/supabaseClient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function CreatorEarnScreen() {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEarnings: 0,
    availableBalance: 0,
    activeAds: 0,
    engagementScore: 0
  });

  useEffect(() => {
    fetchMonetizationData();
  }, []);

  const fetchMonetizationData = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Mocking some data for the premium experience while backend catch up
      // In real scenario, we'd fetch from an 'earnings' or 'creator_stats' table
      setStats({
        totalEarnings: 12450.50,
        availableBalance: 4200.75,
        activeAds: 3,
        engagementScore: 84
      });
    } catch (error) {
      console.warn('Error fetching monetization data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('monetization.title')}</Text>
        <TouchableOpacity onPress={fetchMonetizationData} style={styles.headerIcon}>
          <Ionicons name="refresh" size={22} color="#1E293B" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Earnings Card */}
        <LinearGradient
          colors={[colors.PrimaryRed, '#93000d']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.earningsCard}
        >
          <View style={styles.earningsHeader}>
            <View>
              <Text style={styles.earningsLabel}>{t('monetization.total_earnings')}</Text>
              <Text style={styles.totalAmount}>₹{stats.totalEarnings.toLocaleString()}</Text>
            </View>
            <View style={styles.earningsIcon}>
              <Ionicons name="wallet" size={32} color="rgba(255,255,255,0.3)" />
            </View>
          </View>
          
          <View style={styles.earningsDivider} />
          
          <View style={styles.balanceRow}>
            <View>
              <Text style={styles.balanceLabel}>{t('monetization.available_balance')}</Text>
              <Text style={styles.balanceAmount}>₹{stats.availableBalance.toLocaleString()}</Text>
            </View>
            <TouchableOpacity style={styles.withdrawBtn}>
              <Text style={styles.withdrawText}>{t('monetization.withdraw')}</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Quick Stats */}
        <View style={styles.quickStatsRow}>
          <View style={styles.smallStatCard}>
            <Text style={styles.smallStatValue}>{stats.activeAds}</Text>
            <Text style={styles.smallStatLabel}>Active Ads</Text>
          </View>
          <View style={styles.smallStatCard}>
            <Text style={styles.smallStatValue}>{stats.engagementScore}%</Text>
            <Text style={styles.smallStatLabel}>Engagement</Text>
          </View>
        </View>

        {/* Feature Sections */}
        <Text style={styles.sectionTitle}>{t('monetization.status')}</Text>
        
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={[styles.statusIndicator, { backgroundColor: '#10B981' }]} />
            <Text style={styles.statusText}>{t('monetization.active')}</Text>
          </View>
          <Text style={styles.statusDesc}>
            Your account is currently eligible for all monetization programs. Keep creating high-quality content to maintain this status.
          </Text>
        </View>

        {/* Programs */}
        <Text style={styles.sectionTitle}>Programs</Text>
        
        <View style={styles.programList}>
          {[
            { id: 'ads', icon: 'trending-up', labelKey: 'monetization.ad_revenue', active: true },
            { id: 'sponsor', icon: 'gift', labelKey: 'monetization.sponsorships', active: false },
            { id: 'premium', icon: 'diamond', labelKey: 'monetization.premium_content', active: false },
          ].map(program => (
            <TouchableOpacity key={program.id} style={styles.programCard} activeOpacity={0.7}>
              <View style={[styles.programIcon, { backgroundColor: program.active ? colors.PrimaryRed + '10' : '#F1F5F9' }]}>
                <Ionicons name={program.icon as any} size={24} color={program.active ? colors.PrimaryRed : '#94A3B8'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.programLabel}>{t(program.labelKey)}</Text>
                <Text style={styles.programStatus}>{program.active ? 'Earning' : 'Apply Soon'}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Help */}
        <TouchableOpacity style={styles.helpCard}>
          <Ionicons name="help-circle" size={22} color={colors.PrimaryRed} />
          <Text style={styles.helpText}>{t('monetization.how_it_works')}</Text>
          <Ionicons name="arrow-forward" size={18} color="#94A3B8" />
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC', paddingTop: Platform.OS === 'android' ? 24 : 0 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
  headerIcon: { padding: 4 },

  scrollContent: { padding: 20, paddingBottom: 40 },

  earningsCard: {
    borderRadius: 24, padding: 24, marginBottom: 20,
    elevation: 8, shadowColor: colors.PrimaryRed, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10,
  },
  earningsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  earningsLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '600' },
  totalAmount: { color: 'white', fontSize: 32, fontWeight: '800', marginTop: 4 },
  earningsIcon: { opacity: 0.8 },
  earningsDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 20 },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  balanceLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600' },
  balanceAmount: { color: 'white', fontSize: 20, fontWeight: '700', marginTop: 2 },
  withdrawBtn: { backgroundColor: 'white', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  withdrawText: { color: colors.PrimaryRed, fontWeight: '800', fontSize: 13 },

  quickStatsRow: { flexDirection: 'row', gap: 12, marginBottom: 28 },
  smallStatCard: {
    flex: 1, backgroundColor: 'white', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#F1F5F9', alignItems: 'center',
  },
  smallStatValue: { fontSize: 20, fontWeight: '800', color: '#1E293B' },
  smallStatLabel: { fontSize: 11, color: '#64748B', marginTop: 4, fontWeight: '600' },

  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1E293B', marginBottom: 12, marginLeft: 4 },

  statusCard: { backgroundColor: 'white', padding: 20, borderRadius: 20, marginBottom: 28, borderWidth: 1, borderColor: '#F1F5F9' },
  statusHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  statusIndicator: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  statusText: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  statusDesc: { fontSize: 13, color: '#64748B', lineHeight: 20 },

  programList: { marginBottom: 28 },
  programCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'white',
    padding: 16, borderRadius: 18, marginBottom: 12, borderWidth: 1, borderColor: '#F1F5F9',
  },
  programIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  programLabel: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  programStatus: { fontSize: 12, color: '#64748B', marginTop: 2 },

  helpCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'white',
    padding: 16, borderRadius: 18, borderWidth: 1, borderColor: '#F1F5F9', gap: 12,
  },
  helpText: { flex: 1, fontSize: 14, fontWeight: '700', color: '#1E293B' },
});
