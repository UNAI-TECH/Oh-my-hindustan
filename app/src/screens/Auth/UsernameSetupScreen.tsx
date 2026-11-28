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
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import PostsAppLogo from '../../components/PostsAppLogo';
import WebAuthShell, { webAuthCardStyles } from '../../components/web/WebAuthShell';

export default function UsernameSetupScreen() {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
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
    } catch {
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
      }, 450);
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
    setErrorMsg(null);
    try {
      await updateOnboardingProfile({ username });
      navigation.navigate('ProfileImageUpload');
    } catch (e: any) {
      console.error('Username save failed:', e);
      setErrorMsg('Something went wrong while saving your username. Please try again.');
    }
  };

  useEffect(() => {
    const rawSeed = userProfile?.channel_name || userProfile?.email?.split('@')[0] || '';
    const cleaned = cleanUsername(rawSeed).slice(0, 20);
    if (!username && cleaned.length >= 3) {
      setUsername(cleaned);
      checkUsername(cleaned);
    }
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [userProfile?.channel_name, userProfile?.email]);

  const cardInner = (
    <View style={styles.cardBody}>
      {/* Step 1 of 2 Progress */}
      <View style={styles.stepHeader}>
        <Text style={styles.stepBadgeText}>STEP 1 OF 2</Text>
        <View style={styles.stepBarsRow}>
          <View style={[styles.stepBar, styles.stepBarActive]} />
          <View style={styles.stepBar} />
        </View>
      </View>

      <Text style={webAuthCardStyles.title}>{'Choose your\nusername'}</Text>
      <Text style={webAuthCardStyles.subtitle}>
        Pick a unique @handle so readers and creators can recognize you.
      </Text>

      <View style={webAuthCardStyles.form}>
        <View
          style={[
            webAuthCardStyles.inputWrap,
            isAvailable === true && styles.inputWrapValid,
            isAvailable === false && styles.inputWrapInvalid,
          ]}
        >
          <Text style={styles.atSymbol}>@</Text>
          <TextInput
            style={webAuthCardStyles.input}
            placeholder="username"
            placeholderTextColor="#9CA3AF"
            value={username}
            onChangeText={handleUsernameChange}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={24}
            onSubmitEditing={handleContinue}
          />
          {isChecking && <ActivityIndicator size="small" color="#D4191F" />}
          {!isChecking && isAvailable === true && (
            <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
          )}
          {!isChecking && isAvailable === false && (
            <Ionicons name="close-circle" size={20} color="#DC2626" />
          )}
        </View>

        {errorMsg ? <Text style={webAuthCardStyles.errorText}>{errorMsg}</Text> : null}

        {isAvailable === true ? (
          <Text style={styles.availableText}>✓ @{username} is available!</Text>
        ) : null}

        {suggestions.length > 0 && (
          <View style={styles.suggestionsBox}>
            <Text style={styles.suggestionsTitle}>Available suggestions</Text>
            <View style={styles.suggestionsWrap}>
              {suggestions.map((suggestion) => (
                <TouchableOpacity
                  key={suggestion}
                  style={styles.suggestionChip}
                  onPress={() => handleSuggestionTap(suggestion)}
                >
                  <Text style={styles.suggestionText}>@{suggestion}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[
            webAuthCardStyles.primaryBtn,
            (!isAvailable || isLoading) && styles.primaryBtnDisabled,
          ]}
          onPress={handleContinue}
          disabled={!isAvailable || isLoading}
          activeOpacity={0.88}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <View style={styles.btnContent}>
              <Text style={webAuthCardStyles.primaryBtnText}>Continue</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  if (Platform.OS === 'web') {
    return <WebAuthShell>{cardInner}</WebAuthShell>;
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.nativeContainer}
    >
      <ScrollView
        contentContainerStyle={styles.nativeScroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ marginBottom: 20, alignItems: 'center' }}>
          <PostsAppLogo variant="light" size="md" />
        </View>
        <View style={styles.nativeCard}>{cardInner}</View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const getStyles = (_colors: any) =>
  StyleSheet.create({
    cardBody: {
      width: '100%',
    },
    stepHeader: {
      marginBottom: 18,
      gap: 8,
    },
    stepBadgeText: {
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 1,
      color: '#D4191F',
    },
    stepBarsRow: {
      flexDirection: 'row',
      gap: 8,
    },
    stepBar: {
      flex: 1,
      height: 4,
      borderRadius: 999,
      backgroundColor: '#E5E7EB',
    },
    stepBarActive: {
      backgroundColor: '#D4191F',
    },
    atSymbol: {
      fontSize: 17,
      fontWeight: '800',
      color: '#6B7280',
      marginRight: 6,
    },
    inputWrapValid: {
      borderColor: '#16A34A',
      backgroundColor: '#F0FDF4',
    },
    inputWrapInvalid: {
      borderColor: '#DC2626',
      backgroundColor: '#FEF2F2',
    },
    availableText: {
      color: '#16A34A',
      fontSize: 12,
      fontWeight: '700',
    },
    suggestionsBox: {
      padding: 12,
      backgroundColor: '#F9FAFB',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      gap: 8,
    },
    suggestionsTitle: {
      fontSize: 11,
      fontWeight: '700',
      color: '#6B7280',
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    suggestionsWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    suggestionChip: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      backgroundColor: '#FFFFFF',
      borderRadius: 999,
      borderWidth: 1,
      borderColor: '#FCA5A5',
    },
    suggestionText: {
      fontSize: 12,
      color: '#D4191F',
      fontWeight: '700',
    },
    primaryBtnDisabled: {
      backgroundColor: '#D1D5DB',
    },
    btnContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    nativeContainer: {
      flex: 1,
      backgroundColor: '#F7F6F2',
    },
    nativeScroll: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: 20,
    },
    nativeCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: 20,
      padding: 24,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.06,
      shadowRadius: 20,
      elevation: 4,
    },
  });
