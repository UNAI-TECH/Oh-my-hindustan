import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/Theme';

export default function CreatorEarnScreen() {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8 }}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Earn</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Ionicons name="cash-outline" size={48} color={Colors.PrimaryRed} />
        </View>
        <Text style={styles.title}>Monetization</Text>
        <Text style={styles.subtitle}>Coming Soon</Text>
        <Text style={styles.description}>
          We're building a comprehensive monetization program for creators. 
          Stay tuned for ad revenue sharing, sponsorships, and premium content features.
        </Text>

        <View style={styles.featureList}>
          {[
            { icon: 'trending-up', label: 'Ad Revenue Sharing' },
            { icon: 'gift-outline', label: 'Sponsorship Matches' },
            { icon: 'diamond-outline', label: 'Premium Content' },
            { icon: 'wallet-outline', label: 'Direct Payments' },
          ].map(f => (
            <View key={f.label} style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <Ionicons name={f.icon as any} size={20} color={Colors.PrimaryRed} />
              </View>
              <Text style={styles.featureLabel}>{f.label}</Text>
              <View style={styles.comingSoonBadge}>
                <Text style={styles.comingSoonText}>Soon</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC', paddingTop: Platform.OS === 'android' ? 24 : 0 },
  header: { padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white' },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  content: { flex: 1, alignItems: 'center', paddingHorizontal: 24, paddingTop: 48 },
  iconCircle: {
    width: 96, height: 96, borderRadius: 48, backgroundColor: Colors.PrimaryRed + '10',
    justifyContent: 'center', alignItems: 'center', marginBottom: 24,
  },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1E293B' },
  subtitle: { fontSize: 16, color: Colors.PrimaryRed, fontWeight: '700', marginTop: 4 },
  description: { fontSize: 14, color: '#64748B', textAlign: 'center', marginTop: 12, lineHeight: 22 },
  featureList: { width: '100%', marginTop: 40 },
  featureRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'white',
    padding: 16, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#E2E8F0',
  },
  featureIcon: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.PrimaryRed + '10',
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  featureLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: '#334155' },
  comingSoonBadge: { backgroundColor: '#FEF3C7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  comingSoonText: { fontSize: 11, fontWeight: '700', color: '#D97706' },
});
