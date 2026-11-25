import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FeedItem } from '../../types';
import { estimateReadTime } from './webPortalHelpers';

interface WebFeaturedPostsProps {
  items: FeedItem[];
  onPressItem: (item: FeedItem) => void;
  onPressViewAll: () => void;
}

export default function WebFeaturedPosts({
  items,
  onPressItem,
  onPressViewAll,
}: WebFeaturedPostsProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const visibleItems = items.slice(0, 4);

  if (visibleItems.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.sectionHeadingRow}>
          <View style={styles.sectionDash} />
          <Text style={styles.sectionHeadingText}>Featured Posts</Text>
        </View>

        <TouchableOpacity onPress={onPressViewAll}>
          <Text style={styles.viewAllText}>View All Stories →</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.grid}>
        {visibleItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.card,
              isDesktop ? styles.cardDesktop : styles.cardTablet,
            ]}
            activeOpacity={0.88}
            onPress={() => onPressItem(item)}
          >
            <View style={styles.thumbContainer}>
              {item.thumbnail ? (
                <Image source={{ uri: item.thumbnail }} style={styles.thumbImage} />
              ) : (
                <View style={styles.thumbFallback}>
                  <Text style={styles.thumbFallbackText}>Featured</Text>
                </View>
              )}
              <View style={styles.readPill}>
                <Ionicons name="play" size={9} color="#FFFFFF" />
                <Text style={styles.readPillText}>{estimateReadTime(item)}</Text>
              </View>
            </View>

            <View style={styles.cardBody}>
              <Text style={styles.categoryText} numberOfLines={1}>
                {(item.category || 'NEWS').toUpperCase()}
              </Text>
              <Text style={styles.titleText} numberOfLines={2}>
                {item.title}
              </Text>

              <View style={styles.metaFooter}>
                <Text style={styles.authorText} numberOfLines={1}>
                  {item.authorName || 'PostsApp Desk'}
                </Text>
                <Text style={styles.dateText}>{item.timestamp || 'Today'}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    maxWidth: 1280,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 20,
    marginTop: 34,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionDash: {
    width: 14,
    height: 3,
    backgroundColor: '#D4191F',
  },
  sectionHeadingText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  viewAllText: {
    color: '#D4191F',
    fontSize: 12,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 18,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  cardDesktop: {
    flexBasis: '23%',
    flexGrow: 1,
    minWidth: 220,
  },
  cardTablet: {
    flexBasis: '47%',
    flexGrow: 1,
    minWidth: 260,
  },
  thumbContainer: {
    width: '100%',
    aspectRatio: 16 / 10,
    backgroundColor: '#18181B',
    position: 'relative',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  thumbFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#18181B',
  },
  thumbFallbackText: {
    color: '#E5E7EB',
    fontSize: 28,
    fontWeight: '600',
  },
  readPill: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#D4191F',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 3,
  },
  readPillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  cardBody: {
    padding: 14,
  },
  categoryText: {
    color: '#D4191F',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  titleText: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
    minHeight: 40,
  },
  metaFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 8,
  },
  authorText: {
    flex: 1,
    fontSize: 11,
    color: '#4B5563',
    fontWeight: '500',
  },
  dateText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
});
