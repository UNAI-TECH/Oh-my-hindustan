import { supabase } from '../lib/supabaseClient';
import { generateUUID } from '../utils/uuid';
import {
  cacheArticleSlug,
  getCachedArticleIdBySlug,
  isUuid,
  titleToSlug,
} from '../components/web/webPortalHelpers';

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
        avatarUrl: profile?.avatarUrl,
        phone: profile?.phone,
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
const POST_SELECT_FIELDS = 'id, title, subtitle, short_description, content, content_json, type, language, slug, category, custom_category, thumbnail, featured_image_alt, featured_image_caption, featured_image_credit, authorId, createdAt, updatedAt, published_at, videoDuration, videoUrl, isTrending, trending_score, is_breaking, is_featured, is_editors_pick, views_count, likes_count, comments_count, reading_time_minutes, author_name, author_position, hashtags, translation_group_id, seo_title, seo_description, canonical_url, og_title, og_description, og_image, robots_index, ads_enabled, ad_breaks, author:User!authorId(id, username, avatarUrl, channel_name), Vote:Vote(type), Comment:Comment(id, content), PostView:PostView(id)';

export const AppApi = {
  getHomeFeed: async (
    page = 1,
    limit = 20,
    sortBy: 'latest' | 'trending' | 'popular' = 'latest',
    language?: 'en' | 'ta' | 'all'
  ) => {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('Post')
      .select(POST_SELECT_FIELDS, { count: 'exact' })
      .eq('status', 'PUBLISHED')
      .or('is_active.eq.true,is_active.is.null');

    if (language && language !== 'all') {
      query = query.eq('language', language);
    }

    if (sortBy === 'trending') {
      query = query.order('trending_score', { ascending: false }).order('published_at', { ascending: false });
    } else if (sortBy === 'popular') {
      query = query.order('views_count', { ascending: false }).order('likes_count', { ascending: false });
    } else {
      query = query.order('published_at', { ascending: false, nullsFirst: false }).order('createdAt', { ascending: false });
    }

    const { data, error, count } = await query.range(from, to);

    if (error) throw error;

    const posts = (data || []).map((post: any) => {
      const votes = post.Vote || [];
      const allComments = post.Comment || [];
      const upvotes = votes.filter((v: any) => v.type === 1).length;
      const downvotes = votes.filter((v: any) => v.type === -1).length;
      const realComments = Math.max(post.comments_count || 0, allComments.filter((c: any) => c.content !== '[SYSTEM_REPOST]').length);
      const reposts = allComments.filter((c: any) => c.content === '[SYSTEM_REPOST]').length;
      const viewCount = Math.max(post.views_count || 0, post.PostView ? post.PostView.length : 0);

      const displayCategory = post.category === 'custom' && post.custom_category
        ? post.custom_category
        : (post.category || 'General');

      return {
        id: post.id,
        title: post.title,
        subtitle: post.subtitle,
        short_description: post.short_description || null,
        body: post.content,
        content: post.content,
        content_json: post.content_json || null,
        type: post.type,
        language: (post.language === 'ta' ? 'ta' : 'en') as 'en' | 'ta',
        slug: post.slug || null,
        mediaUrl: post.thumbnail,
        thumbnail: post.thumbnail,
        featured_image_alt: post.featured_image_alt || null,
        featured_image_caption: post.featured_image_caption || null,
        featured_image_credit: post.featured_image_credit || null,
        authorId: post.authorId,
        voteCount: upvotes - downvotes,
        upvoteCount: upvotes,
        downvoteCount: downvotes,
        commentCount: realComments,
        repostCount: reposts,
        viewCount,
        hotScore: 0,
        category: displayCategory,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        published_at: post.published_at || post.createdAt,
        videoDuration: post.videoDuration,
        videoUrl: post.videoUrl || null,
        isTrending: post.isTrending,
        is_breaking: post.is_breaking || false,
        is_featured: post.is_featured || false,
        is_editors_pick: post.is_editors_pick || false,
        reading_time_minutes: post.reading_time_minutes || 1,
        translation_group_id: post.translation_group_id || null,
        seo_title: post.seo_title || null,
        seo_description: post.seo_description || null,
        canonical_url: post.canonical_url || null,
        og_title: post.og_title || null,
        og_description: post.og_description || null,
        og_image: post.og_image || null,
        robots_index: post.robots_index !== false,
        ads_enabled: post.ads_enabled || false,
        ad_breaks: post.ad_breaks || null,
        author_name: post.author_name || null,
        author_position: post.author_position || null,
        hashtags: post.hashtags || null,
        author: post.author ? {
          id: (Array.isArray(post.author) ? post.author[0]?.id : (post.author as any).id),
          username: (Array.isArray(post.author) ? post.author[0]?.username : (post.author as any).username) || 'Creator',
          avatarUrl: (Array.isArray(post.author) ? post.author[0]?.avatarUrl : (post.author as any).avatarUrl),
          channel_name: (Array.isArray(post.author) ? post.author[0]?.channel_name : (post.author as any).channel_name),
        } : null,
        community: {
          id: post.category || 'general',
          name: displayCategory,
          slug: displayCategory.toLowerCase().replace(/\s+/g, '-'),
        },
      };
    });

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
      .select(POST_SELECT_FIELDS)
      .eq('id', id)
      .eq('status', 'PUBLISHED')
      .or('is_active.eq.true,is_active.is.null')
      .single();

    if (error) throw error;

    const votes = post.Vote || [];
    const allComments = post.Comment || [];
    const upvotes = votes.filter((v: any) => v.type === 1).length;
    const downvotes = votes.filter((v: any) => v.type === -1).length;
    const realComments = Math.max(post.comments_count || 0, allComments.filter((c: any) => c.content !== '[SYSTEM_REPOST]').length);
    const reposts = allComments.filter((c: any) => c.content === '[SYSTEM_REPOST]').length;
    const viewCount = Math.max(post.views_count || 0, post.PostView ? post.PostView.length : 0);

    let translations: Array<{ id: string; title: string; language: 'en' | 'ta'; slug: string }> = [];
    if (post.translation_group_id) {
      const { data: siblings } = await supabase
        .from('Post')
        .select('id, title, language, slug')
        .eq('translation_group_id', post.translation_group_id)
        .eq('status', 'PUBLISHED')
        .or('is_active.eq.true,is_active.is.null')
        .neq('id', post.id);
      translations = (siblings || []).map((s: any) => ({
        id: s.id,
        title: s.title,
        language: s.language === 'ta' ? 'ta' : 'en',
        slug: s.slug || s.id,
      }));
    }

    const displayCategory = post.category === 'custom' && post.custom_category
      ? post.custom_category
      : (post.category || 'General');

    return {
      id: post.id,
      title: post.title,
      body: post.content,
      content: post.content,
      content_json: post.content_json || null,
      type: post.type,
      language: (post.language === 'ta' ? 'ta' : 'en') as 'en' | 'ta',
      slug: post.slug || null,
      short_description: post.short_description || null,
      featured_image_alt: post.featured_image_alt || null,
      featured_image_caption: post.featured_image_caption || null,
      featured_image_credit: post.featured_image_credit || null,
      mediaUrl: post.thumbnail,
      thumbnail: post.thumbnail,
      authorId: post.authorId,
      voteCount: upvotes - downvotes,
      upvoteCount: upvotes,
      downvoteCount: downvotes,
      commentCount: realComments,
      repostCount: reposts,
      viewCount,
      hotScore: 0,
      category: displayCategory,
      subtitle: post.subtitle,
      videoDuration: post.videoDuration,
      videoUrl: post.videoUrl || null,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      published_at: post.published_at || post.createdAt,
      translation_group_id: post.translation_group_id || null,
      seo_title: post.seo_title || null,
      seo_description: post.seo_description || null,
      canonical_url: post.canonical_url || null,
      og_title: post.og_title || null,
      og_description: post.og_description || null,
      og_image: post.og_image || null,
      robots_index: post.robots_index !== false,
      reading_time_minutes: post.reading_time_minutes || 1,
      ads_enabled: post.ads_enabled || false,
      ad_breaks: post.ad_breaks || null,
      author_name: post.author_name || null,
      author_position: post.author_position || null,
      hashtags: post.hashtags || null,
      translations,
      author: post.author ? {
        id: (Array.isArray(post.author) ? post.author[0]?.id : (post.author as any).id),
        username: (Array.isArray(post.author) ? post.author[0]?.username : (post.author as any).username) || 'Creator',
        avatarUrl: (Array.isArray(post.author) ? post.author[0]?.avatarUrl : (post.author as any).avatarUrl),
        channel_name: (Array.isArray(post.author) ? post.author[0]?.channel_name : (post.author as any).channel_name),
      } : null,
      community: {
        id: post.category || 'general',
        name: displayCategory,
        slug: displayCategory.toLowerCase().replace(/\s+/g, '-'),
      },
    };
  },

  resolvePostIdBySlug: async (slug: string, preferredLang?: 'en' | 'ta'): Promise<string | null> => {
    if (!slug) return null;
    if (isUuid(slug)) return slug;

    let cleanSlug = slug.trim().toLowerCase();
    try {
      cleanSlug = decodeURIComponent(slug).trim().toLowerCase();
    } catch (_) {}

    const cachedId = getCachedArticleIdBySlug(cleanSlug);
    if (cachedId) return cachedId;

    // 1. Direct database-indexed slug resolution (prefers matching language if provided)
    if (preferredLang) {
      const { data: exactLang } = await supabase
        .from('Post')
        .select('id, slug, title')
        .eq('language', preferredLang)
        .eq('slug', cleanSlug)
        .eq('status', 'PUBLISHED')
        .or('is_active.eq.true,is_active.is.null')
        .maybeSingle();
      if (exactLang?.id) {
        cacheArticleSlug(exactLang.id, exactLang.slug || exactLang.title);
        return exactLang.id;
      }
    }

    const { data: anyLangSlug } = await supabase
      .from('Post')
      .select('id, slug, title')
      .eq('slug', cleanSlug)
      .eq('status', 'PUBLISHED')
      .or('is_active.eq.true,is_active.is.null')
      .limit(1)
      .maybeSingle();

    if (anyLangSlug?.id) {
      cacheArticleSlug(anyLangSlug.id, anyLangSlug.slug || anyLangSlug.title);
      return anyLangSlug.id;
    }

    // 2. Fallback match for legacy title-derived slugs without persisted DB slug
    const { data } = await supabase
      .from('Post')
      .select('id, title, slug')
      .eq('status', 'PUBLISHED')
      .or('is_active.eq.true,is_active.is.null')
      .order('createdAt', { ascending: false })
      .limit(200);

    if (!data) return null;

    const exactMatch = data.find((p: any) => titleToSlug(p.title) === cleanSlug);
    if (exactMatch) {
      cacheArticleSlug(exactMatch.id, exactMatch.slug || exactMatch.title);
      return exactMatch.id;
    }

    return null;
  },

  getPostByIdOrSlug: async (idOrSlug: string, preferredLang?: 'en' | 'ta') => {
    if (!idOrSlug) throw new Error('Missing article identifier');
    if (isUuid(idOrSlug)) {
      return AppApi.getPost(idOrSlug);
    }
    const resolvedId = await AppApi.resolvePostIdBySlug(idOrSlug, preferredLang);
    if (resolvedId) {
      return AppApi.getPost(resolvedId);
    }
    throw new Error('Article unavailable');
  },

  searchArticlesRpc: async (params: {
    query?: string;
    language?: 'en' | 'ta' | null;
    categorySlug?: string | null;
    type?: string | null;
    authorId?: string | null;
    sort?: 'relevance' | 'latest' | 'popular' | 'trending';
    limit?: number;
    offset?: number;
  }) => {
    const { data, error } = await supabase.rpc('search_articles', {
      p_query: params.query || null,
      p_language: params.language ?? null,
      p_category_slug: params.categorySlug || null,
      p_type: params.type || null,
      p_author_id: params.authorId || null,
      p_date_from: null,
      p_date_to: null,
      p_sort: params.sort || (params.query ? 'relevance' : 'latest'),
      p_limit: params.limit || 20,
      p_offset: params.offset || 0,
    });
    if (error) throw error;
    const rows = (data || []) as any[];
    return {
      items: rows,
      total: rows[0]?.total_count ? Number(rows[0].total_count) : 0,
    };
  },

  getBilingualCategories: async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name_en, name_ta, slug_en, slug_ta, description_en, description_ta, display_order, nav_visible, home_visible')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .order('name_en', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  getPopularTags: async (limit = 16) => {
    const { data, error } = await supabase
      .from('tags')
      .select('id, name_en, name_ta, slug_en, slug_ta, is_popular, display_order')
      .eq('is_popular', true)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) {
      const fallback = await supabase
        .from('tags')
        .select('id, name_en, name_ta, slug_en, slug_ta')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (fallback.error) throw fallback.error;
      return fallback.data || [];
    }
    return data || [];
  },

  getHomepageConfig: async (language: 'en' | 'ta') => {
    const { data, error } = await supabase
      .from('homepage_config')
      .select('*')
      .eq('language', language)
      .maybeSingle();
    if (error) return null;
    return data || null;
  },

  getSiteSettingsMap: async (): Promise<Record<string, any>> => {
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle();
    if (error || !data) return {};
    return {
      raw: data,
      site_name: data.general?.siteName,
      tagline_en: data.general?.tagline_en,
      tagline_ta: data.general?.tagline_ta,
      contact_email: data.contact?.email,
      page_about_en: data.legal?.about_en,
      page_about_ta: data.legal?.about_ta,
      'page_privacy-policy_en': data.legal?.privacy_en,
      'page_privacy-policy_ta': data.legal?.privacy_ta,
      page_terms_en: data.legal?.terms_en,
      page_terms_ta: data.legal?.terms_ta,
      'page_editorial-policy_en': data.legal?.editorialPolicy_en,
      'page_editorial-policy_ta': data.legal?.editorialPolicy_ta,
      'page_corrections-policy_en': data.legal?.correctionsPolicy_en,
      'page_corrections-policy_ta': data.legal?.correctionsPolicy_ta,
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
        targetId: n.targetId || '',
        title: n.title,
        message: n.message,
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

    const { data: existing } = await supabase
      .from('Vote')
      .select('id')
      .eq('userId', user.id)
      .eq('postId', postId)
      .maybeSingle();

    if (existing) {
      await supabase.from('Vote').update({ type: voteType }).eq('id', existing.id);
    } else {
      await supabase.from('Vote').insert({
        id: generateUUID(),
        postId,
        userId: user.id,
        type: voteType,
      });
    }
  },

  /**
   * Vote on a comment
   */
  voteComment: async (commentId: string, voteType: 1 | -1) => {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) throw new Error('Not authenticated');

    const { data: existing } = await supabase
      .from('CommentVote')
      .select('id, type')
      .eq('userId', user.id)
      .eq('commentId', commentId)
      .maybeSingle();

    if (existing) {
      if (existing.type === voteType) {
        await supabase.from('CommentVote').delete().eq('id', existing.id);
      } else {
        await supabase.from('CommentVote').update({ type: voteType }).eq('id', existing.id);
      }
    } else {
      await supabase.from('CommentVote').insert({
        id: generateUUID(),
        commentId,
        userId: user.id,
        type: voteType,
      });
    }
  },

  /**
   * Add a comment
   */
  addComment: async (postId: string, content: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) throw new Error('Not authenticated');

    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('Comment')
      .insert({
        id: generateUUID(),
        postId,
        userId: user.id,
        content,
        createdAt: now,
        updatedAt: now,
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

    const now = new Date().toISOString();
    const { error } = await supabase
      .from('Follow')
      .insert({
        id: generateUUID(),
        followerId: user.id,
        followingId: creatorId,
        createdAt: now,
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

    const now = new Date().toISOString();
    const { error } = await supabase
      .from('Save')
      .insert({
        id: generateUUID(),
        userId: user.id,
        postId,
        createdAt: now,
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
   * Mark a single notification as read
   */
  markNotificationRead: async (notificationId: string) => {
    const { error } = await supabase
      .from('Notification')
      .update({ isRead: true })
      .eq('id', notificationId);
    if (error) throw error;
  },

  /**
   * Mark all notifications as read for the current user
   */
  markAllNotificationsRead: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('Notification')
      .update({ isRead: true })
      .eq('userId', user.id)
      .eq('isRead', false);
    if (error) throw error;
  },

  /**
   * Delete notifications by IDs
   */
  deleteNotifications: async (ids: string[]) => {
    const { error } = await supabase
      .from('Notification')
      .delete()
      .in('id', ids);
    if (error) throw error;
  },

  /**
   * Subscribe to real-time notification updates for a user
   */
  subscribeToNotifications: (userId: string, callback: (payload: any) => void) => {
    return supabase
      .channel(`notifications-${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'Notification',
        filter: `userId=eq.${userId}`,
      }, callback)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'Notification',
        filter: `userId=eq.${userId}`,
      }, callback)
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'Notification',
        filter: `userId=eq.${userId}`,
      }, callback)
      .subscribe();
  },

  /**
   * Register a new device push token
   */
  registerDevice: async (token: string, deviceName?: string, platform?: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('UserDevice')
      .upsert({
        userId: user.id,
        pushToken: token,
        deviceName: deviceName || 'Mobile Device',
        platform: platform || 'android',
        lastUsed: new Date().toISOString(),
      }, { onConflict: 'pushToken' });

    if (error) throw error;
    
    // Also update the legacy single token on the User table for redundancy
    await supabase.from('User').update({ push_token: token }).eq('id', user.id);
  },

  /**
   * Unregister a device push token (on logout)
   */
  unregisterDevice: async (token: string) => {
    const { error } = await supabase
      .from('UserDevice')
      .delete()
      .eq('pushToken', token);
    if (error) throw error;
  },

  /**
   * Update the user's push token (Legacy - redirects to registerDevice)
   */
  updatePushToken: async (token: string | null) => {
    if (token) {
      await AppApi.registerDevice(token);
    }
  },

  /**
   * Update the user's push notification enablement status
   */
  updateNotificationSettings: async (enabled: boolean) => {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('User')
      .update({ push_notifications_enabled: enabled })
      .eq('id', user.id);
    if (error) throw error;
  },

  /**
   * Subscribe to real-time feed updates
   */
  subscribeToFeedUpdates: (callback: (payload: any) => void) => {
    // Debounce rapid updates
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const debouncedCallback = (payload: any) => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => callback(payload), 300);
    };

    return supabase
      .channel('viewer-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Post' }, debouncedCallback)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Vote' }, debouncedCallback)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Comment' }, debouncedCallback)
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

    const now = new Date().toISOString();
    const insertPayload: any = {
      id: generateUUID(),
      title: postData.title,
      content: postData.content || '',
      type: postData.type?.toUpperCase() || 'NEWS',
      authorId: user.id,
      createdAt: now,
      updatedAt: now,
    };
    if (postData.category) insertPayload.category = postData.category;
    if (postData.thumbnail) insertPayload.thumbnail = postData.thumbnail;
    if (postData.subtitle) insertPayload.subtitle = postData.subtitle;
    if (postData.video_duration) insertPayload.videoDuration = postData.video_duration;

    const { data, error } = await supabase
      .from('Post')
      .insert(insertPayload)
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
      .from('Post')
      .select('*, Vote(type), Comment(id, content)')
      .eq('authorId', user.id)
      .order('createdAt', { ascending: false });

    if (error) throw error;

    return (data || []).map((post: any) => {
      const votes = post.Vote || [];
      const allComments = post.Comment || [];
      const upvotes = votes.filter((v: any) => v.type === 1).length;
      const downvotes = votes.filter((v: any) => v.type === -1).length;
      const realComments = allComments.filter((c: any) => c.content !== '[SYSTEM_REPOST]').length;

      return {
        id: post.id,
        title: post.title,
        content: post.content,
        type: post.type,
        category: post.category,
        thumbnail: post.thumbnail,
        subtitle: post.subtitle,
        videoDuration: post.videoDuration,
        voteCount: upvotes - downvotes,
        upvoteCount: upvotes,
        downvoteCount: downvotes,
        commentCount: realComments,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
      };
    });
  },

  /**
   * Get real-time stats for the creator dashboard
   */
  getMyStats: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) throw new Error('Not authenticated');

    const { data: posts, error } = await supabase
      .from('Post')
      .select('id, type, Vote(type), Comment(id, content)')
      .eq('authorId', user.id);

    if (error) throw error;

    const allPosts = posts || [];
    let totalVotes = 0;
    let totalComments = 0;
    allPosts.forEach((p: any) => {
      const votes = p.Vote || [];
      const allC = p.Comment || [];
      totalVotes += votes.filter((v: any) => v.type === 1).length;
      totalComments += allC.filter((c: any) => c.content !== '[SYSTEM_REPOST]').length;
    });

    const { count: followerCount } = await supabase
      .from('Follow')
      .select('id', { count: 'exact', head: true })
      .eq('followingId', user.id);

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

    await supabase.from('Comment').delete().eq('postId', postId);
    await supabase.from('Vote').delete().eq('postId', postId);
    await supabase.from('Save').delete().eq('postId', postId);

    const { error } = await supabase
      .from('Post')
      .delete()
      .eq('id', postId)
      .eq('authorId', user.id);

    if (error) throw error;
  },

  /**
   * Get all comments on the creator's posts
   */
  getMyComments: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) throw new Error('Not authenticated');

    const { data: posts } = await supabase
      .from('Post')
      .select('id, title')
      .eq('authorId', user.id);

    if (!posts || posts.length === 0) return [];

    const postIds = posts.map((p: any) => p.id);
    const postMap = Object.fromEntries(posts.map((p: any) => [p.id, p.title]));

    const { data: comments, error } = await supabase
      .from('Comment')
      .select('*, author:User!userId(id, username, avatarUrl)')
      .in('postId', postIds)
      .order('createdAt', { ascending: false });

    if (error) throw error;

    return (comments || []).map((c: any) => ({
      id: c.id,
      content: c.content,
      postId: c.postId,
      postTitle: postMap[c.postId] || 'Unknown Post',
      username: (Array.isArray(c.author) ? c.author[0]?.username : c.author?.username) || 'Anonymous',
      avatarUrl: Array.isArray(c.author) ? c.author[0]?.avatarUrl : c.author?.avatarUrl,
      createdAt: c.createdAt,
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
        table: 'Post',
        filter: `authorId=eq.${userId}`,
      }, callback)
      .subscribe();
  },
};
