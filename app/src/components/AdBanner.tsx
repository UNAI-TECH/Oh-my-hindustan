import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

interface AdBannerProps {
  unitId?: string;
  size?: BannerAdSize;
}

// Production Banner ID provided by user
const PRODUCTION_AD_UNIT_ID = 'ca-app-pub-5668057018566639/8753715926';

// Toggle this for development
const IS_PRODUCTION = !__DEV__;

/**
 * Reusable AdMob Banner Component
 */
const AdBanner: React.FC<AdBannerProps> = ({ 
  unitId = PRODUCTION_AD_UNIT_ID, 
  size = BannerAdSize.ANCHORED_ADAPTIVE_BANNER 
}) => {
  // Use TestId in development to prevent account flags
  const finalUnitId = IS_PRODUCTION ? unitId : TestIds.BANNER;

  return (
    <View style={styles.container}>
      <BannerAd
        unitId={finalUnitId}
        size={size}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
        onAdFailedToLoad={(error) => {
          console.warn('Ad failed to load: ', error.message);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
    width: '100%',
    minHeight: 50,
  },
});

export default AdBanner;
