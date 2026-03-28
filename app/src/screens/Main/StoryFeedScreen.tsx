import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  Image, ActivityIndicator, SafeAreaView, ScrollView, Dimensions 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
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
  };
}

export default function StoryFeedScreen() {
  const { colors } = useAppTheme();
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
      
      // 2. Fetch active stories (RLS handles expiry limitation)
      const { data: activeStories, error } = await supabase
        .from('stories')
        .select(`
          *,
          User:creator_id ( username, avatarUrl )
        `)
        .in('creator_id', creatorIds)
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

  const openStoryViewer = (creatorId: string, initialIndex: number = 0) => {
     // Navigate to StoryViewer
     navigation.navigate('StoryViewer', { 
         creators: groupedStories, 
         initialCreatorId: creatorId,
         initialStoryIndex: initialIndex
     });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.SurfaceWhite }]}>
      <MainHeader />
      
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.PrimaryRed} />
        </View>
      ) : groupedStories.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="aperture-outline" size={64} color={colors.Slate400} />
          <Text style={[styles.emptyTitle, { color: colors.DarkText }]}>No Stories Available</Text>
          <Text style={[styles.emptySubtitle, { color: colors.Slate500 }]}>
             Follow more creators to see their 24-hour updates here.
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.feedScroll} showsVerticalScrollIndicator={false}>
          {/* TOP HORIZONTAL STORIES */}
          <View style={styles.topSection}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
               {/* Current User Add Story Placeholder */}
               <TouchableOpacity style={styles.storyCircleBox} onPress={() => alert('Use Creator Studio to upload a story.')}>
                  <View style={[styles.storyCircle, { borderColor: colors.Slate200, borderWidth: 2 }]}>
                     <Ionicons name="add" size={32} color={colors.Slate500} />
                  </View>
                  <Text style={[styles.storyName, { color: colors.DarkText }]} numberOfLines={1}>Your Story</Text>
               </TouchableOpacity>

               {/* Followed Creators */}
               {groupedStories.map(group => (
                  <TouchableOpacity 
                     key={group.creator_id} 
                     style={styles.storyCircleBox}
                     onPress={() => openStoryViewer(group.creator_id)}
                  >
                     <View style={[styles.storyCircle, { borderColor: colors.PrimaryRed }]}>
                        {group.User?.avatarUrl ? (
                           <Image source={{ uri: group.User.avatarUrl }} style={styles.storyAvatar} />
                        ) : (
                           <Ionicons name="person" size={24} color={colors.Slate400} />
                        )}
                     </View>
                     <Text style={[styles.storyName, { color: colors.DarkText }]} numberOfLines={1}>
                        {group.User?.username || 'Creator'}
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
                     onPress={() => openStoryViewer(story.creator_id)}
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
                           <Text style={styles.storyCardName} numberOfLines={1}>{story.User?.username}</Text>
                        </View>
                     </View>
                  </TouchableOpacity>
               ))}
            </View>
          </View>
        </ScrollView>
      )}

      <AppBottomNavBar currentRoute="StoryFeed" onNavigate={(r) => navigation.navigate(r)} />
    </SafeAreaView>
  );
}

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2;

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  feedScroll: { flex: 1 },
  topSection: {
     paddingVertical: 16,
     borderBottomWidth: 1,
     borderBottomColor: '#f1f5f9',
  },
  horizontalScroll: {
     paddingHorizontal: 16,
     gap: 16,
  },
  storyCircleBox: {
     alignItems: 'center',
     width: 72,
  },
  storyCircle: {
     width: 64,
     height: 64,
     borderRadius: 32,
     borderWidth: 3,
     padding: 2,
     justifyContent: 'center',
     alignItems: 'center',
     marginBottom: 6,
  },
  storyAvatar: {
     width: '100%',
     height: '100%',
     borderRadius: 30,
     backgroundColor: '#e2e8f0',
  },
  storyName: {
     fontSize: 11,
     fontWeight: '500',
  },
  feedGrid: {
     padding: 16,
  },
  sectionTitle: {
     fontSize: 18,
     fontWeight: 'bold',
     marginBottom: 16,
  },
  gridContainer: {
     flexDirection: 'row',
     flexWrap: 'wrap',
     justifyContent: 'space-between',
     gap: 16,
  },
  storyCard: {
     width: cardWidth,
     aspectRatio: 0.65,
     borderRadius: 16,
     overflow: 'hidden',
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
     backgroundColor: 'rgba(0,0,0,0.1)' // subtle dark gradient can be added here
  },
  storyCardHeader: {
     flexDirection: 'row',
     alignItems: 'center',
     gap: 8,
  },
  smallAvatar: {
     width: 24,
     height: 24,
     borderRadius: 12,
  },
  storyCardName: {
     color: '#fff',
     fontSize: 12,
     fontWeight: 'bold',
     textShadowColor: 'rgba(0,0,0,0.5)',
     textShadowOffset: { width: 0, height: 1 },
     textShadowRadius: 2,
  }
});
