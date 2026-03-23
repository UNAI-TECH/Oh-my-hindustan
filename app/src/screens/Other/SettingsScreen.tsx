import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Switch, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/Theme';
import { useAuth } from '../../context/AuthContext';

export default function SettingsScreen() {
  const navigation = useNavigation<any>();
  const { logout } = useAuth();
  
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isDataSaver, setIsDataSaver] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  
  const [showLanguageDialog, setShowLanguageDialog] = useState(false);
  const [showAboutDialog, setShowAboutDialog] = useState(false);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8 }}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        
        <SettingsGroup title="Account">
          <SettingsItem label="Edit Profile" icon="person-outline" onClick={() => navigation.navigate('ProfileSetup')} />
          <SettingsItem label="Notification Settings" icon="notifications-outline" onClick={() => navigation.navigate('Notifications')} />
          <SettingsItem label="Privacy & Security" icon="shield-checkmark-outline" onClick={() => {}} />
        </SettingsGroup>

        <SettingsGroup title="Preferences">
          <SettingsItem 
            label="Appearance" icon="color-palette-outline" 
            trailing={
              <Switch value={isDarkMode} onValueChange={setIsDarkMode} trackColor={{ false: '#767577', true: Colors.PrimaryRedAlpha10 }} thumbColor={isDarkMode ? Colors.PrimaryRed : '#f4f3f4'} />
            } 
            onClick={() => setIsDarkMode(!isDarkMode)}
          />
          <SettingsItem 
            label="Language" icon="globe-outline" 
            trailing={<Text style={{ color: Colors.Slate500 }}>{selectedLanguage}</Text>}
            onClick={() => setShowLanguageDialog(true)}
          />
          <SettingsItem 
            label="Data Saver" icon="bar-chart-outline" 
            trailing={
              <Switch value={isDataSaver} onValueChange={setIsDataSaver} trackColor={{ false: '#767577', true: Colors.PrimaryRedAlpha10 }} thumbColor={isDataSaver ? Colors.PrimaryRed : '#f4f3f4'} />
            } 
            onClick={() => setIsDataSaver(!isDataSaver)}
          />
        </SettingsGroup>

        <SettingsGroup title="Support">
          <SettingsItem label="Help Center" icon="help-circle-outline" onClick={() => {}} />
          <SettingsItem label="About Jan Samvad" icon="information-circle-outline" onClick={() => setShowAboutDialog(true)} />
        </SettingsGroup>

        <TouchableOpacity 
          style={styles.logoutBtn}
          onPress={async () => {
            await logout();
            navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          }}
        >
          <Text style={{ color: Colors.PrimaryRed, fontWeight: 'bold' }}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Language Dialog */}
      {showLanguageDialog && (
        <Modal transparent animationType="fade" visible={showLanguageDialog}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowLanguageDialog(false)}>
            <View style={styles.dialog}>
              <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 16 }}>Select Language</Text>
              {['English', 'Hindi', 'Marathi', 'Bengali'].map(lang => (
                <TouchableOpacity 
                  key={lang} 
                  style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12 }}
                  onPress={() => { setSelectedLanguage(lang); setShowLanguageDialog(false); }}
                >
                  <View style={[styles.radio, selectedLanguage === lang && styles.radioSelected]}>
                    {selectedLanguage === lang && <View style={styles.radioInner} />}
                  </View>
                  <Text style={{ marginLeft: 12 }}>{lang}</Text>
                </TouchableOpacity>
              ))}
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
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  groupTitle: { fontSize: 14, fontWeight: 'bold', color: Colors.Slate500, marginLeft: 4, marginBottom: 8 },
  groupContainer: { backgroundColor: 'white', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden' },
  itemContainer: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  itemLabel: { flex: 1, marginLeft: 16, fontSize: 16 },
  logoutBtn: { width: '100%', padding: 16, backgroundColor: 'white', borderRadius: 12, borderWidth: 1, borderColor: Colors.PrimaryRedAlpha10, alignItems: 'center', marginTop: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  dialog: { backgroundColor: 'white', width: '85%', borderRadius: 16, padding: 24, elevation: 4 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: Colors.Slate400, justifyContent: 'center', alignItems: 'center' },
  radioSelected: { borderColor: Colors.PrimaryRed },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.PrimaryRed }
});
