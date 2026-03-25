import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../../theme/Theme';
import { useAuth } from '../../context/AuthContext';

export default function ProfileImageUploadScreen() {
  const navigation = useNavigation<any>();
  const { uploadProfileImage, updateOnboardingProfile, isLoading, userProfile } = useAuth();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const displayName = userProfile?.username || userProfile?.email?.split('@')[0] || 'User';

  const pickImage = async () => {
    setErrorMsg(null);
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please allow access to your photos to upload a profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch (e: any) {
      setErrorMsg('Failed to pick image. Please try again.');
    }
  };

  const handleContinue = async () => {
    setErrorMsg(null);
    setUploading(true);
    try {
      if (imageUri) {
        const publicUrl = await uploadProfileImage(imageUri);
        await updateOnboardingProfile({ avatarUrl: publicUrl });
      }
      navigation.navigate('TopicSelection');
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSkip = () => {
    navigation.navigate('TopicSelection');
  };

  const avatarFallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=E53935&color=fff&size=200`;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Step Indicator - Step 2 of 3 */}
        <View style={styles.stepIndicator}>
          <View style={[styles.stepDot, styles.stepDotCompleted]} />
          <View style={[styles.stepLine, styles.stepLineCompleted]} />
          <View style={[styles.stepDot, styles.stepDotActive]} />
          <View style={styles.stepLine} />
          <View style={styles.stepDot} />
        </View>

        <View style={styles.iconContainer}>
          <Ionicons name="camera" size={36} color={Colors.PrimaryRed} />
        </View>

        <Text style={styles.title}>Add a profile photo</Text>
        <Text style={styles.subtitle}>
          Upload a profile picture so other users{'\n'}can recognize you
        </Text>

        {/* Avatar Preview */}
        <TouchableOpacity style={styles.avatarContainer} onPress={pickImage} activeOpacity={0.8}>
          <Image
            source={{ uri: imageUri || avatarFallback }}
            style={styles.avatarImage}
          />
          <View style={styles.cameraOverlay}>
            <Ionicons name="camera" size={24} color="white" />
          </View>
          <View style={styles.editBadge}>
            <Ionicons name="pencil" size={14} color="white" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.changePhotoBtn} onPress={pickImage}>
          <Ionicons name="images-outline" size={18} color={Colors.PrimaryRed} />
          <Text style={styles.changePhotoText}>
            {imageUri ? 'Change Photo' : 'Choose from Gallery'}
          </Text>
        </TouchableOpacity>

        {errorMsg && (
          <Text style={styles.errorText}>{errorMsg}</Text>
        )}

        {imageUri && (
          <Text style={styles.successText}>✓ Photo selected! Tap continue to upload.</Text>
        )}
      </View>

      {/* Bottom Buttons */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.buttonContainer, (uploading || isLoading) && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={uploading || isLoading}
        >
          <LinearGradient
            colors={imageUri ? ['#E53935', '#FB8C00'] : ['#E53935', '#FB8C00']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientButton}
          >
            {(uploading || isLoading) ? (
              <ActivityIndicator color="white" />
            ) : (
              <View style={styles.buttonContent}>
                <Text style={styles.buttonText}>
                  {imageUri ? 'Upload & Continue' : 'Continue'}
                </Text>
                <Ionicons name="arrow-forward" size={20} color="white" />
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {!imageUri && (
          <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 24,
    paddingTop: Platform.OS === 'android' ? 48 : 60,
    alignItems: 'center',
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
  },
  stepDotActive: {
    backgroundColor: Colors.PrimaryRed,
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  stepDotCompleted: {
    backgroundColor: '#16A34A',
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  stepLine: {
    width: 30,
    height: 2,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 6,
  },
  stepLineCompleted: {
    backgroundColor: '#16A34A',
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: 'rgba(229, 57, 53, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  avatarContainer: {
    position: 'relative',
    width: 140,
    height: 140,
    borderRadius: 70,
    marginBottom: 20,
  },
  avatarImage: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    borderColor: Colors.PrimaryRed,
  },
  cameraOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 70,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.PrimaryRed,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  changePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(229, 57, 53, 0.08)',
    gap: 8,
    marginBottom: 16,
  },
  changePhotoText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.PrimaryRed,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    marginTop: 8,
    fontWeight: '500',
  },
  successText: {
    color: '#16A34A',
    fontSize: 13,
    marginTop: 8,
    fontWeight: '600',
  },
  bottomContainer: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  buttonContainer: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  gradientButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  skipText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#94A3B8',
  },
});
