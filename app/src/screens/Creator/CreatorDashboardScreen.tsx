import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/Theme';
import StudioBottomNavBar from '../../components/StudioBottomNavBar';

export default function CreatorDashboardScreen() {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Analyst Studio</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity style={{ padding: 8 }}>
            <Ionicons name="create-outline" size={24} color="black" />
          </TouchableOpacity>
          <Image 
            source={{ uri: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=256&h=256&auto=format&fit=crop" }} 
            style={styles.avatar} 
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontWeight: 'bold', fontSize: 24, textAlign: 'center' }}>Welcome back, Kamal</Text>
          <Text style={{ color: Colors.Slate500, fontSize: 14, textAlign: 'center', marginTop: 4 }}>Analyst performance for the last 28 days</Text>
        </View>

        <View style={styles.mainCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ color: Colors.Slate500, fontSize: 14 }}>Total Briefing Reach</Text>
              <Text style={{ fontWeight: '900', fontSize: 28 }}>1,245,602</Text>
            </View>
            <View style={styles.trendPill}>
              <Text style={styles.trendText}>
                <Ionicons name="arrow-up" size={12} color="#16A34A" /> 12.5%
              </Text>
            </View>
          </View>
          
          <View style={styles.chartPlaceholder}>
            <Text style={{ color: Colors.PrimaryRedAlpha10, fontWeight: 'bold' }}>Analytics Visualization</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.miniCard}>
            <Text style={{ color: Colors.Slate500, fontSize: 12 }}>Followers</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              <Text style={{ fontWeight: 'bold', fontSize: 20 }}>12.4k</Text>
              <Text style={{ color: '#16A34A', fontSize: 12, marginLeft: 4 }}>+240</Text>
            </View>
          </View>
          <View style={styles.miniCard}>
            <Text style={{ color: Colors.Slate500, fontSize: 12 }}>Engagement</Text>
             <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              <Text style={{ fontWeight: 'bold', fontSize: 20 }}>4.2k hr</Text>
              <Text style={{ color: '#16A34A', fontSize: 12, marginLeft: 4 }}>+12%</Text>
            </View>
          </View>
        </View>

        <Text style={{ fontWeight: 'bold', fontSize: 18, marginTop: 32, marginBottom: 16 }}>Quick Actions</Text>
        
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionSquare} onPress={() => navigation.navigate('ContentEditor')}>
            <View style={[styles.iconBox, { backgroundColor: Colors.WarmOrange + '1A' }]}>
              <Ionicons name="megaphone-outline" size={24} color={Colors.WarmOrange} />
            </View>
            <Text style={styles.actionText}>New Briefing</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionSquare} onPress={() => navigation.navigate('ContentEditor')}>
            <View style={[styles.iconBox, { backgroundColor: Colors.PrimaryRed + '1A' }]}>
               <Ionicons name="document-text-outline" size={24} color={Colors.PrimaryRed} />
            </View>
            <Text style={styles.actionText}>Policy Analysis</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
        <StudioBottomNavBar 
          currentRoute="CreatorDashboard" 
          onNavigate={(route) => navigation.navigate(route)} 
          onExit={() => navigation.navigate('Home')} 
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC', paddingTop: Platform.OS === 'android' ? 24 : 0 },
  header: { padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white' },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  avatar: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: '#ccc', marginLeft: 8 },
  mainCard: { backgroundColor: 'white', borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0', padding: 20, marginTop: 24 },
  trendPill: { backgroundColor: '#16A34A1A', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  trendText: { color: '#16A34A', fontWeight: 'bold', fontSize: 14 },
  chartPlaceholder: { width: '100%', height: 120, backgroundColor: Colors.PrimaryRedAlpha5, borderRadius: 12, marginTop: 20, justifyContent: 'center', alignItems: 'center' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24, gap: 16 },
  miniCard: { flex: 1, backgroundColor: 'white', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  actionsRow: { flexDirection: 'row', gap: 12 },
  actionSquare: { flex: 1, backgroundColor: 'white', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', padding: 12, alignItems: 'center', justifyContent: 'center' },
  iconBox: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  actionText: { fontWeight: 'bold', fontSize: 12, textAlign: 'center' }
});
