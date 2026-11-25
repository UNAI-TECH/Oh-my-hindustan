import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ScrollView, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';

export default function InterestsSelectionScreen() {
  const { width } = useWindowDimensions();
  const isWebDesktop = Platform.OS === 'web' && width >= 768;
  const itemWidth = isWebDesktop ? undefined : (width - 48 - 16) / 2;
  const { colors } = useAppTheme();
  const styles = getStyles(colors, itemWidth);
  const navigation = useNavigation<any>();
  const categories = [
    "National Security", "Healthcare Policy", "Agricultural Reforms", "Digital India",
    "Economic Growth", "Foreign Policy", "Defense Updates", "Election 2024",
    "PMO Initiatives", "Social Justice", "Infrastructure", "Atmanirbhar Bharat",
    "Rural Development", "Youth Empowerment", "State Governance", "Cultural Heritage"
  ];

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const toggleCategory = (cat: string) => {
    if (selectedCategories.includes(cat)) {
      setSelectedCategories(prev => prev.filter(c => c !== cat));
    } else {
      setSelectedCategories(prev => [...prev, cat]);
    }
  };

  const isEnabled = selectedCategories.length >= 3;

  return (
    <SafeAreaView style={[styles.safeArea, isWebDesktop && { backgroundColor: '#F5F5F7', justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
      <ScrollView
        style={{ width: '100%' }}
        contentContainerStyle={[
          { flexGrow: 1, padding: 24, alignItems: 'center' },
          isWebDesktop && styles.webCard,
        ]}
      >
        <Text style={styles.title}>What matters to you?</Text>
        <Text style={styles.subtitle}>Select at least 3 editorial themes to personalize PostsApp</Text>

        <View style={[styles.grid, isWebDesktop && styles.webGrid]}>
          {categories.map(category => {
            const isSelected = selectedCategories.includes(category);
            return (
              <TouchableOpacity
                key={category}
                style={[
                  styles.gridItem,
                  isWebDesktop && styles.webGridItem,
                  isSelected && styles.gridItemActive
                ]}
                onPress={() => toggleCategory(category)}
                activeOpacity={0.8}
              >
                <Text style={[styles.itemText, isSelected && { color: colors.PrimaryRed, fontWeight: '800' }]}>{category}</Text>
                {isSelected && <Ionicons name="checkmark" size={16} color={colors.PrimaryRed} style={{ position: 'absolute', top: 8, right: 8 }} />}
              </TouchableOpacity>
            )
          })}
        </View>

        <TouchableOpacity 
          style={[styles.btn, isWebDesktop && { maxWidth: 420 }, isEnabled ? styles.btnEnabled : styles.btnDisabled]}
          disabled={!isEnabled}
          onPress={() => {
            navigation.reset({
              index: 0,
              routes: [{ name: 'Home' }]
            });
          }}
        >
          <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>
            {isEnabled ? 'Start Journey' : `Select ${3 - selectedCategories.length} more`}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors: any, itemWidth?: number) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: 'white', paddingTop: Platform.OS === 'android' ? 24 : 0 },
  title: { fontSize: 24, fontWeight: 'bold', marginTop: 32, marginBottom: 8 },
  subtitle: { fontSize: 14, color: colors.Slate500, textAlign: 'center', marginBottom: 32 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 16, flex: 1 },
  gridItem: { 
    width: itemWidth, 
    height: 90, 
    backgroundColor: '#fff', 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: '#E2E8F0', 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 12,
    elevation: 1
  },
  gridItemActive: {
    backgroundColor: colors.PrimaryRedAlpha5,
    borderColor: colors.PrimaryRed,
    borderWidth: 2,
    elevation: 0
  },
  itemText: {
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#333',
    fontSize: 14
  },
  btn: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24
  },
  btnEnabled: {
    backgroundColor: colors.PrimaryRed
  },
  btnDisabled: {
    backgroundColor: 'gray',
    opacity: 0.5
  },
  webCard: {
    flexGrow: 0,
    maxWidth: 760,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 32,
  },
  webGrid: {
    justifyContent: 'flex-start',
    marginBottom: 28,
  },
  webGridItem: {
    flexBasis: '23%',
    flexGrow: 1,
    minWidth: 150,
    borderRadius: 8,
  },
});
