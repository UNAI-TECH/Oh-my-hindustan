import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import PostsAppLogo from '../PostsAppLogo';
import AuthIllustration from './AuthIllustration';

interface WebAuthShellProps {
  children: React.ReactNode;
}

/**
 * Shared centered editorial auth canvas for web Login & SignUp screens,
 * featuring a warm neutral backdrop, back button, centered logo above the
 * auth card, and flanking red vector illustrations on desktop viewports.
 */
export default function WebAuthShell({ children }: WebAuthShellProps) {
  const navigation = useNavigation<any>();
  const { width } = useWindowDimensions();
  const showIllustrations = Platform.OS === 'web' && width >= 920;

  const handleGoBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Home');
    }
  };

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.pageContent}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={handleGoBack}
          activeOpacity={0.85}
          accessibilityLabel="Go back to previous page"
        >
          <Ionicons name="arrow-back" size={16} color="#18181B" />
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.stageWrap}>
        <TouchableOpacity
          style={styles.logoAboveCard}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Home')}
          accessibilityLabel="Go to PostsApp Home"
        >
          <PostsAppLogo variant="light" size="md" />
        </TouchableOpacity>

        <View style={styles.stageRow}>
          {showIllustrations && (
            <View style={styles.leftIllustrationWrap}>
              <AuthIllustration side="left" />
            </View>
          )}

          <View style={styles.centerCard}>
            {children}
          </View>

          {showIllustrations && (
            <View style={styles.rightIllustrationWrap}>
              <AuthIllustration side="right" />
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#F7F6F2',
  },
  pageContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 24,
    maxWidth: 1180,
    width: '100%',
    alignSelf: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
    marginBottom: 12,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#18181B',
  },
  stageWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
  },
  logoAboveCard: {
    marginBottom: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    width: '100%',
    position: 'relative',
  },
  leftIllustrationWrap: {
    marginRight: -28,
    marginBottom: -8,
    zIndex: 1,
  },
  centerCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 32,
    paddingVertical: 34,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.06,
    shadowRadius: 32,
    elevation: 6,
    zIndex: 2,
    alignSelf: 'center',
  },
  rightIllustrationWrap: {
    marginLeft: -22,
    marginBottom: -8,
    zIndex: 1,
  },
});

/**
 * Shared form card styles used by web LoginScreen and SignUpScreen.
 */
export const webAuthCardStyles = StyleSheet.create({
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.4,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 22,
  },
  form: {
    width: '100%',
    gap: 12,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    height: 52,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    color: '#111827',
    outlineStyle: 'none' as any,
  },
  eyeBtn: {
    paddingLeft: 10,
    height: '100%',
    justifyContent: 'center',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  primaryBtn: {
    backgroundColor: '#D4191F',
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  googleBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
  },
  footerMuted: {
    fontSize: 12,
    color: '#6B7280',
  },
  footerLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D4191F',
  },
});
