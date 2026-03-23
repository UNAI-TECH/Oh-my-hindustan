import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Platform, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/Theme';
import { SampleData } from '../../types';

export default function CreatorProfileScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { authorName } = route.params || {};

  const authorPosts = SampleData.baseFeedItems.filter(it => it.authorName === authorName);
  const firstItem = authorPosts[0];

  const [isFollowed, setIsFollowed] = useState(false);
  const [showOptionsSheet, setShowOptionsSheet] = useState(false);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8 }}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Creator</Text>
        <View style={{ flexDirection: 'row' }}>
           <TouchableOpacity style={{ padding: 8 }}>
             <Ionicons name="notifications-outline" size={24} color="black" />
           </TouchableOpacity>
           <TouchableOpacity onPress={() => setShowOptionsSheet(true)} style={{ padding: 8 }}>
             <Ionicons name="ellipsis-vertical" size={24} color="black" />
           </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} bounces={false}>
        <View style={{ width: '100%', paddingBottom: 48 }}>
          <LinearGradient
            colors={[`${Colors.DeepCrimson}CC`, `${Colors.WarmOrange}CC`]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={{ width: '100%', height: 140 }}
          />
          <View style={styles.avatarContainer}>
            <Image 
              source={{ uri: firstItem?.authorImage || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop" }} 
              style={styles.avatar} 
            />
          </View>
        </View>

        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontWeight: 'bold', fontSize: 24 }}>{authorName || 'Unknown Creator'}</Text>
          <Text style={{ color: Colors.Slate500, fontSize: 14, marginTop: 4 }}>Content Creator</Text>
        </View>

        <TouchableOpacity 
          style={[styles.followBtn, isFollowed ? styles.followingBtn : styles.notFollowingBtn]}
          onPress={() => {
            setIsFollowed(!isFollowed);
          }}
        >
          <Text style={{ fontWeight: 'bold', color: isFollowed ? 'black' : 'white' }}>
            {isFollowed ? 'Following' : 'Follow'}
          </Text>
        </TouchableOpacity>

        <Text style={{ paddingHorizontal: 24, fontSize: 20, fontWeight: 'bold', marginTop: 32, marginBottom: 16 }}>Publications</Text>

        <View style={{ paddingHorizontal: 16, gap: 16 }}>
          {authorPosts.length === 0 ? (
            <View style={{ padding: 48, alignItems: 'center' }}><Text style={{ color: Colors.Slate500 }}>No posts yet</Text></View>
          ) : (
            authorPosts.map(item => (
              <ProfilePostCard key={item.id} item={item} onRead={() => navigation.navigate('ArticleDetail', { id: item.id })} />
            ))
          )}
        </View>
      </ScrollView>

      {/* Options Bottom Sheet Mock */}
      {showOptionsSheet && (
        <Modal transparent animationType="slide" visible={showOptionsSheet} onRequestClose={() => setShowOptionsSheet(false)}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowOptionsSheet(false)}>
            <View style={styles.bottomSheet}>
              {["Restrict", "Block", "Report", "Share this profile", "Copy profile URL"].map(opt => (
                <TouchableOpacity key={opt} style={styles.sheetItem} onPress={() => setShowOptionsSheet(false)}>
                  <Text style={{ fontSize: 16, color: opt === 'Report' ? 'red' : 'black' }}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const ProfilePostCard = ({ item, onRead }: any) => {
  const [likes, setLikes] = useState(2500);
  const [liked, setLiked] = useState(false);

  return (
    <View style={styles.postCard}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Image source={{ uri: item.authorImage }} style={{ width: 24, height: 24, borderRadius: 12 }} />
        <Text style={{ fontWeight: 'bold', fontSize: 12, marginLeft: 8 }}>{item.authorName}</Text>
        <Text style={{ fontSize: 12, color: 'gray' }}> • in {item.category || 'Opinion'}</Text>
      </View>
      <Text style={{ fontWeight: 'bold', fontSize: 16, marginTop: 12 }}>{item.title}</Text>
      <Text style={{ fontSize: 12, color: 'gray', marginTop: 8 }} numberOfLines={3}>{item.excerpt || 'Briefing...'}</Text>
      
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16 }}>
        <TouchableOpacity onPress={() => { setLiked(!liked); setLikes(l => liked ? l - 1 : l + 1); }} style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name={liked ? "heart" : "heart-outline"} size={16} color={liked ? Colors.PrimaryRed : 'gray'} />
          <Text style={{ color: liked ? Colors.PrimaryRed : 'gray', marginLeft: 4 }}>{(likes/1000).toFixed(1)}k</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 16 }}>
          <Ionicons name="chatbubble-outline" size={16} color="gray" />
          <Text style={{ color: 'gray', marginLeft: 4 }}>{item.comments}</Text>
        </TouchableOpacity>
        
        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={onRead} style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ color: Colors.PrimaryRed, fontWeight: 'bold', marginRight: 4 }}>Read More</Text>
          <Ionicons name="arrow-forward" size={16} color={Colors.PrimaryRed} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: 'white', paddingTop: Platform.OS === 'android' ? 24 : 0 },
  header: { padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', zIndex: 10 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  avatarContainer: { position: 'absolute', bottom: -12, width: '100%', alignItems: 'center' },
  avatar: { width: 96, height: 96, borderRadius: 48, borderWidth: 4, borderColor: 'white' },
  followBtn: { marginHorizontal: 24, marginTop: 32, height: 48, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  followingBtn: { backgroundColor: '#F1F5F9' },
  notFollowingBtn: { backgroundColor: Colors.PrimaryRed },
  postCard: { padding: 16, backgroundColor: 'white', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  bottomSheet: { backgroundColor: 'white', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, paddingBottom: 32 },
  sheetItem: { paddingVertical: 16 }
});
