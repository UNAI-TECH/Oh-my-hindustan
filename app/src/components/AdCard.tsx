import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabaseClient';
import { useAppTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Extended interface to match the new 'ads' table schema
export interface AdData {
  id: string;
  title: string;
  description: string;
  media_url: string;
  redirect_url: string;
  advertiser_name: string;
  pricing_model: 'cpc' | 'cpm';
  __isAd: true;
}

interface AdCardProps {
  ad: AdData;
}

export default function AdCard({ ad }: AdCardProps) {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const { t } = useTranslation();

  const handlePress = async () => {
    try {
      // 1. Log the click via high-performance RPC (handles budget logic atomically)
      const { data: { session } } = await supabase.auth.getSession();
      await supabase.rpc('track_ad_click', {
        p_ad_id: ad.id,
        p_user_id: session?.user?.id || 'anonymous'
      });
      
      // 2. Open the URL
      Linking.openURL(ad.redirect_url);
    } catch (err) {
      console.warn('Ad click handling failed:', err);
      // Fallback open even if tracking fails to not hurt user experience
      Linking.openURL(ad.redirect_url);
    }
  };

  return (
    <View style={styles.adContainer}>
      <View style={styles.adCard}>
        {/* Ad Header */}
        <View style={styles.adHeader}>
          <View style={styles.adLogoBox}>
            <Ionicons name="megaphone" size={16} color="white" />
          </View>
          <View style={styles.adHeaderInfo}>
            <Text style={styles.adBrandName} numberOfLines={1}>{ad.advertiser_name}</Text>
            <View style={styles.sponsoredBadge}>
              <Text style={styles.adSponsoredLabel}>{t('ads.sponsored') || 'Sponsored'}</Text>
              <Ionicons name="globe-outline" size={10} color={colors.Slate400} style={{ marginLeft: 4 }} />
            </View>
          </View>
        </View>
        
        {/* Main Ad Content */}
        <TouchableOpacity activeOpacity={0.9} onPress={handlePress}>
          <View style={styles.adBanner}>
            <Image 
              source={{ uri: ad.media_url }} 
              style={styles.adImage} 
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.6)']}
              style={styles.imageOverlay}
            />
          </View>
          
          <View style={styles.adContent}>
            <Text style={styles.adHeadline} numberOfLines={2}>{ad.title}</Text>
            <Text style={styles.adSubtext} numberOfLines={2}>{ad.description}</Text>
          </View>
        </TouchableOpacity>
        
        {/* Meta-style Footer */}
        <View style={styles.adFooter}>
          <TouchableOpacity 
            style={[styles.adCTAButton, { backgroundColor: colors.PrimaryRed }]}
            onPress={handlePress}
          >
            <Text style={styles.adCTAText}>{t('ads.learn_more') || 'Learn More'}</Text>
            <Ionicons name="open-outline" size={14} color="white" style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  adContainer: {
    paddingVertical: 10,
  },
  adCard: {
    backgroundColor: colors.SurfaceWhite,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  adHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    paddingHorizontal: 16,
  },
  adLogoBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.PrimaryRed,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.PrimaryRed,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  adHeaderInfo: { 
    flex: 1, 
    marginLeft: 12 
  },
  adBrandName: { 
    fontWeight: '800', 
    fontSize: 15, 
    color: '#1E293B',
    letterSpacing: -0.3,
  },
  sponsoredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
  },
  adSponsoredLabel: { 
    fontSize: 11, 
    color: colors.Slate400,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  moreOptions: {
    padding: 4,
  },
  adBanner: { 
    width: '100%', 
    aspectRatio: 1.91,
    backgroundColor: '#F8FAFC',
    position: 'relative',
  },
  adImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover'
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
  },
  adContent: {
    padding: 16,
    paddingBottom: 4,
  },
  adHeadline: {
    color: '#1E293B',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 6,
    lineHeight: 22,
    letterSpacing: -0.4,
  },
  adSubtext: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  adFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginTop: 12,
  },
  adCTAButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 14,
    shadowColor: colors.PrimaryRed,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  adCTAText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  adEngagement: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  engagementItem: {
    padding: 4,
    opacity: 0.7,
  }
});
