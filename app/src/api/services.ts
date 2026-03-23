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
      .from('User')
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
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) throw new Error('Not authenticated');

    const { data: profile } = await supabase
      .from('User')
      .select('*')
      .eq('id', user.id)
      .single();

    return profile;
  },

  updateProfile: async (details: Record<string, string>) => {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('User')
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
      .from('Post')
      .select('*, User!authorId(id, username, avatarUrl), Vote!postId(type), Comment!postId(id)', { count: 'exact' })
      .order('createdAt', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const posts = (data || []).map((post: any) => ({
      id: post.id,
      title: post.title,
      body: post.content,
      type: post.type,
      published: true,
      mediaUrl: post.thumbnail || post.videoUrl,
      authorId: post.authorId,
      voteCount: post.Vote?.length || 0,
      commentCount: post.Comment?.length || 0,
      hotScore: 0,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      author: post.User ? {
        id: post.User.id,
        username: post.User.username,
        avatarUrl: post.User.avatarUrl,
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
      .from('Post')
      .select('*, User!authorId(id, username, avatarUrl), Vote!postId(type), Comment!postId(id, content, userId, createdAt)')
      .eq('id', id)
      .single();

    if (error) throw error;

    return {
      id: post.id,
      title: post.title,
      body: post.content,
      type: post.type,
      mediaUrl: post.thumbnail || post.videoUrl,
      authorId: post.authorId,
      voteCount: post.Vote?.length || 0,
      commentCount: post.Comment?.length || 0,
      hotScore: 0,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      author: post.User ? {
        id: post.User.id,
        username: post.User.username,
        avatarUrl: post.User.avatarUrl,
      } : null,
      community: {
        id: post.category || 'general',
        name: post.category || 'Oh My Hindustan',
        slug: (post.category || 'general').toLowerCase().replace(/\s+/g, '-'),
      },
    };
  },

  getNotifications: async (page = 1, limit = 20) => {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) throw new Error('Not authenticated');

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from('Notification')
      .select('*', { count: 'exact' })
      .eq('userId', user.id)
      .order('createdAt', { ascending: false })
      .range(from, to);

    if (error) throw error;

    return {
      data: (data || []).map((n: any) => ({
        id: n.id,
        type: n.type,
        isRead: n.isRead,
        createdAt: n.createdAt,
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
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) throw new Error('Not authenticated');

    // Upsert: if the user already voted, update; otherwise insert
    const { error } = await supabase
      .from('Vote')
      .upsert({ 
        postId, 
        userId: user.id, 
        type: voteType 
      }, { onConflict: 'userId,postId' });
    
    if (error) throw error;
  },

  /**
   * Add a comment
   */
  addComment: async (postId: string, content: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('Comment')
      .insert({ 
        postId, 
        userId: user.id, 
        content,
        updatedAt: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
  },

  /**
   * Follow a creator
   */
  follow: async (creatorId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('Follow')
      .insert({ 
        followerId: user.id, 
        followingId: creatorId 
      });
    
    if (error && !error.message.includes('duplicate')) throw error;
  },

  /**
   * Unfollow a creator
   */
  unfollow: async (creatorId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('Follow')
      .delete()
      .eq('followerId', user.id)
      .eq('followingId', creatorId);
    
    if (error) throw error;
  },

  /**
   * Save/unsave a post
   */
  savePost: async (postId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('Save')
      .insert({ 
        userId: user.id, 
        postId 
      });
    
    if (error && !error.message.includes('duplicate')) throw error;
  },

  unsavePost: async (postId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('Save')
      .delete()
      .eq('userId', user.id)
      .eq('postId', postId);

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
        table: 'Post',
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
        table: 'Comment',
        filter: `postId=eq.${postId}`,
      }, callback)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'Vote',
        filter: `postId=eq.${postId}`,
      }, callback)
      .subscribe();
  },
};
