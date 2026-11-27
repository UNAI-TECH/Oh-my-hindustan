import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { navigateAfterAuth } from '../../utils/authReturn';

const TOPICS = [
  { name: 'National Security', icon: 'shield-checkmark' },
  { name: 'Healthcare Policy', icon: 'medkit' },
  { name: 'Agricultural Reforms', icon: 'leaf' },
  { name: 'Digital India', icon: 'laptop' },
  { name: 'Economic Growth', icon: 'trending-up' },
  { name: 'Foreign Policy', icon: 'globe' },
  { name: 'Defense Updates', icon: 'flag' },
  { name: 'Election 2024', icon: 'checkbox' },
  { name: 'PMO Initiatives', icon: 'business' },
  { name: 'Social Justice', icon: 'people' },
  { name: 'Infrastructure', icon: 'construct' },
  { name: 'Atmanirbhar Bharat', icon: 'rocket' },
  { name: 'Rural Development', icon: 'home' },
  { name: 'Youth Empowerment', icon: 'school' },
  { name: 'State Governance', icon: 'library' },
  { name: 'Cultural Heritage', icon: 'color-palette' },
];

export default function TopicSelectionScreen() {
  const { width } = useWindowDimensions();
  const isWebDesktop = Platform.OS === 'web' && width >= 768;
  const cardWidth = isWebDesktop ? undefined : (width - 48 - 12) / 2;
  const { colors } = useAppTheme();
  const styles = getStyles(colors, cardWidth);
  const navigation = useNavigation<any>();
  const { updateOnboardingProfile, isLoading } = useAuth();
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  const toggleTopic = (topic: string) => {
    setSelectedTopics((prev) => {
      if (prev.includes(topic)) {
        return prev.filter((t) => t !== topic);
      }
      if (prev.length >= 3) {
        return prev;
      }
      return [...prev, topic];
    });
  };

  const isEnabled = selectedTopics.length === 3;
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFinish = async () => {
    if (!isEnabled) return;
    setErrorMsg(null);
    try {
      await updateOnboardingProfile({ topics: selectedTopics });
      navigateAfterAuth(navigation);
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to finish setup. Please try again.');
    }
  };

  return (
    <View style={[styles.container, isWebDesktop && { backgroundColor: '#F5F5F7' }]}>
      <ScrollView contentContainerStyle={[styles.scrollContainer, isWebDesktop && styles.webScroll]}>
        <View style={isWebDesktop ? styles.webCard : undefined}>
        <View style={styles.stepIndicator}>
          <View style={[styles.stepDot, styles.stepDotCompleted]} />
          <View style={[styles.stepLine, styles.stepLineCompleted]} />
          <View style={[styles.stepDot, styles.stepDotCompleted]} />
          <View style={[styles.stepLine, styles.stepLineCompleted]} />
          <View style={[styles.stepDot, styles.stepDotActive]} />
        </View>

        <View style={styles.iconContainer}>
          <Ionicons name="newspaper" size={36} color={colors.PrimaryRed} />
        </View>

        <Text style={styles.title}>What matters to you?</Text>
        <Text style={styles.subtitle}>
          Select exactly 3 topics to personalize{'\n'}your forum experience
        </Text>

        <View style={styles.counterContainer}>
          <Text style={styles.counterText}>
            {selectedTopics.length}/3 selected
          </Text>
        </View>

        <View style={[styles.grid, isWebDesktop && styles.webGrid]}>
          {TOPICS.map((topic) => {
            const isSelected = selectedTopics.includes(topic.name);
            const isMaxReached = selectedTopics.length >= 3 && !isSelected;
            return (
              <TouchableOpacity
                key={topic.name}
                style={[
                  styles.topicCard,
                  isWebDesktop && styles.webTopicCard,
                  isSelected && styles.topicCardActive,
                  isMaxReached && styles.topicCardDimmed,
                ]}
                onPress={() => toggleTopic(topic.name)}
                activeOpacity={0.7}
                disabled={isMaxReached}
              >
                <View style={[styles.topicIconBg, isSelected && styles.topicIconBgActive]}>
                  <Ionicons 
                    name={topic.icon as any} 
                    size={22} 
                    color={isSelected ? colors.PrimaryRed : '#94A3B8'} 
                  />
                </View>
                <Text
                  style={[
                    styles.topicText,
                    isSelected && styles.topicTextActive,
                  ]}
                  numberOfLines={2}
                >
                  {topic.name}
                </Text>
                {isSelected && (
                  <View style={styles.checkBadge}>
                    <Ionicons name="checkmark" size={12} color="white" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
        </View>
      </ScrollView>

      <View style={[styles.bottomContainer, isWebDesktop && styles.webBottom]}>
        <TouchableOpacity
          style={[styles.buttonContainer, (!isEnabled || isLoading) && styles.buttonDisabled]}
          onPress={handleFinish}
          disabled={!isEnabled || isLoading}
        >
          <LinearGradient
            colors={isEnabled ? [colors.PrimaryRed, colors.DeepCrimson] : ['#CBD5E1', '#CBD5E1']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientButton}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>
                {isEnabled ? '🚀  Start Journey' : `Select ${3 - selectedTopics.length} more`}
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const getStyles = (colors: any, cardWidth?: number) => StyleSheet.create({
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
    marginBottom: 24,
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
  },
  stepDotActive: {
    backgroundColor: colors.PrimaryRed,
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
    backgroundColor: colors.PrimaryRedAlpha10,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 20,
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
    marginBottom: 16,
    lineHeight: 20,
  },
  counterContainer: {
    alignSelf: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 20,
  },
  counterText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.PrimaryRed,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  topicCard: {
    width: cardWidth,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FAFAFA',
    alignItems: 'center',
    position: 'relative',
  },
  topicCardActive: {
    borderColor: colors.PrimaryRed,
    backgroundColor: colors.PrimaryRedAlpha5,
    borderWidth: 2,
  },
  topicCardDimmed: {
    opacity: 0.4,
  },
  topicIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  topicIconBgActive: {
    backgroundColor: colors.PrimaryRedAlpha10,
  },
  topicText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center',
  },
  topicTextActive: {
    color: colors.PrimaryRed,
    fontWeight: '800',
  },
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.PrimaryRed,
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
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
  webScroll: {
    paddingTop: 36,
    alignItems: 'center',
  },
  webCard: {
    width: '100%',
    maxWidth: 760,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 32,
  },
  webGrid: {
    justifyContent: 'flex-start',
  },
  webTopicCard: {
    flexBasis: '23%',
    flexGrow: 1,
    minWidth: 150,
  },
  webBottom: {
    maxWidth: 760,
    alignSelf: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    bottom: 16,
  },
});
