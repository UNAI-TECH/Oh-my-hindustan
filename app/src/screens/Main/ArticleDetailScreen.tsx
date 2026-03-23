import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Share, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Colors } from '../../theme/Theme';
import { Ionicons } from '@expo/vector-icons';
import { useFeed } from '../../context/FeedContext';
import { FeedItemType } from '../../types';

export default function ArticleDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { id } = route.params || {};
  
  const { selectedArticle, isLoading, fetchArticle } = useFeed();
  const [votes, setVotes] = useState<number>(0);
  const [isSaved, setIsSaved] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [commentsCount, setCommentsCount] = useState<number>(0);
  
  useEffect(() => {
    if (id) fetchArticle(id);
  }, [id]);

  useEffect(() => {
    if (selectedArticle) {
      const v = parseFloat(selectedArticle.votes?.replace('k', '') || '0');
      setVotes(v);
      setCommentsCount(Number(selectedArticle.comments) || 0);
    }
  }, [selectedArticle]);

  if (isLoading && !selectedArticle) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.PrimaryRed} />
      </View>
    );
  }

  if (!selectedArticle) {
    return (
      <View style={styles.center}>
        <Text>Content not found</Text>
      </View>
    );
  }

  const { title, category, authorName, authorImage, subtitle, thumbnail, type, content, excerpt, comments, quote } = selectedArticle;

  const onShare = async () => {
    try {
      await Share.share({ message: `${title}\n\nRead more at Viewer App` });
    } catch (e) {}
  };

  const paragraphs = (content || excerpt || "Content not available.").split('\n\n');

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
          <TouchableOpacity onPress={() => setIsSaved(!isSaved)} style={{ padding: 8 }}>
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
            <Image source={{ uri: authorImage }} style={styles.authorImage} />
            <TouchableOpacity style={{ flex: 1, marginLeft: 12 }} onPress={() => navigation.navigate('CreatorProfile', { id: 'amit_sharma' })}>
              <Text style={styles.authorName}>{authorName || 'Anonymous'}</Text>
              <Text style={styles.authorSubtitle}>{subtitle || 'Political Analyst • 2 hours ago'}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.followBtn, isFollowing && { backgroundColor: '#F1F5F9' }]}
              onPress={() => setIsFollowing(!isFollowing)}
            >
              <Text style={[styles.followBtnText, isFollowing && { color: 'black' }]}>
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ width: '100%', aspectRatio: 16/9 }}>
          <Image source={{ uri: thumbnail }} style={{ flex: 1, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }} />
          {type === FeedItemType.VIDEO && (
            <View style={styles.playOverlay}>
              <View style={styles.playButton}>
                <Ionicons name="play" size={24} color={Colors.PrimaryRed} style={{ marginLeft: 4 }} />
              </View>
            </View>
          )}
        </View>

        <View style={{ padding: 24 }}>
          {paragraphs.map((p, index) => (
            <React.Fragment key={index}>
              <Text style={styles.paragraph}>{p}</Text>
              {index === 0 && quote && (
                <View style={styles.quoteBox}>
                  <View style={styles.quoteAccent} />
                  <Text style={styles.quoteText}>"{quote}"</Text>
                </View>
              )}
            </React.Fragment>
          ))}
        </View>
      </ScrollView>

      {/* Floating Action Bar */}
      <View style={styles.fabContainer}>
        <View style={styles.fab}>
          <View style={styles.voteControls}>
            <TouchableOpacity onPress={() => setVotes(v => v + 0.1)}><Ionicons name="arrow-up" size={20} color={Colors.Slate500} /></TouchableOpacity>
            <Text style={{ fontWeight: 'bold', marginHorizontal: 8 }}>{votes.toFixed(1)}k</Text>
            <TouchableOpacity onPress={() => setVotes(v => Math.max(0, v - 0.1))}><Ionicons name="arrow-down" size={20} color={Colors.Slate500} /></TouchableOpacity>
          </View>
          
          <View style={styles.divider} />
          
          <TouchableOpacity style={styles.commentControl} onPress={() => setCommentsCount(c => c + 1)}>
            <Ionicons name="chatbubble-outline" size={20} color="gray" />
            <Text style={{ marginLeft: 8, fontWeight: 'bold', color: 'gray' }}>{commentsCount}</Text>
          </TouchableOpacity>
          
          <View style={styles.divider} />
          
          <TouchableOpacity style={styles.shareCircle} onPress={onShare}>
            <Ionicons name="share-social" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>
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
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(255,255,255,0.95)', 
    borderRadius: 32, 
    height: 64, 
    width: '95%',
    paddingHorizontal: 16, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.2, 
    shadowRadius: 8, 
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  voteControls: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 24, paddingHorizontal: 12, paddingVertical: 8 },
  divider: { width: 1, height: 24, backgroundColor: '#E2E8F0', marginHorizontal: 12 },
  commentControl: { flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'center' },
  shareCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.PrimaryRed, justifyContent: 'center', alignItems: 'center' }
});
