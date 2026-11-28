import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useAppTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useRef } from 'react';

interface Props {
  currentRoute: string;
  onNavigate: (route: string) => void;
  onDoubleTapHome?: () => void;
}

export default function AppBottomNavBar({ currentRoute, onNavigate, onDoubleTapHome }: Props) {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const lastTap = useRef<number>(0);
  const items = [
    { label: 'Home', route: 'Home', activeIcon: 'home', inactiveIcon: 'home-outline' },
    { label: 'Explore', route: 'Explore', activeIcon: 'compass', inactiveIcon: 'compass-outline' },
    { label: 'Library', route: 'Library', activeIcon: 'bookmark', inactiveIcon: 'bookmark-outline' },
    { label: 'Profile', route: 'Profile', activeIcon: 'person', inactiveIcon: 'person-outline' },
  ];

  return (
    <View style={styles.container}>
      {items.map((item) => {
        const isSelected = currentRoute === item.route;

        return (
          <TouchableOpacity
            key={item.route}
            style={styles.navItem}
            activeOpacity={0.8}
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
            <View style={[styles.activeIndicator, isSelected && styles.activeIndicatorVisible]} />
            <View style={[styles.iconWrap, isSelected && styles.iconWrapActive]}>
              <Ionicons
                name={(isSelected ? item.activeIcon : item.inactiveIcon) as any}
                size={21}
                color={isSelected ? '#D4191F' : '#6B7280'}
              />
            </View>

            <Text
              style={[
                styles.label,
                { color: isSelected ? '#D4191F' : '#6B7280', fontWeight: isSelected ? '800' : '600' },
              ]}
              numberOfLines={1}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const getStyles = (_colors: any) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      height: Platform.OS === 'web' ? 64 : 74,
      backgroundColor: '#FFFFFF',
      borderTopWidth: 1,
      borderTopColor: '#E5E7EB',
      elevation: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      justifyContent: 'space-around',
      alignItems: 'center',
      paddingBottom: Platform.OS === 'web' ? 4 : 14,
      paddingTop: 2,
      ...(Platform.OS === 'web'
        ? ({
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 900,
            backdropFilter: 'blur(10px)',
          } as any)
        : {}),
    },
    navItem: {
      flex: 1,
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
    },
    activeIndicator: {
      position: 'absolute',
      top: 0,
      width: 28,
      height: 3,
      borderBottomLeftRadius: 3,
      borderBottomRightRadius: 3,
      backgroundColor: 'transparent',
    },
    activeIndicatorVisible: {
      backgroundColor: '#D4191F',
    },
    iconWrap: {
      paddingHorizontal: 14,
      paddingVertical: 3,
      borderRadius: 14,
    },
    iconWrapActive: {
      backgroundColor: '#FEF2F2',
    },
    label: {
      fontSize: 11,
      marginTop: 2,
      letterSpacing: 0.2,
    },
  });
