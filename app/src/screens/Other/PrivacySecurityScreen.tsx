import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/Theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function PrivacySecurityScreen() {
  const navigation = useNavigation<any>();

  const [personalizedAds, setPersonalizedAds] = useState(true);
  const [analyticsCookies, setAnalyticsCookies] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('omh_personalized_ads').then(v => { if (v) setPersonalizedAds(v === 'true') });
    AsyncStorage.getItem('omh_analytics_cookies').then(v => { if (v) setAnalyticsCookies(v === 'true') });
  }, []);

  const handlePersonalizedAdsToggle = (val: boolean) => {
    setPersonalizedAds(val);
    AsyncStorage.setItem('omh_personalized_ads', String(val));
    if (!val) {
      Alert.alert('Ads Opted Out', 'You will now see generic ads instead of personalized ones.');
    }
  };

  const handleAnalyticsCookiesToggle = (val: boolean) => {
    setAnalyticsCookies(val);
    AsyncStorage.setItem('omh_analytics_cookies', String(val));
  };

  const handleClearSearchHistory = () => {
    Alert.alert(
      'Clear Search History',
      'Are you sure you want to clear all your recent search history? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: () => {
           AsyncStorage.removeItem('recent_searches');
           Alert.alert('Cleared', 'Your search history has been cleared safely.');
        } }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8 }}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy & Security</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Data Safety & Usage</Text>
          <Text style={styles.sectionDesc}>Manage how your data is used to improve Jan Samvad.</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={{ flex: 1, paddingRight: 16 }}>
              <Text style={styles.settingLabel}>Personalized Ads</Text>
              <Text style={styles.settingSubLabel}>Allow tailored ads based on your reading history.</Text>
            </View>
            <Switch 
              value={personalizedAds} 
              onValueChange={handlePersonalizedAdsToggle} 
              trackColor={{ false: '#767577', true: Colors.PrimaryRedAlpha10 }} 
              thumbColor={personalizedAds ? Colors.PrimaryRed : '#f4f3f4'} 
            />
          </View>
          
          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={{ flex: 1, paddingRight: 16 }}>
              <Text style={styles.settingLabel}>Analytics Cookies</Text>
              <Text style={styles.settingSubLabel}>Help us improve the app by sharing anonymous usage data.</Text>
            </View>
            <Switch 
              value={analyticsCookies} 
              onValueChange={handleAnalyticsCookiesToggle} 
              trackColor={{ false: '#767577', true: Colors.PrimaryRedAlpha10 }} 
              thumbColor={analyticsCookies ? Colors.PrimaryRed : '#f4f3f4'} 
            />
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Information Management</Text>
          <Text style={styles.sectionDesc}>Control your locally stored data.</Text>
        </View>

        <View style={styles.card}>
          <TouchableOpacity style={styles.actionRow} onPress={handleClearSearchHistory}>
            <Ionicons name="trash-outline" size={22} color={Colors.PrimaryRed} />
            <Text style={styles.actionText}>Clear Search History</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC', paddingTop: Platform.OS === 'android' ? 24 : 0 },
  header: { padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC' },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  sectionHeader: { marginTop: 24, marginBottom: 12, paddingHorizontal: 4 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.DarkText },
  sectionDesc: { fontSize: 13, color: Colors.Slate500, marginTop: 4 },
  card: { backgroundColor: 'white', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden' },
  settingRow: { flexDirection: 'row', alignItems: 'center', padding: 16, justifyContent: 'space-between' },
  settingLabel: { fontSize: 16, fontWeight: '600', color: Colors.DarkText },
  settingSubLabel: { fontSize: 13, color: Colors.Slate500, marginTop: 4 },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginLeft: 16 },
  actionRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  actionText: { fontSize: 16, fontWeight: '600', color: Colors.PrimaryRed, marginLeft: 12 }
});
