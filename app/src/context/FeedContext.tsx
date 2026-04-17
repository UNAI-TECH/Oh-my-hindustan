import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { AppApi } from '../api/services';
import { FeedItem, FeedItemType } from '../types';
import { supabase } from '../lib/supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { withRetry } from '../utils/networkUtils';

const FEED_CACHE_KEY = 'home_feed_cache';

interface FeedContextProps {
  feedItems: FeedItem[];
  selectedArticle: FeedItem | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  hasMore: boolean;
  sortBy: 'latest' | 'trending';
  setSortBy: (sort: 'latest' | 'trending') => void;
  fetchArticle: (id: string) => Promise<void>;
  fetchHomeFeed: (showLoading?: boolean, reset?: boolean) => Promise<void>;
  loadMoreFeed: () => Promise<void>;
  refreshFeed: () => void;
}

const formatTimeAgo = (isoString: string): string => {
  try {
    // Normalize: if the timestamp has no timezone info (no Z or +/-), treat it as UTC
    let normalized = isoString;
    if (normalized && !normalized.endsWith('Z') && !normalized.match(/[+-]\d{2}:\d{2}$/)) {
      normalized += 'Z';
    }
    const date = new Date(normalized);
    if (isNaN(date.getTime())) return "Just now";
    
    const diff = Date.now() - date.getTime();
    if (diff < 0) return "Just now";
    const minutes = Math.floor(diff / (60 * 1000));
    
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  } catch (e) {
    return "Just now";
  }
};

const mapPostType = (type: string): FeedItemType => {
  const typeMap: Record<string, FeedItemType> = {
    'BLOG': FeedItemType.BLOG,
    'blog': FeedItemType.BLOG,
    'NEWS': FeedItemType.NEWS,
    'news': FeedItemType.NEWS,
    'VIDEO': FeedItemType.VIDEO,
    'video': FeedItemType.VIDEO,
    'FORUM': FeedItemType.FORUM,
    'DEBATE': FeedItemType.DEBATE,
    'POLICY_TYPE': FeedItemType.POLICY_TYPE,
    'UPDATE': FeedItemType.UPDATE,
    'update': FeedItemType.UPDATE,
    'PROMO': FeedItemType.PROMO,
  };
  return typeMap[type] || FeedItemType.NEWS;
};

const toFeedItem = (post: any): FeedItem => {
  return {
    id: post.id,
    type: mapPostType(post.type),
    title: post.title,
    subtitle: post.subtitle || "Oh My Hindustan",
    authorName: post.author?.channel_name || post.author?.username || "Creator",
    authorImage: post.author?.avatarUrl || "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&q=80&w=800",
    authorId: post.authorId || post.author?.id || null,
    thumbnail: post.thumbnail || post.mediaUrl || null,
    category: post.category || "General",
    timestamp: formatTimeAgo(post.createdAt),
    votes: post.voteCount || 0,
    upvoteCount: post.upvoteCount || 0,
    downvoteCount: post.downvoteCount || 0,
    comments: post.commentCount || 0,
    viewCount: post.viewCount || 0,
    excerpt: post.content?.substring(0, 150) || null,
    content: post.content,
    videoDuration: post.video_duration || null,
    videoUrl: post.videoUrl || post.video_url || null,
    isTrending: post.is_trending || false,
    ads_enabled: post.ads_enabled || false,
    ad_breaks: Array.isArray(post.ad_breaks) ? post.ad_breaks : null,
    authorNameCustom: post.author_name || null,
    authorPosition: post.author_position || null,
    hashtags: Array.isArray(post.hashtags) ? post.hashtags : (post.hashtags ? [post.hashtags] : null),
  };
};

const FeedContext = createContext<FeedContextProps | undefined>(undefined);

export const FeedProvider = ({ children }: { children: ReactNode }) => {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<FeedItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [sortBy, setSortByState] = useState<'latest' | 'trending'>('latest');
  const [error, setError] = useState<string | null>(null);
  const { userProfile } = useAuth();
  const isFetchingRef = useRef(false);

  const saveToCache = async (data: FeedItem[]) => {
    try {
      await AsyncStorage.setItem(FEED_CACHE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save feed cache', e);
    }
  };

  const loadFromCache = async () => {
    try {
      const cached = await AsyncStorage.getItem(FEED_CACHE_KEY);
      if (cached) {
        setFeedItems(JSON.parse(cached));
      }
    } catch (e) {
      console.error('Failed to load feed cache', e);
    }
  };

  const setSortBy = (sort: 'latest' | 'trending') => {
    setSortByState(sort);
    setPage(1);
    setFeedItems([]);
  };

  const fetchHomeFeed = async (showLoading = true, reset = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    if (showLoading) setIsLoading(true);
    const targetPage = reset ? 1 : page;
    
    try {
      if (reset && showLoading && feedItems.length === 0) await loadFromCache();
      
      // withRetry: automatically retries up to 3 times on network failures (mobile data)
      const response = await withRetry(
        () => AppApi.getHomeFeed(targetPage, 15, sortBy),
        3,
        1000,
      );
      const posts = response.data || [];
      const mapped = posts.map(toFeedItem);
      
      setFeedItems(prev => {
        const combined = reset ? mapped : [...prev, ...mapped];
        const seen = new Set();
        return combined.filter(it => {
          if (seen.has(it.id)) return false;
          seen.add(it.id);
          return true;
        });
      });
      
      // FIX: use posts.length < limit to determine if there are more pages
      // This avoids the stale closure on feedItems.length
      const noMore = posts.length < 15;
      setHasMore(!noMore);
      setError(null);
      if (reset) {
        if (reset) setPage(1);
        await saveToCache(mapped.slice(0, 50));
      }
    } catch (e: any) {
      // FIX: Handle PGRST103 (offset beyond available rows) gracefully
      if (e?.code === 'PGRST103') {
        setHasMore(false); // No more data — stop pagination
        // Don't set error — this isn't a real error, just end of data
      } else {
        console.error('Feed fetch error:', e);
        setError(e.message || 'Failed to load feed. Please check your connection.');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      isFetchingRef.current = false;
    }
  };

  const loadMoreFeed = async () => {
    if (isLoading || !hasMore || isFetchingRef.current) return;
    // Only increment page when we actually have more data
    setPage(prev => prev + 1);
  };

  useEffect(() => {
    fetchHomeFeed(page === 1, page === 1);
  }, [page, sortBy]);

  const refreshFeed = () => {
    if (page === 1) {
      setIsRefreshing(true);
      fetchHomeFeed(false, true);
    } else {
      setPage(1);
    }
  };

  const fetchArticle = async (id: string) => {
    setIsLoading(true);
    try {
      const localItem = feedItems.find(it => it.id === id);
      if (localItem) {
        setSelectedArticle(localItem);
        // Stale-while-revalidate: Fetch fresh data silently for flags like ads_enabled
        AppApi.getPost(id).then(freshResponse => {
           if (freshResponse) setSelectedArticle(toFeedItem(freshResponse));
        }).catch(() => {});
      } else {
        const response = await AppApi.getPost(id);
        if (response) {
          setSelectedArticle(toFeedItem(response));
        } else {
          setSelectedArticle(null);
        }
      }
    } catch (e) {
      console.error('Article fetch error:', e);
      setSelectedArticle(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Real-time: listen for new published posts + create notifications for followed creators
  useEffect(() => {
    let debounceTimer: any = null;
    const subscription = AppApi.subscribeToFeedUpdates(async (payload: any) => {
      // Refresh the feed
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (page === 1) {
          fetchHomeFeed(false, true);
        }
      }, 300);

      // Create notification if the current user follows the post author
      if (payload?.new && userProfile?.id && payload.eventType === 'INSERT') {
        try {
          const newPost = payload.new;
          const authorId = newPost.authorId;
          if (!authorId || authorId === userProfile.id) return;

          // Check if current user follows this author
          const { data: followData } = await supabase
            .from('Follow')
            .select('id')
            .eq('followerId', userProfile.id)
            .eq('followingId', authorId)
            .maybeSingle();

          if (followData) {
            // Get author name for the notification
            const { data: authorData } = await supabase
              .from('User')
              .select('username, channel_name')
              .eq('id', authorId)
              .maybeSingle();

            const authorName = authorData?.channel_name || authorData?.username || 'A creator you follow';
            const { generateUUID } = await import('../utils/uuid');

            await supabase.from('Notification').insert({
              id: generateUUID(),
              userId: userProfile.id,
              type: 'NEW_POST',
              title: `${authorName} published a new post`,
              message: newPost.title || 'Check out their latest content!',
              targetId: newPost.id,
              createdAt: new Date().toISOString(),
            });
          }
        } catch (e) {
          console.warn('[FEED] Notification creation error:', e);
        }
      }
    });

    const userChannel = supabase.channel('feed-user-updates')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'User' }, (payload) => {
        if (!payload.new) return;
        const updatedUser = payload.new as any;
        setFeedItems(prev => prev.map(item => {
          if (item.authorId === updatedUser.id) {
            return {
              ...item,
              authorName: updatedUser.channel_name || updatedUser.username || item.authorName,
              authorImage: updatedUser.avatarUrl || item.authorImage
            };
          }
          return item;
        }));
      })
      .subscribe();

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      supabase.removeChannel(subscription);
      supabase.removeChannel(userChannel);
    };
  }, [page, userProfile?.id]);

  return (
    <FeedContext.Provider value={{ 
      feedItems, 
      selectedArticle, 
      isLoading, 
      isRefreshing, 
      hasMore,
      sortBy,
      error,
      setSortBy,
      fetchArticle, 
      fetchHomeFeed,
      loadMoreFeed,
      refreshFeed
    }}>
      {children}
    </FeedContext.Provider>
  );
};

export const useFeed = () => {
  const context = useContext(FeedContext);
  if (!context) throw new Error('useFeed must be used within a FeedProvider');
  return context;
};
