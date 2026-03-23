import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/Theme';
import { useAuth } from '../../context/AuthContext';

export default function SignUpScreen() {
  const navigation = useNavigation<any>();
  const { register, signInWithGoogle, isLoading, error, signupSuccess, isAuthenticated, needsOnboarding, clearState } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    clearState();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      if (needsOnboarding) {
        navigation.reset({ index: 0, routes: [{ name: 'UsernameSetup' }] });
      } else {
        navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
      }
    }
  }, [isAuthenticated, needsOnboarding]);

  const handleSignUp = async () => {
    if (!name || !email || !password) {
      setLocalError('Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return;
    }
    setLocalError(null);
    await register(email.trim(), name.trim(), password);
  };

  const handleGoogleSignIn = async () => {
    setLocalError(null);
    await signInWithGoogle();
  };

  const displayError = localError || error;

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.iconContainer}>
          <Ionicons name="people" size={40} color={Colors.PrimaryRed} />
        </View>

        <Text style={styles.title}>Join the National Dialogue</Text>
        <Text style={styles.subtitle}>Become a verified participant in Jan Samvad.</Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            placeholderTextColor="#64748B"
            value={name}
            onChangeText={(text) => { setName(text); setLocalError(null); }}
          />

          <TextInput
            style={styles.input}
            placeholder="Email Address"
            placeholderTextColor="#64748B"
            value={email}
            onChangeText={(text) => { setEmail(text); setLocalError(null); }}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#64748B"
            value={password}
            onChangeText={(text) => { setPassword(text); setLocalError(null); }}
            secureTextEntry
          />
        </View>

        {displayError && (
          <Text style={styles.errorText}>{displayError}</Text>
        )}

        <TouchableOpacity 
          style={styles.buttonContainer} 
          onPress={handleSignUp}
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
              <Text style={styles.buttonText}>Join Forum</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.dividerContainer}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>  OR  </Text>
          <View style={styles.divider} />
        </View>

        <TouchableOpacity 
          style={styles.googleButton} 
          onPress={handleGoogleSignIn}
          disabled={isLoading}
        >
          <Ionicons name="logo-google" size={22} color="#DB4437" />
          <Text style={styles.googleButtonText}>Continue with Google</Text>
        </TouchableOpacity>

        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => { clearState(); navigation.goBack(); }}>
            <Text style={styles.loginText}>Log In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
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
  },
  inputContainer: {
    width: '100%',
    gap: 16,
  },
  input: {
    width: '100%',
    height: 56,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#000000',
    backgroundColor: '#FFFFFF',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    marginTop: 12,
    alignSelf: 'flex-start',
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
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginTop: 28,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#CBD5E1',
  },
  dividerText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: 'bold',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    gap: 12,
    marginBottom: 32,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  footerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    color: '#64748B',
    fontSize: 14,
  },
  loginText: {
    color: '#E53935',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
