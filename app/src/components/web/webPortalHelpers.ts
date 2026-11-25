import { FeedItem, FeedItemType } from '../../types';

export const WEB_NAV_CATEGORIES = [
  'HOME',
  'BUSINESS',
  'ECONOMY',
  'POLICY',
  'SPORTS',
  'CULTURE',
  'SCIENCE & TECH',
  'WORLD',
] as const;

export const FOOTER_CATEGORIES = [
  'Business',
  'Economy',
  'Policy',
  'Sports',
  'Culture',
  'Science & Tech',
  'World',
] as const;

export const POPULAR_TAGS = [
  '#newsbeat',
  '#business',
  '#science',
  '#world',
  '#policy',
  '#sport',
  '#culture',
] as const;

const CATEGORY_ALIASES: Record<string, string[]> = {
  BUSINESS: ['business', 'economy', 'infrastructure', 'corporate', 'market', 'finance'],
  ECONOMY: ['economy', 'business', 'finance', 'agricultural', 'market', 'growth'],
  POLICY: ['policy', 'politics', 'governance', 'pmo', 'national security', 'defense', 'election', 'social justice'],
  SPORTS: ['sports', 'sport', 'athletics', 'cricket', 'football'],
  CULTURE: ['culture', 'cultural', 'heritage', 'entertainment', 'education', 'rural'],
  'SCIENCE & TECH': ['science', 'tech', 'technology', 'digital india', 'space', 'ai'],
  WORLD: ['world', 'foreign policy', 'geopolitics', 'global', 'international'],
};

/**
 * Matches a FeedItem against an editorial nav category using normalized aliases
 * so existing creator categories map cleanly into the new portal tabs.
 */
export function matchesEditorialCategory(item: FeedItem, activeCategory: string): boolean {
  const catUpper = activeCategory.toUpperCase();
  if (catUpper === 'HOME' || catUpper === 'ALL') return true;
  if (catUpper === 'WATCH_ONLINE') {
    return item.type === FeedItemType.VIDEO || item.type === FeedItemType.DEBATE || !!item.videoUrl;
  }

  const aliases = CATEGORY_ALIASES[catUpper] || [catUpper.toLowerCase()];
  const haystack = [
    item.category || '',
    item.title || '',
    ...(item.hashtags || []),
  ]
    .join(' ')
    .toLowerCase();

  return aliases.some((alias) => haystack.includes(alias));
}

/**
 * Strips HTML tags and entities for clean card excerpts and read-time calculation.
 */
export function stripHtml(html?: string | null): string {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Estimates reading time from article content or uses video duration if available.
 */
export function estimateReadTime(item: FeedItem): string {
  if ((item.type === FeedItemType.VIDEO || item.type === FeedItemType.DEBATE) && item.videoDuration) {
    return item.videoDuration;
  }
  const text = stripHtml(item.content || item.excerpt || item.title);
  const words = text ? text.split(/\s+/).length : 0;
  const mins = Math.max(1, Math.min(12, Math.ceil(words / 200) || 2));
  return `${mins} min read`;
}

/**
 * Formats current date with ordinal suffix like "Fri, Nov 20th, 2026".
 */
export function getFormattedHeaderDate(date = new Date()): string {
  const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const day = date.getDate();
  const year = date.getFullYear();

  const mod100 = day % 100;
  let suffix = 'th';
  if (mod100 < 11 || mod100 > 13) {
    if (day % 10 === 1) suffix = 'st';
    else if (day % 10 === 2) suffix = 'nd';
    else if (day % 10 === 3) suffix = 'rd';
  }

  return `${weekday}, ${month} ${day}${suffix}, ${year}`;
}
