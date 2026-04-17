import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Modal,
  useWindowDimensions,
  Pressable,
  PanResponder,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';

// ─── Types ────────────────────────────────────────────────────────────────────

interface OMHCustomPlayerProps {
  uri: string;
  paused?: boolean;
  onEnded?: () => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onLoad?: () => void;
  onProgress?: (progress: number) => void;
  autoPlay?: boolean;
  initialTime?: number; // in milliseconds
  hideControls?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// ─── Component ────────────────────────────────────────────────────────────────

const OMHCustomPlayer = React.memo(function OMHCustomPlayer({
  uri,
  paused = false,
  onEnded,
  onTimeUpdate,
  onLoad,
  onProgress,
  autoPlay = true,
  initialTime = 0,
  hideControls = false,
}: OMHCustomPlayerProps) {
  // ── State: only what MUST trigger re-render ────────────────────────────────
  const [isPlaying, setIsPlaying] = useState(autoPlay && !paused);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Display state (updates at controlled intervals)
  const [displayTime, setDisplayTime] = useState('0:00');
  const [displayDuration, setDisplayDuration] = useState('0:00');
  const [progressPercent, setProgressPercent] = useState(0);

  // ── Refs: hot-path data that should NOT trigger re-renders ─────────────────
  const webRef = useRef<WebView>(null);
  const controlsTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentTimeRef = useRef(0);
  const durationRef = useRef(0);
  const isSeekingRef = useRef(false);
  const lastDisplayUpdateRef = useRef(0);
  const progressBarWidthRef = useRef(0);

  // Callback refs: update without re-rendering
  const onTimeUpdateRef = useRef(onTimeUpdate);
  const onProgressRef = useRef(onProgress);
  const onEndedRef = useRef(onEnded);
  const onLoadRef = useRef(onLoad);

  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  useEffect(() => { onTimeUpdateRef.current = onTimeUpdate; }, [onTimeUpdate]);
  useEffect(() => { onProgressRef.current = onProgress; }, [onProgress]);
  useEffect(() => { onEndedRef.current = onEnded; }, [onEnded]);
  useEffect(() => { onLoadRef.current = onLoad; }, [onLoad]);

  // ── Sync play/pause to WebView ─────────────────────────────────────────────
  useEffect(() => {
    if (!webRef.current) return;
    const cmd = isPlaying ? 'play()' : 'pause()';
    webRef.current.injectJavaScript(
      `(function(){var v=document.getElementById('omh-v');if(v)v.${cmd}})();true;`
    );
  }, [isPlaying]);

  // ── Handle external pause prop ─────────────────────────────────────────────
  useEffect(() => {
    if (paused) setIsPlaying(false);
    else if (autoPlay) setIsPlaying(true);
  }, [paused, autoPlay, uri]);

  // ── Reset on URI change ────────────────────────────────────────────────────
  useEffect(() => {
    currentTimeRef.current = 0;
    durationRef.current = 0;
    isSeekingRef.current = false;
    lastDisplayUpdateRef.current = 0;
    setDisplayTime('0:00');
    setDisplayDuration('0:00');
    setProgressPercent(0);
    setIsLoading(true);
  }, [uri]);

  // ── Handle Mute ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!webRef.current) return;
    webRef.current.injectJavaScript(
      `(function(){var v=document.getElementById('omh-v');if(v)v.muted=${isMuted}})();true;`
    );
  }, [isMuted]);

  // ── Controls auto-hide & toggle ────────────────────────────────────────────
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => setShowControls(false), 3500);
  }, []);

  const toggleControlsVisible = useCallback(() => {
    setShowControls(prev => {
      if (prev) {
        // If showing, hide instantly and clear timeout
        if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
        return false;
      } else {
        // If hidden, show and start timeout
        if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
        controlsTimerRef.current = setTimeout(() => setShowControls(false), 3500);
        return true;
      }
    });
  }, []);

  useEffect(() => {
    resetControlsTimer();
    return () => { if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current); };
  }, [resetControlsTimer]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const togglePlay = useCallback(() => {
    setIsPlaying(p => !p);
    resetControlsTimer();
  }, [resetControlsTimer]);

  const toggleMute = useCallback(() => {
    setIsMuted(p => !p);
    resetControlsTimer();
  }, [resetControlsTimer]);

  const toggleFullscreen = useCallback(() => setIsFullScreen(p => !p), []);

  // ── Seek ───────────────────────────────────────────────────────────────────
  const seekTo = useCallback((timeSec: number) => {
    if (!webRef.current || timeSec < 0) return;
    const clamped = Math.min(Math.max(0, timeSec), durationRef.current || timeSec);
    currentTimeRef.current = clamped;
    // Update display immediately for responsiveness
    setDisplayTime(formatTime(clamped));
    if (durationRef.current > 0) {
      setProgressPercent((clamped / durationRef.current) * 100);
    }
    webRef.current.injectJavaScript(
      `(function(){var v=document.getElementById('omh-v');if(v)v.currentTime=${clamped}})();true;`
    );
  }, []);

  // ── PanResponder for smooth seek gesture on progress bar ───────────────────
  const seekPanResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt) => {
      isSeekingRef.current = true;
      resetControlsTimer();
      const x = evt.nativeEvent.locationX;
      const w = progressBarWidthRef.current;
      if (w > 0 && durationRef.current > 0) {
        const ratio = Math.max(0, Math.min(1, x / w));
        const newTime = ratio * durationRef.current;
        // Update display instantly (no WebView round-trip)
        setProgressPercent(ratio * 100);
        setDisplayTime(formatTime(newTime));
        currentTimeRef.current = newTime;
      }
    },
    onPanResponderMove: (evt, gestureState) => {
      const w = progressBarWidthRef.current;
      if (w <= 0 || durationRef.current <= 0) return;
      // Use cumulative moveX from the initial touch position  
      const x = evt.nativeEvent.locationX;
      const ratio = Math.max(0, Math.min(1, x / w));
      const newTime = ratio * durationRef.current;
      setProgressPercent(ratio * 100);
      setDisplayTime(formatTime(newTime));
      currentTimeRef.current = newTime;
    },
    onPanResponderRelease: () => {
      // Commit seek to WebView only once on release
      seekTo(currentTimeRef.current);
      setTimeout(() => { isSeekingRef.current = false; }, 300);
    },
    onPanResponderTerminate: () => {
      seekTo(currentTimeRef.current);
      setTimeout(() => { isSeekingRef.current = false; }, 300);
    },
  }), [seekTo, resetControlsTimer]);

  const handleProgressLayout = useCallback((e: any) => {
    progressBarWidthRef.current = e.nativeEvent.layout.width;
  }, []);

  // ── HTML for WebView ───────────────────────────────────────────────────────
  const html = useMemo(() => {
    const startMs = isFullScreen
      ? Math.max(initialTime, currentTimeRef.current * 1000)
      : initialTime;
    return `<!DOCTYPE html>
<html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no"/>
<style>*{margin:0;padding:0;box-sizing:border-box;background:#000}html,body{width:100%;height:100%;overflow:hidden}video{width:100%;height:100vh;object-fit:contain;display:block}</style>
</head><body>
<video id="omh-v" src="${uri.replace(/"/g, '&quot;')}" ${autoPlay && !paused ? 'autoplay' : ''} playsinline webkit-playsinline preload="auto"></video>
<script>
var v=document.getElementById('omh-v'),lt=0;
v.addEventListener('loadedmetadata',function(){v.currentTime=${startMs}/1000;window.ReactNativeWebView.postMessage(JSON.stringify({type:'metadata',duration:v.duration}))});
v.addEventListener('playing',function(){window.ReactNativeWebView.postMessage(JSON.stringify({type:'playing'}))});
v.addEventListener('pause',function(){window.ReactNativeWebView.postMessage(JSON.stringify({type:'paused'}))});
v.addEventListener('ended',function(){window.ReactNativeWebView.postMessage(JSON.stringify({type:'ended'}))});
v.addEventListener('canplay',function(){window.ReactNativeWebView.postMessage(JSON.stringify({type:'loaded'}))});
v.addEventListener('timeupdate',function(){if(v.duration>0){var n=Date.now();if(n-lt>300){lt=n;window.ReactNativeWebView.postMessage(JSON.stringify({type:'progress',current:v.currentTime,duration:v.duration}))}}});
v.addEventListener('error',function(){window.ReactNativeWebView.postMessage(JSON.stringify({type:'error',message:v.error?v.error.message:'unknown'}))});
</script></body></html>`;
  }, [uri, autoPlay, paused, isFullScreen, initialTime]);

  // ── WebView message handler ────────────────────────────────────────────────
  const onMessage = useCallback((event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      switch (data.type) {
        case 'loaded':
          setIsLoading(false);
          onLoadRef.current?.();
          break;
        case 'metadata':
          durationRef.current = data.duration;
          setDisplayDuration(formatTime(data.duration));
          break;
        case 'progress': {
          // Don't update display while user is dragging
          if (isSeekingRef.current) {
            // Still fire callback for ad triggers
            onTimeUpdateRef.current?.(data.current, data.duration);
            return;
          }
          currentTimeRef.current = data.current;
          durationRef.current = data.duration;
          
          // Throttle display updates to ~4fps for smoothness
          const now = Date.now();
          if (now - lastDisplayUpdateRef.current > 250) {
            lastDisplayUpdateRef.current = now;
            setDisplayTime(formatTime(data.current));
            setDisplayDuration(formatTime(data.duration));
            setProgressPercent(data.duration > 0 ? (data.current / data.duration) * 100 : 0);
          }
          
          onProgressRef.current?.(data.current / data.duration);
          onTimeUpdateRef.current?.(data.current, data.duration);
          break;
        }
        case 'ended':
          setIsPlaying(false);
          onEndedRef.current?.();
          break;
        case 'playing':
          setIsPlaying(true);
          setIsLoading(false);
          break;
        case 'paused':
          setIsPlaying(false);
          break;
        case 'error':
          console.log('[OMHPlayer] Error:', data.message);
          break;
      }
    } catch {}
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────
  const playerContent = (
    <View style={styles.container}>
      <WebView
        ref={webRef}
        source={{ html }}
        style={StyleSheet.absoluteFill}
        allowsInlineMediaPlayback
        allowsFullscreenVideo
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        onMessage={onMessage}
        originWhitelist={['*']}
      />

      {isLoading && (
        <View style={styles.centerOverlay}>
          <ActivityIndicator size="large" color="#E53935" />
        </View>
      )}

      {!hideControls && (
        <TouchableOpacity
          activeOpacity={1}
          onPress={toggleControlsVisible}
          style={StyleSheet.absoluteFill}
        >
          {showControls && (
            <View style={styles.controlsOverlay}>
              <View style={styles.topBar} />

              <TouchableOpacity onPress={togglePlay} style={styles.playButton}>
                <Ionicons name={isPlaying ? 'pause' : 'play'} size={40} color="white" />
              </TouchableOpacity>

              <View style={styles.bottomBar}>
                <Text style={styles.timeText}>{displayTime}</Text>

                <View
                  style={styles.progressBarContainer}
                  onLayout={handleProgressLayout}
                  {...seekPanResponder.panHandlers}
                >
                  <View style={styles.progressBg}>
                    <View style={[styles.progressFg, { width: `${progressPercent}%` }]} />
                    <View style={[styles.seekThumb, { left: `${progressPercent}%` }]} />
                  </View>
                </View>

                <Text style={styles.timeText}>{displayDuration}</Text>

                <TouchableOpacity onPress={toggleMute} style={styles.iconBtn}>
                  <Ionicons name={isMuted ? 'volume-mute' : 'volume-high'} size={18} color="white" />
                </TouchableOpacity>

                <TouchableOpacity onPress={toggleFullscreen} style={styles.iconBtn}>
                  <Ionicons name="expand" size={18} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </TouchableOpacity>
      )}
    </View>
  );

  if (isFullScreen) {
    return (
      <Modal visible animationType="fade" onRequestClose={() => setIsFullScreen(false)}>
        <View style={styles.fullScreenContainer}>
          <View style={{ width: windowHeight, height: windowWidth, transform: [{ rotate: '90deg' }] }}>
            {playerContent}
          </View>
        </View>
      </Modal>
    );
  }

  return playerContent;
});

export default OMHCustomPlayer;

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  topBar: {
    height: Platform.OS === 'ios' ? 50 : 8,
  },
  playButton: {
    alignSelf: 'center',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(229,57,53,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingBottom: Platform.OS === 'ios' ? 32 : 10,
    paddingTop: 6,
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  timeText: {
    color: '#fff',
    fontSize: 10,
    minWidth: 30,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '600',
  },
  progressBarContainer: {
    flex: 1,
    height: 28,
    justifyContent: 'center',
  },
  progressBg: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 1.5,
    overflow: 'visible',
    position: 'relative',
  },
  progressFg: {
    height: '100%',
    backgroundColor: '#E53935',
    borderRadius: 1.5,
  },
  seekThumb: {
    position: 'absolute',
    top: -5,
    width: 13,
    height: 13,
    borderRadius: 6.5,
    backgroundColor: '#E53935',
    marginLeft: -6.5,
    borderWidth: 2,
    borderColor: '#fff',
  },
  iconBtn: {
    padding: 5,
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
