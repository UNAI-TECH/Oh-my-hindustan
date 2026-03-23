import React, { useState, useCallback, useEffect, useRef } from 'react';
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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/Theme';
import { useAuth } from '../../context/AuthContext';

export default function UsernameSetupScreen() {
  const navigation = useNavigation<any>();
  const { checkUsernameAvailability, updateOnboardingProfile, isLoading, userProfile } = useAuth();
  const [username, setUsername] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cleanUsername = (text: string) => {
    return text.toLowerCase().replace(/[^a-z0-9_]/g, '');
  };

  const checkUsername = useCallback(async (name: string) => {
    if (name.length < 3) {
      setIsAvailable(null);
      setSuggestions([]);
      setErrorMsg(name.length > 0 ? 'Username must be at least 3 characters' : null);
      return;
    }

    setIsChecking(true);
    setErrorMsg(null);
    try {
      const result = await checkUsernameAvailability(name);
      setIsAvailable(result.available);
      setSuggestions(result.suggestions);
      if (!result.available) {
        setErrorMsg('This username is already taken');
      }
    } catch (e) {
      setErrorMsg('Error checking username');
    } finally {
      setIsChecking(false);
    }
  }, [checkUsernameAvailability]);

  const handleUsernameChange = (text: string) => {
    const cleaned = cleanUsername(text);
    setUsername(cleaned);
    setIsAvailable(null);
    setSuggestions([]);
    setErrorMsg(null);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (cleaned.length >= 3) {
      debounceTimer.current = setTimeout(() => {
        checkUsername(cleaned);
      }, 500);
    } else if (cleaned.length > 0) {
      setErrorMsg('Username must be at least 3 characters');
    }
  };

  const handleSuggestionTap = (suggestion: string) => {
    setUsername(suggestion);
    setIsAvailable(true);
    setSuggestions([]);
    setErrorMsg(null);
  };

  const handleContinue = async () => {
    if (!isAvailable || username.length < 3) return;
    try {
      await updateOnboardingProfile({ username });
      navigation.navigate('LanguageSelection');
    } catch (e) {
      // Error is handled in context
    }
  };

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.stepIndicator}>
          <View style={[styles.stepDot, styles.stepDotActive]} />
          <View style={styles.stepLine} />
          <View style={styles.stepDot} />
          <View style={styles.stepLine} />
          <View style={styles.stepDot} />
        </View>

        <View style={styles.iconContainer}>
          <Ionicons name="person-add" size={36} color={Colors.PrimaryRed} />
        </View>

        <Text style={styles.title}>Choose your username</Text>
        <Text style={styles.subtitle}>
          This is how other users will find you.{'\n'}
          Pick something unique!
        </Text>

        <View style={styles.inputWrapper}>
          <Text style={styles.atSymbol}>@</Text>
          <TextInput
            style={styles.input}
            placeholder="username"
            placeholderTextColor="#94A3B8"
            value={username}
            onChangeText={handleUsernameChange}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={24}
          />
          {isChecking && (
            <ActivityIndicator size="small" color={Colors.PrimaryRed} style={styles.inputIcon} />
          )}
          {!isChecking && isAvailable === true && (
            <Ionicons name="checkmark-circle" size={22} color="#16A34A" style={styles.inputIcon} />
          )}
          {!isChecking && isAvailable === false && (
            <Ionicons name="close-circle" size={22} color="#DC2626" style={styles.inputIcon} />
          )}
        </View>

        {errorMsg && (
          <Text style={styles.errorText}>{errorMsg}</Text>
        )}

        {isAvailable === true && (
          <Text style={styles.availableText}>✓ Username is available!</Text>
        )}

        {suggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            <Text style={styles.suggestionsTitle}>Try one of these:</Text>
            {suggestions.map((suggestion) => (
              <TouchableOpacity
                key={suggestion}
                style={styles.suggestionChip}
                onPress={() => handleSuggestionTap(suggestion)}
              >
                <Text style={styles.suggestionText}>@{suggestion}</Text>
                <Ionicons name="arrow-forward" size={14} color={Colors.PrimaryRed} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ flex: 1 }} />

        <TouchableOpacity
          style={[styles.buttonContainer, (!isAvailable || isLoading) && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={!isAvailable || isLoading}
        >
          <LinearGradient
            colors={isAvailable ? ['#E53935', '#FB8C00'] : ['#CBD5E1', '#CBD5E1']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientButton}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <View style={styles.buttonContent}>
                <Text style={styles.buttonText}>Continue</Text>
                <Ionicons name="arrow-forward" size={20} color="white" />
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>
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
    padding: 24,
    paddingTop: Platform.OS === 'android' ? 48 : 60,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
  },
  stepDotActive: {
    backgroundColor: Colors.PrimaryRed,
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 8,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: 'rgba(229, 57, 53, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    backgroundColor: '#F8FAFC',
  },
  atSymbol: {
    fontSize: 18,
    fontWeight: '700',
    color: '#94A3B8',
    marginRight: 4,
  },
  input: {
    flex: 1,
    fontSize: 17,
    color: '#000',
    fontWeight: '500',
  },
  inputIcon: {
    marginLeft: 8,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    marginTop: 10,
    fontWeight: '500',
  },
  availableText: {
    color: '#16A34A',
    fontSize: 13,
    marginTop: 10,
    fontWeight: '600',
  },
  suggestionsContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  suggestionsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  suggestionText: {
    fontSize: 15,
    color: Colors.PrimaryRed,
    fontWeight: '600',
  },
  buttonContainer: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  gradientButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
});
