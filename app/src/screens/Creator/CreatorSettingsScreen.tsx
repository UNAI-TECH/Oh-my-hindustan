import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform, Switch, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import CustomModal from '../../components/CustomModal';

export default function CreatorSettingsScreen() {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const navigation = useNavigation<any>();
  const { userProfile, updateProfile } = useAuth();
  const { t, i18n } = useTranslation();

  const [displayName, setDisplayName] = useState(userProfile?.username || '');
  const [bio, setBio] = useState(userProfile?.bio || '');
  const [notifComments, setNotifComments] = useState(true);
  const [notifFollowers, setNotifFollowers] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [modalConfig, setModalConfig] = useState({ visible: false, title: '', message: '', isError: false });

  const currentLanguage = i18n.language;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProfile(displayName, bio);
      setModalConfig({ 
        visible: true, 
        title: t('common.success'), 
        message: 'Your settings have been updated.', 
        isError: false 
      });
    } catch (e: any) {
      setModalConfig({ 
        visible: true, 
        title: t('common.error'), 
        message: e.message || 'Failed to save.', 
        isError: true 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8 }}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('creator_studio.settings')}</Text>
        <TouchableOpacity onPress={handleSave} disabled={isSaving} style={{ padding: 8 }}>
          {isSaving ? (
            <ActivityIndicator size="small" color={colors.PrimaryRed} />
          ) : (
            <Text style={{ color: colors.PrimaryRed, fontWeight: '800', fontSize: 16 }}>{t('common.save')}</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {/* Profile Section */}
        <Text style={styles.sectionTitle}>Profile</Text>
        <View style={styles.card}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Display Name</Text>
            <TextInput 
              style={styles.input} 
              value={displayName} 
              onChangeText={setDisplayName} 
              placeholder="Your name"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, { minHeight: 100, textAlignVertical: 'top' }]}
              value={bio} 
              onChangeText={setBio} 
              placeholder="Tell viewers about yourself"
              placeholderTextColor="#94A3B8"
              multiline
            />
          </View>
        </View>

        {/* Language Selection */}
        <Text style={[styles.sectionTitle, { marginTop: 32 }]}>Language / भाषा</Text>
        <View style={styles.languageRow}>
          <TouchableOpacity 
            style={[styles.languageBtn, currentLanguage === 'en' && styles.languageBtnActive]} 
            onPress={() => changeLanguage('en')}
          >
            <Text style={[styles.languageBtnText, currentLanguage === 'en' && styles.languageBtnTextActive]}>English</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.languageBtn, currentLanguage === 'hi' && styles.languageBtnActive]} 
            onPress={() => changeLanguage('hi')}
          >
            <Text style={[styles.languageBtnText, currentLanguage === 'hi' && styles.languageBtnTextActive]}>हिंदी (Hindi)</Text>
          </TouchableOpacity>
        </View>

        {/* Notifications Section */}
        <Text style={[styles.sectionTitle, { marginTop: 32 }]}>Notifications</Text>
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Comments</Text>
              <Text style={styles.settingDesc}>Notify when someone comments</Text>
            </View>
            <Switch
              value={notifComments} 
              onValueChange={setNotifComments}
              trackColor={{ true: colors.PrimaryRed, false: '#E2E8F0' }}
              thumbColor="white"
            />
          </View>

          <View style={[styles.settingRow, { borderBottomWidth: 0, marginBottom: 0 }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Followers</Text>
              <Text style={styles.settingDesc}>Notify on new followers</Text>
            </View>
            <Switch
              value={notifFollowers} 
              onValueChange={setNotifFollowers}
              trackColor={{ true: colors.PrimaryRed, false: '#E2E8F0' }}
              thumbColor="white"
            />
          </View>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={() => Alert.alert('Logout', 'Are you sure?', [{ text: 'Cancel' }, { text: 'Logout', onPress: () => navigation.navigate('Splash') }])}>
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={styles.logoutText}>{t('creator_studio.logout')}</Text>
        </TouchableOpacity>
      </ScrollView>

      <CustomModal 
        visible={modalConfig.visible} 
        title={modalConfig.title} 
        message={modalConfig.message} 
        isError={modalConfig.isError} 
        onPrimaryPress={() => setModalConfig(prev => ({ ...prev, visible: false }))} 
      />
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC', paddingTop: Platform.OS === 'android' ? 24 : 0 },
  header: { 
    padding: 16, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#64748B', letterSpacing: 1, marginBottom: 12, marginLeft: 4, textTransform: 'uppercase' },
  card: {
    backgroundColor: 'white', 
    borderRadius: 20, 
    padding: 16, 
    borderWidth: 1, 
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '700', color: '#475569', marginBottom: 8 },
  input: {
    backgroundColor: '#F8FAFC', 
    borderRadius: 14, 
    padding: 14,
    borderWidth: 1, 
    borderColor: '#E2E8F0', 
    fontSize: 15, 
    color: '#1E293B',
  },
  settingRow: {
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 8,
  },
  settingLabel: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  settingDesc: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  
  languageRow: { flexDirection: 'row', gap: 12 },
  languageBtn: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  languageBtnActive: {
    borderColor: colors.PrimaryRed,
    backgroundColor: colors.PrimaryRed + '05',
  },
  languageBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
  },
  languageBtnTextActive: {
    color: colors.PrimaryRed,
    fontWeight: '800',
  },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 40,
    backgroundColor: '#FEF2F2',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FCA5A533',
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '700',
  },
});
