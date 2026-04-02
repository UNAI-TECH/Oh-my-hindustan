import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Share, ActivityIndicator, Platform, Modal, TextInput, FlatList, KeyboardAvoidingView, Alert, Dimensions, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useFeed } from '../../context/FeedContext';
import { FeedItemType } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { generateUUID } from '../../utils/uuid';
import RenderHtml, { defaultHTMLElementModels, HTMLContentModel } from 'react-native-render-html';
import { useWindowDimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import CustomModal from '../../components/CustomModal';
import { useInteraction } from '../../context/InteractionContext';
import { AppApi } from '../../api/services';
import AdBanner from '../../components/AdBanner';

const SCREEN_WIDTH = Dimensions.get('window').width;

const customHTMLElementModels = {
  font: defaultHTMLElementModels.span.extend({
    contentModel: HTMLContentModel.mixed
  })
};

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
  const { id } = route.params || {};
  const { userProfile } = useAuth();
  
  const { selectedArticle, isLoading, fetchArticle } = useFeed();
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
  const scrollViewRef = React.useRef<ScrollView>(null);
  const [modalConfig, setModalConfig] = useState({ visible: false, title: '', message: '', isError: false });
  const [refreshSyncTrigger, setRefreshSyncTrigger] = useState(0);
  const [keyboardOffset, setKeyboardOffset] = useState(0);

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
    scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    if (id) fetchArticle(id);
  }, [id]);

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
        // Prevent duplicate views client-side check and execute
        const { data } = await supabase.from('PostView').select('id').eq('postId', id).eq('userId', userProfile.id).limit(1);
        if (!data || data.length === 0) {
          await supabase.from('PostView').insert({
            id: generateUUID(),
            postId: id,
            userId: userProfile.id
          });
        }
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
    if (!userProfile?.id) { setModalConfig({ visible: true, title: 'Login Required', message: 'Please login to vote', isError: true }); return; }
    
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
        
        const { error } = await supabase.from('Vote').delete().eq('postId', id).eq('userId', userProfile.id);
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
        const { data: existing } = await supabase.from('Vote').select('id').eq('userId', userProfile.id).eq('postId', id).maybeSingle();
        
        if (existing) {
          const { error } = await supabase.from('Vote').update({ type: voteType }).eq('id', existing.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('Vote').insert({
            id: generateUUID(),
            postId: id,
            userId: userProfile.id,
            type: voteType,
          });
          if (error) throw error;
        }
        
        if (voteType === 1) createNotification('LIKE', 'New Like', `${userProfile.username || 'Someone'} liked your post`);
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
    if (!userProfile?.id) { setModalConfig({ visible: true, title: 'Login Required', message: 'Please login to save posts', isError: true }); return; }
    const prevSaved = isSaved;
    try {
      // Optimistic
      setIsSaved(!isSaved);
      
      if (prevSaved) {
        const { error } = await supabase.from('Save').delete().eq('userId', userProfile.id).eq('postId', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('Save').insert({
          id: generateUUID(),
          userId: userProfile.id,
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
    if (!userProfile?.id || !postAuthorId) { 
      setModalConfig({ visible: true, title: 'Login Required', message: 'Please login to follow creators', isError: true }); 
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
    if (!userProfile?.id) { setModalConfig({ visible: true, title: 'Login Required', message: 'Please login to vote on comments', isError: true }); return; }
    try {
      await AppApi.voteComment(commentId, type);
      fetchComments(); // Instead of building optimistic map, we just wait for real-time or refetch
    } catch (e: any) {
      console.warn('Comment vote failed', e);
    }
  };

  const submitComment = async () => {
    if (!newComment.trim()) return;
    if (!userProfile?.id) { setModalConfig({ visible: true, title: 'Login Required', message: 'Please login to comment', isError: true }); return; }
    
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
        userId: userProfile.id,
        parentId: replyingToId,
        createdAt: new Date().toISOString(),
        User: {
          id: userProfile.id,
          username: userProfile.username,
          avatarUrl: userProfile.avatarUrl
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
          userId: userProfile.id,
          content: commentContent,
          parentId: replyingToId,
          createdAt: now,
          updatedAt: now,
        });
        
      if (error) throw error;
      createNotification('COMMENT', 'New Comment', `${userProfile.username || 'Someone'} commented on your post`);
      
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

      let posts: any[] = [];

      // Fetch by same category
      if (currentCategory) {
        const { data: catPosts } = await supabase
          .from('Post')
          .select('id, title, thumbnail, category, createdAt, authorId, author:User!authorId(username, avatarUrl)')
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
          .select('id, title, thumbnail, category, createdAt, authorId, author:User!authorId(username, avatarUrl)')
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
          .select('id, title, thumbnail, category, createdAt, authorId, author:User!authorId(username, avatarUrl)')
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
  const onShare = useCallback(async () => {
    try {
      const shareTitle = selectedArticle?.title || 'Check this out';
      await Share.share({
        message: `${shareTitle}\n\nRead more on Jan Samvad:\nhttps://ohmyhindustan.com/post/${id}\n\nDownload the app: ${APP_DOWNLOAD_URL}`,
      });
    } catch (e) {}
  }, [selectedArticle?.title, id]);

  // Memoize HTML styles to prevent re-renders
  const htmlTagsStyles = React.useMemo(() => ({
    body: {
      color: colors.DarkText,
      fontSize: 16,
      lineHeight: 24,
    },
    p: {
      color: colors.DarkText,
      fontSize: 16,
      lineHeight: 28,
      marginBottom: 20,
    },
    b: { fontWeight: 'bold' as const },
    strong: { fontWeight: 'bold' as const },
    i: { fontStyle: 'italic' as const },
    em: { fontStyle: 'italic' as const },
    u: { textDecorationLine: 'underline' as const },
    blockquote: {
      borderLeftWidth: 4,
      borderLeftColor: '#e5e7eb',
      backgroundColor: '#f9fafb',
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontStyle: 'italic' as const,
      marginVertical: 16,
      borderRadius: 4,
    },
    ul: { marginVertical: 12, paddingLeft: 10 },
    ol: { marginVertical: 12, paddingLeft: 10 },
    li: { marginBottom: 8 }
  }), [colors.DarkText]); // Only depend on the specific color used

  const renderers = React.useMemo(() => ({
    font: (props: any) => {
      const { tnode } = props;
      const attributes = tnode.attributes;
      const fontSizeMap: Record<string, number> = {
        '1': 10, '2': 13, '3': 16, '4': 18, '5': 24, '6': 32, '7': 48
      };
      
      const customStyle: any = {
        flexDirection: 'row',
        flexWrap: 'wrap',
      };
      
      if (attributes.size && fontSizeMap[attributes.size]) {
        customStyle.fontSize = fontSizeMap[attributes.size];
        customStyle.lineHeight = fontSizeMap[attributes.size] * 1.4;
      }
      if (attributes.color) {
        customStyle.color = attributes.color;
      }
      if (attributes.face) {
        if (attributes.face.includes('Georgia')) customStyle.fontFamily = Platform.OS === 'ios' ? 'Georgia' : 'serif';
        else if (attributes.face.includes('Courier')) customStyle.fontFamily = Platform.OS === 'ios' ? 'Courier' : 'monospace';
        else if (attributes.face.includes('Times')) customStyle.fontFamily = Platform.OS === 'ios' ? 'Times New Roman' : 'serif';
        else if (attributes.face.includes('Arial')) customStyle.fontFamily = Platform.OS === 'ios' ? 'Arial' : 'sans-serif';
      }

      return (
        <Text style={customStyle}>
          {props.children}
        </Text>
      );
    }
  }), []); 

  const baseStyle = React.useMemo(() => ({
    color: colors.DarkText,
    fontSize: 16
  }), [colors.DarkText]);

  // Early returns — AFTER all hooks
  if (isLoading && !selectedArticle) {
    return <View style={styles.center}><ActivityIndicator size="large" color={colors.PrimaryRed} /></View>;
  }
  if (!selectedArticle) {
    return <View style={styles.center}><Text>Content not found</Text></View>;
  }

  const { title, category, authorName, authorImage, subtitle, thumbnail, type, content, excerpt, quote } = selectedArticle;
  const isFollowing = postAuthorId ? !!follows[postAuthorId] : false;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8 }}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity onPress={onShare} style={{ padding: 8 }}>
             <Ionicons name="share-social-outline" size={24} color="black" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSave} style={{ padding: 8 }}>
             <Ionicons name={isSaved ? "bookmark" : "bookmark-outline"} size={24} color={isSaved ? colors.PrimaryRed : "black"} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView ref={scrollViewRef} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={{ padding: 24 }}>
          <View style={styles.categoryPill}>
            <Text style={styles.categoryText}>{category || 'POLICY ANALYSIS'}</Text>
          </View>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.authorRow}>
            <Image source={{ uri: authorImage || `https://ui-avatars.com/api/?name=C&background=E53935&color=fff` }} style={styles.authorImage} />
            <TouchableOpacity style={{ flex: 1, marginLeft: 12 }} onPress={() => navigation.navigate('CreatorProfile', { authorId: postAuthorId, authorName })}>
              <Text style={styles.authorName}>{authorName || 'Anonymous'}</Text>
              <Text style={styles.authorSubtitle}>{subtitle || 'Oh My Hindustan'}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.followBtn, isFollowing && { backgroundColor: '#F1F5F9' }]}
              onPress={handleFollow}
            >
              <Text style={[styles.followBtnText, isFollowing && { color: 'black' }]}>
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Ad Placement 1: Between creator profile and image */}
        <AdBanner />

        {thumbnail && (
          <View style={{ width: '100%', aspectRatio: 16/9 }}>
            {type === FeedItemType.VIDEO && selectedArticle.videoUrl ? (
            <View style={{ flex: 1, backgroundColor: 'black', height: 250 }}>
              <WebView
                source={{ uri: selectedArticle.videoUrl }}
                style={{ flex: 1 }}
                allowsFullscreenVideo={true}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                originWhitelist={['*']}
              />
            </View>            ) : (
              <>
                <Image source={{ uri: thumbnail }} style={{ flex: 1 }} />
                {type === FeedItemType.VIDEO && (
                  <View style={styles.playOverlay}>
                    <View style={styles.playButton}>
                      <Ionicons name="play" size={24} color={colors.PrimaryRed} style={{ marginLeft: 4 }} />
                    </View>
                  </View>
                )}
              </>
            )}
          </View>
        )}

        <View style={{ padding: 24, minHeight: 100 }}>
          <RenderHtml
            contentWidth={width - 48}
            source={{ html: selectedArticle.content || selectedArticle.excerpt || "" }}
            tagsStyles={htmlTagsStyles}
            renderers={renderers}
            customHTMLElementModels={customHTMLElementModels}
            baseStyle={baseStyle}
            enableExperimentalBRCollapsing={true}
            enableExperimentalGhostLinesPrevention={true}
          />
        </View>

        {/* Ad Placement 2: Above Related Posts */}
        <AdBanner />

        {/* Related Posts Section */}
        {relatedPosts.length > 0 && (
          <View style={styles.relatedSection}>
            <Text style={styles.relatedTitle}>Related Posts</Text>
            <View style={styles.relatedGrid}>
              {relatedPosts.map((post) => {
                const authorObj = Array.isArray(post.author) ? post.author[0] : post.author;
                const postAuthorName = authorObj?.username || 'Creator';
                const timeAgo = (() => {
                  try {
                    const diff = Date.now() - new Date(post.createdAt).getTime();
                    const mins = Math.floor(diff / 60000);
                    if (mins < 60) return `${mins}m ago`;
                    const hrs = Math.floor(mins / 60);
                    if (hrs < 24) return `${hrs}h ago`;
                    return `${Math.floor(hrs / 24)}d ago`;
                  } catch { return ''; }
                })();

                return (
                  <TouchableOpacity
                    key={post.id}
                    style={styles.relatedCard}
                    activeOpacity={0.8}
                    onPress={() => navigation.push('ArticleDetail', { id: post.id })}
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
      </ScrollView>

      {/* Floating Action Bar */}
      <View style={styles.fabContainer}>
        <View style={styles.fab}>
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
          
          <View style={styles.divider} />

          <View style={styles.commentControl}>
            <Ionicons name="eye-outline" size={20} color="gray" />
            <Text style={{ marginLeft: 6, fontWeight: 'bold', color: 'gray' }}>{formatVoteCount(viewCount)}</Text>
          </View>
          
          <View style={styles.divider} />
          
          <TouchableOpacity style={styles.commentControl} onPress={openCommentSheet}>
            <Ionicons name="chatbubble-outline" size={20} color="gray" />
            <Text style={{ marginLeft: 8, fontWeight: 'bold', color: 'gray' }}>{commentsCount}</Text>
          </TouchableOpacity>
          
          <View style={styles.divider} />
          
          <TouchableOpacity style={styles.shareCircle} onPress={onShare}>
            <Ionicons name="share-social" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Comments Modal */}
      <Modal visible={showComments} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <TouchableOpacity style={[styles.modalOverlay, keyboardOffset > 0 && { paddingBottom: keyboardOffset }]} activeOpacity={1} onPress={() => setShowComments(false)}>
            <View style={styles.commentsSheet} onStartShouldSetResponder={() => true}>
              <View style={styles.sheetHandle} />
              <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 16 }}>Comments ({commentsCount})</Text>
              
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
                          source={{ uri: c.User?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.User?.username || 'U')}&background=E53935&color=fff` }}
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
                            <Image source={{ uri: selectedArticle?.authorImage || `https://ui-avatars.com/api/?name=C&background=E53935&color=fff` }} style={{ width: 12, height: 12, borderRadius: 6, position: 'absolute', bottom: -2, right: -4, borderWidth: 1, borderColor: 'white' }} />
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
                <TextInput
                  style={styles.commentInput}
                  placeholder="Write a comment..."
                  value={newComment}
                  onChangeText={setNewComment}
                  multiline
                />
                <TouchableOpacity onPress={submitComment} style={styles.sendBtn}>
                  <Ionicons name="send" size={20} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>

      <CustomModal 
        visible={modalConfig.visible} 
        title={modalConfig.title} 
        message={modalConfig.message} 
        isError={modalConfig.isError} 
        onPrimaryPress={() => setModalConfig(prev => ({ ...prev, visible: false }))} 
      />
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
    width: (SCREEN_WIDTH - 48) / 2,
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
  relatedThumbnail: { width: '100%', height: 100, backgroundColor: '#F1F5F9' },
  relatedCardContent: { padding: 10 },
  relatedCategoryPill: { backgroundColor: colors.PrimaryRedAlpha10, alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginBottom: 6 },
  relatedCategoryText: { color: colors.PrimaryRed, fontSize: 9, fontWeight: 'bold' },
  relatedPostTitle: { fontSize: 13, fontWeight: '700', color: colors.DarkText, lineHeight: 18 },
  relatedMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  relatedAuthor: { fontSize: 11, color: colors.Slate500, flex: 1 },
  relatedTime: { fontSize: 10, color: colors.Slate400 },
});
