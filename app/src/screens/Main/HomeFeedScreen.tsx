import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, ScrollView, TouchableOpacity, Image, Share, ActivityIndicator, Platform, RefreshControl, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import AppBottomNavBar from '../../components/BottomNavBar';
import MainHeader from '../../components/MainHeader';
import { useFeed } from '../../context/FeedContext';
import { useNotifications } from '../../context/NotificationContext';
import { FeedItemType, FeedItem } from '../../types';
import { LinearGradient } from 'expo-linear-gradient';

const AD_MARKER = '__AD_PLACEHOLDER__';
const APP_DOWNLOAD_URL = 'https://play.google.com/store/apps/details?id=com.unai.antigravity';

export default function HomeFeedScreen() {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const navigation = useNavigation<any>();
  const { feedItems, isLoading, isRefreshing, refreshFeed, loadMoreFeed, hasMore, sortBy, setSortBy } = useFeed();
  const { unreadCount } = useNotifications();
  
  const [activeTab, setActiveTab] = useState('Trending');
  const tabs = ['Trending', 'News', 'Blogs', 'Videos', 'For You'];

  React.useEffect(() => {
    if (activeTab === 'Trending' && sortBy !== 'trending') setSortBy('trending');
    if (activeTab === 'For You' && sortBy !== 'latest') setSortBy('latest');
  }, [activeTab]);

  const handleTabPress = (tab: string) => {
    setActiveTab(tab);
  };

  const onShare = async (item: FeedItem) => {
    try {
      await Share.share({
        message: `${item.title}\n\nRead more on Jan Samvad:\nhttps://ohmyhindustan.com/post/${item.id}\n\nDownload the app: ${APP_DOWNLOAD_URL}`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const currentTabItems = useMemo(() => {
    if (activeTab === 'Trending' || activeTab === 'For You') return feedItems;
    if (activeTab === 'News') return feedItems.filter(it => [FeedItemType.NEWS, FeedItemType.UPDATE, FeedItemType.POLICY_TYPE, FeedItemType.PROMO].includes(it.type));
    if (activeTab === 'Blogs') return feedItems.filter(it => [FeedItemType.BLOG, FeedItemType.FORUM, FeedItemType.PROMO].includes(it.type));
    if (activeTab === 'Videos') return feedItems.filter(it => [FeedItemType.VIDEO, FeedItemType.DEBATE, FeedItemType.PROMO].includes(it.type));
    return feedItems;
  }, [feedItems, activeTab]);

  // Interleave ad placeholders after every 5 real posts
  const feedWithAds = useMemo(() => {
    if (currentTabItems.length < 5) return currentTabItems;
    const result: (FeedItem | { id: string; __isAd: true })[] = [];
    currentTabItems.forEach((item, index) => {
      result.push(item);
      if ((index + 1) % 5 === 0 && index < currentTabItems.length - 1) {
        result.push({ id: `${AD_MARKER}_${index}`, __isAd: true } as any);
      }
    });
    return result;
  }, [currentTabItems]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <MainHeader />

      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
          {tabs.map(tab => (
            <TouchableOpacity 
              key={tab} 
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => handleTabPress(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {isLoading && currentTabItems.length === 0 ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={colors.PrimaryRed} />
        </View>
      ) : currentTabItems.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Text style={{ color: colors.Slate500, textAlign: 'center' }}>No content found for "{activeTab}" yet.</Text>
        </View>
      ) : (
        <FlatList
          data={feedWithAds}
          keyExtractor={(item, index) => `${(item as any).id}-${index}`}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
          onEndReached={loadMoreFeed}
          onEndReachedThreshold={0.5}
          ListFooterComponent={() => (
            isLoading && hasMore ? (
              <ActivityIndicator size="small" color={colors.PrimaryRed} style={{ marginVertical: 20 }} />
            ) : null
          )}
          refreshControl={
            <RefreshControl 
              refreshing={isRefreshing} 
              onRefresh={refreshFeed} 
              colors={[colors.PrimaryRed]} 
              tintColor={colors.PrimaryRed}
            />
          }
          renderItem={({ item }) => {
            // Render ad placeholder
            if ((item as any).__isAd) {
              return <AdPlaceholderCard />;
            }
            const feedItem = item as FeedItem;
            return (
              <FeedCard 
                item={feedItem} 
                onClick={() => {
                  if (feedItem.type !== FeedItemType.PROMO) {
                    navigation.navigate('ArticleDetail', { id: feedItem.id });
                  }
                }}
                onShare={() => onShare(feedItem)}
              />
            );
          }}
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
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const upvotes = item.upvoteCount || 0;
  const downvotes = item.downvoteCount || 0;
  const commentCount = item.comments || 0;
  const repostCount = item.repostCount || 0;

  return (
    <TouchableOpacity style={styles.card} onPress={onClick} activeOpacity={0.8}>
      <View style={{ padding: 16 }}>
        {item.type === FeedItemType.PROMO ? (
          <View style={{ backgroundColor: colors.PrimaryRed, padding: 24, borderRadius: 12, alignItems: 'center' }}>
             <Ionicons name="mail" size={40} color="white" />
             <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold', marginVertical: 12, textAlign: 'center' }}>{item.title}</Text>
             <View style={{ backgroundColor: 'white', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 }}>
               <Text style={{ color: colors.PrimaryRed, fontWeight: 'bold' }}>Join Newsletter</Text>
             </View>
          </View>
        ) : (
          <View>
            <View style={{ width: '100%', aspectRatio: 16/9, borderRadius: 8, overflow: 'hidden', marginBottom: 12 }}>
              <Image source={{ uri: item.thumbnail }} style={{ flex: 1 }} />
              {item.type === FeedItemType.VIDEO || item.type === FeedItemType.DEBATE ? (
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' }}>
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.9)', width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' }}>
                    <Ionicons name="play" size={24} color={colors.PrimaryRed} style={{ marginLeft: 4 }} />
                  </View>
                </View>
              ) : null}
            </View>
            
            <View>
              <View style={{ backgroundColor: colors.PrimaryRedAlpha10, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, marginBottom: 8 }}>
                <Text style={{ color: colors.PrimaryRed, fontSize: 10, fontWeight: 'bold' }}>{item.category?.toUpperCase() || 'NEWS'}</Text>
              </View>
              <Text style={{ fontWeight: 'bold', fontSize: 18, color: colors.DarkText }} numberOfLines={3}>{item.title}</Text>
            </View>
            
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
               {item.authorImage ? (
                 <Image source={{ uri: item.authorImage }} style={{ width: 28, height: 28, borderRadius: 14 }} />
               ) : (
                 <Ionicons name="person-circle" size={28} color={colors.Slate400} />
               )}
               <View style={{ flex: 1, marginLeft: 8 }}>
                 <Text style={{ color: colors.Slate500, fontSize: 12 }}>{item.authorName} • {item.timestamp}</Text>
               </View>
            </View>
            
            <View style={styles.engagementBar}>
              <View style={styles.engagementItem}>
                <Ionicons name="arrow-up" size={16} color={colors.PrimaryRed} />
                <Text style={styles.engagementCount}>{formatCount(upvotes)}</Text>
                <Ionicons name="arrow-down" size={16} color={colors.Slate400} />
                <Text style={[styles.engagementCount, { color: colors.Slate400 }]}>{formatCount(downvotes)}</Text>
              </View>
              <View style={styles.engagementItem}>
                <Ionicons name="chatbubble-outline" size={15} color={colors.Slate500} />
                <Text style={styles.engagementCount}>{formatCount(commentCount)}</Text>
              </View>
              <View style={styles.engagementItem}>
                <Ionicons name="repeat-outline" size={16} color={colors.Slate500} />
                <Text style={styles.engagementCount}>{formatCount(repostCount)}</Text>
              </View>
              <View style={{ flex: 1 }} />
              <TouchableOpacity onPress={onShare} style={{ padding: 4, marginRight: 8 }}>
                <Ionicons name="share-social-outline" size={20} color={colors.Slate500} />
              </TouchableOpacity>
              <View style={{ backgroundColor: colors.Slate100, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 }}>
                 <Text style={{ color: colors.PrimaryRed, fontSize: 12, fontWeight: 'bold' }}>Read More</Text>
              </View>
            </View>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

// Ad Placeholder Card (Instagram-style sponsored post)
const AdPlaceholderCard = () => {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  return (
  <View style={styles.adCard}>
    <View style={styles.adHeader}>
      <View style={styles.adLogoBox}>
        <Ionicons name="megaphone" size={16} color="white" />
      </View>
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={styles.adBrandName}>Jan Samvad</Text>
        <Text style={styles.adSponsoredLabel}>Sponsored</Text>
      </View>
      <Ionicons name="ellipsis-horizontal" size={18} color={colors.Slate400} />
    </View>
    <View style={styles.adBanner}>
      <LinearGradient
        colors={['#BF3A2B', '#8E1F4F', '#E8722A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.adGradient}
      >
        <Ionicons name="newspaper-outline" size={36} color="rgba(255,255,255,0.9)" />
        <Text style={styles.adHeadline}>Stay Informed, Stay Empowered</Text>
        <Text style={styles.adSubtext}>Your daily dose of news, analysis & debate</Text>
      </LinearGradient>
    </View>
    <View style={styles.adFooter}>
      <TouchableOpacity 
        style={styles.adCTAButton}
        onPress={() => Linking.openURL(APP_DOWNLOAD_URL)}
      >
        <Text style={styles.adCTAText}>Learn More</Text>
      </TouchableOpacity>
      <View style={styles.adEngagement}>
        <Ionicons name="heart-outline" size={18} color={colors.Slate400} />
        <Ionicons name="chatbubble-outline" size={16} color={colors.Slate400} style={{ marginLeft: 16 }} />
        <Ionicons name="share-social-outline" size={18} color={colors.Slate400} style={{ marginLeft: 16 }} />
      </View>
    </View>
  </View>
)};

const getStyles = (colors: any) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.SurfaceWhite,
    paddingTop: Platform.OS === 'android' ? 24 : 0
  },
  tabsContainer: {
    backgroundColor: colors.SurfaceWhite,
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
    backgroundColor: colors.PrimaryRedAlpha10,
    borderColor: colors.PrimaryRed,
    borderWidth: 1
  },
  tabText: {
    color: colors.Slate500,
    fontWeight: 'bold',
    fontSize: 12
  },
  tabTextActive: {
    color: colors.PrimaryRed
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  card: {
    backgroundColor: colors.SurfaceWhite,
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
    color: colors.Slate500,
    marginLeft: 3,
    marginRight: 4,
  },
  // Ad Placeholder Styles
  adCard: {
    backgroundColor: colors.SurfaceWhite,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  adHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  adLogoBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.PrimaryRed,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adBrandName: { fontWeight: 'bold', fontSize: 14, color: colors.DarkText },
  adSponsoredLabel: { fontSize: 11, color: colors.Slate400 },
  adBanner: { width: '100%', aspectRatio: 16 / 9 },
  adGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  adHeadline: {
    color: 'white',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 12,
  },
  adSubtext: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
  },
  adFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  adCTAButton: {
    backgroundColor: colors.PrimaryRed,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  adCTAText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 13,
  },
  adEngagement: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
