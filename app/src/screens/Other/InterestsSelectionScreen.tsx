import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/Theme';

export default function InterestsSelectionScreen() {
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
    <SafeAreaView style={styles.safeArea}>
      <View style={{ flex: 1, padding: 24, alignItems: 'center' }}>
        <Text style={styles.title}>What matters to you?</Text>
        <Text style={styles.subtitle}>Select at least 3 political themes to personalize your forum</Text>

        <View style={styles.grid}>
          {categories.map(category => {
            const isSelected = selectedCategories.includes(category);
            return (
              <TouchableOpacity
                key={category}
                style={[
                  styles.gridItem,
                  isSelected && styles.gridItemActive
                ]}
                onPress={() => toggleCategory(category)}
                activeOpacity={0.8}
              >
                <Text style={[styles.itemText, isSelected && { color: Colors.PrimaryRed, fontWeight: '800' }]}>{category}</Text>
                {isSelected && <Ionicons name="checkmark" size={16} color={Colors.PrimaryRed} style={{ position: 'absolute', top: 8, right: 8 }} />}
              </TouchableOpacity>
            )
          })}
        </View>

        <TouchableOpacity 
          style={[styles.btn, isEnabled ? styles.btnEnabled : styles.btnDisabled]}
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
      </View>
    </SafeAreaView>
  );
}

const numColumns = 2;
const width = (Dimensions.get('window').width - 48 - 16) / 2;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: 'white', paddingTop: Platform.OS === 'android' ? 24 : 0 },
  title: { fontSize: 24, fontWeight: 'bold', marginTop: 32, marginBottom: 8 },
  subtitle: { fontSize: 14, color: Colors.Slate500, textAlign: 'center', marginBottom: 32 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 16, flex: 1 },
  gridItem: { 
    width: width, 
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
    backgroundColor: Colors.PrimaryRedAlpha5,
    borderColor: Colors.PrimaryRed,
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
    backgroundColor: Colors.PrimaryRed
  },
  btnDisabled: {
    backgroundColor: 'gray',
    opacity: 0.5
  }
});
