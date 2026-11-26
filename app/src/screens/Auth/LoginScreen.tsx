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
  ActivityIndicator,
  useWindowDimensions
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import PostsAppLogo from '../../components/PostsAppLogo';
import WebAuthShell, { webAuthCardStyles } from '../../components/web/WebAuthShell';

export default function LoginScreen() {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const navigation = useNavigation<any>();
  const { width } = useWindowDimensions();
  const isWebDesktop = Platform.OS === 'web' && width >= 768;
  const { login, signInWithGoogle, signInWithGoogleNative, isLoading, error, loginSuccess, isAuthenticated, needsOnboarding, clearState } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

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

  const handleLogin = async () => {
    if (!identifier || !password) {
      setLocalError('Please enter valid credentials');
      return;
    }
    setLocalError(null);
    await login(identifier.trim(), password);
  };

  const handleGoogleSignIn = async () => {
    setLocalError(null);
    // Switched to Web OAuth to completely bypass the native DEVELOPER_ERROR
    await signInWithGoogle();
  };

  const displayError = localError || error;

  if (Platform.OS === 'web') {
    return (
      <WebAuthShell>
        <Text style={webAuthCardStyles.title}>{'Welcome\nto PostsApp'}</Text>
        <Text style={webAuthCardStyles.subtitle}>Please login or sign up to continue</Text>

        <View style={webAuthCardStyles.form}>
          <View style={webAuthCardStyles.inputWrap}>
            <Ionicons name="mail-outline" size={18} color="#18181B" style={webAuthCardStyles.inputIcon} />
            <TextInput
              style={webAuthCardStyles.input}
              placeholder="Your Email or Username"
              placeholderTextColor="#6B7280"
              value={identifier}
              onChangeText={(text) => { setIdentifier(text); setLocalError(null); }}
              autoCapitalize="none"
            />
          </View>

          <View style={webAuthCardStyles.inputWrap}>
            <Ionicons name="lock-closed-outline" size={18} color="#18181B" style={webAuthCardStyles.inputIcon} />
            <TextInput
              style={webAuthCardStyles.input}
              placeholder="Your Password"
              placeholderTextColor="#6B7280"
              value={password}
              onChangeText={(text) => { setPassword(text); setLocalError(null); }}
              secureTextEntry={!showPassword}
              onSubmitEditing={handleLogin}
            />
            <TouchableOpacity
              style={webAuthCardStyles.eyeBtn}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={19}
                color="#6B7280"
              />
            </TouchableOpacity>
          </View>

          {displayError && (
            <Text style={webAuthCardStyles.errorText}>{displayError}</Text>
          )}

          <TouchableOpacity
            style={webAuthCardStyles.primaryBtn}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.88}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={webAuthCardStyles.primaryBtnText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={webAuthCardStyles.googleBtn}
            onPress={handleGoogleSignIn}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            <Ionicons name="logo-google" size={18} color="#DB4437" />
            <Text style={webAuthCardStyles.googleBtnText}>Google</Text>
          </TouchableOpacity>
        </View>

        <View style={webAuthCardStyles.footerRow}>
          <Text style={webAuthCardStyles.footerMuted}>Don't Have An Account? </Text>
          <TouchableOpacity onPress={() => { clearState(); navigation.navigate('SignUp' as never); }}>
            <Text style={webAuthCardStyles.footerLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>

        {__DEV__ && (
          <TouchableOpacity
            style={styles.devModeButton}
            onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Home' }] })}
          >
            <Ionicons name="code-slash-outline" size={15} color="#6B7280" />
            <Text style={styles.devModeText}>Developer Mode — Skip Login</Text>
          </TouchableOpacity>
        )}
      </WebAuthShell>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, isWebDesktop && { backgroundColor: '#F5F5F7' }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={isWebDesktop ? styles.webAuthCard : { width: '100%', alignItems: 'center' }}>
        {isWebDesktop && (
          <TouchableOpacity style={styles.webBackHome} onPress={() => navigation.navigate('Home')}>
            <Ionicons name="arrow-back" size={16} color="#4B5563" />
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#4B5563' }}>Back to PostsApp</Text>
          </TouchableOpacity>
        )}
        <View style={{ marginBottom: 20 }}>
          <PostsAppLogo variant="light" size="md" />
        </View>

        <Text style={styles.title}>Welcome to PostsApp</Text>
        <Text style={styles.subtitle}>Sign in to read and join the conversation on PostsApp</Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Email, Mobile Number or Username"
            placeholderTextColor="#64748B"
            value={identifier}
            onChangeText={(text) => { setIdentifier(text); setLocalError(null); }}
            autoCapitalize="none"
          />

          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Password"
              placeholderTextColor="#64748B"
              value={password}
              onChangeText={(text) => { setPassword(text); setLocalError(null); }}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity 
              style={styles.eyeIcon} 
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons 
                name={showPassword ? 'eye-off-outline' : 'eye-outline'} 
                size={22} 
                color="#64748B" 
              />
            </TouchableOpacity>
          </View>
        </View>

        {displayError && (
          <Text style={styles.errorText}>{displayError}</Text>
        )}

        <TouchableOpacity 
          style={styles.buttonContainer} 
          onPress={handleLogin}
          disabled={isLoading}
        >
          <LinearGradient
            colors={[colors.PrimaryRed, colors.DeepCrimson]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientButton}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Enter Forum</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.dividerContainer}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>  OR CONNECT WITH  </Text>
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
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => { clearState(); navigation.navigate('SignUp' as never); }}>
            <Text style={styles.signUpText}>Sign Up</Text>
          </TouchableOpacity>
        </View>

        {__DEV__ && (
          <TouchableOpacity 
            style={styles.devModeButton} 
            onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Home' }] })}
          >
            <Ionicons name="code-slash-outline" size={16} color="#6B7280" />
            <Text style={styles.devModeText}>Developer Mode — Skip Login</Text>
          </TouchableOpacity>
        )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
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
    maxWidth: 440,
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
  passwordContainer: {
    width: '100%',
    height: 56,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  passwordInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#000000',
  },
  eyeIcon: {
    paddingHorizontal: 14,
    height: '100%',
    justifyContent: 'center',
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
    maxWidth: 440,
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
    maxWidth: 440,
    marginTop: 32,
    marginBottom: 24,
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
    maxWidth: 440,
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
  signUpText: {
    color: colors.PrimaryRed,
    fontWeight: 'bold',
    fontSize: 14,
  },
  devModeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    gap: 8,
  },
  devModeText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  webAuthCard: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 36,
    alignItems: 'center',
  },
  webBackHome: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginBottom: 18,
  },
});
