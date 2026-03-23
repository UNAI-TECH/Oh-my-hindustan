import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

// This screen is now replaced by the 3-step onboarding flow
// (UsernameSetup → LanguageSelection → TopicSelection)
// Keeping it as a redirect for backwards compatibility
export default function ProfileSetupScreen() {
  const navigation = useNavigation<any>();

  React.useEffect(() => {
    // Redirect to the new onboarding flow
    navigation.replace('UsernameSetup');
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Setting up...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 18,
    color: '#64748B',
  },
});
