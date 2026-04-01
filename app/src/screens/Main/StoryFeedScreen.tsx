import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  Image, ActivityIndicator, ScrollView, Dimensions, useWindowDimensions, Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAppTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabaseClient';
import MainHeader from '../../components/MainHeader';
import AppBottomNavBar from '../../components/BottomNavBar';
import { Ionicons } from '@expo/vector-icons';

interface Story {
  id: string;
  creator_id: string;
  media_url: string;
  type: string;
  created_at: string;
  viewers_count: number;
  User?: {
    username: string;
    avatarUrl: string;
    channel_name?: string;
  };
}

export default function StoryFeedScreen() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const { colors } = useAppTheme();
  const styles = getStyles(colors, isTablet, width);
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [stories, setStories] = useState<Story[]>([]);
  const [groupedStories, setGroupedStories] = useState<{creator_id: string, User: any, stories: Story[]}[]>([]);

  useEffect(() => {
    fetchStories();
    
    // Listen for realtime story inserts
    const channel = supabase.channel('public:stories')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'stories' }, () => {
        fetchStories();
      })
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchStories();
    }, [])
  );

  const fetchStories = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) return;

      // 1. Get followed creators
      const { data: follows } = await supabase
        .from('Follow')
        .select('followingId')
        .eq('followerId', userId);
        
      if (!follows || follows.length === 0) {
         setLoading(false);
         return;
      }
      
      const creatorIds = follows.map(f => f.followingId);
      
      // 2. Fetch active stories (Strict 24-hour expiry check)
      const { data: activeStories, error } = await supabase
        .from('stories')
        .select(`
          *,
          User:creator_id ( username, channel_name, avatarUrl )
        `)
        .in('creator_id', creatorIds)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      if (activeStories) {
         setStories(activeStories);
         
         // Group by creator for the top horizontal list
         const groups: Record<string, any> = {};
         activeStories.forEach(s => {
            if (!groups[s.creator_id]) {
               groups[s.creator_id] = { creator_id: s.creator_id, User: s.User, stories: [] };
            }
            groups[s.creator_id].stories.push(s);
         });
         setGroupedStories(Object.values(groups));
      }
    } catch (e) {
      console.warn('Error fetching stories:', e);
    } finally {
      setLoading(false);
    }
  };

  const openStoryViewer = (story: Story) => {
    // 1. Validate data before navigating (CRITICAL FIX)
    if (!story || !story.id || !story.media_url || !story.type) {
      console.log("Invalid story data:", story);
      return;
    }
    
    // Instead of passing a full massive object that could crash the navigation bridge,
    // we only pass the storyId and let the Viewer securely fetch it.
    navigation.navigate('StoryViewer', { storyId: story.id });
  };

  const openStoryViewerForCreator = (creatorId: string) => {
     // If clicking top circle, open the first valid story for that creator
     const group = groupedStories.find(g => g.creator_id === creatorId);
     if (group && group.stories.length > 0) {
        openStoryViewer(group.stories[0]);
     }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <MainHeader />
      
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.PrimaryRed} />
        </View>
      ) : groupedStories.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyContent}>
            <Ionicons name="aperture-outline" size={isTablet ? 80 : 64} color={colors.Slate400} />
            <Text style={[styles.emptyTitle, { color: colors.DarkText }]}>No Stories Available</Text>
            <Text style={[styles.emptySubtitle, { color: colors.Slate500 }]}>
               Follow more creators to see their 24-hour updates here.
            </Text>
          </View>
        </View>
      ) : (
        <ScrollView style={styles.feedScroll} showsVerticalScrollIndicator={false}>
          {/* TOP HORIZONTAL STORIES */}
          <View style={styles.topSection}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>

               {/* Followed Creators */}
               {groupedStories.map(group => (
                  <TouchableOpacity 
                     key={group.creator_id} 
                     style={styles.storyCircleBox}
                     onPress={() => openStoryViewerForCreator(group.creator_id)}
                  >
                     <View style={[styles.storyCircle, { borderColor: colors.PrimaryRed }]}>
                        {group.User?.avatarUrl ? (
                           <Image source={{ uri: group.User.avatarUrl }} style={styles.storyAvatar} />
                        ) : (
                           <Ionicons name="person" size={24} color={colors.Slate400} />
                        )}
                     </View>
                     <Text style={[styles.storyName, { color: colors.DarkText }]} numberOfLines={1}>
                        {group.User?.channel_name || group.User?.username || 'Creator'}
                     </Text>
                  </TouchableOpacity>
               ))}
            </ScrollView>
          </View>

          {/* RECENT STORIES FEED - MASONRY LIKE GRID */}
          <View style={styles.feedGrid}>
            <Text style={[styles.sectionTitle, { color: colors.DarkText }]}>Recent Updates</Text>
            <View style={styles.gridContainer}>
               {stories.map((story) => (
                  <TouchableOpacity 
                     key={story.id} 
                     style={[styles.storyCard, { backgroundColor: colors.Slate100 }]}
                     onPress={() => openStoryViewer(story)}
                  >
                     {story.type === 'video' ? (
                        <View style={styles.videoPlaceholder}>
                           <Image source={{ uri: story.media_url }} style={styles.storyCardImg} />
                           <View style={styles.playIconOverlay}>
                              <Ionicons name="play" size={24} color="#fff" />
                           </View>
                        </View>
                     ) : (
                        <Image source={{ uri: story.media_url }} style={styles.storyCardImg} />
                     )}
                     <View style={styles.storyCardOverlay}>
                        <View style={styles.storyCardHeader}>
                           {story.User?.avatarUrl ? (
                              <Image source={{ uri: story.User.avatarUrl }} style={styles.smallAvatar} />
                           ) : (
                              <View style={[styles.smallAvatar, { backgroundColor: colors.Slate400 }]} />
                           )}
                           <Text style={styles.storyCardName} numberOfLines={1}>
                              {story.User?.channel_name || story.User?.username}
                           </Text>
                        </View>
                     </View>
                  </TouchableOpacity>
               ))}
            </View>
          </View>
        </ScrollView>
      )}

      <View style={styles.bottomNavContainer}>
        <AppBottomNavBar currentRoute="StoryFeed" onNavigate={(r) => navigation.navigate(r)} />
      </View>
    </SafeAreaView>
  );
}

const getStyles = (colors: any, isTablet: boolean, width: number) => {
  const numColumns = isTablet ? 3 : 2;
  const horizontalPadding = isTablet ? 40 : 16;
  const gap = 16;
  const cardWidth = (width - (horizontalPadding * 2) - (gap * (numColumns - 1))) / numColumns;

  return StyleSheet.create({
    safeArea: { 
      flex: 1, 
      backgroundColor: colors.SurfaceWhite,
      paddingTop: Platform.OS === 'android' ? 24 : 0
    },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyContainer: { 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center',
      backgroundColor: colors.SurfaceWhite
    },
    emptyContent: {
      alignItems: 'center',
      paddingHorizontal: 40,
      marginBottom: 60, // visual center adjustment
    },
    emptyTitle: { fontSize: 20, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
    emptySubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
    feedScroll: { flex: 1 },
    topSection: {
       paddingVertical: isTablet ? 24 : 16,
       borderBottomWidth: 1,
       borderBottomColor: '#f1f5f9',
    },
    horizontalScroll: {
       paddingHorizontal: horizontalPadding,
       gap: isTablet ? 24 : 16,
    },
    storyCircleBox: {
       alignItems: 'center',
       width: isTablet ? 100 : 72,
    },
    storyCircle: {
       width: isTablet ? 84 : 64,
       height: isTablet ? 84 : 64,
       borderRadius: isTablet ? 42 : 32,
       borderWidth: 3,
       padding: 3,
       justifyContent: 'center',
       alignItems: 'center',
       marginBottom: 6,
    },
    storyAvatar: {
       width: '100%',
       height: '100%',
       borderRadius: isTablet ? 38 : 30,
       backgroundColor: '#e2e8f0',
    },
    storyName: {
       fontSize: isTablet ? 13 : 11,
       fontWeight: '600',
       marginTop: 4,
    },
    feedGrid: {
       padding: horizontalPadding,
       paddingBottom: 120,
    },
    sectionTitle: {
       fontSize: isTablet ? 22 : 18,
       fontWeight: 'bold',
       marginBottom: 20,
    },
    gridContainer: {
       flexDirection: 'row',
       flexWrap: 'wrap',
       justifyContent: 'flex-start',
       gap: gap,
    },
    storyCard: {
       width: cardWidth,
       aspectRatio: 0.7,
       borderRadius: 20,
       overflow: 'hidden',
       marginBottom: gap,
    },
    storyCardImg: {
       width: '100%',
       height: '100%',
       resizeMode: 'cover',
    },
    videoPlaceholder: {
       flex: 1,
       backgroundColor: '#000',
    },
    playIconOverlay: {
       ...StyleSheet.absoluteFillObject,
       justifyContent: 'center',
       alignItems: 'center',
       backgroundColor: 'rgba(0,0,0,0.2)'
    },
    storyCardOverlay: {
       ...StyleSheet.absoluteFillObject,
       padding: 12,
       justifyContent: 'space-between',
       backgroundColor: 'rgba(0,0,0,0.1)'
    },
    storyCardHeader: {
       flexDirection: 'row',
       alignItems: 'center',
       gap: 8,
    },
    smallAvatar: {
       width: isTablet ? 32 : 24,
       height: isTablet ? 32 : 24,
       borderRadius: isTablet ? 16 : 12,
    },
    storyCardName: {
       color: '#fff',
       fontSize: isTablet ? 14 : 12,
       fontWeight: 'bold',
       textShadowColor: 'rgba(0,0,0,0.5)',
       textShadowOffset: { width: 0, height: 1 },
       textShadowRadius: 2,
    },
    bottomNavContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0
    }
  });
};
