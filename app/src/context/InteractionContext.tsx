import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';
import { generateUUID } from '../utils/uuid';

const LIKES_CACHE_KEY = 'global_likes_cache';
const FOLLOWS_CACHE_KEY = 'global_follows_cache';

interface InteractionContextProps {
  likes: Record<string, boolean>;
  follows: Record<string, boolean>;
  toggleLike: (postId: string) => Promise<void>;
  toggleFollow: (creatorId: string) => Promise<void>;
  initializeInteractions: () => Promise<void>;
}

const InteractionContext = createContext<InteractionContextProps | undefined>(undefined);

export const InteractionProvider = ({ children }: { children: ReactNode }) => {
  const [likes, setLikes] = useState<Record<string, boolean>>({});
  const [follows, setFollows] = useState<Record<string, boolean>>({});
  const { userProfile } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);

  // 1. Load instantly from cache
  const loadFromCache = async () => {
    try {
      const [cachedLikes, cachedFollows] = await Promise.all([
        AsyncStorage.getItem(LIKES_CACHE_KEY),
        AsyncStorage.getItem(FOLLOWS_CACHE_KEY)
      ]);
      
      if (cachedLikes) setLikes(JSON.parse(cachedLikes));
      if (cachedFollows) setFollows(JSON.parse(cachedFollows));
    } catch (e) {
      console.error('Failed to load interaction cache', e);
    }
  };

  // 2. Background sync from server
  const syncFromServer = async () => {
    if (!userProfile?.id) return;
    try {
      const [{ data: votes }, { data: followsData }] = await Promise.all([
        supabase.from('Vote').select('postId').eq('userId', userProfile.id).eq('type', 'UP'),
        supabase.from('Follow').select('followingId').eq('followerId', userProfile.id)
      ]);

      const newLikes: Record<string, boolean> = {};
      const newFollows: Record<string, boolean> = {};

      votes?.forEach(v => { newLikes[v.postId] = true; });
      followsData?.forEach(f => { newFollows[f.followingId] = true; });

      setLikes(newLikes);
      setFollows(newFollows);

      await Promise.all([
        AsyncStorage.setItem(LIKES_CACHE_KEY, JSON.stringify(newLikes)),
        AsyncStorage.setItem(FOLLOWS_CACHE_KEY, JSON.stringify(newFollows))
      ]);
    } catch (e) {
      console.warn('Silent sync failed', e);
    }
  };

  const initializeInteractions = async () => {
    if (!userProfile?.id) {
       setLikes({});
       setFollows({});
       return;
    }
    await loadFromCache();
    setIsInitialized(true);
    syncFromServer();
  };

  useEffect(() => {
    initializeInteractions();
  }, [userProfile?.id]);

  const toggleLike = async (postId: string) => {
    if (!userProfile?.id) return;

    const isLiked = !!likes[postId];
    const newLikes = { ...likes };

    // Optimistic UI Update
    if (isLiked) {
      delete newLikes[postId];
    } else {
      newLikes[postId] = true;
    }
    setLikes(newLikes);
    AsyncStorage.setItem(LIKES_CACHE_KEY, JSON.stringify(newLikes));

    try {
      if (isLiked) {
        // Remove like
        await supabase
          .from('Vote')
          .delete()
          .match({ userId: userProfile.id, postId });
      } else {
        // Add like
        await supabase
          .from('Vote')
          .upsert({
             id: generateUUID(),
             userId: userProfile.id, 
             postId,
             type: 'UP',
             createdAt: new Date().toISOString()
          }, { onConflict: 'userId,postId' });
          
          // NOTE: We rely on database edge functions/triggers to increment post counts
      }
    } catch (e) {
      // Revert optimism on failure
      setLikes(likes);
      console.error('Like toggle failed', e);
    }
  };

  const toggleFollow = async (creatorId: string) => {
    if (!userProfile?.id || creatorId === userProfile.id) return;

    const isFollowing = !!follows[creatorId];
    const newFollows = { ...follows };

    // Optimistic Update
    if (isFollowing) {
      delete newFollows[creatorId];
    } else {
      newFollows[creatorId] = true;
    }
    setFollows(newFollows);
    AsyncStorage.setItem(FOLLOWS_CACHE_KEY, JSON.stringify(newFollows));

    try {
      if (isFollowing) {
        await supabase
          .from('Follow')
          .delete()
          .match({ followerId: userProfile.id, followingId: creatorId });
      } else {
        await supabase
          .from('Follow')
          .insert({
            id: generateUUID(),
            followerId: userProfile.id,
            followingId: creatorId,
            createdAt: new Date().toISOString()
          });
      }
    } catch (e) {
      setFollows(follows); // Revert
      console.error('Follow toggle failed', e);
    }
  };

  return (
    <InteractionContext.Provider value={{ likes, follows, toggleLike, toggleFollow, initializeInteractions }}>
      {children}
    </InteractionContext.Provider>
  );
};

export const useInteraction = () => {
  const context = useContext(InteractionContext);
  if (!context) throw new Error('useInteraction must be used within an InteractionProvider');
  return context;
};
