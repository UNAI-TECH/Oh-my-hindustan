import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, ActivityIndicator, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import WebPageShell from '../../components/web/WebPageShell';
import WebHeadSeo from '../../seo/WebHeadSeo';
import { SITE_URL } from '../../seo/seoUtils';
import { useSiteLanguage, SiteLang } from '../../context/SiteLanguageContext';
import { AppApi } from '../../api/services';

export type StaticPageKey =
  | 'about'
  | 'contact'
  | 'editorial-policy'
  | 'corrections-policy'
  | 'privacy-policy'
  | 'terms'
  | 'advertise';

const STATIC_CONTENT: Record<StaticPageKey, {
  title: Record<SiteLang, string>;
  subtitle: Record<SiteLang, string>;
  sections: Record<SiteLang, Array<{ heading: string; body: string }>>;
}> = {
  about: {
    title: { en: 'About PostsApp', ta: 'PostsApp பற்றி' },
    subtitle: {
      en: 'Independent, verifiable bilingual digital journalism in English and Tamil.',
      ta: 'ஆங்கிலம் மற்றும் தமிழில் நம்பகமான சுயாதீன இருமொழி செய்தித் தளம்.',
    },
    sections: {
      en: [
        {
          heading: 'Our Mission',
          body: 'PostsApp connects verified journalists, regional analysts, and readers across India with fact-checked coverage on politics, economy, policy, technology, and culture.',
        },
        {
          heading: 'Bilingual Integrity',
          body: 'English and Tamil articles are authored and reviewed independently by human editors without automated machine translation.',
        },
      ],
      ta: [
        {
          heading: 'எங்கள் நோக்கம்',
          body: 'அரசியல், பொருளாதாரம், கொள்கை, தொழில்நுட்பம் மற்றும் கலாச்சாரம் குறித்த உண்மைச் சரிபார்க்கப்பட்ட செய்திகளை ஆங்கிலம் மற்றும் தமிழ் வாசகர்களிடம் கொண்டு சேர்ப்பதே எங்கள் நோக்கம்.',
        },
        {
          heading: 'இருமொழி தரம்',
          body: 'அனைத்து ஆங்கிலம் மற்றும் தமிழ் கட்டுரைகளும் மனித ஆசிரியர்களால் சுயாதீனமாக எழுதிச் சரிபார்க்கப்படுகின்றன.',
        },
      ],
    },
  },
  contact: {
    title: { en: 'Contact the Newsroom', ta: 'செய்தித் துறையைத் தொடர்பு கொள்ள' },
    subtitle: {
      en: 'Reach our editorial desk, reader support, or partnerships team.',
      ta: 'ஆசிரியர் குழு, வாசகர் உதவி அல்லது விளம்பரப் பிரிவைத் தொடர்பு கொள்ளுங்கள்.',
    },
    sections: {
      en: [
        {
          heading: 'Editorial Desk & News Tips',
          body: 'For press releases, news tips, or verification inquiries, write to editorial@postsapp.com.',
        },
        {
          heading: 'Corrections & Reader Feedback',
          body: 'To flag a factual inaccuracy or request a story update, email corrections@postsapp.com with the article URL.',
        },
      ],
      ta: [
        {
          heading: 'செய்தி ஆசிரியர் குழு',
          body: 'செய்தி அறிக்கைகள் மற்றும் தகவல்களுக்கு editorial@postsapp.com என்ற மின்னஞ்சலில் தொடர்பு கொள்ளவும்.',
        },
        {
          heading: 'திருத்தங்கள்',
          body: 'திருத்தங்கள் கோர corrections@postsapp.com என்ற முகவரிக்கு கட்டுரை இணைப்புடன் அனுப்பவும்.',
        },
      ],
    },
  },
  'editorial-policy': {
    title: { en: 'Editorial Policy', ta: 'ஆசிரியர் கொள்கை' },
    subtitle: {
      en: 'Standards for sourcing, impartiality, attribution, and human-reviewed publishing.',
      ta: 'செய்தி ஆதாரங்கள், நடுநிலைமை மற்றும் ஆசிரியர் சரிபார்ப்பு விதிமுறைகள்.',
    },
    sections: {
      en: [
        {
          heading: 'Verification & Attribution',
          body: 'Claims must be grounded in primary documents, direct reporting, or named credible sources. Analysis and commentary are clearly labeled separately from straight reporting.',
        },
        {
          heading: 'Commercial Independence',
          body: 'Sponsored placements are always labeled clearly as Sponsored and never influence editorial newsroom decisions.',
        },
      ],
      ta: [
        {
          heading: 'ஆதார சரிபார்ப்பு',
          body: 'அனைத்துச் செய்திகளும் முதன்மை ஆவணங்கள் மற்றும் நம்பகமான ஆதாரங்களின் அடிப்படையில் மட்டுமே வெளியிடப்படுகின்றன.',
        },
        {
          heading: 'விளம்பரப் பிரிப்பு',
          body: 'விளம்பரங்கள் எப்போதும் "விளம்பரம்" எனத் தெளிவாகக் குறிப்பிடப்படும்.',
        },
      ],
    },
  },
  'corrections-policy': {
    title: { en: 'Corrections Policy', ta: 'திருத்தக் கொள்கை' },
    subtitle: {
      en: 'How factual errors are reviewed, corrected, and logged in revision history.',
      ta: 'தகவல் பிழைகள் ஏற்படும் போது உடனடியாகத் திருத்தப்பட்டுப் பதிவு செய்யப்படும் முறை.',
    },
    sections: {
      en: [
        {
          heading: 'Prompt Corrections',
          body: 'Confirmed factual inaccuracies are updated promptly by an editor or administrator, with every revision timestamped in PostgreSQL revision history.',
        },
      ],
      ta: [
        {
          heading: 'உடனடித் திருத்தம்',
          body: 'உறுதிப்படுத்தப்பட்ட பிழைகள் உடனடியாகத் திருத்தப்பட்டு திருத்த நேரம் பதிவு செய்யப்படும்.',
        },
      ],
    },
  },
  'privacy-policy': {
    title: { en: 'Privacy Policy', ta: 'தனியுரிமைக் கொள்கை' },
    subtitle: {
      en: 'How PostsApp handles account information, reading preferences, and data deletion.',
      ta: 'உங்கள் கணக்குத் தரவு, வாசிப்பு விருப்பங்கள் மற்றும் கணக்கை நீக்கும் உரிமை.',
    },
    sections: {
      en: [
        {
          heading: 'Minimal Data Storage',
          body: 'We store only data required to provide reader profiles, bookmarks, follows, comments, notifications, and language preferences.',
        },
        {
          heading: 'Self-Service Account Deletion',
          body: 'Signed-in readers can permanently deactivate and anonymize their account anytime under Privacy & Security settings.',
        },
      ],
      ta: [
        {
          heading: 'தரவுப் பாதுகாப்பு',
          body: 'வாசகர் கணக்கு, சேமித்த செய்திகள் மற்றும் மொழித் தேர்வுக்குத் தேவையான தரவுகள் மட்டுமே பாதுகாப்பாகச் சேமிக்கப்படுகின்றன.',
        },
        {
          heading: 'கணக்கை நீக்குதல்',
          body: 'தனியுரிமை அமைப்புகள் வழியாக உங்கள் கணக்கை எப்போது வேண்டுமானாலும் நீக்கலாம்.',
        },
      ],
    },
  },
  terms: {
    title: { en: 'Terms of Service', ta: 'சேவை விதிமுறைகள்' },
    subtitle: {
      en: 'Community and publishing rules for PostsApp web, mobile, and Creator Studio.',
      ta: 'PostsApp இணையம், செயலி மற்றும் படைப்பாளர் தளத்தைப் பயன்படுத்துவதற்கான விதிமுறைகள்.',
    },
    sections: {
      en: [
        {
          heading: 'Acceptable Use',
          body: 'Users agree not to submit unlawful, defamatory, or automated spam content. Administrators may suspend or deactivate violating accounts.',
        },
      ],
      ta: [
        {
          heading: 'பயன்பாட்டு விதிகள்',
          body: 'சட்டவிரோத அல்லது அவதூறு கருத்துகளைப் பதிவிடுவது தடை செய்யப்பட்டுள்ளது.',
        },
      ],
    },
  },
  advertise: {
    title: { en: 'Advertise With PostsApp', ta: 'PostsApp-இல் விளம்பரம் செய்ய' },
    subtitle: {
      en: 'Reach bilingual English & Tamil digital readers across web and mobile.',
      ta: 'ஆங்கிலம் மற்றும் தமிழ் வாசகர்களை இணையம் மற்றும் செயலியில் சென்றடையுங்கள்.',
    },
    sections: {
      en: [
        {
          heading: 'Managed Sponsorship Placements',
          body: 'PostsApp supports leaderboard banners, in-feed cards, and mid-roll video placements with transparent CPC/CPM telemetry. Reach ads@postsapp.com for media kits.',
        },
      ],
      ta: [
        {
          heading: 'விளம்பர வாய்ப்புகள்',
          body: 'செய்தித் தளம் மற்றும் வீடியோ பிரிவுகளில் விளம்பரம் செய்ய ads@postsapp.com முகவரியில் தொடர்பு கொள்ளவும்.',
        },
      ],
    },
  },
};

export default function StaticInfoScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { width } = useWindowDimensions();
  const isWebDesktop = Platform.OS === 'web' && width >= 768;
  const { lang } = useSiteLanguage();

  const pageKey = (route.params?.pageKey || 'about') as StaticPageKey;
  const doc = STATIC_CONTENT[pageKey] || STATIC_CONTENT.about;

  const [settings, setSettings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AppApi.getSiteSettingsMap()
      .then(setSettings)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [pageKey]);

  const customOverride = settings?.[`page_${pageKey}_${lang}`];
  const contactEmail = settings?.contact_email;

  const body = (
    <View style={styles.container}>
      <WebHeadSeo
        config={{
          title: `${doc.title[lang]} | PostsApp`,
          description: doc.subtitle[lang],
          canonicalUrl: `${SITE_URL}/${lang}/${pageKey}`,
          lang,
          ogType: 'website',
          alternates: [
            { hreflang: 'en', href: `${SITE_URL}/en/${pageKey}` },
            { hreflang: 'ta', href: `${SITE_URL}/ta/${pageKey}` },
          ],
        }}
      />

      <View style={styles.headerBlock}>
        <Text style={styles.eyebrow}>POSTSAPP</Text>
        <Text style={styles.title}>{doc.title[lang]}</Text>
        <Text style={styles.subtitle}>{doc.subtitle[lang]}</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="small" color="#D4191F" style={{ marginVertical: 24 }} />
      ) : typeof customOverride === 'string' && customOverride.trim() ? (
        <View style={styles.card}>
          <Text style={styles.body}>{customOverride}</Text>
        </View>
      ) : (
        <View style={{ gap: 14 }}>
          {doc.sections[lang].map((s) => (
            <View key={s.heading} style={styles.card}>
              <Text style={styles.cardHeading}>{s.heading}</Text>
              <Text style={styles.body}>{s.body}</Text>
            </View>
          ))}
          {pageKey === 'contact' && typeof contactEmail === 'string' && contactEmail.trim() ? (
            <View style={styles.card}>
              <Text style={styles.cardHeading}>Primary Newsroom Email</Text>
              <Text style={styles.body}>{contactEmail}</Text>
            </View>
          ) : null}
        </View>
      )}
    </View>
  );

  if (isWebDesktop) {
    return <WebPageShell maxWidth={900}>{body}</WebPageShell>;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.mobileHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 6 }}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.mobileHeaderTitle}>{doc.title[lang]}</Text>
        <View style={{ width: 32 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 16 }}>{body}</ScrollView>
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
  headerBlock: { borderBottomWidth: 1, borderBottomColor: '#E5E7EB', paddingBottom: 16, gap: 6 },
  eyebrow: { fontSize: 11, fontWeight: '900', color: '#D4191F', letterSpacing: 1.2 },
  title: { fontSize: 28, fontWeight: '800', color: '#111827' },
  subtitle: { fontSize: 14, color: '#4B5563', lineHeight: 20 },
  card: {
    backgroundColor: '#FAFBFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 18,
    gap: 6,
  },
  cardHeading: { fontSize: 16, fontWeight: '700', color: '#111827' },
  body: { fontSize: 14, color: '#374151', lineHeight: 22 },
});
