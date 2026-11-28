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
  toggleLike: (postId: string) => Promise<boolean>;
  toggleFollow: (creatorId: string) => Promise<boolean>;
  initializeInteractions: () => Promise<void>;
}

const InteractionContext = createContext<InteractionContextProps | undefined>(undefined);

export const InteractionProvider = ({ children }: { children: ReactNode }) => {
  const [likes, setLikes] = useState<Record<string, boolean>>({});
  const [follows, setFollows] = useState<Record<string, boolean>>({});
  const { userProfile, ensureAuthenticatedUser } = useAuth();
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
        supabase.from('Vote').select('postId').eq('userId', userProfile.id).eq('type', 1),
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

  // Keep likes and follows synced in real time across views/tabs
  useEffect(() => {
    if (!userProfile?.id) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const scheduleSync = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => { syncFromServer(); }, 250);
    };

    const channel = supabase
      .channel(`interaction-sync-${userProfile.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Vote', filter: `userId=eq.${userProfile.id}` }, scheduleSync)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Follow', filter: `followerId=eq.${userProfile.id}` }, scheduleSync)
      .subscribe();

    return () => {
      if (timer) clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [userProfile?.id]);

  const toggleLike = async (postId: string): Promise<boolean> => {
    const activeUser = userProfile?.id ? userProfile : await ensureAuthenticatedUser();
    if (!activeUser?.id) return false;

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
        const { error } = await supabase
          .from('Vote')
          .delete()
          .match({ userId: activeUser.id, postId });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('Vote')
          .upsert({
             id: generateUUID(),
             userId: activeUser.id,
             postId,
             type: 1,
             createdAt: new Date().toISOString()
          }, { onConflict: 'userId,postId' });
        if (error) throw error;
      }
      return true;
    } catch (e) {
      setLikes(likes);
      console.error('Like toggle failed', e);
      return false;
    }
  };

  const toggleFollow = async (creatorId: string): Promise<boolean> => {
    const activeUser = userProfile?.id ? userProfile : await ensureAuthenticatedUser();
    if (!activeUser?.id || creatorId === activeUser.id) return false;

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
        const { error } = await supabase
          .from('Follow')
          .delete()
          .match({ followerId: activeUser.id, followingId: creatorId });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('Follow')
          .insert({
            id: generateUUID(),
            followerId: activeUser.id,
            followingId: creatorId,
            createdAt: new Date().toISOString()
          });
        if (error) throw error;
      }
      return true;
    } catch (e) {
      setFollows(follows);
      console.error('Follow toggle failed', e);
      return false;
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
