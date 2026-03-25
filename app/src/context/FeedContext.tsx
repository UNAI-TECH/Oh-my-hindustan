import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { AppApi } from '../api/services';
import { FeedItem, FeedItemType } from '../types';
import { supabase } from '../lib/supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FEED_CACHE_KEY = 'home_feed_cache';

interface FeedContextProps {
  feedItems: FeedItem[];
  selectedArticle: FeedItem | null;
  isLoading: boolean;
  isRefreshing: boolean;
  fetchArticle: (id: string) => Promise<void>;
  fetchHomeFeed: (showLoading?: boolean) => Promise<void>;
  refreshFeed: () => void;
}

const formatTimeAgo = (isoString: string): string => {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "Just now";
    
    const diff = new Date().getTime() - date.getTime();
    const minutes = Math.floor(diff / (60 * 1000));
    
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
    authorName: post.author?.username || "Creator",
    authorImage: post.author?.avatarUrl || "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&q=80&w=800",
    authorId: post.authorId || post.author?.id || null,
    thumbnail: post.thumbnail || post.mediaUrl || null,
    category: post.category || "General",
    timestamp: formatTimeAgo(post.createdAt),
    votes: post.voteCount || 0,
    upvoteCount: post.upvoteCount || 0,
    downvoteCount: post.downvoteCount || 0,
    comments: post.commentCount || 0,
    repostCount: post.repostCount || 0,
    excerpt: post.content?.substring(0, 150) || null,
    content: post.content,
    videoDuration: post.video_duration || null,
    videoUrl: post.videoUrl || post.video_url || null,
    isTrending: post.is_trending || false,
  };
};

const FeedContext = createContext<FeedContextProps | undefined>(undefined);

export const FeedProvider = ({ children }: { children: ReactNode }) => {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<FeedItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  const fetchHomeFeed = async (showLoading = true) => {
    if (showLoading && feedItems.length === 0) setIsLoading(true);
    try {
      // Load from cache first for instant UI
      if (showLoading && feedItems.length === 0) await loadFromCache();
      
      const response = await AppApi.getHomeFeed(1, 50);
      const posts = response.data || [];
      const mapped = posts.map(toFeedItem);
      // Deduplicate by id to prevent "two children with the same key" errors
      const seen = new Set<string>();
      const unique = mapped.filter(item => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      });
      setFeedItems(unique);
      await saveToCache(unique);
    } catch (e) {
      console.error('Feed fetch error:', e);
      if (feedItems.length === 0) setFeedItems([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const refreshFeed = () => {
    setIsRefreshing(true);
    fetchHomeFeed(false);
  };

  const fetchArticle = async (id: string) => {
    setIsLoading(true);
    try {
      // Check if article is already in local feed items
      const localItem = feedItems.find(it => it.id === id);
      if (localItem) {
        setSelectedArticle(localItem);
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

  // Fetch feed on mount
  useEffect(() => {
    fetchHomeFeed();
  }, []);

  // Real-time: listen for new published posts with debounce + incremental updates
  useEffect(() => {
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    
    const subscription = AppApi.subscribeToFeedUpdates((payload: any) => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        // For INSERT events, try incremental update first for speed
        if (payload.eventType === 'INSERT' && payload.new) {
          // Still do a full refetch to get proper author info joins
          fetchHomeFeed();
        } else {
          fetchHomeFeed();
        }
      }, 300);
    });

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      supabase.removeChannel(subscription);
    };
  }, []);

  return (
    <FeedContext.Provider value={{ 
      feedItems, 
      selectedArticle, 
      isLoading, 
      isRefreshing, 
      fetchArticle, 
      fetchHomeFeed,
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
