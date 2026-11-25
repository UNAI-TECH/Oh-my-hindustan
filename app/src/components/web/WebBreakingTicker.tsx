import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FeedItem } from '../../types';

interface WebBreakingTickerProps {
  items: FeedItem[];
  onPressItem: (item: FeedItem) => void;
}

export default function WebBreakingTicker({ items, onPressItem }: WebBreakingTickerProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (items.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % items.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [items.length]);

  if (!items || items.length === 0) return null;
  const activeItem = items[index % items.length];

  const handlePrev = () => {
    setIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const handleNext = () => {
    setIndex((prev) => (prev + 1) % items.length);
  };

  return (
    <View style={styles.container}>
      <View style={styles.bar}>
        <View style={styles.badge}>
          <View style={styles.badgeDot} />
          <Text style={styles.badgeText}>BREAKING NEWS</Text>
        </View>

        <TouchableOpacity
          style={styles.headlineBtn}
          activeOpacity={0.75}
          onPress={() => onPressItem(activeItem)}
        >
          {activeItem.thumbnail ? (
            <Image source={{ uri: activeItem.thumbnail }} style={styles.thumb} />
          ) : (
            <View style={styles.thumbFallback}>
              <Ionicons name="newspaper-outline" size={14} color="#9CA3AF" />
            </View>
          )}
          <Text style={styles.headlineText} numberOfLines={1}>
            {activeItem.title}
          </Text>
        </TouchableOpacity>

        <View style={styles.controls}>
          <TouchableOpacity style={styles.arrowBtn} onPress={handlePrev} accessibilityLabel="Previous breaking news">
            <Ionicons name="chevron-back" size={14} color="#4B5563" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.arrowBtn} onPress={handleNext} accessibilityLabel="Next breaking news">
            <Ionicons name="chevron-forward" size={14} color="#4B5563" />
          </TouchableOpacity>
        </View>
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
    marginTop: 18,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    height: 44,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#D4191F',
    paddingHorizontal: 14,
    height: '100%',
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  headlineBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 10,
  },
  thumb: {
    width: 30,
    height: 22,
    borderRadius: 3,
  },
  thumbFallback: {
    width: 30,
    height: 22,
    borderRadius: 3,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headlineText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
    borderLeftWidth: 1,
    borderLeftColor: '#E5E7EB',
  },
  arrowBtn: {
    width: 34,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#F3F4F6',
  },
});
