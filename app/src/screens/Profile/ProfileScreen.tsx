import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Platform, Dimensions, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/Theme';
import AppBottomNavBar from '../../components/BottomNavBar';
export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const [selectedTab, setSelectedTab] = useState('My Briefings');
  const tabs = ['My Briefings', 'Upvoted', 'History', 'Following'];
  
  // Real app we'd load session, for UI matching we mock.
  const loggedInName = "Kamal Singh"; 
  
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
        <View style={{ width: '100%', paddingBottom: 80 }}>
          <LinearGradient
            colors={[Colors.DeepCrimson, Colors.WarmOrange]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={{ width: '100%', height: 160 }}
          />
          <View style={styles.avatarContainer}>
            <Image 
              source={{ uri: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop" }} 
              style={styles.avatar} 
            />
          </View>
        </View>

        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontWeight: 'bold', fontSize: 24 }}>{loggedInName}</Text>
          <Text style={{ color: Colors.Slate500, fontSize: 14, marginTop: 4 }}>12,450 Influence Points</Text>
        </View>

        <View style={styles.statsRow}>
          <ProfileStatCard value="142" label="Briefings" />
          <ProfileStatCard value="892" label="Saved" />
          <ProfileStatCard value="560" label="Following" />
          <ProfileStatCard value="2.1k" label="Followers" />
        </View>

        <TouchableOpacity 
          style={styles.creatorAction} 
          onPress={() => navigation.navigate('CreatorDashboard')}
        >
          <View style={styles.creatorIconBox}>
            <Ionicons name="megaphone" size={20} color="white" />
          </View>
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 16 }}>Analyst Dashboard</Text>
            <Text style={{ color: Colors.Slate500, fontSize: 12, marginTop: 2 }}>Manage your briefings and policy analysis</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.PrimaryRed} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.creatorAction, { backgroundColor: '#F0F9FF', borderColor: '#BAE6FD', marginTop: 0 }]} 
        onPress={() => Linking.openURL('https://creators-ohmy.vercel.app/')}
        >
          <View style={[styles.creatorIconBox, { backgroundColor: '#0284C7' }]}>
            <Ionicons name="rocket" size={20} color="white" />
          </View>
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#0369A1' }}>Join as Creator</Text>
            <Text style={{ color: '#0EA5E9', fontSize: 12, marginTop: 2 }}>Become a voice for the nation. Start today!</Text>
          </View>
          <Ionicons name="open-outline" size={20} color="#0284C7" />
        </TouchableOpacity>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ borderBottomWidth: 1, borderColor: '#E2E8F0', paddingBottom: 12 }}>
          {tabs.map(tab => (
            <TouchableOpacity 
              key={tab} 
              onPress={() => setSelectedTab(tab)}
              style={{ paddingHorizontal: 16, borderBottomWidth: selectedTab === tab ? 2 : 0, borderColor: Colors.PrimaryRed, paddingBottom: 8 }}
            >
              <Text style={{ color: selectedTab === tab ? Colors.PrimaryRed : Colors.Slate500, fontWeight: selectedTab === tab ? 'bold' : 'normal' }}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={{ padding: 16, gap: 12 }}>
          <ProfilePostCard 
            title="Public Policy: The way forward for Rural Health in India"
            likes="1.2k" comments="45" date="2d ago"
            img="https://images.unsplash.com/photo-1533727101791-0309197c11f7?q=80&w=200&auto=format&fit=crop"
          />
          <ProfilePostCard 
            title="BJP Economic Council: Key Takeaways for 2024-25 Budget"
            likes="856" comments="12" date="5d ago"
            img="https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=200&auto=format&fit=crop"
          />
        </View>
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

const ProfilePostCard = ({ title, likes, comments, date, img }: any) => (
  <View style={styles.postCard}>
    <Image source={{ uri: img }} style={{ width: 80, height: 80, borderRadius: 8 }} />
    <View style={{ flex: 1, marginLeft: 12, justifyContent: 'space-between' }}>
      <Text style={{ fontWeight: 'bold', fontSize: 14 }} numberOfLines={2}>{title}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Ionicons name="heart" size={12} color={Colors.Slate400} />
        <Text style={[styles.metaText, { marginLeft: 4 }]}>{likes}</Text>
        
        <Ionicons name="chatbubble-outline" size={12} color={Colors.Slate400} style={{ marginLeft: 12 }} />
        <Text style={[styles.metaText, { marginLeft: 4 }]}>{comments}</Text>
        
        <View style={{ flex: 1 }} />
        <Text style={styles.metaText}>{date}</Text>
      </View>
    </View>
  </View>
);

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: 'white', paddingTop: Platform.OS === 'android' ? 24 : 0 },
  header: { padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', zIndex: 10 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  avatarContainer: { position: 'absolute', bottom: 16, width: '100%', alignItems: 'center' },
  avatar: { width: 128, height: 128, borderRadius: 64, borderWidth: 4, borderColor: 'white' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, marginTop: 24 },
  statCard: { flex: 1, backgroundColor: '#F8FAFC', padding: 12, borderRadius: 12, alignItems: 'center', marginHorizontal: 4, borderWidth: 1, borderColor: '#E2E8F0' },
  creatorAction: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.PrimaryRedAlpha5, marginHorizontal: 16, marginVertical: 24, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: Colors.PrimaryRedAlpha10 },
  creatorIconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.PrimaryRed, justifyContent: 'center', alignItems: 'center' },
  postCard: { flexDirection: 'row', padding: 12, backgroundColor: 'white', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  metaText: { fontSize: 12, color: Colors.Slate400 }
});
