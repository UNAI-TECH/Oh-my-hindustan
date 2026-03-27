import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, ActivityIndicator, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAppTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import CustomModal from '../../components/CustomModal';

export default function PersonalDetailsScreen() {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const navigation = useNavigation<any>();
  const { userProfile, uploadProfileImage } = useAuth();
  const [dbUser, setDbUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(null);
  const [modalConfig, setModalConfig] = useState({ visible: false, title: '', message: '', isError: false });

  useEffect(() => {
    const fetchUser = async () => {
      if (!userProfile?.id) { setLoading(false); return; }
      try {
        const { data } = await supabase
          .from('User')
          .select('*')
          .eq('id', userProfile.id)
          .single();
        setDbUser(data);
        if (data?.avatarUrl) setCurrentAvatarUrl(data.avatarUrl);
      } catch (e) {
        console.warn('Failed to fetch user details:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [userProfile?.id]);

  const handleUpdateProfilePicture = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        setModalConfig({ visible: true, title: 'Permission Required', message: 'Please allow access to your photos to update your profile picture.', isError: true });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setUploadingImage(true);
        const publicUrl = await uploadProfileImage(result.assets[0].uri);
        
        // Update the User table
        const { error: updateErr } = await supabase
          .from('User')
          .update({ avatarUrl: publicUrl, updatedAt: new Date().toISOString() })
          .eq('id', userProfile.id);

        if (updateErr) throw updateErr;

        setCurrentAvatarUrl(publicUrl);
        setModalConfig({ visible: true, title: 'Success', message: 'Profile picture updated successfully!', isError: false });
      }
    } catch (e: any) {
      setModalConfig({ visible: true, title: 'Error', message: e.message || 'Failed to update profile picture. Please try again.', isError: true });
    } finally {
      setUploadingImage(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.PrimaryRed} />
        </View>
      </SafeAreaView>
    );
  }

  // Get full name from Supabase auth user_metadata or User table
  const authFullName = userProfile?.user_metadata?.full_name || userProfile?.full_name;
  const fullName = authFullName || dbUser?.username || 'N/A';
  const username = dbUser?.username || userProfile?.username || 'N/A';
  const email = dbUser?.email || userProfile?.email || 'N/A';
  const phone = dbUser?.phone || userProfile?.phone || 'Not set';
  const topics = dbUser?.selected_topics || userProfile?.selected_topics || [];
  const language = dbUser?.preferred_language || userProfile?.preferred_language || 'English';
  const displayName = username || email?.split('@')[0] || 'User';
  const avatarUrl = currentAvatarUrl || dbUser?.avatarUrl || userProfile?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=E53935&color=fff&size=200`;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8 }}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Personal Details</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Profile Picture Section */}
        <View style={styles.profilePictureSection}>
          <View style={styles.avatarWrapper}>
            <Image source={{ uri: avatarUrl }} style={styles.profileAvatar} />
            {uploadingImage && (
              <View style={styles.uploadOverlay}>
                <ActivityIndicator size="small" color="white" />
              </View>
            )}
          </View>
          <TouchableOpacity 
            style={styles.updatePhotoBtn} 
            onPress={handleUpdateProfilePicture}
            disabled={uploadingImage}
          >
            <Ionicons name="camera-outline" size={18} color={colors.PrimaryRed} />
            <Text style={styles.updatePhotoText}>
              {uploadingImage ? 'Uploading...' : 'Update Profile Picture'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionDivider} />

        <DetailRow label="Full Name" value={fullName} icon="person-outline" />
        <DetailRow label="Username" value={`@${username}`} icon="at-outline" />
        <DetailRow label="Email ID" value={email} icon="mail-outline" />
        <DetailRow label="Mobile Number" value={phone} icon="call-outline" />
        
        <View style={styles.sectionDivider} />
        
        <Text style={styles.sectionTitle}>Interested Topics</Text>
        {topics.length > 0 ? (
          <View style={styles.topicsWrapper}>
            {topics.map((topic: string) => (
              <View key={topic} style={styles.topicBadge}>
                <Text style={styles.topicText}>{topic}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyText}>No topics selected</Text>
        )}

        <View style={styles.sectionDivider} />

        <Text style={styles.sectionTitle}>Language Preference</Text>
        <View style={styles.languageBox}>
          <Ionicons name="globe-outline" size={20} color={colors.PrimaryRed} />
          <Text style={styles.languageText}>{language}</Text>
        </View>
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

const DetailRow = ({ label, value, icon }: { label: string; value: string; icon: string }) => {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  return (
  <View style={styles.detailRow}>
    <View style={styles.detailIcon}>
      <Ionicons name={icon as any} size={20} color={colors.Slate500} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  </View>
)};

const getStyles = (colors: any) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC', paddingTop: Platform.OS === 'android' ? 24 : 0 },
  header: { padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC' },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  profilePictureSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  profileAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: colors.PrimaryRed,
  },
  uploadOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 50,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  updatePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(229, 57, 53, 0.08)',
    gap: 8,
  },
  updatePhotoText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.PrimaryRed,
  },
  detailRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'white',
    padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 12,
  },
  detailIcon: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#F1F5F9',
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  detailLabel: { fontSize: 12, color: colors.Slate500, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  detailValue: { fontSize: 16, fontWeight: '600', color: colors.DarkText, marginTop: 2 },
  sectionDivider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: colors.DarkText, marginBottom: 12 },
  topicsWrapper: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  topicBadge: { backgroundColor: 'rgba(229,57,53,0.1)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  topicText: { color: colors.PrimaryRed, fontSize: 13, fontWeight: '600' },
  emptyText: { color: colors.Slate400, fontSize: 14 },
  languageBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'white',
    padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', gap: 10,
  },
  languageText: { fontSize: 16, fontWeight: '600', color: colors.PrimaryRed },
});
