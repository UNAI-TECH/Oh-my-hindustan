import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Share, ActivityIndicator, Platform, Modal, TextInput, FlatList, KeyboardAvoidingView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Colors } from '../../theme/Theme';
import { Ionicons } from '@expo/vector-icons';
import { useFeed } from '../../context/FeedContext';
import { FeedItemType } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { generateUUID } from '../../utils/uuid';
import RenderHtml from 'react-native-render-html';
import { useWindowDimensions } from 'react-native';
import { WebView } from 'react-native-webview';

const formatVoteCount = (n: number): string => {
  if (n >= 10000) {
    const k = n / 1000;
    return k % 1 === 0 ? `${k}K` : `${k.toFixed(1)}K`;
  }
  return n.toString();
};

export default function ArticleDetailScreen() {
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
  const [isReposted, setIsReposted] = useState(false);
  const [repostCount, setRepostCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [commentsCount, setCommentsCount] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [postAuthorId, setPostAuthorId] = useState<string | null>(null);
  
  useEffect(() => {
    if (id) fetchArticle(id);
  }, [id]);

  // Fetch real vote/comment counts and user's existing interactions
  useEffect(() => {
    if (!id) return;
    const fetchInteractions = async () => {
      try {
        // Upvotes
        const { count: upCount } = await supabase.from('Vote').select('id', { count: 'exact', head: true }).eq('postId', id).eq('type', 1);
        // Downvotes
        const { count: downCount } = await supabase.from('Vote').select('id', { count: 'exact', head: true }).eq('postId', id).eq('type', -1);
        // Comments count (excluding reposts)
        const { count: cCount } = await supabase.from('Comment').select('id', { count: 'exact', head: true }).eq('postId', id).neq('content', '[SYSTEM_REPOST]');
        // Repost count
        const { count: rCount } = await supabase.from('Comment').select('id', { count: 'exact', head: true }).eq('postId', id).eq('content', '[SYSTEM_REPOST]');
        // Get post author
        const { data: postData } = await supabase.from('Post').select('authorId').eq('id', id).single();
        if (postData?.authorId) setPostAuthorId(postData.authorId);

        setUpvotes(upCount || 0);
        setDownvotes(downCount || 0);
        setCommentsCount(cCount || 0);
        setRepostCount(rCount || 0);

        // User-specific interactions (if logged in)
        if (userProfile?.id) {
          const { data: myVoteData } = await supabase.from('Vote').select('type').eq('postId', id).eq('userId', userProfile.id).maybeSingle();
          const { data: savedData } = await supabase.from('Save').select('id').eq('postId', id).eq('userId', userProfile.id).maybeSingle();
          const { data: repostData } = await supabase.from('Comment').select('id').eq('postId', id).eq('userId', userProfile.id).eq('content', '[SYSTEM_REPOST]').maybeSingle();
          setMyVote(myVoteData?.type || 0);
          setIsSaved(!!savedData);
          setIsReposted(!!repostData);
          
          if (postData?.authorId) {
            const { data: followData } = await supabase.from('Follow').select('id').eq('followerId', userProfile.id).eq('followingId', postData.authorId).maybeSingle();
            setIsFollowing(!!followData);
          }
        }
      } catch (e: any) {
        console.warn('Fetch interactions error:', e?.message);
      }
    };
    fetchInteractions();
  }, [id, userProfile?.id]);

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
    if (!userProfile?.id) { Alert.alert('Login Required', 'Please login to vote'); return; }
    try {
      if (myVote === voteType) {
        // Toggle off — remove vote
        const { error } = await supabase.from('Vote').delete().eq('postId', id).eq('userId', userProfile.id);
        if (error) throw error;
        if (voteType === 1) setUpvotes(v => Math.max(0, v - 1));
        else setDownvotes(v => Math.max(0, v - 1));
        setMyVote(0);
      } else {
        // Check if existing vote
        const { data: existing } = await supabase.from('Vote').select('id').eq('userId', userProfile.id).eq('postId', id).maybeSingle();
        
        if (existing) {
          // Update existing vote
          const { error } = await supabase.from('Vote').update({ type: voteType }).eq('id', existing.id);
          if (error) throw error;
        } else {
          // Insert new vote
          const { error } = await supabase.from('Vote').insert({
            id: generateUUID(),
            postId: id,
            userId: userProfile.id,
            type: voteType,
          });
          if (error) throw error;
        }
        
        // Update local state
        if (myVote === 1) setUpvotes(v => Math.max(0, v - 1));
        else if (myVote === -1) setDownvotes(v => Math.max(0, v - 1));
        if (voteType === 1) { setUpvotes(v => v + 1); createNotification('LIKE', 'New Like', `${userProfile.username || 'Someone'} liked your post`); }
        else setDownvotes(v => v + 1);
        setMyVote(voteType);
      }
    } catch (e: any) {
      Alert.alert('Vote Failed', e?.message || 'Could not register vote');
    }
  };

  const handleSave = async () => {
    if (!userProfile?.id) { Alert.alert('Login Required', 'Please login to save posts'); return; }
    try {
      if (isSaved) {
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
      setIsSaved(!isSaved);
    } catch (e: any) {
      Alert.alert('Save Failed', e?.message || 'Could not save post');
    }
  };

  const handleRepost = async () => {
    if (!userProfile?.id) { Alert.alert('Login Required', 'Please login to repost'); return; }
    try {
      if (isReposted) {
        const { error } = await supabase.from('Comment').delete().eq('userId', userProfile.id).eq('postId', id).eq('content', '[SYSTEM_REPOST]');
        if (error) throw error;
      } else {
        const now = new Date().toISOString();
        const { error } = await supabase.from('Comment').insert({
          id: generateUUID(),
          userId: userProfile.id,
          postId: id,
          content: '[SYSTEM_REPOST]',
          createdAt: now,
          updatedAt: now,
        });
        if (error) throw error;
        createNotification('REPOST', 'New Repost', `${userProfile.username || 'Someone'} reposted your content`);
      }
      setIsReposted(!isReposted);
      if (!isReposted) setRepostCount(c => c + 1);
      else setRepostCount(c => Math.max(0, c - 1));
    } catch (e: any) {
      Alert.alert('Repost Failed', e?.message || 'Could not repost');
    }
  };

  const handleFollow = async () => {
    if (!userProfile?.id || !postAuthorId) { Alert.alert('Login Required', 'Please login to follow creators'); return; }
    try {
      if (isFollowing) {
        const { error } = await supabase.from('Follow').delete().eq('followerId', userProfile.id).eq('followingId', postAuthorId);
        if (error) throw error;
        setIsFollowing(false);
      } else {
        const { error } = await supabase.from('Follow').insert({
          id: generateUUID(),
          followerId: userProfile.id,
          followingId: postAuthorId,
        });
        if (error) throw error;
        setIsFollowing(true);
        createNotification('FOLLOW', 'New Follower', `${userProfile.username || 'Someone'} started following you`);
      }
    } catch (e: any) {
      Alert.alert('Follow Failed', e?.message || 'Could not follow creator');
    }
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

  const openCommentSheet = () => {
    setShowComments(true);
    fetchComments();
  };

  const submitComment = async () => {
    if (!newComment.trim()) return;
    if (!userProfile?.id) { Alert.alert('Login Required', 'Please login to comment'); return; }
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('Comment')
        .insert({
          id: generateUUID(),
          postId: id,
          userId: userProfile.id,
          content: newComment.trim(),
          createdAt: now,
          updatedAt: now,
        });
      if (error) throw error;
      setNewComment('');
      setCommentsCount(c => c + 1);
      createNotification('COMMENT', 'New Comment', `${userProfile.username || 'Someone'} commented on your post`);
      fetchComments();
    } catch (e: any) {
      Alert.alert('Comment Failed', e?.message || 'Could not post comment');
    }
  };

  if (isLoading && !selectedArticle) {
    return <View style={styles.center}><ActivityIndicator size="large" color={Colors.PrimaryRed} /></View>;
  }
  if (!selectedArticle) {
    return <View style={styles.center}><Text>Content not found</Text></View>;
  }

  const { title, category, authorName, authorImage, subtitle, thumbnail, type, content, excerpt, quote } = selectedArticle;
  const onShare = async () => { try { await Share.share({ message: `${title}\n\nRead more at Oh My Hindustan` }); } catch (e) {} };
  const netVotes = upvotes - downvotes;

  const htmlTagsStyles = {
    p: {
      color: Colors.DarkText,
      fontSize: 16,
      lineHeight: 28,
      marginBottom: 24,
    },
    b: { fontWeight: 'bold' as const },
    strong: { fontWeight: 'bold' as const },
    i: { fontStyle: 'italic' as const },
    em: { fontStyle: 'italic' as const },
    u: { textDecorationLine: 'underline' as const },
    blockquote: {
      borderLeftWidth: 4,
      borderLeftColor: Colors.PrimaryRed,
      backgroundColor: Colors.PrimaryRedAlpha5,
      padding: 16,
      fontStyle: 'italic' as const,
      marginVertical: 16,
    },
    ul: { marginVertical: 16 },
    ol: { marginVertical: 16 },
  };

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
             <Ionicons name={isSaved ? "bookmark" : "bookmark-outline"} size={24} color={isSaved ? Colors.PrimaryRed : "black"} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
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

        {thumbnail && (
          <View style={{ width: '100%', aspectRatio: 16/9 }}>
            {type === FeedItemType.VIDEO && selectedArticle.videoUrl ? (
            <View style={{ flex: 1, backgroundColor: 'black', borderBottomLeftRadius: 24, borderBottomRightRadius: 24, height: 250 }}>
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
                <Image source={{ uri: thumbnail }} style={{ flex: 1, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }} />
                {type === FeedItemType.VIDEO && (
                  <View style={styles.playOverlay}>
                    <View style={styles.playButton}>
                      <Ionicons name="play" size={24} color={Colors.PrimaryRed} style={{ marginLeft: 4 }} />
                    </View>
                  </View>
                )}
              </>
            )}
          </View>
        )}

        <View style={{ padding: 24 }}>
          <RenderHtml
            contentWidth={width - 48}
            source={{ html: selectedArticle.content || selectedArticle.excerpt || "Content not available." }}
            tagsStyles={htmlTagsStyles}
          />
        </View>
      </ScrollView>

      {/* Floating Action Bar */}
      <View style={styles.fabContainer}>
        <View style={styles.fab}>
          <View style={styles.voteControls}>
            <TouchableOpacity onPress={() => handleVote(1)}>
              <Ionicons name="arrow-up" size={20} color={myVote === 1 ? Colors.PrimaryRed : Colors.Slate500} />
            </TouchableOpacity>
            <Text style={{ fontWeight: 'bold', marginHorizontal: 8, color: netVotes > 0 ? Colors.PrimaryRed : Colors.Slate500 }}>
              {formatVoteCount(Math.max(0, netVotes))}
            </Text>
            <TouchableOpacity onPress={() => handleVote(-1)}>
              <Ionicons name="arrow-down" size={20} color={myVote === -1 ? '#3B82F6' : Colors.Slate500} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.divider} />

          <TouchableOpacity style={styles.commentControl} onPress={handleRepost}>
            <Ionicons name="repeat" size={20} color={isReposted ? Colors.PrimaryRed : "gray"} />
            <Text style={{ marginLeft: 6, fontWeight: 'bold', color: isReposted ? Colors.PrimaryRed : 'gray' }}>{repostCount}</Text>
          </TouchableOpacity>
          
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
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowComments(false)}>
            <View style={styles.commentsSheet} onStartShouldSetResponder={() => true}>
              <View style={styles.sheetHandle} />
              <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 16 }}>Comments ({commentsCount})</Text>
              
              {loadingComments ? (
                <ActivityIndicator size="small" color={Colors.PrimaryRed} style={{ marginVertical: 32 }} />
              ) : comments.length === 0 ? (
                <Text style={{ color: Colors.Slate400, textAlign: 'center', marginVertical: 32 }}>No comments yet. Be the first!</Text>
              ) : (
                <FlatList
                  data={comments}
                  keyExtractor={(item, index) => `${item.id}-${index}`}
                  style={{ maxHeight: 300 }}
                  renderItem={({ item }) => (
                    <View style={styles.commentItem}>
                      <Image
                        source={{ uri: item.User?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.User?.username || 'U')}&background=E53935&color=fff` }}
                        style={styles.commentAvatar}
                      />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={{ fontWeight: 'bold', fontSize: 13 }}>@{item.User?.username || 'User'}</Text>
                        <Text style={{ fontSize: 14, color: Colors.DarkText, marginTop: 2 }}>{item.content}</Text>
                        <Text style={{ fontSize: 11, color: Colors.Slate400, marginTop: 4 }}>
                          {new Date(item.createdAt).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                  )}
                />
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.SurfaceWhite, paddingTop: Platform.OS === 'android' ? 24 : 0 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 8, paddingVertical: 4 },
  categoryPill: { backgroundColor: Colors.PrimaryRedAlpha10, alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 8, marginBottom: 20 },
  categoryText: { color: Colors.PrimaryRed, fontWeight: 'bold', fontSize: 12 },
  title: { fontSize: 28, fontWeight: '900', lineHeight: 36, color: Colors.DarkText, marginBottom: 32 },
  authorRow: { flexDirection: 'row', alignItems: 'center' },
  authorImage: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: 'white' },
  authorName: { fontWeight: 'bold', fontSize: 14 },
  authorSubtitle: { fontSize: 12, color: 'gray', marginTop: 2 },
  followBtn: { backgroundColor: Colors.PrimaryRed, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20 },
  followBtnText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  playOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  playButton: { backgroundColor: 'rgba(255,255,255,0.9)', width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
  paragraph: { fontSize: 16, lineHeight: 28, color: Colors.DarkText, marginBottom: 24 },
  quoteBox: { flexDirection: 'row', backgroundColor: Colors.PrimaryRedAlpha5, borderRadius: 8, overflow: 'hidden', marginBottom: 24 },
  quoteAccent: { width: 4, backgroundColor: Colors.PrimaryRed },
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
  shareCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.PrimaryRed, justifyContent: 'center', alignItems: 'center' },
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
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.PrimaryRed, justifyContent: 'center', alignItems: 'center' },
});
