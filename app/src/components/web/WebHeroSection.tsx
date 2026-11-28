import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { FeedItem } from '../../types';
import { estimateReadTime, stripHtml, localizeCategoryName } from './webPortalHelpers';
import { useTranslation } from 'react-i18next';
import { useSiteLanguage } from '../../context/SiteLanguageContext';

interface WebHeroSectionProps {
  editorsPicks: FeedItem[];
  mainNews: FeedItem | null;
  trendingNow: FeedItem[];
  onPressItem: (item: FeedItem) => void;
}

const SectionHeading = ({ title }: { title: string }) => (
  <View style={styles.sectionHeadingRow}>
    <View style={styles.sectionDash} />
    <Text style={styles.sectionHeadingText}>{title}</Text>
  </View>
);

export default function WebHeroSection({
  editorsPicks,
  mainNews,
  trendingNow,
  onPressItem,
}: WebHeroSectionProps) {
  const { width } = useWindowDimensions();
  const { t } = useTranslation();
  const { lang } = useSiteLanguage();
  const isDesktop = width >= 1024;
  const isMobile = width < 768;

  const leadPick = editorsPicks[0] || null;
  const secondaryPicks = editorsPicks.slice(1, 3);

  return (
    <View style={[styles.container, isMobile && { paddingHorizontal: 12, marginTop: 16 }]}>
      <View style={[styles.grid, !isDesktop && styles.gridTablet, isMobile && { flexDirection: 'column', gap: 18 }]}>
        {/* Left Column: Editor's Picks */}
        <View style={[styles.sideColumn, !isDesktop && styles.columnTabletHalf, isMobile && styles.columnMobileFull]}>
          <SectionHeading title={t('editorial.editors_picks', "Editor's Picks")} />

          {leadPick ? (
            <TouchableOpacity
              style={styles.pickHeroCard}
              activeOpacity={0.9}
              onPress={() => onPressItem(leadPick)}
            >
              {leadPick.thumbnail ? (
                <Image source={{ uri: leadPick.thumbnail }} style={StyleSheet.absoluteFillObject} />
              ) : (
                <View style={styles.darkWatermarkBox}>
                  <Text style={styles.watermarkText}>Postsapp</Text>
                </View>
              )}
              <LinearGradient
                colors={['rgba(0,0,0,0.12)', 'rgba(0,0,0,0.88)']}
                style={styles.pickHeroOverlay}
              >
                <View style={styles.badgeRow}>
                  <View style={styles.darkReadPill}>
                    <Text style={styles.pillText}>{estimateReadTime(leadPick).toUpperCase()}</Text>
                  </View>
                  <View style={styles.redCategoryPill}>
                    <Text style={styles.pillText}>
                      {localizeCategoryName(leadPick.category || 'NEWS', lang).toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text style={styles.pickHeroTitle} numberOfLines={3}>
                  {leadPick.title}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : null}

          {secondaryPicks.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.pickCompactCard}
              activeOpacity={0.85}
              onPress={() => onPressItem(item)}
            >
              <Text style={styles.pickCompactMeta}>
                <Text style={styles.pickCompactTime}>{estimateReadTime(item).toUpperCase()}  </Text>
                <Text style={styles.pickCompactCat}>{localizeCategoryName(item.category || 'NEWS', lang).toUpperCase()}</Text>
              </Text>
              <Text style={styles.pickCompactTitle} numberOfLines={3}>
                {item.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Center Column: Main News */}
        <View
          style={[
            styles.centerColumn,
            !isDesktop && styles.columnTabletFull,
            isMobile && styles.columnMobileFull,
            !isDesktop && ({ order: -1 } as any),
          ]}
        >
          <SectionHeading title={t('editorial.main_news', 'Main News')} />
          {mainNews ? (
            <TouchableOpacity
              style={[styles.mainNewsCard, isMobile && styles.mainNewsCardMobile]}
              activeOpacity={0.92}
              onPress={() => onPressItem(mainNews)}
            >
              {mainNews.thumbnail ? (
                <Image source={{ uri: mainNews.thumbnail }} style={StyleSheet.absoluteFillObject} />
              ) : (
                <View style={styles.darkWatermarkBox}>
                  <Text style={styles.watermarkText}>Postsapp</Text>
                </View>
              )}
              <LinearGradient
                colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.45)', 'rgba(0,0,0,0.92)']}
                style={[styles.mainNewsOverlay, isMobile && { padding: 16 }]}
              >
                <View style={styles.badgeRow}>
                  <View style={styles.redReadPill}>
                    <Ionicons name="play" size={9} color="#FFFFFF" />
                    <Text style={styles.pillText}>{estimateReadTime(mainNews).toUpperCase()}</Text>
                  </View>
                  <View style={styles.darkCategoryPill}>
                    <Text style={styles.pillText}>
                      {(mainNews.category || 'NEWS').toUpperCase()}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.mainNewsTitle, isMobile && { fontSize: 20, lineHeight: 26 }]} numberOfLines={3}>
                  {mainNews.title}
                </Text>

                {mainNews.excerpt ? (
                  <Text style={[styles.mainNewsExcerpt, isMobile && { fontSize: 12, lineHeight: 17, marginTop: 6 }]} numberOfLines={2}>
                    {stripHtml(mainNews.excerpt)}
                  </Text>
                ) : null}
              </LinearGradient>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Right Column: Trending Now */}
        <View style={[styles.sideColumn, !isDesktop && styles.columnTabletHalf, isMobile && styles.columnMobileFull]}>
          <SectionHeading title={t('editorial.trending_now', 'Trending Now')} />
          <View style={styles.trendingList}>
            {trendingNow.slice(0, 4).map((item, idx) => (
              <TouchableOpacity
                key={item.id}
                style={styles.trendingCard}
                activeOpacity={0.85}
                onPress={() => onPressItem(item)}
              >
                <View style={styles.trendingThumbWrap}>
                  {item.thumbnail ? (
                    <Image source={{ uri: item.thumbnail }} style={styles.trendingThumb} />
                  ) : (
                    <View style={styles.trendingThumbFallback}>
                      <Text style={styles.trendingThumbFallbackText}>News</Text>
                    </View>
                  )}
                  <View style={styles.rankBadge}>
                    <Text style={styles.rankBadgeText}>{idx + 1}</Text>
                  </View>
                </View>

                <View style={styles.trendingBody}>
                  <Text style={styles.trendingCategory} numberOfLines={1}>
                    {localizeCategoryName(item.category || 'NEWS', lang).toUpperCase()}
                  </Text>
                  <Text style={styles.trendingTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
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
    marginTop: 24,
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
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
  grid: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 20,
  },
  gridTablet: {
    flexWrap: 'wrap',
  },
  sideColumn: {
    flex: 1,
    minWidth: 240,
  },
  centerColumn: {
    flex: 2,
    minWidth: 360,
  },
  columnTabletHalf: {
    flexBasis: '48%',
    flexGrow: 1,
  },
  columnTabletFull: {
    flexBasis: '100%',
    minWidth: 0,
  },
  columnMobileFull: {
    flexBasis: 'auto',
    width: '100%',
    minWidth: 0,
    flex: 0,
    flexGrow: 0,
  },
  pickHeroCard: {
    height: 208,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#171717',
    marginBottom: 12,
    position: 'relative',
  },
  darkWatermarkBox: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#18181B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  watermarkText: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 32,
    fontWeight: '600',
  },
  pickHeroOverlay: {
    flex: 1,
    padding: 14,
    justifyContent: 'flex-end',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  darkReadPill: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 3,
  },
  redCategoryPill: {
    backgroundColor: '#D4191F',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 3,
  },
  redReadPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#D4191F',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 3,
  },
  darkCategoryPill: {
    backgroundColor: 'rgba(20, 20, 20, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 3,
  },
  pillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  pickHeroTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20,
  },
  pickCompactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    marginBottom: 10,
  },
  pickCompactMeta: {
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 6,
  },
  pickCompactTime: {
    color: '#6B7280',
  },
  pickCompactCat: {
    color: '#D4191F',
  },
  pickCompactTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 18,
  },
  mainNewsCard: {
    flex: 1,
    minHeight: 400,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#171717',
    position: 'relative',
  },
  mainNewsCardMobile: {
    flex: 0,
    minHeight: 220,
    height: 240,
    width: '100%',
  },
  mainNewsOverlay: {
    flex: 1,
    padding: 24,
    justifyContent: 'flex-end',
  },
  mainNewsTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 34,
  },
  mainNewsExcerpt: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 10,
  },
  trendingList: {
    gap: 10,
  },
  trendingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 10,
  },
  trendingThumbWrap: {
    width: 78,
    height: 62,
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#18181B',
  },
  trendingThumb: {
    width: '100%',
    height: '100%',
  },
  trendingThumbFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#18181B',
  },
  trendingThumbFallbackText: {
    color: '#E5E7EB',
    fontSize: 13,
    fontWeight: '600',
  },
  rankBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 20,
    height: 20,
    backgroundColor: '#D4191F',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: 4,
  },
  rankBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  trendingBody: {
    flex: 1,
  },
  trendingCategory: {
    color: '#D4191F',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  trendingTitle: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 17,
  },
});
