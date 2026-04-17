/**
 * useMidRollAds Hook
 * 
 * Custom React hook that manages the entire mid-roll ad lifecycle.
 * Accepts post metadata and returns ad state + controls.
 * 
 * SAFETY: All ad logic is wrapped in try/catch. On any failure,
 * the video continues without interruption.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  getAdSlots,
  requestMidRollAd,
  MidRollAdSlot,
  MidRollAd,
} from './adDecisionService';

const MIN_GAP_BETWEEN_ADS_SECONDS = 20;

/**
 * Parse a video duration string like "2:30", "1:45:00", "90" into total seconds.
 */
function parseDurationToSeconds(duration: string | null | undefined): number {
  if (!duration) return 0;
  const trimmed = duration.trim();
  if (/^\d+$/.test(trimmed)) return parseInt(trimmed, 10);
  const parts = trimmed.split(':').map(Number);
  if (parts.some(isNaN)) return 0;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
}

interface UseMidRollAdsParams {
  postId: string;
  adsEnabled: boolean;
  videoDuration: string | null | undefined;
  userId: string | null | undefined;
}

interface UseMidRollAdsReturn {
  /** Whether an ad should be displayed right now */
  showAd: boolean;
  /** The current ad to display (null if no ad) */
  currentAd: MidRollAd | null;
  /** The current slot position (seconds) */
  currentSlotPosition: number;
  /** Call this when the ad is dismissed (skip/complete) */
  onAdComplete: () => void;
  /** Start the playback timer (call when video starts playing) */
  startTracking: () => void;
  /** Pause the playback timer (call when video is paused) */
  pauseTracking: () => void;
  /** The fetched ad slots */
  adSlots: MidRollAdSlot[];
}

export function useMidRollAds({
  postId,
  adsEnabled,
  videoDuration,
  userId,
}: UseMidRollAdsParams): UseMidRollAdsReturn {
  const [adSlots, setAdSlots] = useState<MidRollAdSlot[]>([]);
  const [showAd, setShowAd] = useState(false);
  const [currentAd, setCurrentAd] = useState<MidRollAd | null>(null);
  const [currentSlotPosition, setCurrentSlotPosition] = useState(0);

  // Track which slots have already been played (by position seconds)
  const playedSlotsRef = useRef<Set<number>>(new Set());
  // Timer refs
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef(0);
  const lastAdTimeRef = useRef(0);
  const isTrackingRef = useRef(false);

  const durationSec = parseDurationToSeconds(videoDuration);

  // Fetch ad slots on mount (only if ads are enabled)
  useEffect(() => {
    if (!adsEnabled || !postId || durationSec < 30) {
      setAdSlots([]);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const slots = await getAdSlots(postId);
        if (!cancelled) setAdSlots(slots);
      } catch (e) {
        console.warn('[useMidRollAds] Failed to load slots:', e);
      }
    })();

    return () => { cancelled = true; };
  }, [postId, adsEnabled, durationSec]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  const checkForAd = useCallback(async () => {
    if (showAd || !userId) return; // Already showing an ad or no user

    const elapsed = elapsedRef.current;

    for (const slot of adSlots) {
      const pos = slot.ad_position_seconds;

      // Skip if already played
      if (playedSlotsRef.current.has(pos)) continue;

      // Check if we've reached this slot
      if (elapsed >= pos) {
        // Enforce minimum gap between ads
        if (elapsed - lastAdTimeRef.current < MIN_GAP_BETWEEN_ADS_SECONDS && lastAdTimeRef.current > 0) {
          continue;
        }

        // Request an ad
        try {
          const ad = await requestMidRollAd({
            userId,
            postId,
          });

          if (ad) {
            playedSlotsRef.current.add(pos);
            lastAdTimeRef.current = elapsed;
            setCurrentAd(ad);
            setCurrentSlotPosition(pos);
            setShowAd(true);
            pauseTracking(); // Pause timer while ad plays
          } else {
            // No ad available — mark slot as played and skip
            playedSlotsRef.current.add(pos);
          }
        } catch (e) {
          // Failsafe: skip this slot and continue video
          playedSlotsRef.current.add(pos);
          console.warn('[useMidRollAds] Ad request failed, skipping slot:', e);
        }
        break; // Only trigger one ad at a time
      }
    }
  }, [adSlots, postId, userId, showAd]);

  const startTracking = useCallback(() => {
    if (isTrackingRef.current) return;
    isTrackingRef.current = true;

    intervalRef.current = setInterval(() => {
      elapsedRef.current += 1;
      checkForAd();
    }, 1000);
  }, [checkForAd]);

  const pauseTracking = useCallback(() => {
    isTrackingRef.current = false;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const onAdComplete = useCallback(() => {
    setShowAd(false);
    setCurrentAd(null);
    setCurrentSlotPosition(0);
    // Resume tracking
    startTracking();
  }, [startTracking]);

  return {
    showAd,
    currentAd,
    currentSlotPosition,
    onAdComplete,
    startTracking,
    pauseTracking,
    adSlots,
  };
}
