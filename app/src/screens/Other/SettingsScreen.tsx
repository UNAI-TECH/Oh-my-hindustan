import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Platform, Switch, Modal, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/Theme';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import AppBottomNavBar from '../../components/BottomNavBar';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen() {
  const navigation = useNavigation<any>();
  const { userProfile, logout } = useAuth();
  const { notificationsEnabled, setNotificationsEnabled } = useNotifications();
  
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isDataSaver, setIsDataSaver] = useState(true);
  
  const [showAboutDialog, setShowAboutDialog] = useState(false);
  const [showNotifSettings, setShowNotifSettings] = useState(false);
  const [showHelpDialog, setShowHelpDialog] = useState(false);

  useEffect(() => {
    // Load persisted preferences
    AsyncStorage.getItem('omh_dark_mode').then(v => { if (v) setIsDarkMode(v === 'true') });
    AsyncStorage.getItem('omh_data_saver').then(v => { if (v) setIsDataSaver(v === 'true') });
  }, []);

  const handleDarkModeToggle = (val: boolean) => {
    setIsDarkMode(val);
    AsyncStorage.setItem('omh_dark_mode', String(val));
  };

  const handleDataSaverToggle = (val: boolean) => {
    setIsDataSaver(val);
    AsyncStorage.setItem('omh_data_saver', String(val));
  };

  const displayName = userProfile?.username || userProfile?.email?.split('@')[0] || 'User';
  const avatarUrl = userProfile?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=E53935&color=fff&size=200`;
  const email = userProfile?.email || '';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        
        {/* User Profile Header */}
        <TouchableOpacity style={styles.userHeader} onPress={() => navigation.navigate('PersonalDetails')}>
          <Image source={{ uri: avatarUrl }} style={styles.userAvatar} />
          <View style={{ flex: 1, marginLeft: 16 }}>
             <Text style={styles.userName}>{displayName}</Text>
             <Text style={styles.userEmail}>{email}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.Slate400} />
        </TouchableOpacity>

        <SettingsGroup title="Account">
          <SettingsItem label="Personal Details" icon="person-outline" onClick={() => navigation.navigate('PersonalDetails')} />
          <SettingsItem label="Notification Settings" icon="notifications-outline" onClick={() => setShowNotifSettings(true)} />
          <SettingsItem label="Privacy & Security" icon="shield-checkmark-outline" onClick={() => navigation.navigate('PrivacySecurity')} />
        </SettingsGroup>

        <SettingsGroup title="Preferences">
          <SettingsItem 
            label="Appearance" icon="color-palette-outline" 
            trailing={
              <Switch value={isDarkMode} onValueChange={handleDarkModeToggle} trackColor={{ false: '#767577', true: Colors.PrimaryRedAlpha10 }} thumbColor={isDarkMode ? Colors.PrimaryRed : '#f4f3f4'} />
            } 
            onClick={() => handleDarkModeToggle(!isDarkMode)}
          />
          <SettingsItem 
            label="Data Saver" icon="bar-chart-outline" 
            trailing={
              <Switch value={isDataSaver} onValueChange={handleDataSaverToggle} trackColor={{ false: '#767577', true: Colors.PrimaryRedAlpha10 }} thumbColor={isDataSaver ? Colors.PrimaryRed : '#f4f3f4'} />
            } 
            onClick={() => handleDataSaverToggle(!isDataSaver)}
          />
        </SettingsGroup>

        <SettingsGroup title="Support">
           <SettingsItem label="Help Center" icon="help-circle-outline" onClick={() => setShowHelpDialog(true)} />
           <SettingsItem label="About Jan Samvad" icon="information-circle-outline" onClick={() => setShowAboutDialog(true)} />
        </SettingsGroup>

        {/* Join as Creator CTA */}
        <TouchableOpacity 
          style={styles.creatorCTA} 
          onPress={() => Linking.openURL('https://creators-ohmy.vercel.app/')}
        >
          <View style={styles.creatorIconBox}>
             <Ionicons name="rocket" size={22} color="white" />
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
             <Text style={styles.creatorCTATitle}>Join as a Creator</Text>
             <Text style={styles.creatorCTADesc}>Become a voice for the nation!</Text>
          </View>
          <Ionicons name="open-outline" size={20} color="#0284C7" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.logoutBtn}
          onPress={async () => {
            await logout();
            navigation.reset({ index: 0, routes: [{ name: 'Splash' }] });
          }}
        >
          <Ionicons name="log-out-outline" size={20} color={Colors.PrimaryRed} />
          <Text style={{ color: Colors.PrimaryRed, fontWeight: 'bold', marginLeft: 8 }}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Help Center Dialog */}
      {showHelpDialog && (
        <Modal transparent animationType="fade" visible={showHelpDialog}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowHelpDialog(false)}>
            <View style={styles.dialog}>
              <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 12 }}>Help Center</Text>
              <Text style={{ color: Colors.DarkText, marginBottom: 16, lineHeight: 22 }}>
                Need assistance with Jan Samvad? Reach out to our support team any time!
              </Text>
              
              <TouchableOpacity style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }} onPress={() => Linking.openURL('mailto:support@ohmyhindustan.com')}>
                 <Text style={{ color: Colors.PrimaryRed, fontWeight: 'bold' }}>Email Support</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={{ paddingVertical: 12, marginBottom: 16 }} onPress={() => Linking.openURL('https://ohmyhindustan.com/faq')}>
                 <Text style={{ color: Colors.PrimaryRed, fontWeight: 'bold' }}>Read FAQs</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setShowHelpDialog(false)} style={{ alignSelf: 'flex-end' }}>
                <Text style={{ color: Colors.Slate500, fontWeight: 'bold', padding: 4 }}>Close</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {/* About Dialog */}
      {showAboutDialog && (
        <Modal transparent animationType="fade" visible={showAboutDialog}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowAboutDialog(false)}>
            <View style={styles.dialog}>
              <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 8 }}>About Jan Samvad</Text>
              <Text style={{ color: Colors.Slate500, marginBottom: 8 }}>Version 1.0.0 (Build 20240312)</Text>
              <Text style={{ color: Colors.DarkText, marginBottom: 16 }}>Jan Samvad is a platform for citizen analysis and political discourse. Empowering voices for a better nation.</Text>
              <TouchableOpacity onPress={() => setShowAboutDialog(false)} style={{ alignSelf: 'flex-end' }}>
                <Text style={{ color: Colors.PrimaryRed, fontWeight: 'bold' }}>Close</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {/* Notification Settings Dialog */}
      {showNotifSettings && (
        <Modal transparent animationType="fade" visible={showNotifSettings}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowNotifSettings(false)}>
            <View style={styles.dialog}>
              <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 16 }}>Notification Settings</Text>
              
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, marginTop: 8 }}>
                <View style={{ flex: 1, paddingRight: 16 }}>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: Colors.DarkText }}>Push Notifications</Text>
                  <Text style={{ fontSize: 13, color: Colors.Slate500, marginTop: 4 }}>Receive alerts for new Posts, Blogs, Videos, News</Text>
                </View>
                <Switch 
                  value={notificationsEnabled} 
                  onValueChange={setNotificationsEnabled} 
                  trackColor={{ false: '#767577', true: Colors.PrimaryRedAlpha10 }} 
                  thumbColor={notificationsEnabled ? Colors.PrimaryRed : '#f4f3f4'} 
                />
              </View>

              <TouchableOpacity onPress={() => setShowNotifSettings(false)} style={{ alignSelf: 'flex-end' }}>
                <Text style={{ color: Colors.PrimaryRed, fontWeight: 'bold', padding: 4 }}>Done</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
        <AppBottomNavBar currentRoute="Settings" onNavigate={(route) => navigation.navigate(route)} />
      </View>
    </SafeAreaView>
  );
}

const SettingsGroup = ({ title, children }: any) => (
  <View style={{ marginBottom: 24 }}>
    <Text style={styles.groupTitle}>{title}</Text>
    <View style={styles.groupContainer}>
      {children}
    </View>
  </View>
);

const SettingsItem = ({ label, icon, trailing, onClick }: any) => (
  <TouchableOpacity style={styles.itemContainer} onPress={onClick} activeOpacity={0.7}>
    <Ionicons name={icon} size={24} color={Colors.Slate500} />
    <Text style={styles.itemLabel}>{label}</Text>
    {trailing ? trailing : <Ionicons name="chevron-forward" size={20} color="lightgray" />}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC', paddingTop: Platform.OS === 'android' ? 24 : 0 },
  header: { padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC' },
  headerTitle: { fontSize: 22, fontWeight: 'bold' },
  userHeader: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'white',
    padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 24,
  },
  userAvatar: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: Colors.PrimaryRed },
  userName: { fontWeight: 'bold', fontSize: 18 },
  userEmail: { color: Colors.Slate500, fontSize: 13, marginTop: 2 },
  groupTitle: { fontSize: 14, fontWeight: 'bold', color: Colors.Slate500, marginLeft: 4, marginBottom: 8 },
  groupContainer: { backgroundColor: 'white', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden' },
  itemContainer: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  itemLabel: { flex: 1, marginLeft: 16, fontSize: 16 },
  creatorCTA: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F9FF',
    padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#BAE6FD', marginBottom: 16,
  },
  creatorIconBox: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#0284C7', justifyContent: 'center', alignItems: 'center' },
  creatorCTATitle: { fontWeight: 'bold', fontSize: 16, color: '#0369A1' },
  creatorCTADesc: { color: '#0EA5E9', fontSize: 12, marginTop: 2 },
  logoutBtn: {
    flexDirection: 'row', width: '100%', padding: 16, backgroundColor: 'white',
    borderRadius: 12, borderWidth: 1, borderColor: Colors.PrimaryRedAlpha10,
    alignItems: 'center', justifyContent: 'center',
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  dialog: { backgroundColor: 'white', width: '85%', borderRadius: 16, padding: 24, elevation: 4 },
});
