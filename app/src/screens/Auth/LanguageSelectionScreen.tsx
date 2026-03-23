import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/Theme';
import { useAuth } from '../../context/AuthContext';

const LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', icon: '🇬🇧' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', icon: '🇮🇳' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', icon: '🏛️' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', icon: '🌾' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', icon: '🌸' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', icon: '🏔️' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', icon: '🌿' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', icon: '🌴' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', icon: '🦁' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', icon: '🌾' },
];

export default function LanguageSelectionScreen() {
  const navigation = useNavigation<any>();
  const { updateOnboardingProfile, isLoading } = useAuth();
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);

  const handleContinue = async () => {
    if (!selectedLanguage) return;
    try {
      await updateOnboardingProfile({ language: selectedLanguage });
      navigation.navigate('TopicSelection');
    } catch (e) {
      // Error handled in context
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.stepIndicator}>
          <View style={[styles.stepDot, styles.stepDotCompleted]} />
          <View style={[styles.stepLine, styles.stepLineCompleted]} />
          <View style={[styles.stepDot, styles.stepDotActive]} />
          <View style={styles.stepLine} />
          <View style={styles.stepDot} />
        </View>

        <View style={styles.iconContainer}>
          <Ionicons name="language" size={36} color={Colors.PrimaryRed} />
        </View>

        <Text style={styles.title}>Choose your language</Text>
        <Text style={styles.subtitle}>
          Select your preferred language for{'\n'}content and navigation
        </Text>

        <View style={styles.languageGrid}>
          {LANGUAGES.map((lang) => {
            const isSelected = selectedLanguage === lang.code;
            return (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.languageCard,
                  isSelected && styles.languageCardActive,
                ]}
                onPress={() => setSelectedLanguage(lang.code)}
                activeOpacity={0.7}
              >
                <Text style={styles.languageIcon}>{lang.icon}</Text>
                <Text style={[styles.languageName, isSelected && styles.languageNameActive]}>
                  {lang.name}
                </Text>
                <Text style={[styles.languageNative, isSelected && styles.languageNativeActive]}>
                  {lang.nativeName}
                </Text>
                {isSelected && (
                  <View style={styles.checkBadge}>
                    <Ionicons name="checkmark" size={14} color="white" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.buttonContainer, (!selectedLanguage || isLoading) && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={!selectedLanguage || isLoading}
        >
          <LinearGradient
            colors={selectedLanguage ? ['#E53935', '#FB8C00'] : ['#CBD5E1', '#CBD5E1']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientButton}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <View style={styles.buttonContent}>
                <Text style={styles.buttonText}>Continue</Text>
                <Ionicons name="arrow-forward" size={20} color="white" />
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    padding: 24,
    paddingTop: Platform.OS === 'android' ? 48 : 60,
    paddingBottom: 100,
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
    width: 40,
    height: 2,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 8,
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
    alignSelf: 'center',
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
    marginBottom: 28,
    lineHeight: 20,
  },
  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  languageCard: {
    width: '47%',
    paddingVertical: 18,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FAFAFA',
    alignItems: 'center',
    position: 'relative',
  },
  languageCardActive: {
    borderColor: Colors.PrimaryRed,
    backgroundColor: 'rgba(229, 57, 53, 0.05)',
    borderWidth: 2,
  },
  languageIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  languageName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  languageNameActive: {
    color: Colors.PrimaryRed,
  },
  languageNative: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
  },
  languageNativeActive: {
    color: Colors.PrimaryRed,
  },
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.PrimaryRed,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
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
});
