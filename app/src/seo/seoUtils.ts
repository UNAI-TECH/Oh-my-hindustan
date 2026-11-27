export type SeoLang = 'en' | 'ta';

export const SITE_URL = (
  process.env.EXPO_PUBLIC_SITE_URL || 'https://web.postsapp.in'
).replace(/\/$/, '');

export interface HreflangAlternate {
  hreflang: string;
  href: string;
}

export interface PageSeoConfig {
  title: string;
  description: string;
  canonicalUrl: string;
  lang: SeoLang;
  ogType?: 'website' | 'article' | 'profile';
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  robots?: string;
  publishedTime?: string;
  modifiedTime?: string;
  alternates?: HreflangAlternate[];
  jsonLd?: Array<Record<string, any>>;
}

export function buildArticleSeoConfig(params: {
  article: any;
  translations?: Array<{ language: string; slug: string }>;
  categorySlug?: string;
  categoryName?: string;
}): PageSeoConfig {
  const { article, translations = [], categorySlug, categoryName } = params;
  const lang: SeoLang = article.language === 'ta' ? 'ta' : 'en';
  const slug = article.slug || article.id;
  const canonicalUrl =
    article.canonical_url ||
    `${SITE_URL}/${lang}/article/${encodeURIComponent(slug)}`;

  const title = article.seo_title || article.title || 'PostsApp';
  const plain = String(article.content || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const description =
    article.seo_description ||
    article.short_description ||
    plain.slice(0, 160) ||
    'Independent English & Tamil journalism on PostsApp.';
  const ogImage = article.og_image || article.thumbnail || `${SITE_URL}/assets/icon.png`;

  const alternates: HreflangAlternate[] = [
    { hreflang: lang, href: `${SITE_URL}/${lang}/article/${encodeURIComponent(slug)}` },
  ];
  translations.forEach((tr) => {
    if (tr.language && tr.slug) {
      alternates.push({
        hreflang: tr.language,
        href: `${SITE_URL}/${tr.language}/article/${encodeURIComponent(tr.slug)}`,
      });
    }
  });
  alternates.push({
    hreflang: 'x-default',
    href: alternates.find((a) => a.hreflang === 'en')?.href || canonicalUrl,
  });

  const authorDisplay =
    article.author_name ||
    article.authorNameCustom ||
    article.authorName ||
    'PostsApp Newsroom';
  const authorKey = article.author?.username || article.authorId || '';

  const jsonLd: Array<Record<string, any>> = [
    {
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      headline: article.title,
      description,
      image: [article.thumbnail || ogImage],
      datePublished: article.published_at || article.createdAt,
      dateModified: article.updatedAt || article.published_at || article.createdAt,
      inLanguage: lang,
      articleSection: categoryName || article.category || 'News',
      mainEntityOfPage: canonicalUrl,
      author: {
        '@type': 'Person',
        name: authorDisplay,
        ...(authorKey ? { url: `${SITE_URL}/${lang}/creator/${encodeURIComponent(authorKey)}` } : {}),
      },
      publisher: {
        '@type': 'Organization',
        name: 'PostsApp',
        logo: { '@type': 'ImageObject', url: `${SITE_URL}/assets/icon.png` },
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: lang === 'ta' ? 'முகப்பு' : 'Home', item: `${SITE_URL}/${lang}` },
        ...(categorySlug && categoryName
          ? [{ '@type': 'ListItem', position: 2, name: categoryName, item: `${SITE_URL}/${lang}/category/${categorySlug}` }]
          : []),
        {
          '@type': 'ListItem',
          position: categorySlug ? 3 : 2,
          name: article.title,
          item: canonicalUrl,
        },
      ],
    },
  ];

  if (article.videoUrl) {
    jsonLd.push({
      '@context': 'https://schema.org',
      '@type': 'VideoObject',
      name: article.title,
      description,
      thumbnailUrl: [article.thumbnail || ogImage],
      uploadDate: article.published_at || article.createdAt,
      contentUrl: article.videoUrl,
    });
  }

  return {
    title: title.includes('PostsApp') ? title : `${title} | PostsApp`,
    description,
    canonicalUrl,
    lang,
    ogType: 'article',
    ogTitle: article.og_title || title,
    ogDescription: article.og_description || description,
    ogImage,
    robots: article.robots_index === false ? 'noindex, follow' : 'index, follow',
    publishedTime: article.published_at || article.createdAt,
    modifiedTime: article.updatedAt,
    alternates,
    jsonLd,
  };
}

export function buildHomeSeoConfig(lang: SeoLang): PageSeoConfig {
  const title =
    lang === 'ta'
      ? 'PostsApp தமிழ் — முக்கிய செய்திகள், கட்டுரைகள் & வீடியோ'
      : 'PostsApp — Independent Digital Magazine & Bilingual Wire';
  const description =
    lang === 'ta'
      ? 'அரசியல், பொருளாதாரம், தொழில்நுட்பம் மற்றும் தமிழ்நாடு செய்திகளின் நம்பகமான இருமொழி செய்தித் தளம்.'
      : 'Independent bilingual digital news and analysis in English and Tamil covering politics, economy, policy, and culture.';

  return {
    title,
    description,
    canonicalUrl: `${SITE_URL}/${lang}`,
    lang,
    ogType: 'website',
    ogTitle: title,
    ogDescription: description,
    ogImage: `${SITE_URL}/assets/icon.png`,
    robots: 'index, follow',
    alternates: [
      { hreflang: 'en', href: `${SITE_URL}/en` },
      { hreflang: 'ta', href: `${SITE_URL}/ta` },
      { hreflang: 'x-default', href: `${SITE_URL}/en` },
    ],
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'PostsApp',
        url: SITE_URL,
        logo: `${SITE_URL}/assets/icon.png`,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'PostsApp',
        url: `${SITE_URL}/${lang}`,
        inLanguage: lang,
        potentialAction: {
          '@type': 'SearchAction',
          target: `${SITE_URL}/${lang}/search?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  };
}
