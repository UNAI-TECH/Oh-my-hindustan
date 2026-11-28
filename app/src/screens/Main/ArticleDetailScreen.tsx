import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Pressable, Image, Share, ActivityIndicator, Platform, Modal, TextInput, FlatList, KeyboardAvoidingView, Alert, Keyboard, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useFeed } from '../../context/FeedContext';
import { FeedItemType } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { generateUUID } from '../../utils/uuid';
import CustomModal from '../../components/CustomModal';
import { useInteraction } from '../../context/InteractionContext';
import { AppApi } from '../../api/services';
import AdBanner from '../../components/AdBanner';
import AdEnabledVideoPlayer from '../../components/AdEnabledVideoPlayer';
import WebPageShell from '../../components/web/WebPageShell';
import ArticleBodyRenderer from '../../components/ArticleBodyRenderer';
import { LinearGradient } from 'expo-linear-gradient';
import { resolveArticleHtml, splitHtmlForGuestPreview } from '../../utils/tiptapSerializer';
import { translateArticleContent, TranslatedArticlePayload } from '../../utils/articleTranslator';
import { savePendingAuthReturn } from '../../utils/authReturn';
import WebHeadSeo from '../../seo/WebHeadSeo';
import { buildArticleSeoConfig, SITE_URL } from '../../seo/seoUtils';
import { useSiteLanguage } from '../../context/SiteLanguageContext';
import { useTranslation } from 'react-i18next';
import { openExternalUrl } from '../../utils/openExternalUrl';
import { getOrCreateVisitorId } from '../../utils/visitorId';
import {
  buildArticleParams,
  cacheArticleSlug,
  categoryToSlug,
  isUuid,
  titleToSlug,
} from '../../components/web/webPortalHelpers';

const formatVoteCount = (n: number): string => {
  if (n >= 10000) {
    const k = n / 1000;
    return k % 1 === 0 ? `${k}K` : `${k.toFixed(1)}K`;
  }
  return n.toString();
};

export default function ArticleDetailScreen() {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isWebDesktop = isWeb && width >= 768;
  const routeId = route.params?.id;
  const routeSlug = route.params?.slug;
  const articleLookupKey = routeId || routeSlug || '';
  const { userProfile, isAuthenticated, ensureAuthenticatedUser } = useAuth();
  const isGuestUser = !isAuthenticated && !userProfile?.id;
  const { lang: siteLang, setSiteLang, formatDate } = useSiteLanguage();
  const { t } = useTranslation();
  const preferredRouteLang = route.params?.lang === 'ta' || route.params?.lang === 'en' ? route.params.lang : siteLang;
  
  const { selectedArticle, isLoading, fetchArticle } = useFeed();

  const decodedRouteSlug = React.useMemo(() => {
    if (!routeSlug) return '';
    try {
      return decodeURIComponent(String(routeSlug)).trim().toLowerCase();
    } catch {
      return String(routeSlug).trim().toLowerCase();
    }
  }, [routeSlug]);

  const id = React.useMemo(() => {
    if (routeId) return String(routeId);
    if (selectedArticle?.id) {
      const slugMatches =
        !decodedRouteSlug ||
        selectedArticle.id === decodedRouteSlug ||
        titleToSlug(selectedArticle.title) === decodedRouteSlug ||
        isUuid(decodedRouteSlug) ||
        !isLoading;
      if (slugMatches) return selectedArticle.id;
    }
    if (routeSlug && isUuid(String(routeSlug))) {
      return String(routeSlug);
    }
    return undefined;
  }, [routeId, selectedArticle?.id, selectedArticle?.title, decodedRouteSlug, routeSlug, isLoading]);
  const [upvotes, setUpvotes] = useState(0);
  const [downvotes, setDownvotes] = useState(0);
  const [myVote, setMyVote] = useState<1 | -1 | 0>(0);
  const [isSaved, setIsSaved] = useState(false);
  const [viewCount, setViewCount] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);
  const { follows, toggleFollow } = useInteraction();
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyingToUsername, setReplyingToUsername] = useState<string | null>(null);
  const [postAuthorId, setPostAuthorId] = useState<string | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<any[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [translatedPayload, setTranslatedPayload] = useState<TranslatedArticlePayload | null>(null);
  const [isTranslatingArticle, setIsTranslatingArticle] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const commentInputRef = useRef<TextInput>(null);
  const [modalConfig, setModalConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    isError: boolean;
    isLoginPrompt?: boolean;
  }>({ visible: false, title: '', message: '', isError: false });

  const promptLogin = (message: string) => {
    setModalConfig({
      visible: true,
      title: 'Login Required',
      message,
      isError: true,
      isLoginPrompt: true,
    });
  };
  const [refreshSyncTrigger, setRefreshSyncTrigger] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [keyboardOffset, setKeyboardOffset] = useState(0);

  // Mid-roll functionality is now handled entirely within AdEnabledVideoPlayer.

  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const s1 = Keyboard.addListener(showEvt, (e) => setKeyboardOffset(e.endCoordinates.height));
    const s2 = Keyboard.addListener(hideEvt, () => setKeyboardOffset(0));
    return () => { s1.remove(); s2.remove(); };
  }, []);
  
  // Reset all state when navigating to a different post
  useEffect(() => {
    setUpvotes(0);
    setDownvotes(0);
    setMyVote(0);
    setIsSaved(false);
    setViewCount(0);
    setCommentsCount(0);
    setComments([]);
    setPostAuthorId(null);
    setRelatedPosts([]);
    setIsReady(false);
    scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    setTranslatedPayload(null);
    setIsTranslatingArticle(false);
    if (articleLookupKey) fetchArticle(articleLookupKey, preferredRouteLang);
    const timer = setTimeout(() => setIsReady(true), 150);
    return () => clearTimeout(timer);
  }, [articleLookupKey, preferredRouteLang]);

  // Bilingual switching: when user switches site language while viewing an article,
  // switch to the linked translation sibling if present, otherwise auto-translate the article view.
  useEffect(() => {
    if (!selectedArticle?.id) return;
    const articleLang: 'en' | 'ta' = selectedArticle.language === 'ta' ? 'ta' : 'en';
    if (siteLang === articleLang) {
      setTranslatedPayload(null);
      setIsTranslatingArticle(false);
      return;
    }

    const linkedSibling = (selectedArticle.translations || []).find((tr) => tr.language === siteLang);
    if (linkedSibling) {
      setTranslatedPayload(null);
      setIsTranslatingArticle(false);
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const nextUrl = `/${linkedSibling.language}/article/${encodeURIComponent(linkedSibling.slug || linkedSibling.id)}`;
        window.history.replaceState(null, '', nextUrl);
      }
      navigation.navigate('ArticleDetail', {
        id: linkedSibling.id,
        slug: linkedSibling.slug,
        title: linkedSibling.title,
        lang: linkedSibling.language,
      });
      return;
    }

    let cancelled = false;
    setIsTranslatingArticle(true);
    const sourceHtml = resolveArticleHtml(
      selectedArticle.content_json,
      selectedArticle.content || selectedArticle.excerpt || ''
    );
    translateArticleContent({
      articleId: selectedArticle.id,
      title: selectedArticle.title,
      shortDescription: selectedArticle.short_description,
      bodyHtml: sourceHtml,
      sourceLang: articleLang,
      targetLang: siteLang,
    })
      .then((res) => {
        if (!cancelled) setTranslatedPayload(res);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setIsTranslatingArticle(false);
      });

    return () => {
      cancelled = true;
    };
  }, [siteLang, selectedArticle?.id, selectedArticle?.language, selectedArticle?.translations]);

  useEffect(() => {
    if (!selectedArticle?.title) return;
    const isCurrentMatch =
      selectedArticle.id === routeId ||
      selectedArticle.id === articleLookupKey ||
      titleToSlug(selectedArticle.title) === decodedRouteSlug ||
      (!isLoading && !!selectedArticle.id);
    if (!isCurrentMatch) return;

    const targetSlug = cacheArticleSlug(selectedArticle.id, selectedArticle.title);
    navigation.setOptions({ title: selectedArticle.title });
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = `${selectedArticle.title} | PostsApp`;
    }
    if (
      targetSlug &&
      (routeSlug !== targetSlug || route.params?.title !== selectedArticle.title)
    ) {
      navigation.setParams({
        id: selectedArticle.id,
        slug: targetSlug,
        title: selectedArticle.title,
      });
    }
  }, [
    selectedArticle?.id,
    selectedArticle?.title,
    routeId,
    articleLookupKey,
    decodedRouteSlug,
    routeSlug,
    route.params?.title,
    isLoading,
    navigation,
  ]);

  const fetchInteractions = useCallback(async () => {
    if (!id) return;
    try {
      const { count: upCount } = await supabase.from('Vote').select('id', { count: 'exact', head: true }).eq('postId', id).eq('type', 1);
      const { count: downCount } = await supabase.from('Vote').select('id', { count: 'exact', head: true }).eq('postId', id).eq('type', -1);
      const { count: cCount } = await supabase.from('Comment').select('id', { count: 'exact', head: true }).eq('postId', id).neq('content', '[SYSTEM_REPOST]');
      const { count: rCount } = await supabase.from('Comment').select('id', { count: 'exact', head: true }).eq('postId', id).eq('content', '[SYSTEM_REPOST]');
      const { count: vCount } = await supabase.from('PostView').select('id', { count: 'exact', head: true }).eq('postId', id);
      const { data: postData } = await supabase.from('Post').select('authorId').eq('id', id).single();
      if (postData?.authorId) setPostAuthorId(postData.authorId);

      setUpvotes(upCount || 0);
      setDownvotes(downCount || 0);
      setCommentsCount(cCount || 0);
      setViewCount(vCount || 0);

      if (userProfile?.id) {
        const { data: myVoteData } = await supabase.from('Vote').select('type').eq('postId', id).eq('userId', userProfile.id).maybeSingle();
        setMyVote(myVoteData?.type || 0);
        const { data: savedData } = await supabase.from('Save').select('id').eq('postId', id).eq('userId', userProfile.id).maybeSingle();
        setIsSaved(!!savedData);
      }
    } catch (e: any) {
      console.warn('Fetch interactions error:', e?.message);
    }
  }, [id, userProfile?.id]);

  useEffect(() => {
    fetchInteractions();
  }, [fetchInteractions]);

  useEffect(() => {
    const logView = async () => {
      if (!id || !userProfile?.id) return;
      try {
        await supabase.rpc('record_post_view', {
          p_post_id: id,
          p_visitor_key: userProfile.id,
        });
      } catch (e) {
        console.warn('PostView log error');
      }
    };
    logView();
  }, [id, userProfile?.id]);

  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`interactions_${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Vote', filter: `postId=eq.${id}` }, () => {
        fetchInteractions();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Comment', filter: `postId=eq.${id}` }, () => {
        fetchInteractions();
        setRefreshSyncTrigger(prev => prev + 1);
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'PostView', filter: `postId=eq.${id}` }, () => {
        fetchInteractions();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, fetchInteractions]);

  const createNotification = async (type: string, title: string, message: string) => {
    if (!postAuthorId || postAuthorId === userProfile?.id) return;
    try {
      const { error } = await supabase.from('Notification').insert({
        id: generateUUID(),
        userId: postAuthorId,
        type,
        title,
        message,
        targetId: id,
        createdAt: new Date().toISOString(),
      });
      if (error) console.warn('Notification insert error:', error.message);
    } catch (e) {}
  };

  const handleVote = async (voteType: 1 | -1) => {
    const activeUser = userProfile?.id ? userProfile : await ensureAuthenticatedUser();
    if (!activeUser?.id) { promptLogin('Please login to vote'); return; }
    
    // Save current state for rollback
    const prevUpvotes = upvotes;
    const prevDownvotes = downvotes;
    const prevMyVote = myVote;
    
    try {
      if (myVote === voteType) {
        // Optimistic Update: Toggle off
        if (voteType === 1) setUpvotes(v => Math.max(0, v - 1));
        else setDownvotes(v => Math.max(0, v - 1));
        setMyVote(0);
        
        const { error } = await supabase.from('Vote').delete().eq('postId', id).eq('userId', activeUser.id);
        if (error) throw error;
      } else {
        // Optimistic Update: Switch or New vote
        let newUpvotes = upvotes;
        let newDownvotes = downvotes;
        
        if (myVote === 1) newUpvotes = Math.max(0, newUpvotes - 1);
        else if (myVote === -1) newDownvotes = Math.max(0, newDownvotes - 1);
        
        if (voteType === 1) newUpvotes += 1;
        else newDownvotes += 1;
        
        setUpvotes(newUpvotes);
        setDownvotes(newDownvotes);
        setMyVote(voteType);

        // Check if existing vote
        const { data: existing } = await supabase.from('Vote').select('id').eq('userId', activeUser.id).eq('postId', id).maybeSingle();
        
        if (existing) {
          const { error } = await supabase.from('Vote').update({ type: voteType }).eq('id', existing.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('Vote').insert({
            id: generateUUID(),
            postId: id,
            userId: activeUser.id,
            type: voteType,
          });
          if (error) throw error;
        }
        
        if (voteType === 1) createNotification('LIKE', 'New Like', `${activeUser.username || 'Someone'} liked your post`);
      }
    } catch (e: any) {
      // Rollback
      setUpvotes(prevUpvotes);
      setDownvotes(prevDownvotes);
      setMyVote(prevMyVote);
      setModalConfig({ visible: true, title: 'Vote Failed', message: e?.message || 'Could not register vote', isError: true });
    }
  };

  const handleSave = async () => {
    const activeUser = userProfile?.id ? userProfile : await ensureAuthenticatedUser();
    if (!activeUser?.id) { promptLogin('Please login to save posts'); return; }
    const prevSaved = isSaved;
    try {
      // Optimistic
      setIsSaved(!isSaved);
      
      if (prevSaved) {
        const { error } = await supabase.from('Save').delete().eq('userId', activeUser.id).eq('postId', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('Save').insert({
          id: generateUUID(),
          userId: activeUser.id,
          postId: id,
        });
        if (error) throw error;
      }
    } catch (e: any) {
      setIsSaved(prevSaved);
      setModalConfig({ visible: true, title: 'Save Failed', message: e?.message || 'Could not save post', isError: true });
    }
  };



  const handleFollow = async () => {
    const activeUser = userProfile?.id ? userProfile : await ensureAuthenticatedUser();
    if (!activeUser?.id || !postAuthorId) { 
      promptLogin('Please login to follow creators');
      return; 
    }
    await toggleFollow(postAuthorId);
  };

  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      const { data, error } = await supabase
        .from('Comment')
        .select('*, User:userId(id, username, avatarUrl)')
        .eq('postId', id)
        .neq('content', '[SYSTEM_REPOST]')
        .order('createdAt', { ascending: false });
      if (error) console.warn('Fetch comments error:', error.message);
      setComments(data || []);
    } catch (e) {}
    setLoadingComments(false);
  };

  useEffect(() => {
    if (showComments && refreshSyncTrigger > 0) {
      fetchComments();
    }
  }, [refreshSyncTrigger]);

  const openCommentSheet = () => {
    setShowComments(true);
    setReplyingToId(null);
    setReplyingToUsername(null);
    fetchComments();
  };

  const handleCommentVote = async (commentId: string, type: 1 | -1) => {
    const activeUser = userProfile?.id ? userProfile : await ensureAuthenticatedUser();
    if (!activeUser?.id) { promptLogin('Please login to vote on comments'); return; }
    try {
      await AppApi.voteComment(commentId, type);
      fetchComments(); // Instead of building optimistic map, we just wait for real-time or refetch
    } catch (e: any) {
      console.warn('Comment vote failed', e);
    }
  };

  const submitComment = async () => {
    if (!newComment.trim()) return;
    const activeUser = userProfile?.id ? userProfile : await ensureAuthenticatedUser();
    if (!activeUser?.id) { promptLogin('Please login to comment'); return; }
    
    const commentContent = newComment.trim();
    const prevComments = [...comments];
    const prevCount = commentsCount;
    
    try {
      // Optimistic
      const tempId = `temp-${Date.now()}`;
      const optimisticComment = {
        id: tempId,
        content: commentContent,
        postId: id,
        userId: activeUser.id,
        parentId: replyingToId,
        createdAt: new Date().toISOString(),
        User: {
          id: activeUser.id,
          username: activeUser.username,
          avatarUrl: activeUser.avatarUrl
        },
        upvotes: 0,
        downvotes: 0,
        creatorLiked: false
      };
      
      setComments(prev => [optimisticComment, ...prev]);
      setCommentsCount(c => c + 1);
      setNewComment('');
      setReplyingToId(null);
      setReplyingToUsername(null);
      
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('Comment')
        .insert({
          id: generateUUID(),
          postId: id,
          userId: activeUser.id,
          content: commentContent,
          parentId: replyingToId,
          createdAt: now,
          updatedAt: now,
        });
        
      if (error) throw error;
      createNotification('COMMENT', 'New Comment', `${activeUser.username || 'Someone'} commented on your post`);
      
      // Re-fetch to get the real ID and proper data
      fetchComments();
    } catch (e: any) {
      setComments(prevComments);
      setCommentsCount(prevCount);
      setNewComment(commentContent);
      setModalConfig({ visible: true, title: 'Comment Failed', message: e?.message || 'Could not post comment', isError: true });
    }
  };
  // Fetch related posts (same category or same author, excluding current)
  const fetchRelatedPosts = useCallback(async () => {
    if (!id) return;
    setLoadingRelated(true);
    try {
      const currentCategory = selectedArticle?.category;
      const currentAuthorId = postAuthorId || selectedArticle?.authorId;
      const articleLang = selectedArticle?.language || 'en';

      let posts: any[] = [];

      // Fetch by same category and language
      if (currentCategory) {
        const { data: catPosts } = await supabase
          .from('Post')
          .select('id, slug, title, thumbnail, category, language, createdAt, authorId, author:User!authorId(username, avatarUrl)')
          .eq('status', 'PUBLISHED')
          .eq('language', articleLang)
          .or('is_active.eq.true,is_active.is.null')
          .eq('category', currentCategory)
          .neq('id', id)
          .order('createdAt', { ascending: false })
          .limit(6);
        if (catPosts) posts.push(...catPosts);
      }

      // Fetch by same author (if we don't have enough)
      if (currentAuthorId && posts.length < 6) {
        const { data: authorPosts } = await supabase
          .from('Post')
          .select('id, slug, title, thumbnail, category, language, createdAt, authorId, author:User!authorId(username, avatarUrl)')
          .eq('status', 'PUBLISHED')
          .eq('language', articleLang)
          .or('is_active.eq.true,is_active.is.null')
          .eq('authorId', currentAuthorId)
          .neq('id', id)
          .order('createdAt', { ascending: false })
          .limit(6);
        if (authorPosts) posts.push(...authorPosts);
      }

      // Fallback: Fetch general recent posts if we don't have enough
      if (posts.length < 6) {
        const { data: recentPosts } = await supabase
          .from('Post')
          .select('id, slug, title, thumbnail, category, language, createdAt, authorId, author:User!authorId(username, avatarUrl)')
          .eq('status', 'PUBLISHED')
          .eq('language', articleLang)
          .or('is_active.eq.true,is_active.is.null')
          .neq('id', id)
          .order('createdAt', { ascending: false })
          .limit(6);
        if (recentPosts) posts.push(...recentPosts);
      }

      // Deduplicate
      const seen = new Set<string>();
      const unique = posts.filter(p => {
        if (seen.has(p.id) || p.id === id) return false;
        seen.add(p.id);
        return true;
      }).slice(0, 6);

      setRelatedPosts(unique);
    } catch (e) {
      console.warn('Related posts fetch error:', e);
    } finally {
      setLoadingRelated(false);
    }
  }, [id, selectedArticle?.category, postAuthorId]);

  useEffect(() => {
    if (selectedArticle) fetchRelatedPosts();
  }, [selectedArticle, fetchRelatedPosts]);

  const APP_DOWNLOAD_URL = 'https://play.google.com/store/apps/details?id=com.unai.antigravity';
  const shareUrl = React.useMemo(() => {
    const shareLang = selectedArticle?.language || 'en';
    const shareSlug = selectedArticle?.slug || titleToSlug(selectedArticle?.title) || id || '';
    const origin =
      Platform.OS === 'web' && typeof window !== 'undefined'
        ? window.location.origin
        : SITE_URL;
    return `${origin}/${shareLang}/article/${encodeURIComponent(shareSlug)}`;
  }, [selectedArticle?.language, selectedArticle?.slug, selectedArticle?.title, id]);

  const recordShare = useCallback(async (channel: string) => {
    if (!id) return;
    try {
      const visitorId = await getOrCreateVisitorId();
      await supabase.rpc('record_post_share', {
        p_post_id: id,
        p_channel: channel,
        p_visitor_key: userProfile?.id || visitorId,
      });
    } catch (_) {}
  }, [id, userProfile?.id]);

  const onShare = useCallback(async () => {
    const shareTitle = selectedArticle?.title || 'Check this out';
    void recordShare('native_share');
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && typeof (navigator as any).share === 'function') {
        await (navigator as any).share({ title: shareTitle, url: shareUrl });
        return;
      }
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        setModalConfig({ visible: true, title: 'Link Copied', message: 'Article URL copied to clipboard.', isError: false });
        return;
      }
      await Share.share({
        message: `${shareTitle}\n\nRead more on PostsApp:\n${shareUrl}\n\nDownload the app: ${APP_DOWNLOAD_URL}`,
      });
    } catch (_) {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl).catch(() => {});
        setModalConfig({ visible: true, title: 'Link Copied', message: 'Article URL copied to clipboard.', isError: false });
      }
    }
  }, [selectedArticle?.title, shareUrl, recordShare]);

  const handleCopyShareLink = useCallback(async () => {
    void recordShare('copy_link');
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        setModalConfig({ visible: true, title: 'Link Copied', message: 'Article URL copied to clipboard.', isError: false });
      } else {
        await Share.share({ message: shareUrl });
      }
    } catch (_) {}
  }, [shareUrl, recordShare]);

  const articleSeoConfig = React.useMemo(() => {
    if (Platform.OS !== 'web') return null;
    if (!selectedArticle) {
      if (isLoading) return null;
      return {
        title: 'Article Unavailable | PostsApp',
        description: t('editorial.article_unavailable_desc', 'This article may have been archived, removed, or moved to another URL.'),
        canonicalUrl: `${SITE_URL}/${siteLang}`,
        lang: siteLang,
        robots: 'noindex, follow',
      };
    }
    return buildArticleSeoConfig({
      article: selectedArticle,
      translations: selectedArticle.translations || [],
      categorySlug: categoryToSlug(selectedArticle.category),
      categoryName: selectedArticle.category,
    });
  }, [selectedArticle, isLoading, siteLang, t]);

  // Early returns — AFTER all hooks
  if (isLoading && !selectedArticle) {
    if (isWebDesktop) {
      return (
        <WebPageShell maxWidth={920}>
          <View style={{ paddingVertical: 80, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.PrimaryRed} />
          </View>
        </WebPageShell>
      );
    }
    return <View style={styles.center}><ActivityIndicator size="large" color={colors.PrimaryRed} /></View>;
  }
  if (!selectedArticle) {
    const unavailableContent = (
      <View style={[styles.center, { padding: 32, minHeight: 360 }]}>
        <WebHeadSeo config={articleSeoConfig} />
        <Ionicons name="newspaper-outline" size={56} color="#9CA3AF" />
        <Text style={{ fontSize: 22, fontWeight: '800', color: '#111827', marginTop: 14, textAlign: 'center' }}>
          {t('editorial.article_unavailable', 'Article Unavailable')}
        </Text>
        <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 8, textAlign: 'center', maxWidth: 420 }}>
          {t('editorial.article_unavailable_desc', 'This article may have been archived, removed, or moved to another URL.')}
        </Text>
        <TouchableOpacity
          style={{ marginTop: 20, backgroundColor: colors.PrimaryRed, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 6 }}
          onPress={() => navigation.navigate('Home', { initialCategory: 'home' })}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 14 }}>Go to Home Feed</Text>
        </TouchableOpacity>
      </View>
    );
    return isWebDesktop ? <WebPageShell maxWidth={920}>{unavailableContent}</WebPageShell> : unavailableContent;
  }

  const { title, category, authorName, authorImage, subtitle, thumbnail, type, content, excerpt, quote, authorNameCustom, authorPosition, hashtags } = selectedArticle;
  const isFollowing = postAuthorId ? !!follows[postAuthorId] : false;
  const relatedCardStyle = isWebDesktop ? styles.relatedCardWeb : { width: (width - 48) / 2 };
  const publishedDateStr = formatDate(selectedArticle.published_at || selectedArticle.createdAt);
  const updatedDateStr =
    selectedArticle.updatedAt && selectedArticle.updatedAt !== (selectedArticle.published_at || selectedArticle.createdAt)
      ? `${formatDate(selectedArticle.updatedAt)} IST`
      : null;

  const fullArticleHtml = resolveArticleHtml(
    selectedArticle.content_json,
    selectedArticle.content || selectedArticle.excerpt || ''
  );
  const activeTranslated =
    translatedPayload && translatedPayload.targetLang === siteLang ? translatedPayload : null;
  const displayTitle = activeTranslated?.title || title;
  const displayShortDesc =
    activeTranslated?.shortDescription !== undefined
      ? activeTranslated.shortDescription
      : selectedArticle.short_description;
  const displayArticleHtml = activeTranslated?.bodyHtml || fullArticleHtml;
  const displayArticleLang: 'en' | 'ta' = activeTranslated ? siteLang : (selectedArticle.language || 'en');

  const guestSplit = splitHtmlForGuestPreview(displayArticleHtml, 260);
  const showGuestPaywall = isGuestUser && guestSplit.hasMore;

  const rememberArticleAndGo = (authRoute: 'Login' | 'SignUp') => {
    savePendingAuthReturn({
      screen: 'ArticleDetail',
      params: {
        id: selectedArticle.id,
        slug: selectedArticle.slug || routeSlug,
        title: selectedArticle.title,
        lang: siteLang,
      },
    });
    navigation.navigate(authRoute);
  };

  const articleBodyContent = (
    <>
      <WebHeadSeo config={articleSeoConfig} />
      <View style={isWebDesktop ? { padding: 32 } : { padding: 24 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 16 }}>
            <TouchableOpacity
              style={[styles.categoryPill, { marginBottom: 0 }]}
              onPress={() => navigation.navigate('Home', { initialCategory: categoryToSlug(category || 'general') })}
            >
              <Text style={styles.categoryText}>{category || 'POLICY ANALYSIS'}</Text>
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              {selectedArticle.reading_time_minutes ? (
                <Text style={{ fontSize: 12, color: colors.Slate500, fontWeight: '600' }}>
                  {selectedArticle.reading_time_minutes} {t('common.minute_read', 'min read')}
                </Text>
              ) : null}
              {publishedDateStr ? (
                <Text style={{ fontSize: 12, color: colors.Slate400 }}>
                  {publishedDateStr}
                </Text>
              ) : null}
            </View>
          </View>

          <Text style={[styles.title, isWebDesktop && { fontSize: 34, lineHeight: 42 }, { marginBottom: 14 }]}>{displayTitle}</Text>

          {displayShortDesc ? (
            <Text style={{ fontSize: 16, lineHeight: 24, color: colors.Slate500, marginBottom: 18 }}>
              {displayShortDesc}
            </Text>
          ) : null}

          {isTranslatingArticle && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14, paddingVertical: 6, paddingHorizontal: 10, backgroundColor: '#F8FAFC', borderRadius: 6, alignSelf: 'flex-start' }}>
              <ActivityIndicator size="small" color={colors.PrimaryRed} />
              <Text style={{ fontSize: 12, fontWeight: '600', color: colors.Slate500 }}>
                {siteLang === 'ta' ? 'தமிழில் மொழிபெயர்க்கப்படுகிறது...' : 'Translating to English...'}
              </Text>
            </View>
          )}

          {activeTranslated && !isTranslatingArticle && (
            <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 16, paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#EFF6FF', borderRadius: 6, borderWidth: 1, borderColor: '#BFDBFE' }}>
              <Ionicons name="language-outline" size={15} color="#1D4ED8" />
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#1E40AF' }}>
                {siteLang === 'ta' ? 'தமிழில் மொழிபெயர்க்கப்பட்ட பதிப்பு' : 'Auto-translated English view'}
              </Text>
              <TouchableOpacity onPress={() => setSiteLang(selectedArticle.language === 'ta' ? 'ta' : 'en')}>
                <Text style={{ fontSize: 12, fontWeight: '800', color: '#D4191F', textDecorationLine: 'underline' }}>
                  {selectedArticle.language === 'ta' ? 'தமிழ் மூலத்தைப் பார்க்க' : 'View original English'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {updatedDateStr ? (
            <Text style={{ fontSize: 11, color: colors.Slate400, marginBottom: 12 }}>
              Updated: {updatedDateStr}
            </Text>
          ) : null}

          {selectedArticle.translations && selectedArticle.translations.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
              {selectedArticle.translations.map((tr) => (
                <TouchableOpacity
                  key={tr.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    backgroundColor: '#FEF2F2',
                    borderWidth: 1,
                    borderColor: '#FECACA',
                    paddingHorizontal: 12,
                    paddingVertical: 7,
                    borderRadius: 6,
                  }}
                  onPress={() => {
                    setSiteLang(tr.language);
                    navigation.navigate('ArticleDetail', {
                      id: tr.id,
                      slug: tr.slug,
                      title: tr.title,
                      lang: tr.language,
                    });
                  }}
                >
                  <Ionicons name="language-outline" size={16} color={colors.PrimaryRed} />
                  <Text style={{ color: colors.PrimaryRed, fontWeight: '700', fontSize: 13 }}>
                    {tr.language === 'ta' ? 'தமிழில் படிக்க (Read in Tamil)' : 'Read in English'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {(authorNameCustom || authorPosition || selectedArticle.author_name || selectedArticle.author_position) && (
            <View style={{ marginBottom: 4, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
              {(authorNameCustom || selectedArticle.author_name) && (
                <Text style={{ fontSize: 18, fontWeight: '900', color: colors.DarkText, marginBottom: 4 }}>
                  {authorNameCustom || selectedArticle.author_name}
                </Text>
              )}
              {(authorPosition || selectedArticle.author_position) && (
                <Text style={{ fontSize: 13, color: colors.Slate500, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {authorPosition || selectedArticle.author_position}
                </Text>
              )}
            </View>
          )}
        </View>

        {thumbnail && (
          <View>
            {type === FeedItemType.VIDEO && selectedArticle.videoUrl && isReady ? (
            <View style={{ width: '100%', backgroundColor: 'black' }}>
              <AdEnabledVideoPlayer
                postId={id}
                videoUrl={selectedArticle.videoUrl}
                adsEnabled={selectedArticle.ads_enabled}
                adBreaks={selectedArticle.ad_breaks}
                userId={userProfile?.id}
              />
            </View>
            ) : (
              <View style={{ width: '100%', aspectRatio: 16/9 }}>
                <Image
                  source={{ uri: thumbnail }}
                  style={{ flex: 1 }}
                  accessibilityLabel={selectedArticle.featured_image_alt || title}
                />
                {type === FeedItemType.VIDEO && (
                  <View style={styles.playOverlay}>
                    <View style={styles.playButton}>
                      <Ionicons name="play" size={24} color={colors.PrimaryRed} style={{ marginLeft: 4 }} />
                    </View>
                  </View>
                )}
              </View>
            )}
            {(selectedArticle.featured_image_caption || selectedArticle.featured_image_credit) && (
              <View style={{ paddingHorizontal: isWebDesktop ? 32 : 24, paddingTop: 8 }}>
                {selectedArticle.featured_image_caption ? (
                  <Text style={{ fontSize: 12, color: colors.Slate500 }}>{selectedArticle.featured_image_caption}</Text>
                ) : null}
                {selectedArticle.featured_image_credit ? (
                  <Text style={{ fontSize: 11, color: colors.Slate400, marginTop: 2 }}>Source: {selectedArticle.featured_image_credit}</Text>
                ) : null}
              </View>
            )}
          </View>
        )}

        {/* Creator Profile & Follow Below Cover Image */}
        <View style={{ paddingHorizontal: isWebDesktop ? 32 : 24, paddingTop: 18, paddingBottom: 6 }}>
          <View style={styles.authorRow}>
            <Image source={{ uri: authorImage || `https://ui-avatars.com/api/?name=C&background=D4191F&color=fff` }} style={styles.authorImage} />
            <TouchableOpacity style={{ flex: 1, marginLeft: 12 }} onPress={() => navigation.navigate('CreatorProfile', { authorId: postAuthorId, authorName })}>
              <Text style={styles.authorName}>{authorName || 'Anonymous'}</Text>
              <Text style={styles.authorSubtitle}>{subtitle || 'PostsApp'}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.followBtn, isFollowing && { backgroundColor: '#F1F5F9' }]}
              onPress={handleFollow}
            >
              <Text style={[styles.followBtnText, isFollowing && { color: 'black' }]}>
                {isFollowing ? t('common.following', 'Following') : t('common.follow', 'Follow')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Ad Placement 1: Below creator profile */}
        <AdBanner />

        {/* Mid-Roll Ad Overlay is handled by AdEnabledVideoPlayer */}

        <View style={{ padding: isWebDesktop ? 32 : 24, minHeight: 100 }}>
          {showGuestPaywall ? (
            <View>
              <ArticleBodyRenderer
                contentHtml={guestSplit.previewHtml}
                language={selectedArticle.language || 'en'}
              />

              <View
                style={{
                  position: 'relative',
                  marginTop: 8,
                  minHeight: 290,
                  borderRadius: 12,
                }}
              >
                <View
                  pointerEvents="none"
                  style={[
                    {
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      overflow: 'hidden',
                      opacity: Platform.OS === 'web' ? 0.42 : 0.2,
                    },
                    Platform.OS === 'web'
                      ? ({ filter: 'blur(6px)', userSelect: 'none' } as any)
                      : null,
                  ]}
                >
                  <ArticleBodyRenderer
                    contentHtml={guestSplit.remainderHtml}
                    language={selectedArticle.language || 'en'}
                  />
                </View>

                <LinearGradient
                  colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.9)', '#FFFFFF']}
                  style={{
                    minHeight: 290,
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingHorizontal: isWebDesktop ? 20 : 12,
                    paddingVertical: 24,
                  }}
                >
                  <View
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderWidth: 1,
                      borderColor: '#E5E7EB',
                      borderRadius: 14,
                      paddingVertical: 22,
                      paddingHorizontal: 24,
                      maxWidth: 420,
                      width: '100%',
                      alignItems: 'center',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 8 },
                      shadowOpacity: 0.08,
                      shadowRadius: 20,
                      elevation: 5,
                    }}
                  >
                    <View
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 21,
                        backgroundColor: '#FEF2F2',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginBottom: 10,
                      }}
                    >
                      <Ionicons name="lock-closed" size={20} color="#D4191F" />
                    </View>
                    <Text
                      style={{
                        fontSize: 17,
                        fontWeight: '800',
                        color: '#111827',
                        textAlign: 'center',
                      }}
                    >
                      {selectedArticle.language === 'ta' || siteLang === 'ta'
                        ? 'முழு கட்டுரையைப் படிக்க உள்நுழையவும்'
                        : 'Sign in to read the full story'}
                    </Text>
                    <Text
                      style={{
                        fontSize: 13,
                        color: '#6B7280',
                        textAlign: 'center',
                        marginTop: 6,
                        lineHeight: 19,
                      }}
                    >
                      {selectedArticle.language === 'ta' || siteLang === 'ta'
                        ? 'இலவச கணக்கில் உள்நுழைந்து முழு கட்டுரையைப் படித்து கருத்துத் தெரிவிக்கவும்.'
                        : 'Continue reading this dispatch, save stories to your library, and join the conversation.'}
                    </Text>
                    <TouchableOpacity
                      style={{
                        marginTop: 16,
                        backgroundColor: '#D4191F',
                        paddingHorizontal: 24,
                        paddingVertical: 11,
                        borderRadius: 8,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                        width: '100%',
                        justifyContent: 'center',
                      }}
                      onPress={() => rememberArticleAndGo('Login')}
                    >
                      <Ionicons name="log-in-outline" size={18} color="#FFFFFF" />
                      <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 14 }}>
                        {t('auth.sign_in', 'Sign In')}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{ marginTop: 10, paddingVertical: 4 }}
                      onPress={() => rememberArticleAndGo('SignUp')}
                    >
                      <Text style={{ color: '#D4191F', fontWeight: '700', fontSize: 12 }}>
                        {t('auth.sign_up', 'Create Free Account')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </LinearGradient>
              </View>
            </View>
          ) : (
            <ArticleBodyRenderer
              contentHtml={displayArticleHtml}
              language={displayArticleLang}
            />
          )}
        </View>
        
        {((hashtags && hashtags.length > 0) || (selectedArticle.hashtags && selectedArticle.hashtags.length > 0)) && (
          <View style={{ paddingHorizontal: isWebDesktop ? 32 : 24, paddingBottom: 24, marginTop: -8 }}>
            <View style={{ height: 1, backgroundColor: '#F1F5F9', marginBottom: 16 }} />
            <Text style={{ color: colors.Slate400, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
              Post Hashtags
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {(hashtags || selectedArticle.hashtags).map((tag: string, idx: number) => (
                <TouchableOpacity
                  key={idx}
                  style={{ backgroundColor: '#Fef2f2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#fee2e2' }}
                  onPress={() => navigation.navigate('Search', { initialTag: tag })}
                >
                  <Text style={{ color: colors.PrimaryRed, fontSize: 14, fontWeight: '700' }}>
                    #{String(tag).replace(/^#/, '')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Quick Social Share Bar */}
        <View style={{ paddingHorizontal: isWebDesktop ? 32 : 24, paddingBottom: 24 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#F1F5F9' }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.Slate500, marginRight: 4 }}>{t('common.share', 'Share')}:</Text>
            <TouchableOpacity
              style={styles.webActionBtn}
              onPress={() => {
                void recordShare('whatsapp');
                openExternalUrl(`https://api.whatsapp.com/send?text=${encodeURIComponent(`${title} ${shareUrl}`)}`);
              }}
            >
              <Ionicons name="logo-whatsapp" size={14} color="#16A34A" />
              <Text style={styles.webActionText}>WhatsApp</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.webActionBtn}
              onPress={() => {
                void recordShare('x');
                openExternalUrl(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(shareUrl)}`);
              }}
            >
              <Ionicons name="logo-twitter" size={14} color="#111827" />
              <Text style={styles.webActionText}>X</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.webActionBtn}
              onPress={() => {
                void recordShare('telegram');
                openExternalUrl(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`);
              }}
            >
              <Ionicons name="paper-plane-outline" size={14} color="#0284C7" />
              <Text style={styles.webActionText}>Telegram</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.webActionBtn} onPress={handleCopyShareLink}>
              <Ionicons name="link-outline" size={14} color="#374151" />
              <Text style={styles.webActionText}>Copy Link</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Inline Engagement Bar (never overlaps paywall or footer) */}
        <View style={{ paddingHorizontal: isWebDesktop ? 32 : 20, paddingBottom: 24 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              gap: 10,
              backgroundColor: '#F8FAFC',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: '#E2E8F0',
              paddingHorizontal: 14,
              paddingVertical: 10,
            }}
          >
            <View style={styles.voteControls}>
              <TouchableOpacity onPress={() => handleVote(1)}>
                <Ionicons name="arrow-up" size={20} color={myVote === 1 ? colors.PrimaryRed : colors.Slate500} />
              </TouchableOpacity>
              <Text style={{ fontWeight: 'bold', marginHorizontal: 6, color: myVote === 1 ? colors.PrimaryRed : colors.Slate500 }}>
                {formatVoteCount(upvotes)}
              </Text>

              <View style={{ width: 1, height: 16, backgroundColor: colors.Slate200, marginHorizontal: 4 }} />

              <TouchableOpacity onPress={() => handleVote(-1)}>
                <Ionicons name="arrow-down" size={20} color={myVote === -1 ? '#3B82F6' : colors.Slate500} />
              </TouchableOpacity>
              <Text style={{ fontWeight: 'bold', marginHorizontal: 6, color: myVote === -1 ? '#3B82F6' : colors.Slate500 }}>
                {formatVoteCount(downvotes)}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="eye-outline" size={18} color="gray" />
                <Text style={{ marginLeft: 5, fontWeight: '700', color: 'gray', fontSize: 13 }}>{formatVoteCount(viewCount)}</Text>
              </View>

              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }} onPress={openCommentSheet}>
                <Ionicons name="chatbubble-outline" size={18} color="gray" />
                <Text style={{ marginLeft: 5, fontWeight: '700', color: 'gray', fontSize: 13 }}>{commentsCount}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.shareCircle, { width: 36, height: 36, borderRadius: 18 }]} onPress={onShare}>
                <Ionicons name="share-social" size={17} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Ad Placement 2: Above Related Posts */}
        <AdBanner />

        {/* Related Posts Section */}
        {relatedPosts.length > 0 && (
          <View style={[styles.relatedSection, isWebDesktop && { paddingHorizontal: 32 }]}>
            <Text style={styles.relatedTitle}>Related Posts</Text>
            <View style={[styles.relatedGrid, isWebDesktop && { gap: 16, justifyContent: 'flex-start' }]}>
              {relatedPosts.map((post) => {
                const authorObj = Array.isArray(post.author) ? post.author[0] : post.author;
                const postAuthorName = authorObj?.username || 'Creator';
                const timeAgo = (() => {
                  try {
                    let ts = post.createdAt;
                    if (ts && !ts.endsWith('Z') && !ts.match(/[+-]\d{2}:\d{2}$/)) ts += 'Z';
                    const diff = Date.now() - new Date(ts).getTime();
                    if (diff < 0) return 'Just now';
                    const mins = Math.floor(diff / 60000);
                    if (mins < 1) return 'Just now';
                    if (mins < 60) return `${mins}m ago`;
                    const hrs = Math.floor(mins / 60);
                    if (hrs < 24) return `${hrs}h ago`;
                    return `${Math.floor(hrs / 24)}d ago`;
                  } catch { return ''; }
                })();

                return (
                  <TouchableOpacity
                    key={post.id}
                    style={[styles.relatedCard, relatedCardStyle]}
                    activeOpacity={0.8}
                    onPress={() => navigation.push('ArticleDetail', buildArticleParams(post))}
                  >
                    <Image
                      source={{ uri: post.thumbnail || 'https://via.placeholder.com/200x120/f1f5f9/94a3b8?text=No+Image' }}
                      style={styles.relatedThumbnail}
                    />
                    <View style={styles.relatedCardContent}>
                      <View style={styles.relatedCategoryPill}>
                        <Text style={styles.relatedCategoryText}>{(post.category || 'General').toUpperCase()}</Text>
                      </View>
                      <Text style={styles.relatedPostTitle} numberOfLines={2}>{post.title}</Text>
                      <View style={styles.relatedMeta}>
                        <Text style={styles.relatedAuthor} numberOfLines={1}>{postAuthorName}</Text>
                        <Text style={styles.relatedTime}>{timeAgo}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
        {loadingRelated && (
          <ActivityIndicator size="small" color={colors.PrimaryRed} style={{ marginVertical: 24 }} />
        )}
    </>
  );

  const modalsBlock = (
    <>
      {/* Comments Modal */}
      <Modal
        visible={showComments}
        animationType="slide"
        transparent
        onRequestClose={() => setShowComments(false)}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <View style={[styles.modalOverlay, keyboardOffset > 0 && { paddingBottom: keyboardOffset }]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowComments(false)} />
            <View style={[styles.commentsSheet, isWebDesktop && styles.webCommentsSheet]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <View style={{ width: 28 }} />
                <View style={styles.sheetHandle} />
                <TouchableOpacity onPress={() => setShowComments(false)} style={{ padding: 4 }} accessibilityLabel="Close comments">
                  <Ionicons name="close" size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>
              <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 16 }}>
                {t('common.comments', 'Comments')} ({commentsCount})
              </Text>
              
              {loadingComments ? (
                <ActivityIndicator size="small" color={colors.PrimaryRed} style={{ marginVertical: 32 }} />
              ) : comments.length === 0 ? (
                <Text style={{ color: colors.Slate400, textAlign: 'center', marginVertical: 32 }}>No comments yet. Be the first!</Text>
              ) : (
                <FlatList
                  data={comments.filter(c => !c.parentId)}
                  keyExtractor={(item) => item.id}
                  style={{ maxHeight: 300 }}
                  renderItem={({ item }) => {
                    const itemReplies = comments.filter(r => r.parentId === item.id);
                    
                    const renderComment = (c: any, isReply = false) => (
                      <View key={c.id} style={[styles.commentItem, isReply && { marginLeft: 32, borderBottomWidth: 0, paddingVertical: 8 }]}>
                        <Image
                          source={{ uri: c.User?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.User?.username || 'U')}&background=D4191F&color=fff` }}
                          style={styles.commentAvatar}
                        />
                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <Text style={{ fontWeight: 'bold', fontSize: 13 }}>@{c.User?.username || 'User'}</Text>
                          <Text style={{ fontSize: 14, color: colors.DarkText, marginTop: 2 }}>{c.content}</Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 16 }}>
                            <Text style={{ fontSize: 11, color: colors.Slate400 }}>{new Date(c.createdAt).toLocaleDateString()}</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                              {!isReply && (
                                <TouchableOpacity onPress={() => { setReplyingToId(c.id); setReplyingToUsername(c.User?.username); }}>
                                  <Text style={{ fontSize: 11, fontWeight: 'bold', color: 'gray' }}>Reply</Text>
                                </TouchableOpacity>
                              )}
                            </View>
                          </View>
                        </View>
                        {c.creatorLiked && (
                          <View style={{ position: 'absolute', right: 0, bottom: 4 }}>
                            <Ionicons name="heart" size={16} color="red" />
                            <Image source={{ uri: selectedArticle?.authorImage || `https://ui-avatars.com/api/?name=C&background=D4191F&color=fff` }} style={{ width: 12, height: 12, borderRadius: 6, position: 'absolute', bottom: -2, right: -4, borderWidth: 1, borderColor: 'white' }} />
                          </View>
                        )}
                      </View>
                    );

                    return (
                      <View>
                        {renderComment(item)}
                        {itemReplies.map(reply => renderComment(reply, true))}
                      </View>
                    );
                  }}
                />
              )}

              {replyingToId && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, backgroundColor: '#F1F5F9', borderRadius: 8, marginTop: 10 }}>
                  <Text style={{ fontSize: 12, color: 'gray' }}>Replying to @{replyingToUsername}</Text>
                  <TouchableOpacity onPress={() => { setReplyingToId(null); setReplyingToUsername(null); }}>
                    <Ionicons name="close-circle" size={16} color="gray" />
                  </TouchableOpacity>
                </View>
              )}


              <View style={styles.commentInputRow}>
                <Pressable style={{ flex: 1 }} onPress={() => commentInputRef.current?.focus()}>
                  <TextInput
                    ref={commentInputRef}
                    style={styles.commentInput}
                    placeholder="Write a comment..."
                    placeholderTextColor="#64748B"
                    value={newComment}
                    onChangeText={setNewComment}
                    multiline
                    editable
                  />
                </Pressable>
                <TouchableOpacity onPress={submitComment} style={styles.sendBtn}>
                  <Ionicons name="send" size={20} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <CustomModal
        visible={modalConfig.visible}
        title={modalConfig.title}
        message={modalConfig.message}
        isError={modalConfig.isError}
        icon={modalConfig.isLoginPrompt ? 'log-in-outline' : undefined}
        primaryButtonText={modalConfig.isLoginPrompt ? 'Sign In' : 'OK'}
        secondaryButtonText={modalConfig.isLoginPrompt ? 'Cancel' : undefined}
        onPrimaryPress={() => {
          const goToLogin = !!modalConfig.isLoginPrompt;
          setModalConfig(prev => ({ ...prev, visible: false, isLoginPrompt: false }));
          if (goToLogin) {
            setShowComments(false);
            rememberArticleAndGo('Login');
          }
        }}
        onSecondaryPress={() => setModalConfig(prev => ({ ...prev, visible: false, isLoginPrompt: false }))}
      />
    </>
  );

  if (isWeb) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F5F5F7' }}>
        <WebPageShell maxWidth={920}>
          <View style={[styles.webTopBar, { flexWrap: 'wrap', gap: 8 }]}>
            <TouchableOpacity style={styles.webBackBtn} onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Home')}>
              <Ionicons name="arrow-back" size={16} color="#111827" />
              <Text style={styles.webBackText}>{isWebDesktop ? 'Back to Stories' : 'Back'}</Text>
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 4, padding: 2 }}>
                <TouchableOpacity
                  onPress={() => setSiteLang('en')}
                  style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 3, backgroundColor: siteLang === 'en' ? '#D4191F' : 'transparent' }}
                >
                  <Text style={{ fontSize: 11, fontWeight: '700', color: siteLang === 'en' ? '#FFFFFF' : '#374151' }}>EN</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setSiteLang('ta')}
                  style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 3, backgroundColor: siteLang === 'ta' ? '#D4191F' : 'transparent' }}
                >
                  <Text style={{ fontSize: 11, fontWeight: '700', color: siteLang === 'ta' ? '#FFFFFF' : '#374151' }}>தமிழ்</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.webActionBtn} onPress={onShare}>
                <Ionicons name="share-social-outline" size={16} color="#374151" />
                <Text style={styles.webActionText}>Share</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.webActionBtn} onPress={handleSave}>
                <Ionicons name={isSaved ? 'bookmark' : 'bookmark-outline'} size={16} color={isSaved ? colors.PrimaryRed : '#374151'} />
                <Text style={[styles.webActionText, isSaved && { color: colors.PrimaryRed }]}>
                  {isSaved ? 'Saved' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.webArticleCard}>
            {articleBodyContent}
          </View>
        </WebPageShell>
        {modalsBlock}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8 }}>
          <Ionicons name="arrow-back" size={24} color={colors.DarkText} />
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 6, padding: 2, marginRight: 4 }}>
            <TouchableOpacity
              onPress={() => setSiteLang('en')}
              style={{ paddingHorizontal: 7, paddingVertical: 3, borderRadius: 4, backgroundColor: siteLang === 'en' ? colors.PrimaryRed : 'transparent' }}
            >
              <Text style={{ fontSize: 11, fontWeight: '700', color: siteLang === 'en' ? '#FFFFFF' : '#475569' }}>EN</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setSiteLang('ta')}
              style={{ paddingHorizontal: 7, paddingVertical: 3, borderRadius: 4, backgroundColor: siteLang === 'ta' ? colors.PrimaryRed : 'transparent' }}
            >
              <Text style={{ fontSize: 11, fontWeight: '700', color: siteLang === 'ta' ? '#FFFFFF' : '#475569' }}>தமிழ்</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={onShare} style={{ padding: 8 }}>
             <Ionicons name="share-social-outline" size={24} color={colors.DarkText} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSave} style={{ padding: 8 }}>
             <Ionicons name={isSaved ? "bookmark" : "bookmark-outline"} size={24} color={isSaved ? colors.PrimaryRed : colors.DarkText} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView ref={scrollViewRef} contentContainerStyle={{ paddingBottom: 24 }}>
        {articleBodyContent}
      </ScrollView>

      {modalsBlock}
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.SurfaceWhite, paddingTop: Platform.OS === 'android' ? 24 : 0 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 8, paddingVertical: 4 },
  categoryPill: { backgroundColor: colors.PrimaryRedAlpha10, alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 8, marginBottom: 20 },
  categoryText: { color: colors.PrimaryRed, fontWeight: 'bold', fontSize: 12 },
  title: { fontSize: 28, fontWeight: '900', lineHeight: 36, color: colors.DarkText, marginBottom: 32 },
  authorRow: { flexDirection: 'row', alignItems: 'center' },
  authorImage: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: 'white' },
  authorName: { fontWeight: 'bold', fontSize: 14 },
  authorSubtitle: { fontSize: 12, color: 'gray', marginTop: 2 },
  followBtn: { backgroundColor: colors.PrimaryRed, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20 },
  followBtnText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  playOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  playButton: { backgroundColor: 'rgba(255,255,255,0.9)', width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
  paragraph: { fontSize: 16, lineHeight: 28, color: colors.DarkText, marginBottom: 24 },
  quoteBox: { flexDirection: 'row', backgroundColor: colors.PrimaryRedAlpha5, borderRadius: 8, overflow: 'hidden', marginBottom: 24 },
  quoteAccent: { width: 4, backgroundColor: colors.PrimaryRed },
  quoteText: { fontStyle: 'italic', color: 'gray', fontSize: 18, padding: 24, flex: 1 },
  fabContainer: { position: 'absolute', bottom: 32, left: 16, right: 16, alignItems: 'center' },
  fab: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.95)', 
    borderRadius: 32, height: 64, width: '95%', paddingHorizontal: 16, 
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 8,
    borderWidth: 1, borderColor: '#E2E8F0'
  },
  voteControls: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 24, paddingHorizontal: 12, paddingVertical: 8 },
  divider: { width: 1, height: 24, backgroundColor: '#E2E8F0', marginHorizontal: 12 },
  commentControl: { flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'center' },
  shareCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.PrimaryRed, justifyContent: 'center', alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  commentsSheet: { 
    backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, 
    padding: 20, paddingBottom: 32, maxHeight: '70%',
  },
  sheetHandle: { width: 40, height: 4, backgroundColor: '#D1D5DB', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  commentItem: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  commentAvatar: { width: 32, height: 32, borderRadius: 16 },
  commentInputRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16, gap: 10 },
  commentInput: { flex: 1, backgroundColor: '#F1F5F9', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, maxHeight: 80 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.PrimaryRed, justifyContent: 'center', alignItems: 'center' },
  // Related Posts Styles
  relatedSection: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  relatedTitle: { fontSize: 20, fontWeight: '800', color: colors.DarkText, marginBottom: 16 },
  relatedGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  relatedCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  relatedCardWeb: {
    flexBasis: '31%',
    flexGrow: 1,
    minWidth: 220,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    shadowOpacity: 0.03,
  },
  webTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  webBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  webBackText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  webActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  webActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  webArticleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  webCommentsSheet: {
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
  },
  relatedThumbnail: { width: '100%', height: 100, backgroundColor: '#F1F5F9' },
  relatedCardContent: { padding: 10 },
  relatedCategoryPill: { backgroundColor: colors.PrimaryRedAlpha10, alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginBottom: 6 },
  relatedCategoryText: { color: colors.PrimaryRed, fontSize: 9, fontWeight: 'bold' },
  relatedPostTitle: { fontSize: 13, fontWeight: '700', color: colors.DarkText, lineHeight: 18 },
  relatedMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  relatedAuthor: { fontSize: 11, color: colors.Slate500, flex: 1 },
  relatedTime: { fontSize: 10, color: colors.Slate400 },
});
