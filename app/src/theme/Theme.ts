import { StyleSheet } from 'react-native';

// Primary palette
export const lightColors = {
  PrimaryRed: '#BF3A2B',
  DeepCrimson: '#8E1F4F',
  WarmOrange: '#E8722A',
  AmberGold: '#F0A500',

  // Backgrounds
  CreamBg: '#EDE9DF',
  SurfaceWhite: '#FFFFFF',
  BackgroundLight: '#F8F6F6',

  // Text
  DarkText: '#1A1A1A',
  MutedGray: '#6B6B6B',
  SlateText: '#334155',
  Slate400: '#94A3B8',
  Slate500: '#64748B',
  Slate600: '#475569',
  Slate100: '#F1F5F9',
  Slate50: '#F8FAFC',
  Slate200: '#E2E8F0',

  // Status
  GreenStatus: '#16A34A',
  RedStatus: '#DC2626',
  AmberStatus: '#F59E0B',

  // Accent
  PrimaryRedAlpha10: 'rgba(191, 58, 43, 0.10)',
  PrimaryRedAlpha20: 'rgba(191, 58, 43, 0.20)',
  PrimaryRedAlpha5: 'rgba(191, 58, 43, 0.05)',

  // Admin sidebar
  AdminSidebar: '#8E1F4F',
};

export const darkColors = {
  ...lightColors, // fallback if new colors are added

  // Backgrounds
  CreamBg: '#121212',
  SurfaceWhite: '#1A1A1A',
  BackgroundLight: '#000000',

  // Text (inverted)
  DarkText: '#F8FAFC',
  MutedGray: '#94A3B8',
  SlateText: '#E2E8F0',
  Slate400: '#64748B',
  Slate500: '#94A3B8',
  Slate600: '#CBD5E1',
  Slate100: '#1E293B',
  Slate50: '#0F172A',
  Slate200: '#334155',

  // Accent overrides for visibility on dark
  PrimaryRedAlpha10: 'rgba(191, 58, 43, 0.20)',
  PrimaryRedAlpha20: 'rgba(191, 58, 43, 0.30)',
  PrimaryRedAlpha5: 'rgba(191, 58, 43, 0.10)',
};

// Fallback for non-refactored files
export const Colors = lightColors;

export const LightColorScheme = {
  primary: lightColors.PrimaryRed,
  onPrimary: lightColors.SurfaceWhite,
  secondary: lightColors.WarmOrange,
  onSecondary: lightColors.SurfaceWhite,
  tertiary: lightColors.DeepCrimson,
  onTertiary: lightColors.SurfaceWhite,
  background: lightColors.CreamBg,
  onBackground: lightColors.DarkText,
  surface: lightColors.SurfaceWhite,
  onSurface: lightColors.DarkText,
  surfaceVariant: lightColors.BackgroundLight,
  onSurfaceVariant: lightColors.SlateText,
  outline: lightColors.Slate200,
  outlineVariant: lightColors.Slate100,
};

export const DarkColorScheme = {
  primary: darkColors.PrimaryRed,
  onPrimary: '#FFFFFF',
  secondary: darkColors.WarmOrange,
  onSecondary: '#FFFFFF',
  tertiary: darkColors.DeepCrimson,
  onTertiary: '#FFFFFF',
  background: darkColors.CreamBg,
  onBackground: darkColors.DarkText,
  surface: darkColors.SurfaceWhite,
  onSurface: darkColors.DarkText,
  surfaceVariant: darkColors.BackgroundLight,
  onSurfaceVariant: darkColors.MutedGray,
  outline: darkColors.Slate400,
  outlineVariant: darkColors.Slate200,
};

// Fallback sans-serif roughly matching Android's compose Type.kt setup
export const Typography = StyleSheet.create({
  displayLarge: { fontWeight: 'bold', fontSize: 32, lineHeight: 40 },
  headlineLarge: { fontWeight: 'bold', fontSize: 28, lineHeight: 34 },
  headlineMedium: { fontWeight: 'bold', fontSize: 24, lineHeight: 30 },
  headlineSmall: { fontWeight: 'bold', fontSize: 20, lineHeight: 26 },
  titleLarge: { fontWeight: 'bold', fontSize: 18, lineHeight: 24 },
  titleMedium: { fontWeight: '600', fontSize: 16, lineHeight: 22 }, // SemiBold
  titleSmall: { fontWeight: '600', fontSize: 14, lineHeight: 20 },
  bodyLarge: { fontWeight: 'normal', fontSize: 16, lineHeight: 24 },
  bodyMedium: { fontWeight: 'normal', fontSize: 14, lineHeight: 20 },
  bodySmall: { fontWeight: 'normal', fontSize: 12, lineHeight: 16 },
  labelLarge: { fontWeight: 'bold', fontSize: 14, lineHeight: 20 },
  labelMedium: { fontWeight: '500', fontSize: 12, lineHeight: 16 }, // Medium
  labelSmall: { fontWeight: 'bold', fontSize: 10, lineHeight: 14, letterSpacing: 0.5 },
});
