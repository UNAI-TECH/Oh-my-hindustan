import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Image, Dimensions, TouchableWithoutFeedback,
  Animated, SafeAreaView, PanResponder, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Share, Modal, FlatList, Keyboard, ActivityIndicator
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabaseClient';
import { WebView } from 'react-native-webview';
import { Video as ExpoVideo, ResizeMode as ExpoResizeMode } from 'expo-av';

const { width, height } = Dimensions.get('window');
const IMAGE_STORY_DURATION = 5000; // 5 seconds per image
const VIDEO_STORY_DURATION = 30000; // 30 seconds max for video stories

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
  }
}

export default function StoryViewerScreen() {
  const insets = useSafeAreaInsets();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();

  // Fetch storyId from route
  const { storyId } = route.params || { storyId: '' };

  const [currentStory, setCurrentStory] = useState<Story | null>(null);
  const [loadingStory, setLoadingStory] = useState(true);

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
  const videoRef = useRef<any>(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  // FETCH STORY
  useEffect(() => {
    const fetchStory = async () => {
      if (!storyId) return;
      try {
        setLoadingStory(true);
        const { data, error } = await supabase
          .from('stories')
          .select('*, User:creator_id(username, avatarUrl)')
          .eq('id', storyId)
          .single();

        if (error || !data) {
          console.log("Story fetch error", error);
          setLoadingStory(false);
          return;
        }

        setCurrentStory(data);
      } catch (err) {
        console.log("Story fetch catch error", err);
      } finally {
        setLoadingStory(false);
      }
    };
    fetchStory();
  }, [storyId]);

  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvt, (e) => setKeyboardOffset(e.endCoordinates.height));
    const hideSub = Keyboard.addListener(hideEvt, () => setKeyboardOffset(0));
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setCurrentUserId(session.user.id);
    });
  }, []);

  useEffect(() => {
    const checkLiked = async () => {
      if (currentStory && currentUserId) {
        setIsLiked(false);
        const { data, error } = await supabase.from('story_likes')
          .select('id')
          .eq('story_id', currentStory.id)
          .eq('user_id', currentUserId);
        
        if (error) console.warn('Error fetching like status:', error.message);
        setIsLiked(data && data.length > 0);
      }
    };
    checkLiked();
  }, [currentStory?.id, currentUserId]);

  // View Logging
  useEffect(() => {
    const logView = async () => {
      if (currentStory && currentUserId) {
        const { data } = await supabase.from('story_views')
          .select('id')
          .eq('story_id', currentStory.id)
          .eq('user_id', currentUserId)
          .limit(1);
          
        if (!data || data.length === 0) {
          supabase.from('story_views').insert({
            story_id: currentStory.id,
            user_id: currentUserId
          }).then();
        }
      }
    };
    logView();
  }, [currentStory?.id, currentUserId]);

  // Progress Bar Animation
  useEffect(() => {
    if (!currentStory) return;
    progressAnim.setValue(0);

    const isVideo = currentStory.type === 'video';
    const duration = isVideo ? VIDEO_STORY_DURATION : IMAGE_STORY_DURATION;
    const isReady = isVideo ? isVideoLoaded : true;

    if (!isVideo) {
      setIsVideoLoaded(false);
      setIsVideoPlaying(false);
    }

    if (!isPaused && isReady) {
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: duration,
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (finished) navigation.goBack();
      });
    } else {
      progressAnim.stopAnimation();
    }
  }, [isPaused, currentStory, isVideoLoaded]);

  // Video Control
  useEffect(() => {
    if (ExpoVideo && currentStory?.type === 'video' && videoRef.current) {
      if (isPaused) {
        videoRef.current.pauseAsync().catch(() => {});
      } else {
        videoRef.current.playAsync().catch(() => {});
      }
    }
  }, [isPaused, currentStory, isVideoLoaded]);

  const likeStory = async () => {
    if (!currentStory || !currentUserId) return;
    const newIsLiked = !isLiked;
    setIsLiked(newIsLiked);

    if (newIsLiked) {
      await supabase.from('story_likes').insert({
        story_id: currentStory.id,
        user_id: currentUserId
      });
    } else {
      await supabase.from('story_likes')
        .delete()
        .eq('story_id', currentStory.id)
        .eq('user_id', currentUserId);
    }
  };

  const sendMessage = async () => {
    if (!currentStory || !message.trim() || !currentUserId) return;
    await supabase.from('story_messages').insert({
      story_id: currentStory.id,
      sender_id: currentUserId,
      creator_id: currentStory.creator_id,
      message: message.trim(),
    });
    setMessage('');
  };

  const shareStory = async () => {
    if (!currentStory) return;
    try {
      await Share.share({ message: `Check out this story: ${currentStory.media_url}` });
      if (currentUserId) {
        const { data } = await supabase.from('story_shares')
          .select('id').eq('story_id', currentStory.id).eq('user_id', currentUserId).limit(1);
        if (!data || data.length === 0) {
          await supabase.from('story_shares').insert({
            story_id: currentStory.id,
            user_id: currentUserId
          });
        }
      }
    } catch (err) {}
  };

  const fetchComments = async () => {
    if (!currentStory) return;
    const { data } = await supabase
      .from('story_comments')
      .select('*, User:user_id(username, avatarUrl)')
      .eq('story_id', currentStory.id)
      .order('created_at', { ascending: false });
    if (data) setComments(data);
  };

  const openCommentsSheet = () => {
    setIsPaused(true);
    setShowCommentModal(true);
    fetchComments();
  };

  const sendComment = async () => {
    if (!currentStory || !commentText.trim() || !currentUserId) return;
    const textToSend = commentText.trim();
    setCommentText('');
    
    // Optimistic UI updates
    const newComment = {
      id: Math.random().toString(),
      comment: textToSend,
      created_at: new Date().toISOString(),
      User: { username: 'You', avatarUrl: '' }
    };
    setComments([newComment, ...comments]);
    
    await supabase.from('story_comments').insert({
      story_id: currentStory.id,
      user_id: currentUserId,
      comment: textToSend,
    });
    fetchComments();
  };

  const openViewersSheet = async () => {
    if (!currentStory) return;
    setIsPaused(true);
    setShowViewersSheet(true);
    const { data } = await supabase
      .from('story_views')
      .select('*, User:user_id(username, avatarUrl)')
      .eq('story_id', currentStory.id)
      .order('viewed_at', { ascending: false });
    if (data) {
      const uniqueViews = data.filter((v: any, i: number, a: any[]) => a.findIndex(t => t.user_id === v.user_id) === i);
      setViewers(uniqueViews);
    }
  };

  const getTimeAgo = (dateStr: string) => {
    try {
      const ms = Date.now() - new Date(dateStr).getTime();
      const mins = Math.floor(ms / 60000);
      if (mins < 60) return `${mins}m`;
      const hrs = Math.floor(mins / 60);
      return `${hrs}h`;
    } catch { return '1h'; }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => setIsPaused(true),
      onPanResponderRelease: (evt, { dy }) => {
        setIsPaused(false);
        if (dy < -50 && currentStory && currentUserId === currentStory.creator_id) {
          openViewersSheet();
        } else if (Math.abs(dy) > 100) {
           navigation.goBack();
        }
      },
      onPanResponderTerminate: () => setIsPaused(false),
    })
  ).current;

  // SAFE LOADING STATE
  if (loadingStory) {
    return (
      <View style={styles.errorContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  // SAFE DATA CHECK
  if (!currentStory || !currentStory.media_url) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Story is unavailable or expired.</Text>
        <Ionicons name="close" size={40} color="#fff" onPress={() => navigation.goBack()} style={{ marginTop: 20 }} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <SafeAreaView style={styles.container}>
        <View style={styles.storyContainer} {...panResponder.panHandlers}>
        
        {/* MEDIA RENDER */}
        {(currentStory.type === 'video' && !currentStory.media_url.match(/\\.(jpe?g|png|gif|webp)(\\?.*)?$/i)) ? (
          <View style={styles.videoPlaceholder}>
            {ExpoVideo ? (
              <ExpoVideo
                ref={videoRef}
                source={{ uri: currentStory.media_url }}
                style={styles.media}
                resizeMode={ExpoResizeMode.CONTAIN}
                shouldPlay={!isPaused}
                isLooping={false}
                onLoad={() => {
                  setIsVideoLoaded(true);
                  setIsVideoPlaying(true);
                }}
                onPlaybackStatusUpdate={(status: any) => {
                  if (status.didJustFinish) {
                    navigation.goBack();
                  }
                }}
                onError={(err: any) => {
                  console.log('Story video error:', err);
                  setIsVideoLoaded(true); // Don't block loading
                }}
              />
            ) : (
              <WebView
                source={{ html: `
                  <html>
                    <body style="margin:0;padding:0;background:#000;display:flex;align-items:center;justify-content:center;height:100vh;overflow:hidden">
                      <video id="vid" src="${currentStory.media_url}" autoplay playsinline muted
                        style="width:100%;height:100%;object-fit:contain"
                      ></video>
                      <script>
                        const vid = document.getElementById('vid');
                        vid.onended = () => { window.ReactNativeWebView.postMessage('videoEnded'); };
                        window.addEventListener('message', (e) => {
                          if (e.data === 'pause') vid.pause();
                          if (e.data === 'play') vid.play();
                        });
                      </script>
                    </body>
                  </html>
                ` }}
                style={styles.media}
                allowsInlineMediaPlayback={true}
                mediaPlaybackRequiresUserAction={false}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                onMessage={(event: any) => {
                  if (event.nativeEvent.data === 'videoEnded') navigation.goBack();
                }}
                onLoad={() => {
                  setIsVideoLoaded(true);
                  setIsVideoPlaying(true);
                }}
              />
            )}
            {!isVideoLoaded && (
              <View style={styles.playOverlay}>
                <ActivityIndicator size="large" color="#fff" />
                <Text style={{ color: '#fff', marginTop: 12, fontSize: 14 }}>Loading video...</Text>
              </View>
            )}
          </View>
        ) : (currentStory.type === 'image' || currentStory.media_url.match(/\\.(jpe?g|png|gif|webp)(\\?.*)?$/i)) ? (
          <Image source={{ uri: currentStory.media_url }} style={styles.media} resizeMode="contain" />
        ) : currentStory.type === 'text' ? (
          <View style={[styles.media, { backgroundColor: currentStory.background_color || '#111', justifyContent: 'center', alignItems: 'center'}]}>
             <Text style={{color: '#fff', fontSize: 24, textAlign: 'center', marginHorizontal: 20}}>{currentStory.text_content}</Text>
          </View>
        ) : (
           <View style={[styles.media, { backgroundColor: '#111' }]} />
        )}

        <View style={styles.gradientOverlay} />

        {/* SINGLE PROGRESS BAR */}
        <View style={[styles.progressContainer, { top: insets.top + (Platform.OS === 'ios' ? 0 : 4) }]}>
          <View style={styles.progressBarBg}>
            <Animated.View style={[styles.progressBarFg, {
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%']
              })
            }]} />
          </View>
        </View>

        {/* HEADER */}
        <View style={[styles.header, { top: insets.top + (Platform.OS === 'ios' ? 12 : 16) }]}>
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

        {/* INTERACTION STRIP */}
        <View style={[styles.footer, keyboardOffset > 0 && { paddingBottom: 10, bottom: keyboardOffset }]}>
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
                <Ionicons name={isLiked ? "heart" : "heart-outline"} size={30} color={isLiked ? "#e11d48" : "#fff"} />
              </TouchableOpacity>
              {currentStory.allow_comments !== false && (
                <TouchableOpacity onPress={openCommentsSheet}>
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
                     {item.User?.avatarUrl ? (
                        <Image source={{ uri: item.User.avatarUrl }} style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12 }} />
                     ) : (
                        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#ddd', marginRight: 12 }} />
                     )}
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

      {/* Comment Modal */}
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
                     {item.User?.avatarUrl ? (
                      <Image source={{ uri: item.User.avatarUrl }} style={{ width: 36, height: 36, borderRadius: 18, marginRight: 12 }} />
                    ) : (
                      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#ddd', marginRight: 12 }} />
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: 'bold', fontSize: 13, color: '#000' }}>
                        {item.User?.username} <Text style={{ fontWeight: 'normal', color: '#666', fontSize: 12 }}>{getTimeAgo(item.created_at)}</Text>
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
                  <Ionicons name="send" size={24} color={commentText.trim() ? "#e11d48" : "#999"} />
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
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  errorContainer: {
    flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center'
  },
  errorText: { color: '#fff', fontSize: 16 },
  storyContainer: {
    flex: 1,
    backgroundColor: '#111',
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 8,
  },
  media: {
    width: '100%',
    height: '100%',
  },
  videoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 120,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  progressContainer: {
    flexDirection: 'row',
    position: 'absolute',
    top: Platform.OS === 'ios' ? 12 : 24,
    left: 8,
    right: 8,
    gap: 4,
    zIndex: 10,
  },
  progressBarBg: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFg: {
    height: '100%',
    backgroundColor: '#fff',
  },
  header: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 24 : 36,
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  username: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  timeAgo: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  closeBtn: {
    padding: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    paddingTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: 'transparent',
  },
  messageInputContainer: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    paddingHorizontal: 16,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  messageInput: {
    color: '#fff',
    fontSize: 15,
  },
  sheetOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end'
  },
  sheetContent: {
    backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: height * 0.6
  },
  sheetHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20
  },
  sheetTitle: {
    fontSize: 18, fontWeight: 'bold'
  },
});
