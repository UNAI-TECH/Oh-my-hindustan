import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Image, Dimensions, TouchableWithoutFeedback,
  Animated, SafeAreaView, PanResponder, TouchableOpacity
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
  const progressAnim = useRef(new Animated.Value(0)).current;

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

  const currentGroup: CreatorGroup = creators[creatorIndex];
  const currentStory: Story | undefined = currentGroup?.stories[storyIndex];

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

  // Log View
  useEffect(() => {
    const logView = async () => {
      if (currentStory) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) {
          supabase.from('story_views').insert({
            story_id: currentStory.id,
            user_id: session.user.id
          }).then();
        }
      }
    };
    logView();
  }, [currentStory]);

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
    if (!currentStory) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      await supabase.from('story_likes').insert({
        story_id: currentStory.id,
        user_id: session.user.id
      });
      // Could add floating heart animation here
    }
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
    <SafeAreaView style={styles.container}>
      <View style={styles.storyContainer} {...panResponder.panHandlers}>
        {/* MEDIA */}
        {currentStory.type === 'video' ? (
          <View style={styles.videoPlaceholder}>
            <Image source={{ uri: currentStory.media_url }} style={styles.media} blurRadius={10} />
            <View style={styles.playOverlay}>
              <Ionicons name="play-circle-outline" size={64} color="#fff" />
              <Text style={{ color: '#fff', marginTop: 8 }}>Video Story</Text>
            </View>
          </View>
        ) : (
          <Image source={{ uri: currentStory.media_url }} style={styles.media} resizeMode="cover" />
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
            <Text style={styles.timeAgo}>2h</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* INTERACTION STRIP */}
        <View style={styles.footer}>
          <TouchableWithoutFeedback onPress={likeStory}>
            <View style={styles.iconBtn}>
              <Ionicons name="heart-outline" size={32} color="#fff" />
            </View>
          </TouchableWithoutFeedback>
          <TouchableWithoutFeedback onPress={() => alert('Share feature')}>
            <View style={styles.iconBtn}>
              <Ionicons name="paper-plane-outline" size={30} color="#fff" />
            </View>
          </TouchableWithoutFeedback>
        </View>
      </View>
    </SafeAreaView>
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
    bottom: 24,
    right: 16,
    alignItems: 'center',
    gap: 20,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  }
});
