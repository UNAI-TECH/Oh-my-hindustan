import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/Theme';

export default function CreatorSubtitlesScreen() {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8 }}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Subtitles</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Ionicons name="language-outline" size={48} color={Colors.PrimaryRed} />
        </View>
        <Text style={styles.title}>Subtitle Management</Text>
        <Text style={styles.subtitle}>Coming Soon</Text>
        <Text style={styles.description}>
          Auto-generate and manage subtitles for your video content in multiple languages. 
          Make your content accessible to a wider audience.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC', paddingTop: Platform.OS === 'android' ? 24 : 0 },
  header: { padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white' },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  content: { flex: 1, alignItems: 'center', paddingHorizontal: 24, paddingTop: 48 },
  iconCircle: {
    width: 96, height: 96, borderRadius: 48, backgroundColor: Colors.PrimaryRed + '10',
    justifyContent: 'center', alignItems: 'center', marginBottom: 24,
  },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1E293B' },
  subtitle: { fontSize: 16, color: Colors.PrimaryRed, fontWeight: '700', marginTop: 4 },
  description: { fontSize: 14, color: '#64748B', textAlign: 'center', marginTop: 12, lineHeight: 22 },
});
