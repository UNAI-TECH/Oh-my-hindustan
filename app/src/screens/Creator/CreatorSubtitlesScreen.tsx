import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';
import WebStudioShell from '../../components/web/WebStudioShell';

export default function CreatorSubtitlesScreen() {
  const { width } = useWindowDimensions();
  const isWebDesktop = Platform.OS === 'web' && width >= 768;
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const navigation = useNavigation<any>();

  const body = (
    <View style={styles.content}>
      <View style={styles.iconCircle}>
        <Ionicons name="language-outline" size={48} color={colors.PrimaryRed} />
      </View>
      <Text style={styles.title}>Subtitle Management</Text>
      <Text style={styles.subtitle}>Coming Soon</Text>
      <Text style={styles.description}>
        Auto-generate and manage subtitles for your video content in multiple languages. 
        Make your content accessible to a wider audience.
      </Text>
    </View>
  );

  if (isWebDesktop) {
    return (
      <WebStudioShell activeRoute="CreatorSubtitles" title="Subtitles" maxWidth={780}>
        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 6, borderWidth: 1, borderColor: '#E5E7EB', paddingBottom: 48 }}>
          {body}
        </View>
      </WebStudioShell>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8 }}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Subtitles</Text>
        <View style={{ width: 40 }} />
      </View>

      {body}
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC', paddingTop: Platform.OS === 'android' ? 24 : 0 },
  header: { padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white' },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  content: { flex: 1, alignItems: 'center', paddingHorizontal: 24, paddingTop: 48 },
  iconCircle: {
    width: 96, height: 96, borderRadius: 48, backgroundColor: colors.PrimaryRed + '10',
    justifyContent: 'center', alignItems: 'center', marginBottom: 24,
  },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1E293B' },
  subtitle: { fontSize: 16, color: colors.PrimaryRed, fontWeight: '700', marginTop: 4 },
  description: { fontSize: 14, color: '#64748B', textAlign: 'center', marginTop: 12, lineHeight: 22 },
});
