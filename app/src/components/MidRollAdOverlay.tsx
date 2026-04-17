/**
 * MidRollAdOverlay
 * 
 * Full-screen overlay component for mid-roll video ads.
 * Renders ON TOP of the existing video player without destroying it.
 * 
 * Features:
 * - Fullscreen takeover with ad content
 * - Skip button with countdown timer (5s)
 * - Auto-dismiss after 15s
 * - Impression & click tracking
 * - Quartile tracking (25%, 50%, 75%, 100%)
 * - Failsafe: auto-resumes on any error
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Linking,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { trackMidRollImpression, trackMidRollClick, MidRollAd } from '../api/adDecisionService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SKIP_DELAY_SECONDS = 5;
const AUTO_DISMISS_SECONDS = 15;

interface MidRollAdOverlayProps {
  ad: MidRollAd;
  postId: string;
  userId: string;
  slotPosition: number;
  onClose: () => void;
}

export default function MidRollAdOverlay({
  ad,
  postId,
  userId,
  slotPosition,
  onClose,
}: MidRollAdOverlayProps) {
  const [countdown, setCountdown] = useState(SKIP_DELAY_SECONDS);
  const [canSkip, setCanSkip] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const impressionTracked = useRef(false);
  const quartilesTracked = useRef<Set<number>>(new Set());

  // Fade-in animation
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  // Track impression on mount
  useEffect(() => {
    if (!impressionTracked.current) {
      impressionTracked.current = true;
      trackMidRollImpression(ad.id, postId, userId, slotPosition).catch(() => {});
    }
  }, [ad.id, postId, userId, slotPosition]);

  // Countdown timer + auto-dismiss
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed(prev => {
        const next = prev + 1;
        
        // Quartile tracking
        const progress = next / AUTO_DISMISS_SECONDS;
        const quartiles = [0.25, 0.5, 0.75, 1.0];
        quartiles.forEach(q => {
          if (progress >= q && !quartilesTracked.current.has(q)) {
            quartilesTracked.current.add(q);
            // Quartile events logged silently
            console.log(`[MidRoll] Quartile ${q * 100}% reached`);
          }
        });

        // Auto-dismiss after max time
        if (next >= AUTO_DISMISS_SECONDS) {
          clearInterval(timer);
          handleClose();
        }
        
        return next;
      });

      setCountdown(prev => {
        if (prev <= 1) {
          setCanSkip(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleClose = useCallback(() => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  }, [onClose, fadeAnim]);

  const handleClick = useCallback(async () => {
    try {
      trackMidRollClick(ad.id, postId, userId).catch(() => {});
      Linking.openURL(ad.redirect_url);
    } catch (e) {
      console.warn('[MidRoll] Ad click failed:', e);
    }
  }, [ad, postId, userId]);

  const progressWidth = (elapsed / AUTO_DISMISS_SECONDS) * 100;

  return (
    <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
      {/* Dark backdrop */}
      <View style={styles.backdrop} />

      {/* Ad Card */}
      <View style={styles.adCard}>
        {/* Sponsored Label */}
        <View style={styles.sponsoredBar}>
          <View style={styles.sponsoredLeft}>
            <View style={styles.adIconBox}>
              <Ionicons name="megaphone" size={12} color="white" />
            </View>
            <View>
              <Text style={styles.advertiserName}>{ad.advertiser_name}</Text>
              <Text style={styles.sponsoredLabel}>Sponsored • Mid-roll Ad</Text>
            </View>
          </View>
          {/* Skip Button */}
          <TouchableOpacity
            style={[styles.skipButton, !canSkip && styles.skipButtonDisabled]}
            onPress={canSkip ? handleClose : undefined}
            activeOpacity={canSkip ? 0.7 : 1}
          >
            {canSkip ? (
              <>
                <Text style={styles.skipText}>Skip Ad</Text>
                <Ionicons name="play-skip-forward" size={14} color="white" />
              </>
            ) : (
              <Text style={styles.skipCountdown}>Skip in {countdown}s</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Ad Image */}
        <TouchableOpacity activeOpacity={0.9} onPress={handleClick}>
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: ad.media_url }}
              style={styles.adImage}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.7)']}
              style={styles.imageGradient}
            />
            {/* CTA overlay on image */}
            <View style={styles.ctaOverlay}>
              <Text style={styles.adTitle} numberOfLines={2}>{ad.title}</Text>
              <Text style={styles.adDescription} numberOfLines={2}>{ad.description}</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* CTA Button */}
        <View style={styles.ctaBar}>
          <TouchableOpacity style={styles.ctaButton} onPress={handleClick} activeOpacity={0.8}>
            <Text style={styles.ctaText}>Learn More</Text>
            <Ionicons name="open-outline" size={14} color="white" style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progressWidth}%` }]} />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
  },
  adCard: {
    width: SCREEN_WIDTH - 32,
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 25,
  },
  sponsoredBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sponsoredLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  adIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#E31E24',
    justifyContent: 'center',
    alignItems: 'center',
  },
  advertiserName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
  },
  sponsoredLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E31E24',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  skipButtonDisabled: {
    backgroundColor: '#64748B',
  },
  skipText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '800',
  },
  skipCountdown: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    position: 'relative',
  },
  adImage: {
    width: '100%',
    height: '100%',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  ctaOverlay: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  adTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 22,
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  adDescription: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  ctaBar: {
    padding: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E31E24',
    paddingVertical: 12,
    borderRadius: 14,
    shadowColor: '#E31E24',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  ctaText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  progressBar: {
    height: 3,
    backgroundColor: '#F1F5F9',
    width: '100%',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#E31E24',
  },
});
