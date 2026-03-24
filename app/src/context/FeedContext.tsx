import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppApi } from '../api/services';
import { FeedItem, FeedItemType } from '../types';
import { supabase } from '../lib/supabaseClient';

interface FeedContextProps {
  feedItems: FeedItem[];
  selectedArticle: FeedItem | null;
  isLoading: boolean;
  fetchArticle: (id: string) => Promise<void>;
  fetchHomeFeed: () => Promise<void>;
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
  const voteCount = post.voteCount || 0;
  const calculatedVotes = voteCount > 1000 
    ? (voteCount / 1000).toFixed(1) + 'k' 
    : voteCount.toString();
    
  return {
    id: post.id,
    type: mapPostType(post.type),
    title: post.title,
    subtitle: post.subtitle || "Oh My Hindustan",
    authorName: post.author?.username || "Creator",
    authorImage: post.author?.avatarUrl || "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&q=80&w=800",
    thumbnail: post.thumbnail || post.mediaUrl || null,
    category: post.category || "General",
    timestamp: formatTimeAgo(post.createdAt),
    votes: calculatedVotes,
    comments: post.commentCount || 0,
    excerpt: post.content?.substring(0, 150) || null,
    content: post.content,
    videoDuration: post.video_duration || null,
    isTrending: post.is_trending || false,
  };
};

const FeedContext = createContext<FeedContextProps | undefined>(undefined);

export const FeedProvider = ({ children }: { children: ReactNode }) => {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<FeedItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchHomeFeed = async () => {
    setIsLoading(true);
    try {
      const response = await AppApi.getHomeFeed(1, 50);
      const posts = response.data || [];
      setFeedItems(posts.map(toFeedItem));
    } catch (e) {
      console.error('Feed fetch error:', e);
      setFeedItems([]);
    } finally {
      setIsLoading(false);
    }
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

  // Real-time: listen for new published posts
  useEffect(() => {
    const subscription = AppApi.subscribeToFeedUpdates((payload: any) => {
      // Refetch the entire feed to get proper joins (author info, etc.)
      fetchHomeFeed();
    });

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  return (
    <FeedContext.Provider value={{ feedItems, selectedArticle, isLoading, fetchArticle, fetchHomeFeed }}>
      {children}
    </FeedContext.Provider>
  );
};

export const useFeed = () => {
  const context = useContext(FeedContext);
  if (!context) throw new Error('useFeed must be used within a FeedProvider');
  return context;
};
