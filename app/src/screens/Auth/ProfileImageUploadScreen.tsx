import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAppTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import CustomModal from '../../components/CustomModal';
import PostsAppLogo from '../../components/PostsAppLogo';
import WebAuthShell, { webAuthCardStyles } from '../../components/web/WebAuthShell';
import { navigateAfterAuth } from '../../utils/authReturn';

export default function ProfileImageUploadScreen() {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const navigation = useNavigation<any>();
  const { uploadProfileImage, updateOnboardingProfile, isLoading, userProfile } = useAuth();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [modalConfig, setModalConfig] = useState({ visible: false, title: '', message: '', isError: false });

  const displayName = userProfile?.username || userProfile?.email?.split('@')[0] || 'User';
  const avatarFallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=D4191F&color=fff&size=200`;

  const pickImage = async () => {
    setErrorMsg(null);
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        setModalConfig({
          visible: true,
          title: 'Permission Required',
          message: 'Please allow access to your photos to upload a profile picture.',
          isError: true,
        });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch {
      setErrorMsg('Failed to pick image. Please try again.');
    }
  };

  const finishOnboarding = async (skipPhoto = false) => {
    setErrorMsg(null);
    setUploading(true);
    try {
      let publicUrl: string | undefined;
      if (!skipPhoto && imageUri) {
        publicUrl = await uploadProfileImage(imageUri);
      }
      await updateOnboardingProfile({
        ...(publicUrl ? { avatarUrl: publicUrl } : {}),
        onboarding_complete: true,
      });
      navigateAfterAuth(navigation);
    } catch (e: any) {
      console.error('Profile image setup failed:', e);
      setErrorMsg('Could not finish profile setup. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const cardInner = (
    <View style={styles.cardBody}>
      {/* Step 2 of 2 Progress */}
      <View style={styles.stepHeader}>
        <Text style={styles.stepBadgeText}>STEP 2 OF 2</Text>
        <View style={styles.stepBarsRow}>
          <View style={[styles.stepBar, styles.stepBarDone]} />
          <View style={[styles.stepBar, styles.stepBarActive]} />
        </View>
      </View>

      <Text style={webAuthCardStyles.title}>{'Add your\nprofile photo'}</Text>
      <Text style={webAuthCardStyles.subtitle}>
        Upload a photo for <Text style={styles.handleHighlight}>@{displayName}</Text> or finish right away.
      </Text>

      <View style={styles.avatarStage}>
        <TouchableOpacity style={styles.avatarWrap} onPress={pickImage} activeOpacity={0.85}>
          <Image
            source={{ uri: imageUri || userProfile?.avatarUrl || avatarFallback }}
            style={styles.avatarImage}
          />
          <View style={styles.editBadge}>
            <Ionicons name="camera" size={16} color="#FFFFFF" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.pickPhotoBtn} onPress={pickImage} activeOpacity={0.85}>
          <Ionicons name="images-outline" size={16} color="#D4191F" />
          <Text style={styles.pickPhotoBtnText}>
            {imageUri ? 'Change Photo' : 'Choose from Gallery'}
          </Text>
        </TouchableOpacity>
      </View>

      {errorMsg ? <Text style={[webAuthCardStyles.errorText, { textAlign: 'center', marginBottom: 8 }]}>{errorMsg}</Text> : null}

      {imageUri ? (
        <Text style={styles.selectedText}>✓ Photo ready to upload</Text>
      ) : null}

      <View style={webAuthCardStyles.form}>
        <TouchableOpacity
          style={webAuthCardStyles.primaryBtn}
          onPress={() => finishOnboarding(false)}
          disabled={uploading || isLoading}
          activeOpacity={0.88}
        >
          {uploading || isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <View style={styles.btnContent}>
              <Text style={webAuthCardStyles.primaryBtnText}>
                {imageUri ? 'Upload & Finish' : 'Finish Setup'}
              </Text>
              <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
            </View>
          )}
        </TouchableOpacity>

        {!imageUri && (
          <TouchableOpacity
            style={styles.skipBtn}
            onPress={() => finishOnboarding(true)}
            disabled={uploading || isLoading}
          >
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>
        )}
      </View>

      <CustomModal
        visible={modalConfig.visible}
        title={modalConfig.title}
        message={modalConfig.message}
        isError={modalConfig.isError}
        onPrimaryPress={() => setModalConfig((prev) => ({ ...prev, visible: false }))}
      />
    </View>
  );

  if (Platform.OS === 'web') {
    return <WebAuthShell>{cardInner}</WebAuthShell>;
  }

  return (
    <ScrollView contentContainerStyle={styles.nativeScroll} style={styles.nativeContainer}>
      <View style={{ marginBottom: 20, alignItems: 'center' }}>
        <PostsAppLogo variant="light" size="md" />
      </View>
      <View style={styles.nativeCard}>{cardInner}</View>
    </ScrollView>
  );
}

const getStyles = (_colors: any) =>
  StyleSheet.create({
    cardBody: {
      width: '100%',
    },
    stepHeader: {
      marginBottom: 18,
      gap: 8,
    },
    stepBadgeText: {
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 1,
      color: '#D4191F',
    },
    stepBarsRow: {
      flexDirection: 'row',
      gap: 8,
    },
    stepBar: {
      flex: 1,
      height: 4,
      borderRadius: 999,
      backgroundColor: '#E5E7EB',
    },
    stepBarDone: {
      backgroundColor: '#16A34A',
    },
    stepBarActive: {
      backgroundColor: '#D4191F',
    },
    handleHighlight: {
      color: '#111827',
      fontWeight: '700',
    },
    avatarStage: {
      alignItems: 'center',
      paddingVertical: 14,
      gap: 14,
      marginBottom: 8,
    },
    avatarWrap: {
      position: 'relative',
      width: 124,
      height: 124,
      borderRadius: 62,
    },
    avatarImage: {
      width: 124,
      height: 124,
      borderRadius: 62,
      borderWidth: 3,
      borderColor: '#D4191F',
      backgroundColor: '#F3F4F6',
    },
    editBadge: {
      position: 'absolute',
      bottom: 2,
      right: 2,
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: '#D4191F',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 3,
      borderColor: '#FFFFFF',
    },
    pickPhotoBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 16,
      paddingVertical: 9,
      borderRadius: 999,
      backgroundColor: '#FEF2F2',
      borderWidth: 1,
      borderColor: '#FECACA',
    },
    pickPhotoBtnText: {
      fontSize: 13,
      fontWeight: '700',
      color: '#D4191F',
    },
    selectedText: {
      color: '#16A34A',
      fontSize: 12,
      fontWeight: '700',
      textAlign: 'center',
      marginBottom: 10,
    },
    btnContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    skipBtn: {
      alignItems: 'center',
      paddingVertical: 10,
    },
    skipText: {
      fontSize: 13,
      fontWeight: '600',
      color: '#6B7280',
    },
    nativeContainer: {
      flex: 1,
      backgroundColor: '#F7F6F2',
    },
    nativeScroll: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: 20,
    },
    nativeCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: 20,
      padding: 24,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.06,
      shadowRadius: 20,
      elevation: 4,
    },
  });
