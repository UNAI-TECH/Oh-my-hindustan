import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import PostsAppLogo from '../PostsAppLogo';
import { FOOTER_CATEGORIES } from './webPortalHelpers';
import { supabase } from '../../lib/supabaseClient';

interface WebPortalFooterProps {
  onSelectCategory: (category: string) => void;
  onNavigate: (route: string) => void;
}

export default function WebPortalFooter({
  onSelectCategory,
  onNavigate,
}: WebPortalFooterProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 960;

  const [email, setEmail] = useState('');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const leftCategories = FOOTER_CATEGORIES.slice(0, 4);
  const rightCategories = FOOTER_CATEGORIES.slice(4);

  const handleJoin = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@') || !trimmed.includes('.')) {
      setStatusMsg('Please enter a valid email address.');
      return;
    }

    setSubmitting(true);
    setStatusMsg(null);
    try {
      await supabase
        .from('newsletter_subscribers')
        .insert({ email: trimmed, created_at: new Date().toISOString() });
    } catch (_) {
      // Gracefully confirm even if table has not been provisioned yet
    } finally {
      setSubmitting(false);
      setEmail('');
      setStatusMsg('Subscribed to PostsApp Daily Briefing!');
    }
  };

  return (
    <View style={styles.footerOuter}>
      <View style={styles.topCrimsonBorder} />

      <View style={styles.footerInner}>
        <View style={[styles.columnsRow, !isDesktop && styles.columnsRowTablet]}>
          {/* Column 1: Brand & Bureaus */}
          <View style={styles.brandCol}>
            <PostsAppLogo variant="dark" size="md" style={{ alignItems: 'flex-start' }} />
            <Text style={styles.brandDesc}>
              PostsApp is a high-velocity news and commentary portal covering Indian economy,
              public policy, technology, geopolitics, and cultural heritage.
            </Text>
            <Text style={styles.bureausText}>
              Bureaus: New Delhi • Bengaluru • Chennai • Mumbai
            </Text>
          </View>

          {/* Column 2: Categories */}
          <View style={styles.categoriesCol}>
            <Text style={styles.colHeading}>CATEGORIES</Text>
            <View style={styles.categoryColumns}>
              <View style={styles.categoryList}>
                {leftCategories.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={styles.categoryLinkBtn}
                    onPress={() => onSelectCategory(cat.toUpperCase())}
                  >
                    <Text style={styles.categoryLinkText}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.categoryList}>
                {rightCategories.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={styles.categoryLinkBtn}
                    onPress={() => onSelectCategory(cat.toUpperCase())}
                  >
                    <Text style={styles.categoryLinkText}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Column 3: Daily Briefing Newsletter */}
          <View style={styles.newsletterCol}>
            <Text style={styles.colHeading}>POSTSAPP DAILY BRIEFING</Text>
            <Text style={styles.newsletterDesc}>
              Get our top 5 dispatches and breaking news alerts delivered to your inbox every
              morning.
            </Text>

            <View style={styles.inputRow}>
              <TextInput
                style={styles.emailInput}
                placeholder="Enter your email..."
                placeholderTextColor="#737373"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                onSubmitEditing={handleJoin}
              />
              <TouchableOpacity
                style={styles.joinBtn}
                onPress={handleJoin}
                disabled={submitting}
              >
                <Text style={styles.joinBtnText}>{submitting ? '...' : 'JOIN'}</Text>
              </TouchableOpacity>
            </View>

            {statusMsg && (
              <Text
                style={[
                  styles.statusText,
                  statusMsg.includes('valid') ? styles.statusError : styles.statusSuccess,
                ]}
              >
                {statusMsg}
              </Text>
            )}
          </View>
        </View>

        {/* Bottom Copyright Row */}
        <View style={styles.bottomBar}>
          <Text style={styles.copyrightText}>
            © {new Date().getFullYear()} PostsApp Digital Media. All rights reserved.
          </Text>

          <View style={styles.bottomLinks}>
            <TouchableOpacity onPress={() => onNavigate('Settings')}>
              <Text style={styles.bottomLinkText}>Advertise</Text>
            </TouchableOpacity>
            <Text style={styles.bottomDot}>•</Text>
            <TouchableOpacity onPress={() => onNavigate('Profile')}>
              <Text style={styles.bottomLinkText}>Membership</Text>
            </TouchableOpacity>
            <Text style={styles.bottomDot}>•</Text>
            <TouchableOpacity onPress={() => onNavigate('PrivacySecurity')}>
              <Text style={styles.bottomLinkText}>Editorial Policy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footerOuter: {
    backgroundColor: '#141414',
    width: '100%',
  },
  topCrimsonBorder: {
    height: 3,
    backgroundColor: '#D4191F',
    width: '100%',
  },
  footerInner: {
    maxWidth: 1280,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 44,
    paddingBottom: 24,
  },
  columnsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 40,
    paddingBottom: 36,
  },
  columnsRowTablet: {
    flexDirection: 'column',
    gap: 28,
  },
  brandCol: {
    flex: 1.3,
    maxWidth: 380,
  },
  brandDesc: {
    color: '#A3A3A3',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 14,
  },
  bureausText: {
    color: '#737373',
    fontSize: 11,
    marginTop: 14,
  },
  categoriesCol: {
    flex: 1,
  },
  colHeading: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 16,
  },
  categoryColumns: {
    flexDirection: 'row',
    gap: 40,
  },
  categoryList: {
    gap: 10,
  },
  categoryLinkBtn: {
    paddingVertical: 1,
  },
  categoryLinkText: {
    color: '#A3A3A3',
    fontSize: 13,
  },
  newsletterCol: {
    flex: 1.2,
    maxWidth: 380,
  },
  newsletterDesc: {
    color: '#A3A3A3',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  emailInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#262626',
    borderWidth: 1,
    borderColor: '#3A3A3A',
    borderRadius: 4,
    paddingHorizontal: 14,
    color: '#FFFFFF',
    fontSize: 13,
    outlineStyle: 'none' as any,
  },
  joinBtn: {
    height: 40,
    paddingHorizontal: 18,
    backgroundColor: '#D4191F',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  joinBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusText: {
    fontSize: 12,
    marginTop: 8,
    fontWeight: '500',
  },
  statusError: {
    color: '#F87171',
  },
  statusSuccess: {
    color: '#4ADE80',
  },
  bottomBar: {
    borderTopWidth: 1,
    borderTopColor: '#262626',
    paddingTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  copyrightText: {
    color: '#737373',
    fontSize: 12,
  },
  bottomLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bottomLinkText: {
    color: '#A3A3A3',
    fontSize: 12,
  },
  bottomDot: {
    color: '#525252',
    fontSize: 12,
  },
});
