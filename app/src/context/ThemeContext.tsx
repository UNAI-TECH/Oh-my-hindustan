import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors } from '../theme/Theme';

interface ThemeContextProps {
  isDark: boolean;
  colors: typeof lightColors;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  themePreference: 'light' | 'dark' | 'system';
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const systemColorScheme = useColorScheme();
  const [themePreference, setThemePreference] = useState<'light' | 'dark' | 'system'>('light');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('omh_theme_preference').then(val => {
      if (val === 'dark' || val === 'light' || val === 'system') {
        setThemePreference(val);
      } else {
        // Fallback or backward compatibility for previous setup
        AsyncStorage.getItem('omh_dark_mode').then(oldVal => {
          if (oldVal === 'true') setThemePreference('dark');
          else setThemePreference('light');
        });
      }
      setIsReady(true);
    });
  }, []);

  const setTheme = (theme: 'light' | 'dark' | 'system') => {
    setThemePreference(theme);
    AsyncStorage.setItem('omh_theme_preference', theme);
  };

  const isDark = themePreference === 'system' ? systemColorScheme === 'dark' : themePreference === 'dark';
  const colors = isDark ? darkColors : lightColors;

  if (!isReady) return null; // Avoid flashing unstyled content

  return (
    <ThemeContext.Provider value={{ isDark, colors, setTheme, themePreference }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) return { colors: lightColors, isDark: false, setTheme: () => {}, themePreference: 'light' };
  return context;
};
