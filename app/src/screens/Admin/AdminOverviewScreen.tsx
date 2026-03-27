import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';

export default function AdminOverviewScreen() {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={styles.appIcon}>
             <Ionicons name="business" size={20} color="white" />
          </View>
          <Text style={styles.headerTitle}>GOVERNANCE_HUB</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity style={{ padding: 8 }}>
            <Ionicons name="notifications-outline" size={24} color="black" />
          </TouchableOpacity>
          <View style={styles.profileIcon}>
            <Ionicons name="person-circle-outline" size={24} color="black" />
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <Text style={{ fontWeight: 'bold', fontSize: 24 }}>Governance Overview</Text>
        <Text style={{ color: colors.Slate500, fontSize: 14 }}>National level platform statistics</Text>

        <View style={{ marginTop: 24, gap: 12 }}>
          <View style={styles.row}>
            <AdminKpiCard label="Verified Citizens" value="125,432" change="+12.5%" icon="people" bgColor="#E0F2FE" iconColor="#0284C7" />
            <AdminKpiCard label="Active Debates" value="12,240" change="+5.2%" icon="flash" bgColor="#DCFCE7" iconColor="#16A34A" />
          </View>
          <View style={styles.row}>
            <AdminKpiCard label="Platform Fund" value="₹4.52Cr" change="+18.1%" icon="cash" bgColor="#FEF3C7" iconColor="#D97706" />
            <AdminKpiCard label="Fact Check" value="12 New" change="Queue" icon="checkmark-circle" bgColor="#FEE2E2" iconColor="#DC2626" />
          </View>
        </View>

        <View style={styles.contributionsCard}>
          <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 16 }}>Recent Contributions</Text>
          
          <AdminPaymentRow user="amit_s" amount="₹499" status="Verified" statusBg="#DCFCE7" statusColor="#16A34A" />
          <View style={styles.divider} />
          <AdminPaymentRow user="raj_bjp" amount="₹1,200" status="Review" statusBg="#FEF3C7" statusColor="#D97706" />
          <View style={styles.divider} />
          <AdminPaymentRow user="priya_m" amount="₹150" status="Verified" statusBg="#DCFCE7" statusColor="#16A34A" />
        </View>

        <TouchableOpacity 
          style={styles.actionBtn}
          onPress={() => navigation.navigate('AdminMonetization')}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>View Economic Details</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const AdminKpiCard = ({ label, value, change, icon, bgColor, iconColor }: any) => {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  return (
  <View style={styles.kpiCard}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <View style={[styles.kpiIconWrapper, { backgroundColor: bgColor }]}>
        <Ionicons name={icon as any} size={20} color={iconColor} />
      </View>
      <Text style={{ color: '#16A34A', fontWeight: 'bold', fontSize: 12 }}>{change}</Text>
    </View>
    <Text style={{ color: colors.Slate500, fontSize: 14, marginTop: 12 }}>{label}</Text>
    <Text style={{ fontWeight: 'bold', fontSize: 24, marginTop: 4 }}>{value}</Text>
  </View>
)};

const AdminPaymentRow = ({ user, amount, status, statusBg, statusColor }: any) => {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  return (
  <View style={styles.paymentRow}>
    <View style={styles.userIcon}>
      <Ionicons name="person" size={16} color="black" />
    </View>
    <View style={{ flex: 1, marginLeft: 12 }}>
      <Text style={{ fontWeight: 'bold', fontSize: 16 }}>@{user}</Text>
      <Text style={{ color: colors.Slate400, fontSize: 12 }}>Citizen Support</Text>
    </View>
    <View style={{ alignItems: 'flex-end' }}>
      <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{amount}</Text>
      <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
        <Text style={{ color: statusColor, fontSize: 8, fontWeight: 'bold' }}>{status.toUpperCase()}</Text>
      </View>
    </View>
  </View>
)};

const getStyles = (colors: any) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC', paddingTop: Platform.OS === 'android' ? 24 : 0 },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, backgroundColor: 'white', alignItems: 'center' },
  appIcon: { width: 32, height: 32, backgroundColor: colors.PrimaryRed, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  headerTitle: { fontWeight: 'bold', fontSize: 16 },
  profileIcon: { width: 32, height: 32, backgroundColor: '#E2E8F0', borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  row: { flexDirection: 'row', gap: 12 },
  kpiCard: { flex: 1, backgroundColor: 'white', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  kpiIconWrapper: { width: 36, height: 36, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  contributionsCard: { backgroundColor: 'white', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', marginTop: 24 },
  paymentRow: { flexDirection: 'row', alignItems: 'center' },
  userIcon: { width: 32, height: 32, backgroundColor: '#E2E8F0', borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  statusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 4 },
  divider: { height: 1, backgroundColor: '#F8FAFC', marginVertical: 12 },
  actionBtn: { width: '100%', height: 56, backgroundColor: colors.PrimaryRed, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 24 }
});
