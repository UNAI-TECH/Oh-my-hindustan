import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, ScrollView, TouchableOpacity, Image, Share, ActivityIndicator, Platform, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../theme/Theme';
import { Ionicons } from '@expo/vector-icons';
import AppBottomNavBar from '../../components/BottomNavBar';
import { useFeed } from '../../context/FeedContext';
import { useNotifications } from '../../context/NotificationContext';
import { FeedItemType, FeedItem } from '../../types';

export default function HomeFeedScreen() {
  const navigation = useNavigation<any>();
  const { feedItems, isLoading, isRefreshing, refreshFeed, loadMoreFeed, hasMore, sortBy, setSortBy } = useFeed();
  const { unreadCount } = useNotifications();
  
  const [selectedTab, setSelectedTab] = useState('Trending');
  const tabs = ['Trending', 'News', 'Blogs', 'Videos', 'For You'];

  const filteredItems = useMemo(() => {
    const items = feedItems;
    switch (selectedTab) {
      case 'Trending': return items;
      case 'News': return items.filter(it => [FeedItemType.NEWS, FeedItemType.UPDATE, FeedItemType.POLICY_TYPE, FeedItemType.PROMO].includes(it.type));
      case 'Blogs': return items.filter(it => [FeedItemType.BLOG, FeedItemType.FORUM, FeedItemType.PROMO].includes(it.type));
      case 'Videos': return items.filter(it => [FeedItemType.VIDEO, FeedItemType.DEBATE, FeedItemType.PROMO].includes(it.type));
      case 'For You': return items;
      default: return items;
    }
  }, [selectedTab, feedItems]);

  const handleTabPress = (tab: string) => {
    setSelectedTab(tab);
    if (tab === 'Trending') setSortBy('trending');
    if (tab === 'For You') setSortBy('latest');
  };

  const onShare = async (item: FeedItem) => {
    try {
      await Share.share({
        message: `${item.title}\n\nRead more at Oh My Hindustan`,
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
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
          {tabs.map(tab => (
            <TouchableOpacity 
              key={tab} 
              style={[styles.tab, selectedTab === tab && styles.tabActive]}
              onPress={() => handleTabPress(tab)}
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
      ) : filteredItems.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Text style={{ color: Colors.Slate500, textAlign: 'center' }}>No content found for "{selectedTab}" yet.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
          onEndReached={loadMoreFeed}
          onEndReachedThreshold={0.5}
          ListFooterComponent={() => (
            isLoading && hasMore ? (
              <ActivityIndicator size="small" color={Colors.PrimaryRed} style={{ marginVertical: 20 }} />
            ) : null
          )}
          refreshControl={
            <RefreshControl 
              refreshing={isRefreshing} 
              onRefresh={refreshFeed} 
              colors={[Colors.PrimaryRed]} 
              tintColor={Colors.PrimaryRed}
            />
          }
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
        <AppBottomNavBar 
          currentRoute="Home" 
          onNavigate={(route) => navigation.navigate(route)} 
          onDoubleTapHome={refreshFeed}
        />
      </View>
    </SafeAreaView>
  );
}

const formatCount = (n: number): string => {
  if (n >= 10000) return `${(n / 1000).toFixed(1)}K`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
};

const FeedCard = ({ item, onClick, onShare }: { item: FeedItem, onClick: () => void, onShare: () => void }) => {
  const upvotes = item.upvoteCount || 0;
  const downvotes = item.downvoteCount || 0;
  const commentCount = item.comments || 0;
  const repostCount = item.repostCount || 0;

  return (
    <TouchableOpacity style={styles.card} onPress={onClick} activeOpacity={0.8}>
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
                 <Text style={{ color: Colors.Slate500, fontSize: 12 }}>{item.authorName} • {item.timestamp}</Text>
               </View>
            </View>
            <View style={styles.engagementBar}>
              <View style={styles.engagementItem}>
                <Ionicons name="arrow-up" size={16} color={Colors.PrimaryRed} />
                <Text style={styles.engagementCount}>{formatCount(upvotes)}</Text>
                <Ionicons name="arrow-down" size={16} color={Colors.Slate400} />
                <Text style={[styles.engagementCount, { color: Colors.Slate400 }]}>{formatCount(downvotes)}</Text>
              </View>
              <View style={styles.engagementItem}>
                <Ionicons name="chatbubble-outline" size={15} color={Colors.Slate500} />
                <Text style={styles.engagementCount}>{formatCount(commentCount)}</Text>
              </View>
              <View style={styles.engagementItem}>
                <Ionicons name="repeat-outline" size={16} color={Colors.Slate500} />
                <Text style={styles.engagementCount}>{formatCount(repostCount)}</Text>
              </View>
              <TouchableOpacity onPress={onShare} style={{ padding: 4 }}>
                <Ionicons name="share-social-outline" size={18} color={Colors.Slate500} />
              </TouchableOpacity>
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
            <View style={styles.engagementBar}>
              <View style={styles.engagementItem}>
                <Ionicons name="arrow-up" size={16} color={Colors.PrimaryRed} />
                <Text style={styles.engagementCount}>{formatCount(upvotes)}</Text>
                <Ionicons name="arrow-down" size={16} color={Colors.Slate400} />
                <Text style={[styles.engagementCount, { color: Colors.Slate400 }]}>{formatCount(downvotes)}</Text>
              </View>
              <View style={styles.engagementItem}>
                <Ionicons name="chatbubble-outline" size={15} color={Colors.Slate500} />
                <Text style={styles.engagementCount}>{formatCount(commentCount)}</Text>
              </View>
              <View style={styles.engagementItem}>
                <Ionicons name="repeat-outline" size={16} color={Colors.Slate500} />
                <Text style={styles.engagementCount}>{formatCount(repostCount)}</Text>
              </View>
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
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.PrimaryRed,
    borderWidth: 1.5,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: 'white',
    fontSize: 9,
    fontWeight: 'bold',
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
  },
  engagementBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  engagementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  engagementCount: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.Slate500,
    marginLeft: 3,
    marginRight: 4,
  },
});
