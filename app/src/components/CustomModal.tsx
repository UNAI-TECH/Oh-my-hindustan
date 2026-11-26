import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useAppTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

interface CustomModalProps {
  visible: boolean;
  title: string;
  message: string;
  primaryButtonText?: string;
  onPrimaryPress?: () => void;
  secondaryButtonText?: string;
  onSecondaryPress?: () => void;
  isError?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
}

export default function CustomModal({
  visible,
  title,
  message,
  primaryButtonText = 'OK',
  onPrimaryPress,
  secondaryButtonText,
  onSecondaryPress,
  isError = false,
  icon,
}: CustomModalProps) {
  const { colors } = useAppTheme();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const cardWidth = isWeb ? Math.min(420, Math.max(280, width - 32)) : Math.min(400, Math.max(280, width - 48));
  const styles = getStyles(colors, cardWidth);
  const defaultIcon = isError ? 'warning-outline' : 'information-circle-outline';
  const displayIcon = icon || defaultIcon;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onSecondaryPress || onPrimaryPress}>
      <View style={styles.overlay}>
        <View style={[styles.card, isError ? styles.cardError : styles.cardDefault]}>
          <View style={[styles.iconContainer, isError && { backgroundColor: `${colors.PrimaryRed}15` }]}>
            <Ionicons name={displayIcon} size={32} color={isError ? colors.PrimaryRed : colors.DarkText} />
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={[styles.buttonRow, !secondaryButtonText && styles.buttonRowSingle]}>
            {secondaryButtonText ? (
              <TouchableOpacity activeOpacity={0.75} style={styles.secondaryButton} onPress={onSecondaryPress}>
                <Text style={styles.secondaryButtonText}>{secondaryButtonText}</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.primaryButton,
                isError && { backgroundColor: colors.PrimaryRed },
                !secondaryButtonText && styles.primaryButtonFull,
              ]}
              onPress={onPrimaryPress}
            >
              <Text style={styles.primaryButtonText}>{primaryButtonText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const getStyles = (colors: any, cardWidth: number) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    ...(Platform.OS === 'web' ? ({ backdropFilter: 'blur(6px)' } as any) : {}),
  },
  card: {
    width: cardWidth,
    maxWidth: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.2,
    shadowRadius: 28,
    elevation: 12,
  },
  cardDefault: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardError: {
    borderWidth: 1,
    borderColor: 'rgba(212, 25, 31, 0.16)',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.DarkText,
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  message: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  buttonRowSingle: {
    justifyContent: 'center',
  },
  secondaryButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
  },
  primaryButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.DarkText,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  primaryButtonFull: {
    width: '100%',
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});
