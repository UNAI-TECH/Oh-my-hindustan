import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [sortBy, setSortByState] = useState<'latest' | 'trending'>('trending');

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
    if (showLoading && feedItems.length === 0) setIsLoading(true);
    const targetPage = reset ? 1 : page;
    
    try {
      if (reset && showLoading && feedItems.length === 0) await loadFromCache();
      
      const response = await AppApi.getHomeFeed(targetPage, 15, sortBy);
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
      
      setHasMore(posts.length === 15);
      if (reset) await saveToCache(mapped.slice(0, 50));
    } catch (e) {
      console.error('Feed fetch error:', e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const loadMoreFeed = async () => {
    if (isLoading || !hasMore) return;
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

  // Real-time: listen for new published posts
  useEffect(() => {
    let debounceTimer: any = null;
    const subscription = AppApi.subscribeToFeedUpdates((payload: any) => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (page === 1) {
          fetchHomeFeed(false, true);
        }
      }, 300);
    });

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      supabase.removeChannel(subscription);
    };
  }, [page]);

  return (
    <FeedContext.Provider value={{ 
      feedItems, 
      selectedArticle, 
      isLoading, 
      isRefreshing, 
      hasMore,
      sortBy,
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
