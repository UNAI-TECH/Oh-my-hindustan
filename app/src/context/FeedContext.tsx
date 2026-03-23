import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppApi } from '../api/services';
import { FeedItem, FeedItemType, PostResponse, SampleData } from '../types';

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

const toFeedItem = (post: PostResponse): FeedItem => {
  const calculatedVotes = post.vote_count > 1000 
    ? (post.vote_count / 1000).toFixed(1) + 'k' 
    : post.vote_count.toString();
    
  return {
    id: post.id,
    type: post.type === 'video' ? FeedItemType.VIDEO : FeedItemType.UPDATE,
    title: post.title,
    subtitle: post.community?.name || "Oh My Hindustan",
    authorName: post.author?.username || "Anonymous",
    authorImage: post.author?.avatarUrl || "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&q=80&w=800",
    thumbnail: post.media_url || "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=800",
    category: post.community?.name || "General",
    timestamp: formatTimeAgo(post.created_at),
    votes: calculatedVotes,
    comments: 0,
    excerpt: post.body?.substring(0, 150) || null,
    content: post.body
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
      const response = await AppApi.getHomeFeed(1, 20);
      const posts = response.data || [];
      setFeedItems(posts.map(toFeedItem));
    } catch (e) {
      console.error(e);
      // Fallback to sample data simulating continuous feed logic if strictly failing
      // setFeedItems([...SampleData.topNarratives, ...SampleData.baseFeedItems]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchArticle = async (id: string) => {
    setIsLoading(true);
    try {
      // Check local mock data first exactly like ViewModel
      const mockItems = [...SampleData.topNarratives, ...SampleData.baseFeedItems];
      const localItem = mockItems.find(it => it.id === id);
      
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
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHomeFeed();
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
