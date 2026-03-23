import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, ScrollView, TouchableOpacity, Image, Share, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../theme/Theme';
import { Ionicons } from '@expo/vector-icons';
import AppBottomNavBar from '../../components/BottomNavBar';
import { useFeed } from '../../context/FeedContext';
import { FeedItemType, FeedItem, SampleData } from '../../types';

export default function HomeFeedScreen() {
  const navigation = useNavigation<any>();
  const { feedItems, isLoading } = useFeed();
  
  const [selectedTab, setSelectedTab] = useState('Trending');
  const tabs = ['Trending', 'News', 'Blogs', 'Videos', 'For You'];

  const filteredItems = useMemo(() => {
    const items = feedItems.length > 0 ? feedItems : [
      ...SampleData.topNarratives,
      ...SampleData.baseFeedItems
    ];
    switch (selectedTab) {
      case 'Trending': return [...items].sort(() => 0.5 - Math.random()).slice(0, 5);
      case 'News': return items.filter(it => [FeedItemType.NEWS, FeedItemType.UPDATE, FeedItemType.POLICY_TYPE, FeedItemType.PROMO].includes(it.type));
      case 'Blogs': return items.filter(it => [FeedItemType.BLOG, FeedItemType.FORUM, FeedItemType.PROMO].includes(it.type));
      case 'Videos': return items.filter(it => [FeedItemType.VIDEO, FeedItemType.DEBATE, FeedItemType.PROMO].includes(it.type));
      case 'For You': return items;
      default: return items;
    }
  }, [selectedTab, feedItems]);

  const onShare = async (item: FeedItem) => {
    try {
      await Share.share({
        message: `${item.title}\n\nRead more at Viewer App`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerTitle}>
          <View style={styles.logoBox}>
            <Ionicons name="globe" size={20} color="white" />
          </View>
          <Text style={styles.headerText}>JAN SAMVAD</Text>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity onPress={() => navigation.navigate('Search')} style={styles.iconBtn}>
            <Ionicons name="search" size={24} color={Colors.Slate500} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={styles.iconBtn}>
            <Ionicons name="notifications" size={24} color={Colors.Slate500} />
            <View style={styles.badge} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
          {tabs.map(tab => (
            <TouchableOpacity 
              key={tab} 
              style={[styles.tab, selectedTab === tab && styles.tabActive]}
              onPress={() => setSelectedTab(tab)}
            >
              <Text style={[styles.tabText, selectedTab === tab && styles.tabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {isLoading && feedItems.length === 0 ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={Colors.PrimaryRed} />
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
          renderItem={({ item }) => (
            <FeedCard 
              item={item} 
              onClick={() => {
                if (item.type !== FeedItemType.PROMO) {
                  navigation.navigate('ArticleDetail', { id: item.id });
                }
              }}
              onShare={() => onShare(item)}
            />
          )}
        />
      )}

      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
        <AppBottomNavBar currentRoute="Home" onNavigate={(route) => navigation.navigate(route)} />
      </View>
    </SafeAreaView>
  );
}

const FeedCard = ({ item, onClick, onShare }: { item: FeedItem, onClick: () => void, onShare: () => void }) => {
  const [votes, setVotes] = useState<number>(parseFloat(item.votes?.toString().replace('k', '') || '0'));
  const [commentsCount, setCommentsCount] = useState<number>(parseInt(item.comments?.toString() || '0') || 0);

  return (
    <TouchableOpacity style={styles.card} onPress={onClick} activeOpacity={0.8}>
      {/* Simplify rendering based on type for brevity, but matching UI closely */}
      <View style={{ padding: 16 }}>
        {item.type === FeedItemType.PROMO ? (
          <View style={{ backgroundColor: Colors.PrimaryRed, padding: 24, borderRadius: 12, alignItems: 'center' }}>
             <Ionicons name="mail" size={40} color="white" />
             <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold', marginVertical: 12, textAlign: 'center' }}>{item.title}</Text>
             <View style={{ backgroundColor: 'white', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 }}>
               <Text style={{ color: Colors.PrimaryRed, fontWeight: 'bold' }}>Join Newsletter</Text>
             </View>
          </View>
        ) : item.type === FeedItemType.VIDEO || item.type === FeedItemType.DEBATE ? (
          <View>
            <View style={{ width: '100%', aspectRatio: 16/9, borderRadius: 8, overflow: 'hidden' }}>
              <Image source={{ uri: item.thumbnail }} style={{ flex: 1 }} />
              <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' }}>
                <View style={{ backgroundColor: 'rgba(255,255,255,0.9)', width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' }}>
                  <Ionicons name="play" size={24} color={Colors.PrimaryRed} style={{ marginLeft: 4 }} />
                </View>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
               <Image source={{ uri: item.authorImage }} style={{ width: 40, height: 40, borderRadius: 20 }} />
               <View style={{ flex: 1, marginLeft: 12 }}>
                 <Text style={{ fontWeight: 'bold', fontSize: 16 }} numberOfLines={1}>{item.title}</Text>
                 <Text style={{ color: Colors.Slate500, fontSize: 12 }}>{item.authorName} • 456k views</Text>
               </View>
            </View>
          </View>
        ) : (
          <View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <View style={{ backgroundColor: Colors.PrimaryRedAlpha10, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, marginBottom: 8 }}>
                  <Text style={{ color: Colors.PrimaryRed, fontSize: 10, fontWeight: 'bold' }}>{item.category?.toUpperCase() || 'NEWS'}</Text>
                </View>
                <Text style={{ fontWeight: 'bold', fontSize: 16 }} numberOfLines={4}>{item.title}</Text>
              </View>
              <Image source={{ uri: item.thumbnail }} style={{ width: 80, height: 80, borderRadius: 8, marginLeft: 16 }} />
            </View>
            
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4 }}>
                <TouchableOpacity onPress={() => setVotes(v => v + 0.1)}><Ionicons name="arrow-up" size={16} color={Colors.Slate500} /></TouchableOpacity>
                <Text style={{ fontWeight: 'bold', fontSize: 12, marginHorizontal: 4 }}>{votes.toFixed(1)}k</Text>
                <TouchableOpacity onPress={() => setVotes(v => Math.max(0, v - 0.1))}><Ionicons name="arrow-down" size={16} color={Colors.Slate500} /></TouchableOpacity>
              </View>
              
              <TouchableOpacity onPress={() => setCommentsCount(c => c + 1)} style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 16 }}>
                <Ionicons name="chatbubble-outline" size={16} color={Colors.Slate500} style={{ marginRight: 4 }} />
                <Text style={{ fontSize: 14, color: Colors.Slate500 }}>{commentsCount}</Text>
              </TouchableOpacity>
              
              <View style={{ flex: 1 }} />
              <TouchableOpacity onPress={onShare} style={{ padding: 4, marginRight: 8 }}>
                <Ionicons name="share-social-outline" size={20} color={Colors.Slate500} />
              </TouchableOpacity>
              <Text style={{ color: Colors.PrimaryRed, fontSize: 12, fontWeight: 'bold' }}>Read More</Text>
            </View>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.SurfaceWhite,
    paddingTop: Platform.OS === 'android' ? 24 : 0
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.SurfaceWhite
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBox: {
    backgroundColor: Colors.PrimaryRed,
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8
  },
  headerText: {
    fontWeight: '900',
    fontSize: 18,
    color: Colors.PrimaryRed,
    letterSpacing: 1
  },
  headerIcons: {
    flexDirection: 'row'
  },
  iconBtn: {
    padding: 8,
    marginLeft: 8,
    position: 'relative'
  },
  iconText: {
    fontSize: 20
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.PrimaryRed,
    borderWidth: 1.5,
    borderColor: 'white'
  },
  tabsContainer: {
    backgroundColor: Colors.SurfaceWhite,
    paddingVertical: 12
  },
  tab: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8
  },
  tabActive: {
    backgroundColor: Colors.PrimaryRedAlpha10,
    borderColor: Colors.PrimaryRed,
    borderWidth: 1
  },
  tabText: {
    color: Colors.Slate500,
    fontWeight: 'bold',
    fontSize: 12
  },
  tabTextActive: {
    color: Colors.PrimaryRed
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  card: {
    backgroundColor: Colors.SurfaceWhite,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  }
});
