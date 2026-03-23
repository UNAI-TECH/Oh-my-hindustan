import { supabase } from '../lib/supabaseClient';

/**
 * Authentication API - Supabase direct
 */
export const AuthApi = {
  login: async (credentials: Record<string, string>) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.username || credentials.email,
      password: credentials.password,
    });
    if (error) throw error;
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    return {
      access_token: data.session?.access_token || '',
      user: {
        id: data.user.id,
        email: data.user.email,
        username: profile?.username,
        role: profile?.role,
        bio: profile?.bio,
        avatarUrl: profile?.avatar_url,
      },
    };
  },

  register: async (details: Record<string, string>) => {
    const { data, error } = await supabase.auth.signUp({
      email: details.email,
      password: details.password,
      options: {
        data: {
          username: details.username,
          full_name: details.username,
          role: 'viewer',
        },
      },
    });
    if (error) throw error;

    return {
      access_token: data.session?.access_token || '',
      user: {
        id: data.user?.id || '',
        email: data.user?.email,
        username: details.username,
        role: 'viewer',
      },
    };
  },

  getProfile: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    return profile;
  },

  updateProfile: async (details: Record<string, string>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('profiles')
      .update(details)
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

/**
 * Application API - Supabase direct queries with real-time support
 */
export const AppApi = {
  getHomeFeed: async (page = 1, limit = 20) => {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from('posts')
      .select('*, profiles!author_id(id, username, avatar_url, full_name), votes(vote_type), comments(id)', { count: 'exact' })
      .eq('published', true)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const posts = (data || []).map((post: any) => ({
      id: post.id,
      title: post.title,
      body: post.content,
      type: post.type,
      media_url: post.thumbnail || post.video_url,
      author_id: post.author_id,
      vote_count: post.votes?.reduce((sum: number, v: any) => sum + (v.vote_type || 0), 0) || 0,
      hot_score: 0,
      created_at: post.created_at,
      updated_at: post.updated_at,
      author: post.profiles ? {
        id: post.profiles.id,
        username: post.profiles.username || post.profiles.full_name,
        avatarUrl: post.profiles.avatar_url,
      } : null,
      community: {
        id: post.category || 'general',
        name: post.category || 'Oh My Hindustan',
        slug: (post.category || 'general').toLowerCase().replace(/\s+/g, '-'),
      },
    }));

    return {
      data: posts,
      total: count || 0,
      page,
      limit,
    };
  },

  getPost: async (id: string) => {
    const { data: post, error } = await supabase
      .from('posts')
      .select('*, profiles!author_id(id, username, avatar_url, full_name), votes(vote_type), comments(id, content, user_id, created_at)')
      .eq('id', id)
      .single();

    if (error) throw error;

    return {
      id: post.id,
      title: post.title,
      body: post.content,
      type: post.type,
      media_url: post.thumbnail || post.video_url,
      author_id: post.author_id,
      vote_count: post.votes?.reduce((sum: number, v: any) => sum + (v.vote_type || 0), 0) || 0,
      hot_score: 0,
      created_at: post.created_at,
      updated_at: post.updated_at,
      author: post.profiles ? {
        id: post.profiles.id,
        username: post.profiles.username || post.profiles.full_name,
        avatarUrl: post.profiles.avatar_url,
      } : null,
      community: {
        id: post.category || 'general',
        name: post.category || 'Oh My Hindustan',
        slug: (post.category || 'general').toLowerCase().replace(/\s+/g, '-'),
      },
    };
  },

  getNotifications: async (page = 1, limit = 20) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    return {
      data: (data || []).map((n: any) => ({
        id: n.id,
        type: n.type,
        isRead: n.is_read,
        createdAt: n.created_at,
        payload: { title: n.title, message: n.message },
      })),
      total: count || 0,
      page,
      limit,
    };
  },

  /**
   * Vote on a post (upvote = 1, downvote = -1)
   */
  vote: async (postId: string, voteType: 1 | -1) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Upsert: if the user already voted, update; otherwise insert
    const { error } = await supabase
      .from('votes')
      .upsert({
        user_id: user.id,
        post_id: postId,
        vote_type: voteType,
      }, { onConflict: 'user_id,post_id' });

    if (error) throw error;
  },

  /**
   * Add a comment
   */
  addComment: async (postId: string, content: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('comments')
      .insert({
        user_id: user.id,
        post_id: postId,
        content,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Follow a creator
   */
  follow: async (creatorId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('follows')
      .insert({
        follower_id: user.id,
        following_id: creatorId,
      });

    if (error && !error.message.includes('duplicate')) throw error;
  },

  /**
   * Unfollow a creator
   */
  unfollow: async (creatorId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', user.id)
      .eq('following_id', creatorId);

    if (error) throw error;
  },

  /**
   * Save/unsave a post
   */
  savePost: async (postId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('saves')
      .insert({ user_id: user.id, post_id: postId });

    if (error && !error.message.includes('duplicate')) throw error;
  },

  unsavePost: async (postId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('saves')
      .delete()
      .eq('user_id', user.id)
      .eq('post_id', postId);

    if (error) throw error;
  },

  /**
   * Subscribe to real-time feed updates
   */
  subscribeToFeedUpdates: (callback: (payload: any) => void) => {
    return supabase
      .channel('viewer-feed')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'posts',
        filter: 'published=eq.true',
      }, callback)
      .subscribe();
  },

  /**
   * Subscribe to real-time updates for a specific post (comments, votes)
   */
  subscribeToPostUpdates: (postId: string, callback: (payload: any) => void) => {
    return supabase
      .channel(`post-${postId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'comments',
        filter: `post_id=eq.${postId}`,
      }, callback)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'votes',
        filter: `post_id=eq.${postId}`,
      }, callback)
      .subscribe();
  },
};
