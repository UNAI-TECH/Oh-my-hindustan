import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/Theme';
import StudioBottomNavBar from '../../components/StudioBottomNavBar';

export default function CreatorAnalyticsScreen() {
  const navigation = useNavigation<any>();
  const days = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8 }}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Briefing Insights</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          {['7d', '30d', '90d', 'Custom'].map((label, i) => (
             <View key={label} style={[styles.dateChip, i === 0 && styles.dateChipActive]}>
                <Text style={[styles.dateText, i === 0 && styles.dateTextActive]}>{label}</Text>
             </View>
          ))}
        </ScrollView>

        <View style={{ gap: 12 }}>
          <View style={styles.row}>
            <SmallStatCard label="Briefing Reach" value="1.2M" change="+12%" />
            <SmallStatCard label="Engagement" value="45.2K" change="+8%" />
          </View>
          <View style={styles.row}>
            <SmallStatCard label="New Followers" value="2,480" change="-2%" isNegative />
            <SmallStatCard label="Influence" value="12.4K" change="+15%" />
          </View>
        </View>

        <View style={styles.chartCard}>
          <Text style={{ fontWeight: 'bold', fontSize: 16 }}>Reach over time</Text>
          <View style={styles.chartArea}>
            {/* Using a simple placeholder for the Canvas line chart since RN requires SVGs or complicated Canvas setup not present here */}
            <View style={{ flex: 1, borderBottomWidth: 2, borderBottomColor: Colors.PrimaryRed, opacity: 0.5, borderRadius: 50, transform: [{ scaleY: -1 }] }} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
             {days.map(d => <Text key={d} style={{ color: Colors.Slate400, fontSize: 10 }}>{d}</Text>)}
          </View>
        </View>

        <View style={styles.chartCard}>
          <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 24 }}>Traffic Sources</Text>
          
          <TrafficSourceBar label="Direct" percent="42%" progress={0.42} />
          <TrafficSourceBar label="Organic Search" percent="28%" progress={0.28} />
          <TrafficSourceBar label="Social Media" percent="20%" progress={0.20} />
          <TrafficSourceBar label="Referral" percent="10%" progress={0.10} />
        </View>
      </ScrollView>

      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
        <StudioBottomNavBar 
          currentRoute="Analytics" 
          onNavigate={(route) => navigation.navigate(route)} 
          onExit={() => navigation.navigate('Home')} 
        />
      </View>
    </SafeAreaView>
  );
}

const SmallStatCard = ({ label, value, change, isNegative }: any) => (
  <View style={styles.statCard}>
    <Text style={{ fontSize: 12, color: Colors.Slate500, letterSpacing: 0.5, marginBottom: 4 }}>{label.toUpperCase()}</Text>
    <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>{value}</Text>
      <Text style={{ fontSize: 12, fontWeight: 'bold', color: isNegative ? 'red' : '#16A34A', marginLeft: 4, marginBottom: 4 }}>{change}</Text>
    </View>
  </View>
);

const TrafficSourceBar = ({ label, percent, progress }: any) => (
  <View style={{ marginBottom: 16 }}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
      <Text style={{ fontSize: 14 }}>{label}</Text>
      <Text style={{ fontSize: 14, color: Colors.Slate500 }}>{percent}</Text>
    </View>
    <View style={{ width: '100%', height: 8, backgroundColor: Colors.PrimaryRedAlpha10, borderRadius: 4, overflow: 'hidden' }}>
      <View style={{ width: `${progress * 100}%`, height: '100%', backgroundColor: Colors.PrimaryRed }} />
    </View>
  </View>
)

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC', paddingTop: Platform.OS === 'android' ? 24 : 0 },
  header: { padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white' },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  dateChip: { backgroundColor: Colors.PrimaryRedAlpha10, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 8, marginRight: 8 },
  dateChipActive: { backgroundColor: Colors.PrimaryRed },
  dateText: { color: Colors.PrimaryRed, fontWeight: 'bold', fontSize: 14 },
  dateTextActive: { color: 'white' },
  row: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, backgroundColor: 'white', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  chartCard: { backgroundColor: 'white', borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9', padding: 20, marginTop: 24 },
  chartArea: { width: '100%', height: 160, marginTop: 24 }
});
