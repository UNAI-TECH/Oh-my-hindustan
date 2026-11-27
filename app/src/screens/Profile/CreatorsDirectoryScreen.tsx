import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Platform, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabaseClient';
import WebPageShell from '../../components/web/WebPageShell';
import WebHeadSeo from '../../seo/WebHeadSeo';
import { SITE_URL } from '../../seo/seoUtils';
import { useSiteLanguage } from '../../context/SiteLanguageContext';

export default function CreatorsDirectoryScreen() {
  const navigation = useNavigation<any>();
  const { width } = useWindowDimensions();
  const isWebDesktop = Platform.OS === 'web' && width >= 768;
  const { lang } = useSiteLanguage();

  const [creators, setCreators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('User')
      .select('id, username, channel_name, bio, avatarUrl, role')
      .in('role', ['CREATOR', 'ANALYST'])
      .eq('account_status', 'active')
      .is('deleted_at', null)
      .order('createdAt', { ascending: false })
      .then(({ data }) => {
        setCreators(data || []);
        setLoading(false);
      });
  }, []);

  const title = lang === 'ta' ? 'படைப்பாளர்கள் & பத்திரிகையாளர்கள்' : 'Verified Creators & Journalists';

  const content = (
    <View style={styles.container}>
      <WebHeadSeo
        config={{
          title: `${title} | PostsApp`,
          description: 'Explore independent journalists, analysts, and verified creators publishing on PostsApp.',
          canonicalUrl: `${SITE_URL}/${lang}/creators`,
          lang,
          alternates: [
            { hreflang: 'en', href: `${SITE_URL}/en/creators` },
            { hreflang: 'ta', href: `${SITE_URL}/ta/creators` },
          ],
        }}
      />

      <View style={styles.header}>
        <Text style={styles.eyebrow}>DIRECTORY</Text>
        <Text style={styles.title}>{title}</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#D4191F" style={{ marginVertical: 40 }} />
      ) : creators.length === 0 ? (
        <Text style={styles.empty}>No creators available yet.</Text>
      ) : (
        <View style={[styles.grid, isWebDesktop && styles.gridDesktop]}>
          {creators.map((c) => {
            const name = c.channel_name || c.username || 'Creator';
            const avatar = c.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=D4191F&color=fff&size=160`;
            return (
              <TouchableOpacity
                key={c.id}
                style={[styles.card, isWebDesktop && { width: '31.5%' }]}
                onPress={() =>
                  navigation.navigate('CreatorProfile', {
                    authorId: c.username || c.id,
                    authorName: name,
                  })
                }
              >
                <Image source={{ uri: avatar }} style={styles.avatar} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.name} numberOfLines={1}>{name}</Text>
                  <Text style={styles.handle} numberOfLines={1}>@{c.username}</Text>
                  {c.bio ? (
                    <Text style={styles.bio} numberOfLines={2}>{c.bio}</Text>
                  ) : null}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );

  if (isWebDesktop) {
    return <WebPageShell maxWidth={1120}>{content}</WebPageShell>;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.mobileHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 6 }}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.mobileHeaderTitle}>{title}</Text>
        <View style={{ width: 32 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 16 }}>{content}</ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  mobileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  mobileHeaderTitle: { fontSize: 16, fontWeight: '800', color: '#111827' },
  container: { paddingVertical: 16, gap: 18 },
  header: { borderBottomWidth: 1, borderBottomColor: '#E5E7EB', paddingBottom: 14, gap: 4 },
  eyebrow: { fontSize: 11, fontWeight: '900', color: '#D4191F', letterSpacing: 1.2 },
  title: { fontSize: 26, fontWeight: '800', color: '#111827' },
  empty: { color: '#6B7280', fontSize: 14, paddingVertical: 20 },
  grid: { gap: 14 },
  gridDesktop: { flexDirection: 'row', flexWrap: 'wrap', gap: 18 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#F3F4F6' },
  name: { fontSize: 15, fontWeight: '800', color: '#111827' },
  handle: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  bio: { fontSize: 12, color: '#4B5563', marginTop: 4 },
});
