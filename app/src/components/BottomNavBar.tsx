import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../theme/Theme';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  currentRoute: string;
  onNavigate: (route: string) => void;
}

export default function AppBottomNavBar({ currentRoute, onNavigate }: Props) {
  const items = [
    { label: 'Home', route: 'Home', icon: 'home' },
    { label: 'Explore', route: 'Explore', icon: 'search' },
    { label: 'Analyst', route: 'ContentEditor', icon: 'megaphone' },
    { label: 'Archive', route: 'Library', icon: 'library' },
    { label: 'Profile', route: 'Profile', icon: 'person' }
  ];

  return (
    <View style={styles.container}>
      {items.map((item) => {
        const isSelected = currentRoute === item.route;
        const isAnalyst = item.label === 'Analyst';

        return (
          <TouchableOpacity
            key={item.route}
            style={styles.navItem}
            onPress={() => {
              if (currentRoute !== item.route) {
                onNavigate(item.route);
              }
            }}
          >
            {isAnalyst ? (
              <View style={[styles.analystIconContainer, { elevation: 4, shadowOpacity: 0.2 }]}>
                <Ionicons name={item.icon as any} size={20} color="white" />
              </View>
            ) : (
              <Ionicons 
                name={item.icon as any} 
                size={24} 
                color={isSelected ? Colors.PrimaryRed : Colors.Slate500} 
              />
            )}

            {!isAnalyst && (
              <Text
                style={[
                  styles.label,
                  { color: isSelected ? Colors.PrimaryRed : Colors.SlateText, opacity: isSelected ? 1 : 0.4 }
                ]}
              >
                {item.label}
              </Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 20, // safe area padding generally
  },
  navItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  analystIconContainer: {
    backgroundColor: Colors.PrimaryRed,
    borderRadius: 12,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  analystIcon: {
    fontSize: 20, // slightly smaller emoji
  },
  label: {
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 4,
  }
});
