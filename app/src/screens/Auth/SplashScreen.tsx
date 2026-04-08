import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';

export default function SplashScreen() {
  const navigation = useNavigation<any>();
  const { isAuthenticated, needsOnboarding } = useAuth();

  useEffect(() => {
    // Instantly navigate to the respective screen without the animation delay
    if (isAuthenticated) {
      if (needsOnboarding) {
        navigation.reset({ index: 0, routes: [{ name: 'UsernameSetup' }] });
      } else {
        navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
      }
    } else {
      navigation.replace('Login');
    }
  }, [isAuthenticated, needsOnboarding]);

  // Return a transparent/white view so it seamlessly transitions from the native splash screen
  return <View style={styles.container} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff', // Matches native splash screen background
  },
});
