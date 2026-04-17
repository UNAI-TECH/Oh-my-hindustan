import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Animated,
  Linking,
  Platform,
} from 'react-native';
import OMHCustomPlayer from './OMHCustomPlayer';
import { supabase } from '../lib/supabaseClient';

// ─── Types ───────────────────────────────────────────────────────────────────

type PlayerMode = 'content' | 'ad';

interface Ad {
  id: string;
  ad_video_url: string;
  title: string;
  revenue_per_view: number;
  type?: string[];
  is_skippable?: boolean;
  skip_after?: number;
  priority?: number;
  description?: string;
  link?: string;
  logo_url?: string;
}

interface Props {
  postId: string;
  videoUrl: string;
  adsEnabled: boolean;
  userId: string | undefined;
  adBreaks?: { type: string; time: number }[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

const LEGACY_AD_SLOTS = [30, 60, 80];

// ─── Global ad cache (session-wide, avoids refetching) ───────────────────────

let _cachedAds: Ad[] | null = null;
let _cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000;

async function getCachedAds(): Promise<Ad[]> {
  const now = Date.now();
  if (_cachedAds && now - _cacheTime < CACHE_TTL) return _cachedAds;
  try {
    const { data } = await supabase.from('video_ads').select('*').eq('is_active', true);
    _cachedAds = data || [];
    _cacheTime = now;
    return _cachedAds;
  } catch {
    return _cachedAds || [];
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function AdEnabledVideoPlayer({
  postId,
  videoUrl,
  adsEnabled,
  adBreaks,
  userId,
}: Props) {
  // ── Core state ─────────────────────────────────────────────────────────────
  const [mode, setMode] = useState<PlayerMode>('content');
  const [activeUri, setActiveUri] = useState<string | null>(null);
  const [playerInitialTime, setPlayerInitialTime] = useState(0);
  const [isInitialized, setIsInitialized] = useState(!adsEnabled);
  const [ads, setAds] = useState<Ad[]>([]);
  const [currentAd, setCurrentAd] = useState<Ad | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── Skip system ────────────────────────────────────────────────────────────
  const [skipTimer, setSkipTimer] = useState(5);
  const [canSkip, setCanSkip] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);

  // ── Ad info panel (below video, toggled) ───────────────────────────────────
  const [showAdInfo, setShowAdInfo] = useState(false);

  // ── Refs (perf: no re-render on these) ─────────────────────────────────────
  const adPlayedRef = useRef<Set<number>>(new Set());
  const savedTimeRef = useRef(0);
  const currentTimeMsRef = useRef(0);
  const isTransitioning = useRef(false);
  const skipIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const modeRef = useRef<PlayerMode>('content');
  const adsRef = useRef<Ad[]>([]);

  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { adsRef.current = ads; }, [ads]);

  // ══════════════════════════════════════════════════════════════════════════
  // INIT — fetch ads before playback
  // ══════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    if (!adsEnabled) {
      setActiveUri(videoUrl);
      setIsInitialized(true);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const fetchedAds = await getCachedAds();
        if (cancelled) return;
        setAds(fetchedAds);

        // Pre-roll
        const preRoll = adBreaks?.find(b => b.type === 'pre') || { time: 0, type: 'pre' };
        if (fetchedAds.length > 0) {
          const eligible = fetchedAds
            .filter(a => !a.type || a.type.includes('pre'))
            .sort((a, b) => (b.priority || 5) - (a.priority || 5));
          const ad = eligible[0];
          if (ad?.ad_video_url) {
            setMode('ad');
            setCurrentAd(ad);
            setSkipTimer(ad.is_skippable !== false ? (ad.skip_after || 5) : 999);
            setCanSkip(ad.is_skippable === false);
            adPlayedRef.current.add(preRoll.time);
            setActiveUri(ad.ad_video_url);
            trackRevenue(ad);
            setIsInitialized(true);
            return;
          }
        }
        setActiveUri(videoUrl);
      } catch {
        if (!cancelled) setActiveUri(videoUrl);
      } finally {
        if (!cancelled) setIsInitialized(true);
      }
    })();
    return () => { cancelled = true; };
  }, [adsEnabled, postId, videoUrl]);

  // ══════════════════════════════════════════════════════════════════════════
  // AD SELECTION
  // ══════════════════════════════════════════════════════════════════════════

  const getAd = useCallback((type: 'pre' | 'mid'): Ad | null => {
    const pool = adsRef.current;
    if (!pool.length) return null;
    let eligible = pool.filter(a => !a.type || a.type.includes(type));
    if (!eligible.length) eligible = pool;
    return type === 'pre'
      ? eligible.sort((a, b) => (b.priority || 5) - (a.priority || 5))[0]
      : eligible[Math.floor(Math.random() * eligible.length)];
  }, []);

  // ══════════════════════════════════════════════════════════════════════════
  // REVENUE — fire-and-forget
  // ══════════════════════════════════════════════════════════════════════════

  const trackRevenue = useCallback(async (ad: Ad) => {
    try {
      await supabase
        .from('video_ads')
        .update({
          views: (ad as any).views ? (ad as any).views + 1 : 1,
          revenue: Number((ad as any).revenue || 0) + Number(ad.revenue_per_view || 0),
        })
        .eq('id', ad.id);
    } catch { /* silent */ }
  }, []);

  // ══════════════════════════════════════════════════════════════════════════
  // TRIGGER AD
  // ══════════════════════════════════════════════════════════════════════════

  const triggerAd = useCallback((slotTime: number, type: 'pre' | 'mid') => {
    if (isTransitioning.current) return;
    const ad = getAd(type);
    if (!ad?.ad_video_url) return;

    isTransitioning.current = true;
    adPlayedRef.current.add(slotTime);
    if (type === 'mid') savedTimeRef.current = currentTimeMsRef.current;

    setCurrentAd(ad);
    setMode('ad');
    setShowAdInfo(false);
    setSkipTimer(ad.is_skippable !== false ? (ad.skip_after || 5) : 999);
    setCanSkip(ad.is_skippable === false);
    setPlayerInitialTime(0);
    setActiveUri(ad.ad_video_url);

    setTimeout(() => { isTransitioning.current = false; }, 400);
    trackRevenue(ad);
  }, [getAd, trackRevenue]);

  // ══════════════════════════════════════════════════════════════════════════
  // RESUME CONTENT
  // ══════════════════════════════════════════════════════════════════════════

  const resumeContent = useCallback(() => {
    if (isTransitioning.current && modeRef.current === 'content') return;
    isTransitioning.current = true;

    if (skipIntervalRef.current) {
      clearInterval(skipIntervalRef.current);
      skipIntervalRef.current = null;
    }
    setCanSkip(false);
    setShowAdInfo(false);
    setMode('content');
    setCurrentAd(null);
    setPlayerInitialTime(savedTimeRef.current);
    setActiveUri(videoUrl);

    setTimeout(() => { isTransitioning.current = false; }, 400);
  }, [videoUrl]);

  // ══════════════════════════════════════════════════════════════════════════
  // SKIP AD
  // ══════════════════════════════════════════════════════════════════════════

  const handleSkipAd = useCallback(() => {
    if (isSkipping || modeRef.current !== 'ad') return;
    setIsSkipping(true);
    resumeContent();
    setTimeout(() => setIsSkipping(false), 500);
  }, [isSkipping, resumeContent]);

  // ══════════════════════════════════════════════════════════════════════════
  // TIME UPDATE — mid-roll triggers
  // ══════════════════════════════════════════════════════════════════════════

  const onTimeUpdate = useCallback((current: number, dur: number) => {
    currentTimeMsRef.current = current * 1000;
    setIsLoading(false);

    if (modeRef.current !== 'content' || !adsEnabled || !adsRef.current.length || isTransitioning.current) return;

    const sec = Math.floor(current);
    if (adBreaks?.length) {
      const match = adBreaks.find(b => b.type === 'mid' && Math.abs(b.time - sec) <= 1);
      if (match && !adPlayedRef.current.has(match.time)) triggerAd(match.time, 'mid');
    } else if (LEGACY_AD_SLOTS.includes(sec) && !adPlayedRef.current.has(sec)) {
      triggerAd(sec, 'mid');
    }
  }, [adsEnabled, adBreaks, triggerAd]);

  // ══════════════════════════════════════════════════════════════════════════
  // SKIP TIMER
  // ══════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    if (mode !== 'ad' || !currentAd) return;
    if (currentAd.is_skippable === false) { setCanSkip(false); return; }

    skipIntervalRef.current = setInterval(() => {
      setSkipTimer(prev => {
        if (prev <= 1) {
          setCanSkip(true);
          if (skipIntervalRef.current) clearInterval(skipIntervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (skipIntervalRef.current) { clearInterval(skipIntervalRef.current); skipIntervalRef.current = null; }
    };
  }, [mode, currentAd]);

  // ══════════════════════════════════════════════════════════════════════════
  // CLEANUP
  // ══════════════════════════════════════════════════════════════════════════

  useEffect(() => () => { if (skipIntervalRef.current) clearInterval(skipIntervalRef.current); }, []);

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════

  const isAd = mode === 'ad' && currentAd;

  return (
    <View style={styles.container}>
      {/* ── VIDEO PLAYER ── */}
      <View style={styles.playerArea}>
        {isInitialized && activeUri ? (
          <OMHCustomPlayer
            uri={activeUri}
            initialTime={playerInitialTime}
            paused={isSkipping}
            onTimeUpdate={onTimeUpdate}
            onEnded={mode === 'ad' ? handleSkipAd : undefined}
            onLoad={() => setIsLoading(false)}
            hideControls={mode === 'ad'}
          />
        ) : null}

        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#E53935" />
          </View>
        )}

        {/* ── AD OVERLAY (absolute on player) ── */}
        {isAd && (
          <View style={styles.adOverlay} pointerEvents="box-none">
            {/* Sponsored pill */}
            <View style={styles.sponsoredPill}>
              <Text style={styles.sponsoredText}>Ad</Text>
            </View>

            {/* Skip button  */}
            <View style={styles.skipWrap}>
              {canSkip ? (
                <TouchableOpacity style={styles.skipBtn} onPress={handleSkipAd} activeOpacity={0.8}>
                  <Text style={styles.skipBtnText}>Skip Ad ▸▸</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.skipBtnDisabled}>
                  <Text style={styles.skipBtnDisabledText}>Skip in {skipTimer}s</Text>
                </View>
              )}
            </View>
          </View>
        )}
      </View>

      {/* ── BOTTOM AD BAR (below video, not overlapping) ── */}
      {isAd && (
        <View style={styles.bottomBar}>
          {currentAd!.logo_url ? (
            <Image source={{ uri: currentAd!.logo_url }} style={styles.barLogo} />
          ) : (
            <View style={[styles.barLogo, styles.barLogoFallback]}>
              <Text style={styles.barLogoFallbackText}>AD</Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.barTextArea}
            activeOpacity={0.7}
            onPress={() => setShowAdInfo(prev => !prev)}
          >
            <Text style={styles.barTitle} numberOfLines={1}>{currentAd!.title || 'Advertisement'}</Text>
            <Text style={styles.barSub}>Sponsored · Tap for info</Text>
          </TouchableOpacity>
          {currentAd!.link ? (
            <TouchableOpacity
              style={styles.barCTA}
              onPress={() => Linking.openURL(currentAd!.link!).catch(() => {})}
              activeOpacity={0.8}
            >
              <Text style={styles.barCTAText}>Visit</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      )}

      {/* ── AD INFO PANEL (expands below bottom bar, NOT overlay) ── */}
      {isAd && showAdInfo && (
        <View style={styles.adInfoPanel}>
          <View style={styles.adInfoHeader}>
            <Text style={styles.adInfoTitle}>{currentAd!.title || 'Advertisement'}</Text>
            <TouchableOpacity style={styles.adInfoClose} onPress={() => setShowAdInfo(false)}>
              <Text style={styles.adInfoCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
          {currentAd!.description ? (
            <Text style={styles.adInfoDesc}>{currentAd!.description}</Text>
          ) : (
            <Text style={styles.adInfoDesc}>This ad is served based on the content you're watching.</Text>
          )}
          {currentAd!.link ? (
            <TouchableOpacity
              style={styles.adInfoCTA}
              onPress={() => Linking.openURL(currentAd!.link!).catch(() => {})}
              activeOpacity={0.8}
            >
              <Text style={styles.adInfoCTAText}>Learn More</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      )}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#000',
  },
  playerArea: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },

  // ── Ad Overlay (absolute on player) ──
  adOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  sponsoredPill: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#FFCA28',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 3,
  },
  sponsoredText: {
    color: '#000',
    fontSize: 11,
    fontWeight: '800',
  },
  skipWrap: {
    position: 'absolute',
    bottom: 12,
    right: 0,
  },
  skipBtn: {
    backgroundColor: '#fff',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
  },
  skipBtnText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 13,
  },
  skipBtnDisabled: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderRightWidth: 0,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  skipBtnDisabledText: {
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
    fontSize: 13,
  },

  // ── Bottom Ad Bar (below video) ──
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  barLogo: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: '#333',
    marginRight: 10,
  },
  barLogoFallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  barLogoFallbackText: {
    color: '#666',
    fontSize: 10,
    fontWeight: '800',
  },
  barTextArea: {
    flex: 1,
    justifyContent: 'center',
  },
  barTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  barSub: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    marginTop: 1,
  },
  barCTA: {
    backgroundColor: '#3EA6FF',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 4,
    marginLeft: 8,
  },
  barCTAText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '700',
  },

  // ── Ad Info Panel (below bottom bar, NOT overlay) ──
  adInfoPanel: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  adInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  adInfoTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111',
    flex: 1,
    marginRight: 12,
  },
  adInfoClose: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  adInfoCloseText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
  },
  adInfoDesc: {
    fontSize: 14,
    lineHeight: 20,
    color: '#555',
    marginBottom: 12,
  },
  adInfoCTA: {
    backgroundColor: '#E53935',
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: 'center',
  },
  adInfoCTAText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
