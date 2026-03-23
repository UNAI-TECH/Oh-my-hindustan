import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';

export default function SplashScreen() {
  const navigation = useNavigation<any>();
  const { isAuthenticated, needsOnboarding } = useAuth();
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }).start(() => {
      setTimeout(() => {
        if (isAuthenticated) {
          if (needsOnboarding) {
            navigation.reset({ index: 0, routes: [{ name: 'UsernameSetup' }] });
          } else {
            navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
          }
        } else {
          navigation.replace('Login');
        }
      }, 800);
    });
  }, []);

  return (
    <LinearGradient
      colors={['#E53935', '#FB8C00']}
      style={styles.container}
    >
      <Animated.View style={{ opacity: fadeAnim, alignItems: 'center' }}>
        <View style={styles.iconContainer}>
          <Ionicons name="flag" size={48} color="#E53935" />
        </View>
        <Text style={styles.title}>Oh My Hindustan</Text>
        <Text style={styles.subtitle}>Jan Samvad Forum</Text>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    letterSpacing: 1,
  },
});
