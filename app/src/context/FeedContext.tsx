import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { AppApi } from '../api/services';
import { FeedItem, FeedItemType } from '../types';
import { supabase } from '../lib/supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { useSiteLanguage } from './SiteLanguageContext';
import { withRetry } from '../utils/networkUtils';
import { formatCardExcerpt, cacheArticleSlug, titleToSlug } from '../components/web/webPortalHelpers';

const FEED_CACHE_KEY = 'home_feed_cache';

interface FeedContextProps {
  feedItems: FeedItem[];
  selectedArticle: FeedItem | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  hasMore: boolean;
  sortBy: 'latest' | 'trending' | 'popular';
  setSortBy: (sort: 'latest' | 'trending' | 'popular') => void;
  fetchArticle: (id: string, preferredLang?: 'en' | 'ta') => Promise<void>;
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

export const mapPostToFeedItem = (post: any): FeedItem => {
  const effectiveSlug = post?.slug || (post?.title ? titleToSlug(post.title) : null);
  if (post?.id && (effectiveSlug || post?.title)) {
    cacheArticleSlug(post.id, effectiveSlug || post.title);
  }
  return {
    id: post.id,
    type: mapPostType(post.type),
    title: post.title,
    subtitle: post.subtitle || "PostsApp",
    short_description: post.short_description || null,
    language: (post.language === 'ta' ? 'ta' : 'en'),
    slug: effectiveSlug,
    authorName: post.author?.channel_name || post.author?.username || "Creator",
    authorUsername: post.author?.username || null,
    authorImage: post.author?.avatarUrl || "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&q=80&w=800",
    authorId: post.authorId || post.author?.id || null,
    author: post.author || null,
    thumbnail: post.thumbnail || post.mediaUrl || null,
    featured_image_alt: post.featured_image_alt || null,
    featured_image_caption: post.featured_image_caption || null,
    featured_image_credit: post.featured_image_credit || null,
    category: post.category || "General",
    timestamp: formatTimeAgo(post.published_at || post.createdAt),
    published_at: post.published_at || post.createdAt,
    updatedAt: post.updatedAt || null,
    createdAt: post.createdAt || null,
    votes: post.voteCount || 0,
    upvoteCount: post.upvoteCount || 0,
    downvoteCount: post.downvoteCount || 0,
    comments: post.commentCount || 0,
    viewCount: post.viewCount || 0,
    excerpt: post.short_description || formatCardExcerpt(post.content, 160) || null,
    content: post.content,
    content_json: post.content_json || null,
    videoDuration: post.video_duration || post.videoDuration || null,
    videoUrl: post.videoUrl || post.video_url || null,
    isTrending: post.isTrending || post.is_trending || false,
    is_breaking: post.is_breaking || false,
    is_featured: post.is_featured || false,
    is_editors_pick: post.is_editors_pick || false,
    reading_time_minutes: post.reading_time_minutes || 1,
    translation_group_id: post.translation_group_id || null,
    translations: post.translations || [],
    seo_title: post.seo_title || null,
    seo_description: post.seo_description || null,
    canonical_url: post.canonical_url || null,
    og_title: post.og_title || null,
    og_description: post.og_description || null,
    og_image: post.og_image || null,
    robots_index: post.robots_index !== false,
    ads_enabled: post.ads_enabled || false,
    ad_breaks: Array.isArray(post.ad_breaks) ? post.ad_breaks : null,
    authorNameCustom: post.author_name || null,
    authorPosition: post.author_position || null,
    hashtags: Array.isArray(post.hashtags) ? post.hashtags : (post.hashtags ? [post.hashtags] : null),
  };
};

const toFeedItem = mapPostToFeedItem;

const FeedContext = createContext<FeedContextProps | undefined>(undefined);

export const FeedProvider = ({ children }: { children: ReactNode }) => {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<FeedItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [sortBy, setSortByState] = useState<'latest' | 'trending' | 'popular'>('latest');
  const [error, setError] = useState<string | null>(null);
  const { userProfile } = useAuth();
  const { lang } = useSiteLanguage();
  const isFetchingRef = useRef(false);
  const fetchRequestIdRef = useRef(0);

  const saveToCache = async (data: FeedItem[]) => {
    try {
      if (data.length > 0) {
        await AsyncStorage.setItem(`${FEED_CACHE_KEY}_${lang}`, JSON.stringify(data));
      }
    } catch (e) {
      console.error('Failed to save feed cache', e);
    }
  };

  const loadFromCache = async (targetLang = lang): Promise<boolean> => {
    try {
      const cached = await AsyncStorage.getItem(`${FEED_CACHE_KEY}_${targetLang}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setFeedItems(parsed);
          setIsLoading(false);
          return true;
        }
      }
    } catch (e) {
      console.error('Failed to load feed cache', e);
    }
    return false;
  };

  const setSortBy = (sort: 'latest' | 'trending' | 'popular') => {
    if (sort === sortBy) return;
    setSortByState(sort);
    setPage(1);
  };

  const fetchHomeFeed = async (showLoading = true, reset = false) => {
    if (!reset && isFetchingRef.current) return;
    const reqId = reset ? ++fetchRequestIdRef.current : fetchRequestIdRef.current;
    isFetchingRef.current = true;
    const targetPage = reset ? 1 : page;
    let hasCached = false;
    if (reset && showLoading) {
      hasCached = await loadFromCache(lang);
    }
    if (showLoading && !hasCached) setIsLoading(true);

    try {
      const response = await withRetry(
        () => AppApi.getHomeFeed(targetPage, 25, sortBy, lang),
        2,
        400,
      );
      if (reqId !== fetchRequestIdRef.current) return;

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

      const noMore = posts.length < 15;
      setHasMore(!noMore);
      setError(null);
      if (reset) {
        setPage(1);
        await saveToCache(mapped.slice(0, 50));
      }
    } catch (e: any) {
      if (reqId !== fetchRequestIdRef.current) return;
      if (e?.code === 'PGRST103') {
        setHasMore(false);
      } else {
        console.error('Feed fetch error:', e);
        setError(e.message || 'Failed to load feed. Please check your connection.');
      }
    } finally {
      if (reqId === fetchRequestIdRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
        isFetchingRef.current = false;
      }
    }
  };

  const loadMoreFeed = async () => {
    if (isLoading || !hasMore || isFetchingRef.current) return;
    setPage(prev => prev + 1);
  };

  useEffect(() => {
    setPage(1);
    fetchHomeFeed(true, true);
  }, [lang, sortBy]);

  useEffect(() => {
    if (page > 1) {
      fetchHomeFeed(false, false);
    }
  }, [page]);

  const refreshFeed = () => {
    if (page === 1) {
      if (feedItems.length > 0) setIsRefreshing(true);
      fetchHomeFeed(feedItems.length === 0, true);
    } else {
      setPage(1);
      fetchHomeFeed(true, true);
    }
  };

  const fetchArticle = async (idOrSlug: string, preferredLang?: 'en' | 'ta') => {
    setIsLoading(true);
    try {
      let decodedSlug = idOrSlug;
      try {
        decodedSlug = decodeURIComponent(idOrSlug);
      } catch (_) {}
      const normalizedSlug = decodedSlug.trim().toLowerCase();

      const localItem = feedItems.find(
        it => it.id === idOrSlug || it.slug === normalizedSlug || titleToSlug(it.title) === normalizedSlug
      );
      if (localItem) {
        cacheArticleSlug(localItem.id, localItem.slug || localItem.title);
        setSelectedArticle(localItem);
        AppApi.getPost(localItem.id).then(freshResponse => {
           if (freshResponse) setSelectedArticle(toFeedItem(freshResponse));
        }).catch(() => {});
      } else {
        setSelectedArticle(null);
        const response = await AppApi.getPostByIdOrSlug(idOrSlug, preferredLang || lang);
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
        if (payload?.table === 'Post' && payload?.new?.id && selectedArticle?.id === payload.new.id) {
          AppApi.getPost(payload.new.id)
            .then((fresh) => { if (fresh) setSelectedArticle(toFeedItem(fresh)); })
            .catch(() => {});
        }
      }, 300);

      // Note: Follow notifications are dispatched server-side via DB trigger + notify-followers Edge Function
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
