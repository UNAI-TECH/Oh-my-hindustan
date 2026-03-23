import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, FlatList, Image, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/Theme';
import { FeedItemType, FeedItem } from '../../types';
import { useFeed } from '../../context/FeedContext';

export default function SearchScreen() {
  const navigation = useNavigation<any>();
  const { feedItems } = useFeed();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const filters = ['All', 'News', 'Blogs', 'Videos'];

  const filteredItems = useMemo(() => {
    return feedItems.filter(item => {
      const q = searchQuery.toLowerCase();
      const matchesQuery = item.title.toLowerCase().includes(q) || 
                           (item.excerpt?.toLowerCase().includes(q)) || 
                           (item.authorName?.toLowerCase().includes(q));
      
      let matchesFilter = true;
      if (selectedFilter === 'News') matchesFilter = item.type === FeedItemType.NEWS;
      if (selectedFilter === 'Blogs') matchesFilter = item.type === FeedItemType.BLOG;
      if (selectedFilter === 'Videos') matchesFilter = item.type === FeedItemType.VIDEO;

      return matchesQuery && matchesFilter && item.type !== FeedItemType.PROMO;
    });
  }, [searchQuery, selectedFilter]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8 }}>
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={Colors.PrimaryRed} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search blogs, news, videos..."
              placeholderTextColor={Colors.Slate400}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                 <Ionicons name="close-circle" size={20} color={Colors.Slate400} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
          {filters.map(filter => (
            <TouchableOpacity 
              key={filter} 
              onPress={() => setSelectedFilter(filter)}
              style={[styles.filterChip, selectedFilter === filter && styles.filterChipActive]}
            >
              <Text style={[styles.filterText, selectedFilter === filter && styles.filterTextActive]}>{filter}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={{ flex: 1, backgroundColor: '#FFF9F2' }}>
        {filteredItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={64} color={Colors.Slate400} style={{ opacity: 0.3 }} />
            <Text style={{ fontSize: 18, color: Colors.Slate500, marginTop: 16, fontWeight: 'bold' }}>No results found</Text>
          </View>
        ) : (
          <FlatList
            data={filteredItems}
            keyExtractor={it => it.id}
            contentContainerStyle={{ padding: 16 }}
            ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
            renderItem={({ item }) => (
               <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('ArticleDetail', { id: item.id })}>
                 <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 16 }}>
                   <View style={{ flex: 1 }}>
                     <View style={styles.categoryPill}>
                       <Text style={styles.categoryText}>{item.category || 'NEWS'}</Text>
                     </View>
                     <Text style={styles.titleText} numberOfLines={3}>{item.title}</Text>
                   </View>
                   {item.thumbnail && (
                     <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
                   )}
                 </View>
               </TouchableOpacity>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: 'white', paddingTop: Platform.OS === 'android' ? 24 : 0 },
  header: { padding: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 12, paddingHorizontal: 12, height: 48, marginLeft: 8 },
  searchInput: { flex: 1, marginHorizontal: 8, fontSize: 16, color: 'black' },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F1F5F9', marginRight: 8 },
  filterChipActive: { backgroundColor: Colors.PrimaryRed },
  filterText: { color: Colors.Slate500, fontSize: 14 },
  filterTextActive: { color: 'white' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: 'white', borderRadius: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  categoryPill: { backgroundColor: Colors.PrimaryRedAlpha10, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, marginBottom: 8 },
  categoryText: { color: Colors.PrimaryRed, fontSize: 10, fontWeight: 'bold' },
  titleText: { fontWeight: 'bold', fontSize: 16 },
  thumbnail: { width: 80, height: 80, borderRadius: 8, marginLeft: 16 }
});
