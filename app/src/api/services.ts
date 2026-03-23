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
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) throw new Error('Not authenticated');

    const { data: profile } = await supabase
      .from('profiles')
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
      published: post.published,
      mediaUrl: post.thumbnail || post.video_url,
      thumbnail: post.thumbnail,
      authorId: post.author_id,
      voteCount: post.votes?.length || 0,
      commentCount: post.comments?.length || 0,
      hotScore: 0,
      category: post.category || 'General',
      createdAt: post.created_at,
      updatedAt: post.updated_at,
      content: post.content,
      subtitle: post.subtitle,
      video_duration: post.video_duration,
      is_trending: post.is_trending,
      author: post.profiles ? {
        id: post.profiles.id,
        username: post.profiles.username || post.profiles.full_name || 'Creator',
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
      content: post.content,
      type: post.type,
      mediaUrl: post.thumbnail || post.video_url,
      thumbnail: post.thumbnail,
      authorId: post.author_id,
      voteCount: post.votes?.length || 0,
      commentCount: post.comments?.length || 0,
      hotScore: 0,
      category: post.category || 'General',
      subtitle: post.subtitle,
      video_duration: post.video_duration,
      createdAt: post.created_at,
      updatedAt: post.updated_at,
      author: post.profiles ? {
        id: post.profiles.id,
        username: post.profiles.username || post.profiles.full_name || 'Creator',
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
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
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
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('votes')
      .upsert({ 
        post_id: postId, 
        user_id: user.id, 
        vote_type: voteType 
      }, { onConflict: 'user_id,post_id' });
    
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
      .from('comments')
      .insert({ 
        post_id: postId, 
        user_id: user.id, 
        content,
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
      .from('follows')
      .insert({ 
        follower_id: user.id, 
        following_id: creatorId 
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
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('saves')
      .insert({ 
        user_id: user.id, 
        post_id: postId 
      });
    
    if (error && !error.message.includes('duplicate')) throw error;
  },

  unsavePost: async (postId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
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

/**
 * Creator Studio API — Supabase direct queries for creator dashboard
 */
export const CreatorApi = {
  /**
   * Create a new post (Blog, News, or Video)
   */
  createPost: async (postData: {
    title: string;
    content: string;
    type: string;
    category: string;
    thumbnail?: string;
    subtitle?: string;
    video_duration?: string;
  }) => {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('posts')
      .insert({
        title: postData.title,
        content: postData.content,
        type: postData.type,
        category: postData.category,
        thumbnail: postData.thumbnail || null,
        subtitle: postData.subtitle || null,
        video_duration: postData.video_duration || null,
        author_id: user.id,
        published: true,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get all posts by the current creator
   */
  getMyPosts: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('posts')
      .select('*, votes(vote_type), comments(id)')
      .eq('author_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((post: any) => ({
      id: post.id,
      title: post.title,
      content: post.content,
      type: post.type,
      category: post.category,
      thumbnail: post.thumbnail,
      subtitle: post.subtitle,
      video_duration: post.video_duration,
      voteCount: post.votes?.length || 0,
      commentCount: post.comments?.length || 0,
      createdAt: post.created_at,
      updatedAt: post.updated_at,
    }));
  },

  /**
   * Get real-time stats for the creator dashboard
   */
  getMyStats: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) throw new Error('Not authenticated');

    // Get posts with their votes and comments in one query
    const { data: posts, error } = await supabase
      .from('posts')
      .select('id, type, votes(id), comments(id)')
      .eq('author_id', user.id);

    if (error) throw error;

    const allPosts = posts || [];
    let totalVotes = 0;
    let totalComments = 0;
    allPosts.forEach((p: any) => {
      totalVotes += p.votes?.length || 0;
      totalComments += p.comments?.length || 0;
    });

    // Get follower count
    const { count: followerCount } = await supabase
      .from('follows')
      .select('id', { count: 'exact', head: true })
      .eq('following_id', user.id);

    return {
      totalPosts: allPosts.length,
      totalComments,
      totalVotes,
      totalFollowers: followerCount || 0,
    };
  },

  /**
   * Delete a post
   */
  deletePost: async (postId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) throw new Error('Not authenticated');

    // Delete related records first
    await supabase.from('comments').delete().eq('post_id', postId);
    await supabase.from('votes').delete().eq('post_id', postId);
    await supabase.from('saves').delete().eq('post_id', postId);

    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId)
      .eq('author_id', user.id);

    if (error) throw error;
  },

  /**
   * Get all comments on the creator's posts
   */
  getMyComments: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) throw new Error('Not authenticated');

    // First get all of the creator's post IDs
    const { data: posts } = await supabase
      .from('posts')
      .select('id, title')
      .eq('author_id', user.id);

    if (!posts || posts.length === 0) return [];

    const postIds = posts.map((p: any) => p.id);
    const postMap = Object.fromEntries(posts.map((p: any) => [p.id, p.title]));

    const { data: comments, error } = await supabase
      .from('comments')
      .select('*, profiles!user_id(id, username, avatar_url, full_name)')
      .in('post_id', postIds)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (comments || []).map((c: any) => ({
      id: c.id,
      content: c.content,
      postId: c.post_id,
      postTitle: postMap[c.post_id] || 'Unknown Post',
      username: c.profiles?.username || c.profiles?.full_name || 'Anonymous',
      avatarUrl: c.profiles?.avatar_url,
      createdAt: c.created_at,
    }));
  },

  /**
   * Subscribe to real-time updates on creator's posts
   */
  subscribeToMyPosts: (userId: string, callback: (payload: any) => void) => {
    return supabase
      .channel(`creator-${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'posts',
        filter: `author_id=eq.${userId}`,
      }, callback)
      .subscribe();
  },
};
