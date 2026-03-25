import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../theme/Theme';
import { Ionicons } from '@expo/vector-icons';
import { useRef } from 'react';

interface Props {
  currentRoute: string;
  onNavigate: (route: string) => void;
  onDoubleTapHome?: () => void;
}

export default function AppBottomNavBar({ currentRoute, onNavigate, onDoubleTapHome }: Props) {
  const lastTap = useRef<number>(0);
  const items = [
    { label: 'Home', route: 'Home', icon: 'home' },
    { label: 'Explore', route: 'Explore', icon: 'search' },
    { label: 'Library', route: 'Library', icon: 'library' },
    { label: 'Settings', route: 'Settings', icon: 'settings' }
  ];

  return (
    <View style={styles.container}>
      {items.map((item) => {
        const isSelected = currentRoute === item.route;

        return (
          <TouchableOpacity
            key={item.route}
            style={styles.navItem}
            onPress={() => {
              if (item.route === 'Home' && currentRoute === 'Home') {
                const now = Date.now();
                const DOUBLE_TAP_DELAY = 300;
                if (now - lastTap.current < DOUBLE_TAP_DELAY) {
                  onDoubleTapHome?.();
                }
                lastTap.current = now;
              }
              
              if (currentRoute !== item.route) {
                onNavigate(item.route);
              }
            }}
          >
            <Ionicons 
              name={item.icon as any} 
              size={24} 
              color={isSelected ? Colors.PrimaryRed : Colors.Slate500} 
            />

            <Text
              style={[
                styles.label,
                { color: isSelected ? Colors.PrimaryRed : Colors.SlateText, opacity: isSelected ? 1 : 0.4 }
              ]}
            >
              {item.label}
            </Text>
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
  label: {
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 4,
  }
});
