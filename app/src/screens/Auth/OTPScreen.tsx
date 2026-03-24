import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/Theme';
import { useAuth } from '../../context/AuthContext';

export default function OTPScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { verifySignupOtp, isLoading, error } = useAuth();
  
  const email = route.params?.email || '';
  const [token, setToken] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleVerify = async () => {
    if (!token || token.length < 6) {
      setLocalError('Please enter a valid 6-digit code');
      return;
    }
    setLocalError(null);
    const success = await verifySignupOtp(email, token);
    if (success) {
      // Upon success, AuthContext will set isAuthenticated indicating a successful login
      // We don't need to navigate directly to UsernameSetup here because SignUpScreen or LoginScreen logic handles the redirect.
      // But we can reset specifically in case the flow requires it over here:
      navigation.reset({ index: 0, routes: [{ name: 'UsernameSetup' }] });
    }
  };

  const displayError = localError || error;

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.innerContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>

        <View style={styles.iconContainer}>
          <Ionicons name="mail-unread" size={40} color={Colors.PrimaryRed} />
        </View>

        <Text style={styles.title}>Verify your email</Text>
        <Text style={styles.subtitle}>We've sent a 6-digit code to {email}.</Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="000000"
            placeholderTextColor="#64748B"
            value={token}
            onChangeText={(text) => { setToken(text); setLocalError(null); }}
            keyboardType="number-pad"
            maxLength={6}
          />
        </View>

        {displayError && (
          <Text style={styles.errorText}>{displayError}</Text>
        )}

        <TouchableOpacity 
          style={styles.buttonContainer} 
          onPress={handleVerify}
          disabled={isLoading}
        >
          <LinearGradient
            colors={['#E53935', '#FB8C00']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientButton}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Verify OTP</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  innerContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 24,
    zIndex: 1,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: 'rgba(229, 57, 53, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 40,
    textAlign: 'center',
  },
  inputContainer: {
    width: '100%',
    alignItems: 'center',
  },
  input: {
    width: 200,
    height: 60,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 24,
    letterSpacing: 8,
    textAlign: 'center',
    color: '#000000',
    backgroundColor: '#FFFFFF',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    marginTop: 12,
    fontWeight: '500',
  },
  buttonContainer: {
    width: '100%',
    height: 56,
    marginTop: 32,
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradientButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
});
