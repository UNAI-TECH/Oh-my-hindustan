import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FeedItem } from '../../types';
import AdCard, { AdData } from '../AdCard';
import { estimateReadTime, stripHtml, localizeCategoryName } from './webPortalHelpers';
import { useTranslation } from 'react-i18next';
import { useSiteLanguage } from '../../context/SiteLanguageContext';

interface WebExpressPostsProps {
  expressOneItems: FeedItem[];
  expressTwoItems: FeedItem[];
  extraItems: FeedItem[];
  activeAds: AdData[];
  onPressItem: (item: FeedItem) => void;
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
}

const SectionHeading = ({ title }: { title: string }) => (
  <View style={styles.sectionHeadingRow}>
    <View style={styles.sectionDash} />
    <Text style={styles.sectionHeadingText}>{title}</Text>
  </View>
);

const CompactHorizontalCard = ({
  item,
  onPress,
}: {
  item: FeedItem;
  onPress: () => void;
}) => {
  const [hovered, setHovered] = useState(false);
  const { lang } = useSiteLanguage();

  return (
    <TouchableOpacity
      style={[styles.compactCard, hovered && styles.compactCardHovered]}
      activeOpacity={0.88}
      onPress={onPress}
      {...({
        onMouseEnter: () => setHovered(true),
        onMouseLeave: () => setHovered(false),
      } as any)}
    >
      <View style={styles.compactThumbWrap}>
        {item.thumbnail ? (
          <Image source={{ uri: item.thumbnail }} style={styles.compactThumb} />
        ) : (
          <View style={styles.compactThumbFallback}>
            <Text style={styles.compactThumbFallbackText}>Postsapp</Text>
          </View>
        )}
      </View>

      <View style={styles.compactBody}>
        <Text style={styles.compactCategory} numberOfLines={1}>
          {localizeCategoryName(item.category || 'NEWS', lang).toUpperCase()}
        </Text>
        <Text
          style={[styles.compactTitle, hovered && styles.compactTitleHovered]}
          numberOfLines={2}
        >
          {item.title}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default function WebExpressPosts({
  expressOneItems,
  expressTwoItems,
  extraItems,
  activeAds,
  onPressItem,
  hasMore,
  isLoading,
  onLoadMore,
}: WebExpressPostsProps) {
  const { width } = useWindowDimensions();
  const { t } = useTranslation();
  const { lang } = useSiteLanguage();
  const isDesktop = width >= 1024;
  const isMobile = width < 768;

  const leadItem = expressOneItems[0] || null;
  const expressOneList = expressOneItems.slice(1, 5);
  const expressTwoList = expressTwoItems.slice(0, 4);

  return (
    <View style={[styles.container, isMobile && { paddingHorizontal: 12, marginTop: 24, marginBottom: 16 }]}>
      <View style={[styles.splitRow, !isDesktop && styles.splitRowTablet]}>
        {/* Express Posts 1 (~2/3 width) */}
        <View style={[styles.leftTwoThirds, !isDesktop && styles.columnFullMobile]}>
          <SectionHeading title={t('editorial.express_posts_1', 'Express Posts 1')} />

          <View style={[styles.expressOneInner, !isDesktop && styles.expressOneInnerTablet]}>
            {leadItem ? (
              <TouchableOpacity
                style={[styles.leadCard, !isDesktop && styles.columnFullMobile]}
                activeOpacity={0.9}
                onPress={() => onPressItem(leadItem)}
              >
                <View style={styles.leadThumbWrap}>
                  {leadItem.thumbnail ? (
                    <Image source={{ uri: leadItem.thumbnail }} style={styles.leadThumb} />
                  ) : (
                    <View style={styles.leadThumbFallback}>
                      <Text style={styles.leadThumbFallbackText}>Postsapp</Text>
                    </View>
                  )}
                  <View style={styles.readPill}>
                    <Ionicons name="play" size={9} color="#FFFFFF" />
                    <Text style={styles.readPillText}>{estimateReadTime(leadItem)}</Text>
                  </View>
                </View>

                <View style={styles.leadBody}>
                  <Text style={styles.leadCategory} numberOfLines={1}>
                    {localizeCategoryName(leadItem.category || 'NEWS', lang).toUpperCase()}
                  </Text>
                  <Text style={styles.leadTitle} numberOfLines={3}>
                    {leadItem.title}
                  </Text>
                  <Text style={styles.leadMeta}>
                    {leadItem.authorName || 'PostsApp Desk'}  •  {leadItem.timestamp || 'Today'}
                  </Text>
                  <Text style={styles.leadExcerpt} numberOfLines={3}>
                    {stripHtml(leadItem.excerpt || leadItem.content) ||
                      'Read the complete coverage, expert commentary, and latest updates on PostsApp.'}
                  </Text>
                </View>
              </TouchableOpacity>
            ) : null}

            <View style={[styles.compactStack, !isDesktop && styles.columnFullMobile]}>
              {expressOneList.map((item) => (
                <CompactHorizontalCard
                  key={item.id}
                  item={item}
                  onPress={() => onPressItem(item)}
                />
              ))}
            </View>
          </View>
        </View>

        {/* Express Posts 2 (~1/3 width) */}
        <View style={[styles.rightOneThird, !isDesktop && styles.columnFullMobile]}>
          <SectionHeading title={t('editorial.express_posts_2', 'Express Posts 2')} />
          <View style={[styles.compactStack, !isDesktop && styles.columnFullMobile]}>
            {expressTwoList.map((item) => (
              <CompactHorizontalCard
                key={item.id}
                item={item}
                onPress={() => onPressItem(item)}
              />
            ))}
          </View>
        </View>
      </View>

      {/* Remaining Paginated Stories + Ads */}
      {extraItems.length > 0 && (
        <View style={styles.moreSection}>
          <SectionHeading title={t('editorial.more_stories', 'More Stories')} />
          <View style={styles.moreGrid}>
            {extraItems.map((item, idx) => (
              <React.Fragment key={`${item.id}-${idx}`}>
                <TouchableOpacity
                  style={styles.moreCard}
                  activeOpacity={0.88}
                  onPress={() => onPressItem(item)}
                >
                  {item.thumbnail ? (
                    <Image source={{ uri: item.thumbnail }} style={styles.moreThumb} />
                  ) : (
                    <View style={styles.moreThumbFallback}>
                      <Text style={styles.compactThumbFallbackText}>Postsapp</Text>
                    </View>
                  )}
                  <View style={styles.moreBody}>
                    <Text style={styles.compactCategory} numberOfLines={1}>
                      {(item.category || 'NEWS').toUpperCase()}
                    </Text>
                    <Text style={styles.moreTitle} numberOfLines={2}>
                      {item.title}
                    </Text>
                    <Text style={styles.moreMeta}>
                      {item.authorName || 'PostsApp'} • {item.timestamp || 'Today'}
                    </Text>
                  </View>
                </TouchableOpacity>

                {activeAds.length > 0 && (idx + 1) % 6 === 0 && (
                  <View style={styles.moreCard}>
                    <AdCard ad={{ ...activeAds[Math.floor(idx / 6) % activeAds.length], __isAd: true }} />
                  </View>
                )}
              </React.Fragment>
            ))}
          </View>
        </View>
      )}

      {hasMore && (
        <View style={styles.loadMoreWrap}>
          <TouchableOpacity
            style={styles.loadMoreBtn}
            onPress={onLoadMore}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.loadMoreText}>{t('editorial.load_more', 'Load More Stories')}</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
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
    marginBottom: 44,
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
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
  splitRow: {
    flexDirection: 'row',
    gap: 24,
    alignItems: 'flex-start',
  },
  splitRowTablet: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 24,
  },
  columnFullMobile: {
    flex: 0,
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 'auto',
    width: '100%',
    minWidth: 0,
  },
  leftTwoThirds: {
    flex: 2,
    width: '100%',
  },
  rightOneThird: {
    flex: 1,
    width: '100%',
    minWidth: 0,
  },
  expressOneInner: {
    flexDirection: 'row',
    gap: 18,
    alignItems: 'stretch',
  },
  expressOneInnerTablet: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  leadCard: {
    flex: 1.05,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  leadThumbWrap: {
    width: '100%',
    aspectRatio: 16 / 10,
    backgroundColor: '#18181B',
    position: 'relative',
  },
  leadThumb: {
    width: '100%',
    height: '100%',
  },
  leadThumbFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#18181B',
  },
  leadThumbFallbackText: {
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
  leadBody: {
    padding: 18,
  },
  leadCategory: {
    color: '#D4191F',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  leadTitle: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
    marginBottom: 8,
  },
  leadMeta: {
    color: '#6B7280',
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 12,
  },
  leadExcerpt: {
    color: '#4B5563',
    fontSize: 13,
    lineHeight: 20,
  },
  compactStack: {
    flex: 0.95,
    gap: 12,
  },
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
  },
  compactCardHovered: {
    borderColor: '#D4191F',
  },
  compactThumbWrap: {
    width: 86,
    height: 60,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#18181B',
  },
  compactThumb: {
    width: '100%',
    height: '100%',
  },
  compactThumbFallback: {
    flex: 1,
    backgroundColor: '#18181B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactThumbFallbackText: {
    color: '#E5E7EB',
    fontSize: 12,
    fontWeight: '600',
  },
  compactBody: {
    flex: 1,
  },
  compactCategory: {
    color: '#D4191F',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  compactTitle: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  compactTitleHovered: {
    color: '#B81414',
  },
  moreSection: {
    marginTop: 36,
  },
  moreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 18,
  },
  moreCard: {
    flexBasis: '31%',
    flexGrow: 1,
    minWidth: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  moreThumb: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
  moreThumbFallback: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#18181B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreBody: {
    padding: 14,
  },
  moreTitle: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
    marginBottom: 8,
  },
  moreMeta: {
    color: '#6B7280',
    fontSize: 11,
  },
  loadMoreWrap: {
    alignItems: 'center',
    marginTop: 28,
  },
  loadMoreBtn: {
    backgroundColor: '#181818',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#D4191F',
  },
  loadMoreText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});
