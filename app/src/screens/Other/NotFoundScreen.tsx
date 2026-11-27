import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import WebPageShell from '../../components/web/WebPageShell';
import WebHeadSeo from '../../seo/WebHeadSeo';
import { SITE_URL } from '../../seo/seoUtils';
import { useSiteLanguage } from '../../context/SiteLanguageContext';

export default function NotFoundScreen() {
  const navigation = useNavigation<any>();
  const { width } = useWindowDimensions();
  const isWebDesktop = Platform.OS === 'web';
  const { lang } = useSiteLanguage();

  const body = (
    <View style={styles.box}>
      <WebHeadSeo
        config={{
          title: lang === 'ta' ? 'பக்கம் கிடைக்கவில்லை | PostsApp' : 'Page Not Found | PostsApp',
          description: 'The requested page could not be found.',
          canonicalUrl: `${SITE_URL}/${lang}/404`,
          lang,
          robots: 'noindex, follow',
        }}
      />
      <View style={styles.badge}>
        <Text style={styles.badgeText}>404 NOT FOUND</Text>
      </View>
      <Text style={styles.title}>
        {lang === 'ta' ? 'நீங்கள் தேடும் பக்கம் கிடைக்கவில்லை' : 'The requested page could not be found'}
      </Text>
      <Text style={styles.desc}>
        {lang === 'ta'
          ? 'இணைப்பு தவறாக இருக்கலாம் அல்லது கட்டுரை நீக்கப்பட்டிருக்கலாம்.'
          : 'The URL may have changed, or the story may have been archived.'}
      </Text>
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => navigation.navigate('Home', { initialCategory: 'home' })}
        >
          <Text style={styles.primaryText}>{lang === 'ta' ? 'முகப்புக்குச் செல்' : 'Go to Home'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => navigation.navigate('Search')}
        >
          <Text style={styles.secondaryText}>{lang === 'ta' ? 'செய்திகளைத் தேடு' : 'Search News'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isWebDesktop) {
    return <WebPageShell maxWidth={760}>{body}</WebPageShell>;
  }

  return <SafeAreaView style={styles.safe}>{body}</SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF', justifyContent: 'center' },
  box: { alignItems: 'center', paddingVertical: 64, paddingHorizontal: 24, gap: 14 },
  badge: { backgroundColor: '#FEE2E2', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 99 },
  badgeText: { color: '#D4191F', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  title: { fontSize: 24, fontWeight: '800', color: '#111827', textAlign: 'center' },
  desc: { fontSize: 14, color: '#6B7280', textAlign: 'center', maxWidth: 420 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  primaryBtn: { backgroundColor: '#D4191F', paddingHorizontal: 18, paddingVertical: 11, borderRadius: 8 },
  primaryText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  secondaryBtn: { backgroundColor: '#F3F4F6', paddingHorizontal: 18, paddingVertical: 11, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  secondaryText: { color: '#111827', fontSize: 13, fontWeight: '700' },
});
