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
  Alert,
  useWindowDimensions
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import CustomModal from '../../components/CustomModal';
import PostsAppLogo from '../../components/PostsAppLogo';
import WebAuthShell, { webAuthCardStyles } from '../../components/web/WebAuthShell';
import { navigateAfterAuth } from '../../utils/authReturn';

export default function SignUpScreen() {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const navigation = useNavigation<any>();
  const { width } = useWindowDimensions();
  const isWebDesktop = Platform.OS === 'web' && width >= 768;
  const { register, signInWithGoogle, isLoading, error, isAuthenticated, needsOnboarding, clearState } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [modalConfig, setModalConfig] = useState({ visible: false, title: '', message: '', isError: false });

  useEffect(() => {
    clearState();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      if (needsOnboarding) {
        navigation.reset({ index: 0, routes: [{ name: 'UsernameSetup' }] });
      } else {
        navigateAfterAuth(navigation);
      }
    }
  }, [isAuthenticated, needsOnboarding]);

  useEffect(() => {
    if (error && Platform.OS !== 'web') {
      setModalConfig({ visible: true, title: 'Authentication Failed', message: error, isError: true });
    }
  }, [error]);

  const handleSignUp = async () => {
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanMobile = mobile.trim();

    if (cleanName.length < 2) {
      setLocalError('Please enter your full name (at least 2 characters).');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setLocalError('Please enter a valid email address.');
      return;
    }
    if (cleanMobile.replace(/\D/g, '').length < 7) {
      setLocalError('Please enter a valid mobile number (at least 7 digits).');
      return;
    }
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }

    setLocalError(null);
    const outcome = await register(cleanEmail, cleanName, password, cleanMobile);
    if (outcome === 'confirmation_required') {
      navigation.navigate('OTP', { email: cleanEmail });
    }
  };

  const handleGoogleSignIn = async () => {
    setLocalError(null);
    await signInWithGoogle();
  };

  const displayError = localError || error;

  if (Platform.OS === 'web') {
    return (
      <>
        <WebAuthShell>
          <Text style={webAuthCardStyles.title}>{'Join\nPostsApp'}</Text>
          <Text style={webAuthCardStyles.subtitle}>Please login or sign up to continue</Text>

          <View style={webAuthCardStyles.form}>
            <View style={webAuthCardStyles.inputWrap}>
              <Ionicons name="person-outline" size={18} color="#18181B" style={webAuthCardStyles.inputIcon} />
              <TextInput
                style={webAuthCardStyles.input}
                placeholder="Full Name"
                placeholderTextColor="#6B7280"
                value={name}
                onChangeText={(text) => { setName(text); setLocalError(null); }}
              />
            </View>

            <View style={webAuthCardStyles.inputWrap}>
              <Ionicons name="mail-outline" size={18} color="#18181B" style={webAuthCardStyles.inputIcon} />
              <TextInput
                style={webAuthCardStyles.input}
                placeholder="Your Email"
                placeholderTextColor="#6B7280"
                value={email}
                onChangeText={(text) => { setEmail(text); setLocalError(null); }}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={webAuthCardStyles.inputWrap}>
              <Ionicons name="call-outline" size={18} color="#18181B" style={webAuthCardStyles.inputIcon} />
              <TextInput
                style={webAuthCardStyles.input}
                placeholder="Mobile Number"
                placeholderTextColor="#6B7280"
                value={mobile}
                onChangeText={(text) => { setMobile(text); setLocalError(null); }}
                keyboardType="phone-pad"
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

            <View style={webAuthCardStyles.inputWrap}>
              <Ionicons name="shield-checkmark-outline" size={18} color="#18181B" style={webAuthCardStyles.inputIcon} />
              <TextInput
                style={webAuthCardStyles.input}
                placeholder="Confirm Password"
                placeholderTextColor="#6B7280"
                value={confirmPassword}
                onChangeText={(text) => { setConfirmPassword(text); setLocalError(null); }}
                secureTextEntry={!showConfirmPassword}
                onSubmitEditing={handleSignUp}
              />
              <TouchableOpacity
                style={webAuthCardStyles.eyeBtn}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons
                  name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
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
              onPress={handleSignUp}
              disabled={isLoading}
              activeOpacity={0.88}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={webAuthCardStyles.primaryBtnText}>Sign Up</Text>
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
            <Text style={webAuthCardStyles.footerMuted}>Already Have An Account? </Text>
            <TouchableOpacity onPress={() => { clearState(); navigation.navigate('Login' as never); }}>
              <Text style={webAuthCardStyles.footerLink}>Login</Text>
            </TouchableOpacity>
          </View>
        </WebAuthShell>

        <CustomModal
          visible={modalConfig.visible}
          title={modalConfig.title}
          message={modalConfig.message}
          isError={modalConfig.isError}
          onPrimaryPress={() => setModalConfig(prev => ({ ...prev, visible: false }))}
        />
      </>
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

        <Text style={styles.title}>Join PostsApp</Text>
        <Text style={styles.subtitle}>Become a verified participant on PostsApp.</Text>

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
            placeholder="Mobile Number"
            placeholderTextColor="#64748B"
            value={mobile}
            onChangeText={(text) => { setMobile(text); setLocalError(null); }}
            keyboardType="phone-pad"
          />

          {/* Password with eye icon */}
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

          {/* Confirm Password with eye icon */}
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Confirm Password"
              placeholderTextColor="#64748B"
              value={confirmPassword}
              onChangeText={(text) => { setConfirmPassword(text); setLocalError(null); }}
              secureTextEntry={!showConfirmPassword}
            />
            <TouchableOpacity 
              style={styles.eyeIcon} 
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <Ionicons 
                name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} 
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
          onPress={handleSignUp}
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
        </View>
      </ScrollView>
      <CustomModal 
        visible={modalConfig.visible} 
        title={modalConfig.title} 
        message={modalConfig.message} 
        isError={modalConfig.isError} 
        onPrimaryPress={() => setModalConfig(prev => ({ ...prev, visible: false }))} 
      />
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
  loginText: {
    color: colors.PrimaryRed,
    fontWeight: 'bold',
    fontSize: 14,
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
