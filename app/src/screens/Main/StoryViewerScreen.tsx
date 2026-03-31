import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Image, Dimensions, TouchableWithoutFeedback,
  Animated, SafeAreaView, PanResponder, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Share, Modal, FlatList, Keyboard
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabaseClient';

const { width, height } = Dimensions.get('window');
const STORY_DURATION = 5000; // 5 seconds per image

interface Story {
  id: string;
  creator_id: string;
  media_url: string;
  type: string;
  created_at: string;
  allow_comments?: boolean;
  allow_sharing?: boolean;
}

interface CreatorGroup {
  creator_id: string;
  User: { username: string; avatarUrl: string };
  stories: Story[];
}

export default function StoryViewerScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();

  const { creators, initialCreatorId, initialStoryIndex } = route.params || { creators: [], initialCreatorId: '', initialStoryIndex: 0 };

  const [creatorIndex, setCreatorIndex] = useState(0);
  const [storyIndex, setStoryIndex] = useState(0);
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

  // Initialize derivations before useEffect hooks
  const currentGroup: CreatorGroup = creators[creatorIndex];
  const currentStory: Story | undefined = currentGroup?.stories[storyIndex];

  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvt, (e) => setKeyboardOffset(e.endCoordinates.height));
    const hideSub = Keyboard.addListener(hideEvt, () => setKeyboardOffset(0));
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  useEffect(() => {
    const checkLiked = async () => {
      if (currentStory && currentUserId) {
        setIsLiked(false); // Reset optimistic state while fetching
        const { data, error } = await supabase.from('story_likes')
          .select('id')
          .eq('story_id', currentStory.id)
          .eq('user_id', currentUserId);
        
        if (error) {
          console.warn('Error fetching like status:', error.message);
        }
        setIsLiked(data && data.length > 0);
      }
    };
    checkLiked();
  }, [currentStory?.id, currentUserId]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setCurrentUserId(session.user.id);
    });
  }, []);

  // Initialize indices based on params
  useEffect(() => {
    if (creators && creators.length > 0) {
      const cIndex = creators.findIndex((c: any) => c.creator_id === initialCreatorId);
      if (cIndex !== -1) {
        setCreatorIndex(cIndex);
        setStoryIndex(initialStoryIndex || 0);
      }
    }
  }, []);

  // Progress Bar Animation
  useEffect(() => {
    if (!currentStory) return;
    progressAnim.setValue(0);

    if (!isPaused) {
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: STORY_DURATION,
        useNativeDriver: false, // width animations can't use native driver
      }).start(({ finished }) => {
        if (finished) goToNextStory();
      });
    } else {
      progressAnim.stopAnimation();
    }
  }, [creatorIndex, storyIndex, isPaused, currentStory]);

  // Log View safely
  useEffect(() => {
    const logView = async () => {
      if (currentStory && currentUserId) {
        const { data, error } = await supabase.from('story_views')
          .select('id')
          .eq('story_id', currentStory.id)
          .eq('user_id', currentUserId)
          .limit(1);
          
        if (!data || data.length === 0) {
          // If 0, insert
          supabase.from('story_views').insert({
            story_id: currentStory.id,
            user_id: currentUserId
          }).then();
        }
      }
    };
    logView();
  }, [currentStory?.id, currentUserId]);

  const goToNextStory = () => {
    if (!currentGroup) return;
    if (storyIndex < currentGroup.stories.length - 1) {
      setStoryIndex(storyIndex + 1);
    } else {
      goToNextCreator();
    }
  };

  const goToPrevStory = () => {
    if (!currentGroup) return;
    if (storyIndex > 0) {
      setStoryIndex(storyIndex - 1);
    } else {
      goToPrevCreator();
    }
  };

  const goToNextCreator = () => {
    if (creatorIndex < creators.length - 1) {
      setCreatorIndex(creatorIndex + 1);
      setStoryIndex(0);
    } else {
      navigation.goBack(); // All stories watched
    }
  };

  const goToPrevCreator = () => {
    if (creatorIndex > 0) {
      setCreatorIndex(creatorIndex - 1);
      setStoryIndex(creators[creatorIndex - 1].stories.length - 1);
    } else {
      navigation.goBack(); // Exit at start
    }
  };

  const likeStory = async () => {
    if (!currentStory || !currentUserId) return;
    
    // Optimistic toggle
    const newIsLiked = !isLiked;
    setIsLiked(newIsLiked);

    if (newIsLiked) {
      const { error } = await supabase.from('story_likes').insert({
        story_id: currentStory.id,
        user_id: currentUserId
      });
      if (error) console.warn('Error liking story:', error.message);
    } else {
      const { error } = await supabase.from('story_likes')
        .delete()
        .eq('story_id', currentStory.id)
        .eq('user_id', currentUserId);
      if (error) console.warn('Error unliking story:', error.message);
    }
  };

  const sendMessage = async () => {
    if (!currentStory || !message.trim()) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      await supabase.from('story_messages').insert({
        story_id: currentStory.id,
        sender_id: session.user.id,
        creator_id: currentStory.creator_id,
        message: message.trim(),
      });
      setMessage('');
    }
  };

  const shareStory = async () => {
    if (!currentStory) return;
    try {
      await Share.share({ message: `Check out this story: ${currentStory.media_url}` });
      if (currentUserId) {
        // Prevent duplicate shares
        const { data } = await supabase.from('story_shares')
          .select('id')
          .eq('story_id', currentStory.id)
          .eq('user_id', currentUserId)
          .limit(1);
          
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
    
    const newComment = {
      id: Math.random().toString(),
      comment: commentText.trim(),
      created_at: new Date().toISOString(),
      User: { username: 'You', avatarUrl: '' }
    };
    setComments([newComment, ...comments]);
    
    const textToSend = commentText.trim();
    setCommentText('');
    
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

  // Pan Responder for swipes (Next/Prev Creator) and holds (Pause)
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setIsPaused(true);
      },
      onPanResponderRelease: (evt, gestureState) => {
        setIsPaused(false);
        const { dx, dy } = gestureState;
        // Check for Tap vs Swipe
        if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
          // Tap
          const touchX = evt.nativeEvent.pageX;
          if (touchX < width * 0.3) {
            goToPrevStory();
          } else {
            goToNextStory();
          }
        } else if (dy < -50 && currentUserId === currentStory.creator_id) {
          // Swipe up -> Open viewers list if creator
          openViewersSheet();
        } else if (dx > 50) {
          // Swipe right -> Prev Creator
          goToPrevCreator();
        } else if (dx < -50) {
          // Swipe left -> Next Creator
          goToNextCreator();
        }
      },
      onPanResponderTerminate: () => setIsPaused(false),
    })
  ).current;

  if (!currentGroup || !currentStory) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Story no longer available.</Text>
        <Ionicons name="close" size={40} color="#fff" onPress={() => navigation.goBack()} style={{ marginTop: 20 }} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <SafeAreaView style={styles.container}>
        <View style={styles.storyContainer} {...panResponder.panHandlers}>
        {/* MEDIA */}
        {currentStory.type === 'video' ? (
          <View style={styles.videoPlaceholder}>
            <Image source={{ uri: currentStory.media_url }} style={styles.media} blurRadius={10} resizeMode="contain" />
            <View style={styles.playOverlay}>
              <Ionicons name="play-circle-outline" size={64} color="#fff" />
              <Text style={{ color: '#fff', marginTop: 8 }}>Video Story</Text>
            </View>
          </View>
        ) : (
          <Image source={{ uri: currentStory.media_url }} style={styles.media} resizeMode="contain" />
        )}

        <View style={styles.gradientOverlay} />

        {/* PROGRESS BARS */}
        <View style={styles.progressContainer}>
          {currentGroup.stories.map((s, idx) => (
            <View key={s.id} style={styles.progressBarBg}>
              <Animated.View style={[styles.progressBarFg, {
                width: idx === storyIndex ? progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%']
                }) : idx < storyIndex ? '100%' : '0%'
              }]} />
            </View>
          ))}
        </View>

        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {currentGroup.User.avatarUrl ? (
              <Image source={{ uri: currentGroup.User.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: '#cbd5e1' }]} />
            )}
            <Text style={styles.username}>{currentGroup.User.username}</Text>
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
    backgroundColor: 'rgba(0,0,0,0.3)', // subtle dark top
  },
  progressContainer: {
    flexDirection: 'row',
    position: 'absolute',
    top: 12,
    left: 8,
    right: 8,
    gap: 4,
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
    top: 24,
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
