import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/Theme';
import { useAuth } from '../../context/AuthContext';

export default function CreatorSettingsScreen() {
  const navigation = useNavigation<any>();
  const { userProfile, updateProfile } = useAuth();

  const [displayName, setDisplayName] = useState(userProfile?.username || '');
  const [bio, setBio] = useState(userProfile?.bio || '');
  const [notifComments, setNotifComments] = useState(true);
  const [notifFollowers, setNotifFollowers] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProfile(displayName, bio);
      Alert.alert('Saved', 'Your settings have been updated.');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to save.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8 }}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <TouchableOpacity onPress={handleSave} disabled={isSaving} style={{ padding: 8 }}>
          <Text style={{ color: Colors.PrimaryRed, fontWeight: 'bold', opacity: isSaving ? 0.5 : 1 }}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.sectionTitle}>Profile</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Display Name</Text>
          <TextInput style={styles.input} value={displayName} onChangeText={setDisplayName} placeholder="Your name" />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
            value={bio} onChangeText={setBio} placeholder="Tell viewers about yourself"
            multiline
          />
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 32 }]}>Notifications</Text>

        <View style={styles.settingRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.settingLabel}>Comment Notifications</Text>
            <Text style={styles.settingDesc}>Get notified when someone comments on your content</Text>
          </View>
          <Switch
            value={notifComments} onValueChange={setNotifComments}
            trackColor={{ true: Colors.PrimaryRed, false: '#E2E8F0' }}
            thumbColor="white"
          />
        </View>

        <View style={styles.settingRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.settingLabel}>Follower Notifications</Text>
            <Text style={styles.settingDesc}>Get notified when someone follows you</Text>
          </View>
          <Switch
            value={notifFollowers} onValueChange={setNotifFollowers}
            trackColor={{ true: Colors.PrimaryRed, false: '#E2E8F0' }}
            thumbColor="white"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC', paddingTop: Platform.OS === 'android' ? 24 : 0 },
  header: { padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white' },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: Colors.Slate500, letterSpacing: 0.5, marginBottom: 16, textTransform: 'uppercase' },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 8 },
  input: {
    backgroundColor: 'white', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#E2E8F0', fontSize: 15, color: '#000',
  },
  settingRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'white',
    borderRadius: 12, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#E2E8F0',
  },
  settingLabel: { fontSize: 15, fontWeight: '600', color: '#1E293B' },
  settingDesc: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
});
