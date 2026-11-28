import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { navigateAfterAuth } from '../../utils/authReturn';
import PostsAppLogo from '../../components/PostsAppLogo';

export default function AuthCallbackScreen() {
  const navigation = useNavigation<any>();
  const { finalizeWebAuthCallback, ensureAuthenticatedUser, needsOnboarding, isAuthenticated, userProfile } = useAuth();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    let active = true;

    const handleCallback = async () => {
      try {
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          const searchParams = new URLSearchParams(window.location.search);
          const hashParams = new URLSearchParams((window.location.hash || '').replace(/^#/, ''));
          const oauthErr =
            searchParams.get('error_description') ||
            hashParams.get('error_description') ||
            searchParams.get('error') ||
            hashParams.get('error');

          if (oauthErr) {
            throw new Error(decodeURIComponent(oauthErr.replace(/\+/g, ' ')));
          }

          await finalizeWebAuthCallback(window.location.href);
        } else {
          const activeUser = await ensureAuthenticatedUser();
          if (!activeUser) throw new Error('No active session received.');
        }
      } catch (err: any) {
        if (active) {
          console.error('[AUTH CALLBACK] Error:', err);
          setErrorMsg('Google sign-in could not be completed. Please try again.');
          setProcessing(false);
        }
      }
    };

    handleCallback();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated && userProfile?.id && !errorMsg) {
      if (needsOnboarding) {
        navigation.reset({ index: 0, routes: [{ name: 'UsernameSetup' }] });
      } else {
        navigateAfterAuth(navigation);
      }
    }
  }, [isAuthenticated, userProfile?.id, needsOnboarding, errorMsg, navigation]);

  return (
    <View style={{ flex: 1, backgroundColor: '#F7F6F2', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <View
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          padding: 32,
          width: '100%',
          maxWidth: 420,
          alignItems: 'center',
          borderWidth: 1,
          borderColor: '#E5E7EB',
        }}
      >
        <View style={{ marginBottom: 20 }}>
          <PostsAppLogo variant="light" size="md" />
        </View>

        {errorMsg ? (
          <>
            <Ionicons name="alert-circle" size={44} color="#DC2626" />
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#111827', marginTop: 12, textAlign: 'center' }}>
              Sign In Incomplete
            </Text>
            <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 8, textAlign: 'center', lineHeight: 20 }}>
              {errorMsg}
            </Text>
            <TouchableOpacity
              style={{
                marginTop: 20,
                backgroundColor: '#D4191F',
                paddingHorizontal: 22,
                paddingVertical: 12,
                borderRadius: 10,
                width: '100%',
                alignItems: 'center',
              }}
              onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Login' }] })}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 14 }}>Back to Sign In</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <ActivityIndicator size="large" color="#D4191F" style={{ marginVertical: 12 }} />
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827', marginTop: 8 }}>
              {processing ? 'Completing sign-in...' : 'Redirecting...'}
            </Text>
            <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 6, textAlign: 'center' }}>
              Verifying your PostsApp account and preferences.
            </Text>
          </>
        )}
      </View>
    </View>
  );
}
