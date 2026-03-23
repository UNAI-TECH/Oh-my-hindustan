import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../theme/Theme';
import { Ionicons } from '@expo/vector-icons';
import AppBottomNavBar from '../../components/BottomNavBar';
import { useFeed } from '../../context/FeedContext';
import { FeedItemType, FeedItem } from '../../types';

export default function ExploreScreen() {
  const navigation = useNavigation<any>();
  const { feedItems } = useFeed();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('Forum');
  const [selectedCategory, setSelectedCategory] = useState('Politics');

  const categories = ["Politics", "Policy", "Economy", "Digital India", "Viksit Bharat"];
  
  const filteredItems = useMemo(() => {
    return (feedItems || []).filter(item => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q || item.title.toLowerCase().includes(q) || (item.authorName?.toLowerCase().includes(q));
      
      let matchesType = true;
      if (selectedType === 'Forum') matchesType = item.type === FeedItemType.FORUM;
      if (selectedType === 'Policy') matchesType = item.type === FeedItemType.POLICY_TYPE;
      if (selectedType === 'Debates') matchesType = item.type === FeedItemType.DEBATE;
      if (selectedType === 'Updates') matchesType = item.type === FeedItemType.UPDATE;
      
      const matchesCat = item.category?.toLowerCase().includes(selectedCategory.toLowerCase());
      
      return matchesSearch && matchesType && matchesCat;
    });
  }, [searchQuery, selectedType, selectedCategory, feedItems]);

  const topNarratives = useMemo(() => {
    return (feedItems || []).filter(item => item.isTrending).slice(0, 5);
  }, [feedItems]);

  const numColumns = 2;
  const chunkedItems = [];
  for (let i = 0; i < filteredItems.length; i += numColumns) {
    chunkedItems.push(filteredItems.slice(i, i + numColumns));
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TextInput
          placeholder="Search political analysts, news, or debates..."
          placeholderTextColor={Colors.Slate400}
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
        />

        <View style={styles.typeGrid}>
          <TypeButton label="Forum" icon="people" isActive={selectedType === 'Forum'} onClick={() => setSelectedType('Forum')} />
          <TypeButton label="Policy" icon="business" isActive={selectedType === 'Policy'} onClick={() => setSelectedType('Policy')} />
          <TypeButton label="Debates" icon="chatbubbles" isActive={selectedType === 'Debates'} onClick={() => setSelectedType('Debates')} />
          <TypeButton label="Updates" icon="radio" isActive={selectedType === 'Updates'} onClick={() => setSelectedType('Updates')} />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 20 }}>
          {categories.map(cat => (
            <TouchableOpacity 
              key={cat} 
              style={[styles.categoryChip, selectedCategory === cat && styles.categoryChipActive]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[styles.categoryChipText, selectedCategory === cat && styles.categoryChipTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <SectionHeader title="Top Narratives" />
        {topNarratives.length === 0 ? (
          <View style={{ marginBottom: 24, paddingVertical: 20, alignItems: 'center' }}>
            <Text style={{ color: Colors.Slate400 }}>No trending narratives found.</Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24, marginRight: -16 }}>
            {topNarratives.map(item => (
              <TouchableOpacity key={item.id} style={styles.trendingCard} onPress={() => navigation.navigate('ArticleDetail', { id: item.id })}>
                <Image source={{ uri: item.thumbnail || 'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&q=80&w=800' }} style={styles.trendingImg} />
                <View style={styles.trendingCat}><Text style={styles.categoryText}>{item.category || 'NATIONAL'}</Text></View>
                <Text style={styles.trendingTitle} numberOfLines={2}>{item.title}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <SectionHeader title="Selected Feed" />
        
        {filteredItems.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 40 }}><Text style={{ color: Colors.Slate500 }}>No content found for this selection</Text></View>
        ) : selectedType === 'Debates' || selectedType === 'Policy' ? (
          <View style={{ gap: 12 }}>
             {chunkedItems.map((pair, rowIndex) => (
                <View key={rowIndex} style={{ flexDirection: 'row', gap: 12 }}>
                  {pair.map(item => (
                    <TouchableOpacity key={item.id} style={styles.gridCard} onPress={() => navigation.navigate('ArticleDetail', { id: item.id })}>
                       {selectedType === 'Debates' ? (
                         <View style={{ aspectRatio: 9/16, borderRadius: 12, overflow: 'hidden' }}>
                            <Image source={{ uri: item.thumbnail }} style={{ flex: 1 }} />
                            <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.1)' }} />
                            <Text style={{ position: 'absolute', bottom: 8, left: 8, color: 'white', fontWeight: 'bold' }}>{item.votes}</Text>
                         </View>
                       ) : (
                         <View>
                           <Image source={{ uri: item.thumbnail }} style={{ width: '100%', aspectRatio: 1, borderRadius: 12 }} />
                           <Text style={{ fontWeight: 'bold', fontSize: 12, marginTop: 8 }} numberOfLines={2}>{item.title}</Text>
                           <Text style={{ fontSize: 10, color: Colors.Slate400, marginTop: 4 }}>5 min read</Text>
                         </View>
                       )}
                    </TouchableOpacity>
                  ))}
                  {pair.length === 1 && <View style={{ flex: 1 }} />}
                </View>
             ))}
          </View>
        ) : (
          <View>
            {filteredItems.map(item => (
              <TouchableOpacity key={item.id} onPress={() => navigation.navigate('ArticleDetail', { id: item.id })} style={{ marginBottom: 16 }}>
                 <Image source={{ uri: item.thumbnail }} style={{ width: '100%', height: 160, borderRadius: 12, marginBottom: 8 }} />
                 <View style={styles.categoryPill}><Text style={styles.categoryText}>{item.category || ''}</Text></View>
                 <Text style={{ fontWeight: 'bold', fontSize: 16, marginTop: 4 }}>{item.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
        <AppBottomNavBar currentRoute="Explore" onNavigate={(route) => navigation.navigate(route)} />
      </View>
    </SafeAreaView>
  );
}

const TypeButton = ({ label, icon, isActive, onClick }: any) => (
  <TouchableOpacity onPress={onClick} style={{ alignItems: 'center', width: Dimensions.get('window').width / 4 - 24 }}>
    <View style={[{ width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center' }, isActive ? { backgroundColor: Colors.PrimaryRed, elevation: 8 } : { backgroundColor: Colors.PrimaryRedAlpha10 }]}>
      <Ionicons name={icon} size={28} color={isActive ? "white" : Colors.PrimaryRed} />
    </View>
    <Text style={{ marginTop: 8, fontSize: 12, color: isActive ? Colors.PrimaryRed : Colors.Slate400, fontWeight: isActive ? 'bold' : 'normal' }}>{label}</Text>
  </TouchableOpacity>
);

const SectionHeader = ({ title }: { title: string }) => (
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16 }}>
    <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{title}</Text>
    <Text style={{ fontWeight: 'bold', fontSize: 12, color: Colors.PrimaryRed }}>View all</Text>
  </View>
);

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF9F2', paddingTop: Platform.OS === 'android' ? 24 : 0 },
  header: { padding: 16, backgroundColor: '#FFF9F2' },
  searchInput: { height: 56, backgroundColor: Colors.Slate400 + '1A', borderRadius: 12, paddingHorizontal: 16, fontSize: 14, color: Colors.DarkText },
  typeGrid: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  categoryChip: { backgroundColor: Colors.BackgroundLight, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8 },
  categoryChipActive: { backgroundColor: Colors.PrimaryRed },
  categoryChipText: { color: Colors.Slate600, fontSize: 14 },
  categoryChipTextActive: { color: 'white' },
  trendingCard: { width: 280, marginRight: 16 },
  trendingImg: { width: '100%', height: 160, borderRadius: 12, marginBottom: 12 },
  trendingCat: { backgroundColor: Colors.PrimaryRedAlpha10, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginBottom: 4 },
  categoryText: { color: Colors.PrimaryRed, fontSize: 10, fontWeight: 'bold' },
  categoryPill: { backgroundColor: Colors.PrimaryRedAlpha10, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  trendingTitle: { fontWeight: 'bold', fontSize: 16 },
  gridCard: { flex: 1, overflow: 'hidden' }
});
