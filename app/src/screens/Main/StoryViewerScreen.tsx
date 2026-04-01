import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Image, Dimensions,
  Animated, SafeAreaView, PanResponder, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, Share,
  Modal, FlatList, Keyboard, ActivityIndicator
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabaseClient';
import { WebView } from 'react-native-webview';

const { width, height } = Dimensions.get('window');
const IMAGE_STORY_DURATION = 5000;
const VIDEO_STORY_DURATION = 30000;

interface Story {
  id: string;
  creator_id: string;
  media_url: string;
  type: string;
  created_at: string;
  allow_comments?: boolean;
  allow_sharing?: boolean;
  background_color?: string;
  text_content?: string;
  User?: {
    username: string;
    avatarUrl: string;
  };
}

// ─── WebView Video Player (No Native ExoPlayer → Zero Hard Crashes) ────────
function WebViewVideoPlayer({
  uri,
  paused,
  onEnded,
  onLoaded,
  onError,
  onProgress,
}: {
  uri: string;
  paused: boolean;
  onEnded: () => void;
  onLoaded: () => void;
  onError: (msg: string) => void;
  onProgress: (progress: number) => void;
}) {
  const webRef = useRef<any>(null);

  useEffect(() => {
    if (!webRef.current) return;
    webRef.current.injectJavaScript(
      `(function(){ var v = document.getElementById('sv'); if(v){ ${paused ? 'v.pause()' : 'v.play()'} }; })(); true;`
    );
  }, [paused]);

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no" />
        <style>
          * { margin:0; padding:0; box-sizing:border-box; background:#000; }
          html, body { width:100%; height:100%; overflow:hidden; }
          video { width:100%; height:100vh; object-fit:contain; display:block; }
        </style>
      </head>
      <body>
        <video
          id="sv"
          src="${uri.replace(/"/g, '&quot;')}"
          autoplay
          playsinline
          webkit-playsinline
          preload="auto"
        ></video>
        <script>
          var v = document.getElementById('sv');
          v.addEventListener('ended', function(){ window.ReactNativeWebView.postMessage('ended'); });
          v.addEventListener('canplay', function(){ window.ReactNativeWebView.postMessage('loaded'); });
          v.addEventListener('timeupdate', function(){
            if (v.duration > 0) {
               window.ReactNativeWebView.postMessage('progress:' + (v.currentTime / v.duration));
            }
          });
          v.addEventListener('error', function(e){
            var msg = v.error ? v.error.message : 'unknown';
            window.ReactNativeWebView.postMessage('error:' + msg);
          });
        </script>
      </body>
    </html>
  `;

  return (
    <WebView
      ref={webRef}
      source={{ html }}
      style={StyleSheet.absoluteFill}
      allowsInlineMediaPlayback
      mediaPlaybackRequiresUserAction={false}
      javaScriptEnabled
      domStorageEnabled
      scrollEnabled={false}
      bounces={false}
      onMessage={(evt) => {
        const data = evt.nativeEvent.data;
        if (data === 'ended') onEnded();
        else if (data === 'loaded') onLoaded();
        else if (data.startsWith('progress:')) onProgress(Number(data.replace('progress:', '')));
        else if (data.startsWith('error:')) onError(data.replace('error:', ''));
      }}
    />
  );
}

// ─── Main Screen ────────────────────────────────────────────────────────────
export default function StoryViewerScreen() {
  const insets = useSafeAreaInsets();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();

  // ── Safe param ──────────────────────────────────────────────────────────
  const storyId: string | undefined = route?.params?.storyId;

  // ── State ───────────────────────────────────────────────────────────────
  const [currentStory, setCurrentStory] = useState<Story | null>(null);
  const [loadingStory, setLoadingStory] = useState(true);
  const [mediaReady, setMediaReady] = useState(false);   // validated + renderable
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);

  const [isPaused, setIsPaused] = useState(false);
  const [message, setMessage] = useState('');
  const [showViewersSheet, setShowViewersSheet] = useState(false);
  const [viewers, setViewers] = useState<any[]>([]);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<any[]>([]);
  const [isLiked, setIsLiked] = useState(false);
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  const progressAnim = useRef(new Animated.Value(0)).current;

  // ── Step 1: Fetch story from DB ──────────────────────────────────────────
  useEffect(() => {
    if (!storyId) {
      setLoadingStory(false);
      return;
    }
    (async () => {
      try {
        const { data, error } = await supabase
          .from('stories')
          .select('*, User:creator_id(username, avatarUrl)')
          .eq('id', storyId)
          .single();

        if (error || !data) {
          console.log('[StoryViewer] DB error:', error?.message);
          setLoadingStory(false);
          return;
        }
        setCurrentStory(data);
      } catch (e: any) {
        console.log('[StoryViewer] fetch crash:', e?.message);
        setLoadingStory(false);
      }
    })();
  }, [storyId]);

  // ── Step 2: Validate media URL (GET → content-type check) ───────────────
  useEffect(() => {
    if (!currentStory) return;

    if (currentStory.type === 'text') {
      setMediaReady(true);
      setLoadingStory(false);
      return;
    }

    (async () => {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 8000);
        const res = await fetch(currentStory.media_url, {
          method: 'GET',
          signal: controller.signal,
          headers: { Range: 'bytes=0-1023' }, // only fetch first 1 KB, fast
        });
        clearTimeout(timer);

        if (!res.ok) {
          setMediaError(`Media unavailable (HTTP ${res.status})`);
          setMediaReady(false);
          setLoadingStory(false);
          return;
        }

        const ct = res.headers.get('content-type') || '';
        console.log('[StoryViewer] content-type:', ct, '| story.type:', currentStory.type);

        if (currentStory.type === 'video' && !ct.startsWith('video/') && !ct.startsWith('application/octet')) {
          // Content-type mismatch — treat as broken
          setMediaError(`Invalid media format (${ct || 'unknown'})`);
          setMediaReady(false);
        } else {
          setMediaReady(true);
        }
      } catch (e: any) {
        // Network error / timeout — still try rendering image stories, block video
        if (currentStory.type === 'video') {
          setMediaError('Could not reach video server');
          setMediaReady(false);
        } else {
          setMediaReady(true); // images are safer, let <Image> handle its own error
        }
      } finally {
        setLoadingStory(false);
      }
    })();
  }, [currentStory]);

  // ── Keyboard listeners ───────────────────────────────────────────────────
  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const s1 = Keyboard.addListener(showEvt, (e) => setKeyboardOffset(e.endCoordinates.height));
    const s2 = Keyboard.addListener(hideEvt, () => setKeyboardOffset(0));
    return () => { s1.remove(); s2.remove(); };
  }, []);

  // ── Auth ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setCurrentUserId(session.user.id);
    });
  }, []);

  // ── Like check ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentStory?.id || !currentUserId) return;
    supabase.from('story_likes')
      .select('id')
      .eq('story_id', currentStory.id)
      .eq('user_id', currentUserId)
      .then(({ data }) => setIsLiked(!!(data && data.length > 0)));
  }, [currentStory?.id, currentUserId]);

  // ── View log ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentStory?.id || !currentUserId) return;
    supabase.from('story_views')
      .select('id')
      .eq('story_id', currentStory.id)
      .eq('user_id', currentUserId)
      .limit(1)
      .then(({ data }) => {
        if (!data || data.length === 0) {
          supabase.from('story_views').insert({ story_id: currentStory.id, user_id: currentUserId }).then();
        }
      });
  }, [currentStory?.id, currentUserId]);

  // ── Progress bar ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentStory || !mediaReady) return;
    
    // Video progress is handled by onProgress callback from WebViewVideoPlayer
    if (currentStory.type === 'video') return; 

    // Handle image and text durations
    if (!isPaused) {
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: IMAGE_STORY_DURATION,
        useNativeDriver: false,
      }).start(({ finished }) => { if (finished) navigation.goBack(); });
    } else {
      progressAnim.stopAnimation();
    }
  }, [isPaused, currentStory, mediaReady]);

  // ── Pan responder ─────────────────────────────────────────────────────────
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => setIsPaused(true),
      onPanResponderRelease: (_evt, { dy }) => {
        setIsPaused(false);
        if (Math.abs(dy) > 100) navigation.goBack();
      },
      onPanResponderTerminate: () => setIsPaused(false),
    })
  ).current;

  // ── Interactions ──────────────────────────────────────────────────────────
  const likeStory = async () => {
    if (!currentStory?.id || !currentUserId) return;
    const next = !isLiked;
    setIsLiked(next);
    if (next) {
      await supabase.from('story_likes').insert({ story_id: currentStory.id, user_id: currentUserId });
    } else {
      await supabase.from('story_likes').delete().eq('story_id', currentStory.id).eq('user_id', currentUserId);
    }
  };

  const sendMessage = async () => {
    if (!currentStory?.id || !message.trim() || !currentUserId) return;
    await supabase.from('story_messages').insert({
      story_id: currentStory.id, sender_id: currentUserId,
      creator_id: currentStory.creator_id, message: message.trim(),
    });
    setMessage('');
  };

  const shareStory = async () => {
    if (!currentStory) return;
    try {
      await Share.share({ message: `Check out this story: ${currentStory.media_url}` });
    } catch {}
  };

  const fetchComments = async () => {
    if (!currentStory?.id) return;
    const { data } = await supabase
      .from('story_comments')
      .select('*, User:user_id(username, avatarUrl)')
      .eq('story_id', currentStory.id)
      .order('created_at', { ascending: false });
    if (data) setComments(data);
  };

  const sendComment = async () => {
    if (!currentStory?.id || !commentText.trim() || !currentUserId) return;
    const text = commentText.trim();
    setCommentText('');
    setComments(prev => [{
      id: Math.random().toString(), comment: text,
      created_at: new Date().toISOString(), User: { username: 'You', avatarUrl: '' }
    }, ...prev]);
    await supabase.from('story_comments').insert({ story_id: currentStory.id, user_id: currentUserId, comment: text });
    fetchComments();
  };

  const openViewersSheet = async () => {
    if (!currentStory?.id) return;
    setIsPaused(true);
    setShowViewersSheet(true);
    const { data } = await supabase
      .from('story_views')
      .select('*, User:user_id(username, avatarUrl)')
      .eq('story_id', currentStory.id)
      .order('viewed_at', { ascending: false });
    if (data) {
      const unique = data.filter((v: any, i: number, a: any[]) => a.findIndex(t => t.user_id === v.user_id) === i);
      setViewers(unique);
    }
  };

  const getTimeAgo = (dateStr: string) => {
    try {
      const ms = Date.now() - new Date(dateStr).getTime();
      const mins = Math.floor(ms / 60000);
      if (mins < 60) return `${mins}m`;
      return `${Math.floor(mins / 60)}h`;
    } catch { return '?'; }
  };

  // ── Guards ────────────────────────────────────────────────────────────────
  if (!storyId) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Story not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20 }}>
          <Ionicons name="close" size={40} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  }

  if (loadingStory) {
    return (
      <View style={styles.errorContainer}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={[styles.errorText, { marginTop: 16, fontSize: 14, color: 'rgba(255,255,255,0.7)' }]}>
          Loading story...
        </Text>
      </View>
    );
  }

  if (!currentStory) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#fff" />
        <Text style={styles.errorText}>Story not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20 }}>
          <Ionicons name="close" size={40} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  }

  if (mediaError) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="cloud-offline-outline" size={48} color="#fff" />
        <Text style={styles.errorText}>Media Unavailable</Text>
        <Text style={{ color: 'rgba(255,255,255,0.5)', marginTop: 8, fontSize: 13 }}>{mediaError}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 24 }}>
          <Ionicons name="close" size={40} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <SafeAreaView style={styles.container}>
        <View style={styles.storyContainer} {...panResponder.panHandlers}>

          {/* ── MEDIA ── */}
          {currentStory.type === 'image' && currentStory.media_url ? (
            <Image
              source={{ uri: currentStory.media_url }}
              style={StyleSheet.absoluteFill}
              resizeMode="contain"
              onError={() => setMediaError('Image failed to load')}
            />
          ) : currentStory.type === 'video' && currentStory.media_url ? (
            <>
              <WebViewVideoPlayer
                uri={currentStory.media_url}
                paused={isPaused}
                onEnded={() => navigation.goBack()}
                onLoaded={() => setVideoLoaded(true)}
                onProgress={(p) => progressAnim.setValue(p)}
                onError={(msg) => {
                  console.log('[StoryViewer] WebView video error:', msg);
                  setMediaError(`Playback error: ${msg}`);
                }}
              />
              {!videoLoaded && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color="#fff" />
                  <Text style={{ color: '#fff', marginTop: 12, fontSize: 14 }}>Loading video...</Text>
                </View>
              )}
            </>
          ) : currentStory.type === 'text' ? (
            <View style={[StyleSheet.absoluteFill, {
              backgroundColor: currentStory.background_color || '#111',
              justifyContent: 'center', alignItems: 'center'
            }]}>
              <Text style={{ color: '#fff', fontSize: 24, textAlign: 'center', marginHorizontal: 24 }}>
                {currentStory.text_content || ''}
              </Text>
            </View>
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: '#111' }]} />
          )}

          {/* gradient */}
          <View style={styles.gradientOverlay} />

          {/* PROGRESS BAR */}
          <View style={[styles.progressContainer, { top: insets.top + 4 }]}>
            <View style={styles.progressBarBg}>
              <Animated.View style={[styles.progressBarFg, {
                width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] })
              }]} />
            </View>
          </View>

          {/* HEADER */}
          <View style={[styles.header, { top: insets.top + 18 }]}>
            <View style={styles.headerLeft}>
              {currentStory.User?.avatarUrl ? (
                <Image source={{ uri: currentStory.User.avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, { backgroundColor: '#cbd5e1' }]} />
              )}
              <Text style={styles.username}>{currentStory.User?.username || 'Creator'}</Text>
              <Text style={styles.timeAgo}>{getTimeAgo(currentStory.created_at)}</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* FOOTER */}
          <View style={[styles.footer, keyboardOffset > 0 && { bottom: keyboardOffset, paddingBottom: 10 }]}>
            {currentUserId !== currentStory.creator_id ? (
              <>
                <View style={styles.messageInputContainer}>
                  <TextInput
                    style={styles.messageInput}
                    placeholder="Send message"
                    placeholderTextColor="rgba(255,255,255,0.8)"
                    value={message}
                    onChangeText={setMessage}
                    onSubmitEditing={sendMessage}
                    returnKeyType="send"
                    onFocus={() => setIsPaused(true)}
                    onBlur={() => setIsPaused(false)}
                  />
                </View>
                <TouchableOpacity onPress={likeStory}>
                  <Ionicons name={isLiked ? 'heart' : 'heart-outline'} size={30} color={isLiked ? '#e11d48' : '#fff'} />
                </TouchableOpacity>
                {currentStory.allow_comments !== false && (
                  <TouchableOpacity onPress={() => { setIsPaused(true); setShowCommentModal(true); fetchComments(); }}>
                    <Ionicons name="chatbubble-outline" size={28} color="#fff" />
                  </TouchableOpacity>
                )}
                {currentStory.allow_sharing !== false && (
                  <TouchableOpacity onPress={shareStory}>
                    <Ionicons name="paper-plane-outline" size={28} color="#fff" />
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <View style={{ flex: 1, alignItems: 'center' }}>
                <TouchableOpacity onPress={openViewersSheet} style={{ alignItems: 'center' }}>
                  <Ionicons name="chevron-up" size={24} color="#fff" />
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Viewers</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Viewers Sheet */}
        <Modal visible={showViewersSheet} animationType="slide" transparent>
          <View style={styles.sheetOverlay}>
            <TouchableOpacity style={{ flex: 1 }} onPress={() => { setShowViewersSheet(false); setIsPaused(false); }} />
            <View style={styles.sheetContent}>
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>Viewers</Text>
                <TouchableOpacity onPress={() => { setShowViewersSheet(false); setIsPaused(false); }}>
                  <Ionicons name="close" size={24} color="#000" />
                </TouchableOpacity>
              </View>
              <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 16 }}>👁 {viewers.length} Views</Text>
              {viewers.length === 0 ? (
                <Text style={{ textAlign: 'center', color: '#666', marginTop: 20 }}>No viewers yet</Text>
              ) : (
                <FlatList
                  data={viewers}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                      {item.User?.avatarUrl
                        ? <Image source={{ uri: item.User.avatarUrl }} style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12 }} />
                        : <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#ddd', marginRight: 12 }} />
                      }
                      <View>
                        <Text style={{ fontWeight: 'bold' }}>{item.User?.username}</Text>
                        <Text style={{ color: '#666', fontSize: 12 }}>{getTimeAgo(item.viewed_at)}</Text>
                      </View>
                    </View>
                  )}
                />
              )}
            </View>
          </View>
        </Modal>

        {/* Comments Modal */}
        <Modal visible={showCommentModal} animationType="slide" transparent>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
            <View style={styles.sheetOverlay}>
              <TouchableOpacity style={{ flex: 1 }} onPress={() => { setShowCommentModal(false); setIsPaused(false); }} />
              <View style={[styles.sheetContent, { height: height * 0.7, paddingBottom: 0, paddingHorizontal: 0 }]}>
                <View style={[styles.sheetHeader, { paddingHorizontal: 20 }]}>
                  <Text style={styles.sheetTitle}>Comments</Text>
                  <TouchableOpacity onPress={() => { setShowCommentModal(false); setIsPaused(false); }}>
                    <Ionicons name="close" size={24} color="#000" />
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={comments}
                  keyExtractor={(item) => item.id}
                  ListEmptyComponent={<Text style={{ textAlign: 'center', color: '#666', marginTop: 20 }}>No comments yet</Text>}
                  renderItem={({ item }) => (
                    <View style={{ flexDirection: 'row', marginBottom: 16, paddingHorizontal: 20 }}>
                      {item.User?.avatarUrl
                        ? <Image source={{ uri: item.User.avatarUrl }} style={{ width: 36, height: 36, borderRadius: 18, marginRight: 12 }} />
                        : <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#ddd', marginRight: 12 }} />
                      }
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontWeight: 'bold', fontSize: 13 }}>
                          {item.User?.username}
                          <Text style={{ fontWeight: 'normal', color: '#666', fontSize: 12 }}> {getTimeAgo(item.created_at)}</Text>
                        </Text>
                        <Text style={{ marginTop: 2, color: '#333' }}>{item.comment}</Text>
                      </View>
                    </View>
                  )}
                  contentContainerStyle={{ paddingBottom: 20 }}
                />
                <View style={{ flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f1f1f1', paddingVertical: 12, paddingHorizontal: 16, paddingBottom: Platform.OS === 'ios' ? 30 : 12, backgroundColor: '#fff' }}>
                  <TextInput
                    style={{ flex: 1, backgroundColor: '#f1f1f1', padding: 12, borderRadius: 20, marginRight: 8, color: '#000', maxHeight: 100 }}
                    placeholder="Add a comment..."
                    placeholderTextColor="#666"
                    value={commentText}
                    onChangeText={setCommentText}
                    multiline
                  />
                  <TouchableOpacity onPress={sendComment}>
                    <Ionicons name="send" size={24} color={commentText.trim() ? '#e11d48' : '#999'} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  errorContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#fff', fontSize: 16, marginTop: 16 },
  storyContainer: {
    flex: 1, backgroundColor: '#111', borderRadius: 16,
    overflow: 'hidden', marginTop: 8, marginBottom: 8,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center', alignItems: 'center',
  },
  gradientOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 140,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  progressContainer: {
    flexDirection: 'row', position: 'absolute',
    left: 8, right: 8, gap: 4, zIndex: 10,
  },
  progressBarBg: {
    flex: 1, height: 3, backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2, overflow: 'hidden',
  },
  progressBarFg: { height: '100%', backgroundColor: '#fff' },
  header: {
    position: 'absolute', left: 12, right: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatar: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)', backgroundColor: '#cbd5e1',
  },
  username: {
    color: '#fff', fontWeight: 'bold', fontSize: 14,
    textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2,
  },
  timeAgo: {
    color: 'rgba(255,255,255,0.8)', fontSize: 12,
    textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2,
  },
  closeBtn: { padding: 4 },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 16, paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    paddingTop: 16, flexDirection: 'row', alignItems: 'center', gap: 16,
  },
  messageInputContainer: {
    flex: 1, height: 48, borderRadius: 24, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)', paddingHorizontal: 16,
    justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.2)',
  },
  messageInput: { color: '#fff', fontSize: 15 },
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheetContent: {
    backgroundColor: '#fff', borderTopLeftRadius: 20,
    borderTopRightRadius: 20, padding: 20, maxHeight: height * 0.6,
  },
  sheetHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 20,
  },
  sheetTitle: { fontSize: 18, fontWeight: 'bold' },
});
