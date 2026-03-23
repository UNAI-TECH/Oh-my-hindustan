import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/Theme';
import AppBottomNavBar from '../../components/BottomNavBar';
import { FeedItemType } from '../../types';
import { useFeed } from '../../context/FeedContext';

export default function LibraryScreen() {
  const navigation = useNavigation<any>();
  const { feedItems } = useFeed();
  // In a real app, we'd hook into a global state context or async storage.
  // Using Mock filter logic matching Kotlin code.
  const savedItems = feedItems.slice(0, 3);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Library</Text>
      </View>

      {savedItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="bookmark-outline" size={64} color={Colors.Slate400} style={{ opacity: 0.3 }} />
          <Text style={styles.emptyTitle}>Your library is empty</Text>
          <Text style={styles.emptyDesc}>Saved articles will appear here</Text>
        </View>
      ) : (
        <FlatList
          data={savedItems}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
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

      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
        <AppBottomNavBar currentRoute="Library" onNavigate={(route) => navigation.navigate(route)} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC', paddingTop: Platform.OS === 'android' ? 24 : 0 },
  header: { padding: 16, backgroundColor: 'white', elevation: 2 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.Slate500, marginTop: 16 },
  emptyDesc: { fontSize: 14, color: Colors.Slate400, marginTop: 4 },
  card: { backgroundColor: 'white', borderRadius: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  categoryPill: { backgroundColor: Colors.PrimaryRedAlpha10, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, marginBottom: 8 },
  categoryText: { color: Colors.PrimaryRed, fontSize: 10, fontWeight: 'bold' },
  titleText: { fontWeight: 'bold', fontSize: 16 },
  thumbnail: { width: 80, height: 80, borderRadius: 8, marginLeft: 16 }
});
