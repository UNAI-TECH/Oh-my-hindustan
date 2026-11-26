import { FeedItem, FeedItemType } from '../../types';

export const WEB_NAV_CATEGORIES = [
  'HOME',
  'POLITICS',
  'BUSINESS',
  'ECONOMY',
  'POLICY',
  'SPORTS',
  'CULTURE',
  'SCIENCE & TECH',
  'WORLD',
] as const;

export const FOOTER_CATEGORIES = [
  'Politics',
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
  POLITICS: ['politics', 'political', 'election', 'parliament', 'government', 'minister', 'party', 'assembly', 'lok sabha', 'rajya sabha', 'governance', 'policy'],
  BUSINESS: ['business', 'economy', 'infrastructure', 'corporate', 'market', 'finance'],
  ECONOMY: ['economy', 'business', 'finance', 'agricultural', 'market', 'growth'],
  POLICY: ['policy', 'governance', 'pmo', 'national security', 'defense', 'social justice'],
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

const HTML_ENTITY_MAP: Record<string, string> = {
  '&nbsp;': ' ',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&apos;': "'",
  '&#39;': "'",
  '&#039;': "'",
  '&lsquo;': '\u2018',
  '&rsquo;': '\u2019',
  '&ldquo;': '\u201C',
  '&rdquo;': '\u201D',
  '&ndash;': '\u2013',
  '&mdash;': '\u2014',
  '&hellip;': '...',
  '&bull;': '\u2022',
  '&copy;': '\u00A9',
  '&reg;': '\u00AE',
  '&trade;': '\u2122',
};

/**
 * Strips HTML tags (including incomplete trailing tags), style/script blocks,
 * and decodes named and numeric HTML entities into clean plain text.
 */
export function stripHtml(html?: string | null): string {
  if (!html) return '';
  let text = String(html)
    .replace(/<(style|script)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<\/(p|div|h[1-6]|li|blockquote|section|article|tr)>/gi, ' ')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/<[^>]*$/g, ' ');

  // Decode named and numeric HTML entities safely (handle double-encoded strings cleanly)
  for (let pass = 0; pass < 2; pass++) {
    const prev = text;
    text = text
      .replace(/&(nbsp|amp|lt|gt|quot|apos|lsquo|rsquo|ldquo|rdquo|ndash|mdash|hellip|bull|copy|reg|trade);|&#0?39;/gi, (m) => {
        return HTML_ENTITY_MAP[m.toLowerCase()] ?? m;
      })
      .replace(/&#(\d+);/g, (_, dec) => {
        const code = Number(dec);
        return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : '';
      })
      .replace(/&#x([0-9a-f]+);/gi, (_, hex) => {
        const code = parseInt(hex, 16);
        return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : '';
      });
    if (text === prev) break;
  }

  return text
    .replace(/<[^>]*>/g, ' ')
    .replace(/<[^>]*$/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Strips and decodes HTML before truncating so cards never show partial tags or raw CSS attributes.
 */
export function formatCardExcerpt(html?: string | null, maxLength = 155): string {
  const clean = stripHtml(html);
  if (!clean || clean.length <= maxLength) return clean;
  const sliced = clean.slice(0, maxLength);
  const lastSpace = sliced.lastIndexOf(' ');
  const trimmed = lastSpace > maxLength * 0.6 ? sliced.slice(0, lastSpace) : sliced;
  return `${trimmed.trimEnd()}...`;
}

/**
 * Converts a nav category label (e.g. "SCIENCE & TECH") to a clean URL slug ("science-tech").
 */
export function categoryToSlug(category: string): string {
  const upper = category.trim().toUpperCase();
  if (upper === 'SCIENCE & TECH') return 'science-tech';
  if (upper === 'WATCH_ONLINE') return 'watch-online';
  return upper.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/**
 * Resolves a category URL slug back into the canonical nav category constant.
 */
export function slugToCategory(slug?: string | null): string {
  if (!slug) return 'HOME';
  const norm = slug.trim().toLowerCase();
  if (norm === 'home' || norm === '') return 'HOME';
  if (norm === 'watch-online' || norm === 'watch_online') return 'WATCH_ONLINE';
  if (norm === 'science-tech' || norm === 'science-and-tech' || norm === 'science & tech') return 'SCIENCE & TECH';
  const match = WEB_NAV_CATEGORIES.find((c) => categoryToSlug(c) === norm || c.toLowerCase() === norm);
  return match || norm.toUpperCase();
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
