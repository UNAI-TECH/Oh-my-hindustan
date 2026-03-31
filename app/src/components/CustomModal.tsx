import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
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

const { width } = Dimensions.get('window');

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
  const styles = getStyles(colors);
  const defaultIcon = isError ? 'warning-outline' : 'information-circle-outline';
  const displayIcon = icon || defaultIcon;

  return (
    <Modal visible={visible} transparent animationType="fade">
      {/* Blurred overlay wrapper */}
      <BlurView intensity={30} tint="dark" style={styles.overlay}>
        <View style={[styles.card, isError ? styles.cardError : styles.cardDefault]}>
          <View style={[styles.iconContainer, isError && { backgroundColor: `${colors.PrimaryRed}15` }]}>
            <Ionicons name={displayIcon} size={36} color={isError ? colors.PrimaryRed : colors.DarkText} />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          
          <View style={[styles.buttonRow, !secondaryButtonText && { justifyContent: 'center' }]}>
            {secondaryButtonText && (
              <TouchableOpacity activeOpacity={0.7} style={styles.secondaryButton} onPress={onSecondaryPress}>
                <Text style={styles.secondaryButtonText}>{secondaryButtonText}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              activeOpacity={0.7}
              style={[
                styles.primaryButton, 
                isError && { backgroundColor: colors.PrimaryRed },
                !secondaryButtonText && { flex: 0, width: '100%' }
              ]} 
              onPress={onPrimaryPress}
            >
              <Text style={styles.primaryButtonText}>{primaryButtonText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </BlurView>
    </Modal>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: width - 56,
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    padding: 28,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.3)',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 1,
        shadowRadius: 36,
      },
      android: {
        elevation: 12,
      }
    })
  },
  cardDefault: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  cardError: {
    borderWidth: 1.5,
    borderColor: 'rgba(239,68,68,0.1)',
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.DarkText,
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  message: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    height: 54,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.DarkText,
  },
  primaryButton: {
    flex: 1,
    height: 54,
    borderRadius: 16,
    backgroundColor: colors.DarkText,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.DarkText,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 0.3,
  },
});
