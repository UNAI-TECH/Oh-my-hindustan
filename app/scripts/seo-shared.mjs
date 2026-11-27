import fs from 'node:fs';
import path from 'node:path';

export function loadEnvFile(envPath) {
  const out = {};
  try {
    if (!fs.existsSync(envPath)) return out;
    const raw = fs.readFileSync(envPath, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!(key in process.env)) {
        process.env[key] = val;
      }
      out[key] = val;
    }
  } catch {
    // ignore missing .env
  }
  return out;
}

export function getSupabaseConfig(appRoot) {
  loadEnvFile(path.join(appRoot, '.env'));
  const supabaseUrl = (process.env.EXPO_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
  const siteUrl = (process.env.EXPO_PUBLIC_SITE_URL || 'https://postsapp.com').replace(/\/$/, '');
  return { supabaseUrl, supabaseAnonKey, siteUrl };
}

export async function sbSelect(config, table, queryString = '') {
  if (!config.supabaseUrl || !config.supabaseAnonKey) return [];
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const url = `${config.supabaseUrl}/rest/v1/${table}${queryString ? `?${queryString}` : ''}`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        apikey: config.supabaseAnonKey,
        Authorization: `Bearer ${config.supabaseAnonKey}`,
        Accept: 'application/json',
      },
    });
    clearTimeout(timer);
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function escapeXml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function stripHtml(html) {
  return String(html || '')
    .replace(/<(style|script)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function sanitizeRawHtml(raw) {
  if (!raw) return '';
  return String(raw)
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/\son\w+=(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');
}

function serializeMarks(text, marks) {
  let out = escapeHtml(text);
  if (!Array.isArray(marks)) return out;
  for (const m of marks) {
    if (m.type === 'bold' || m.type === 'strong') out = `<strong>${out}</strong>`;
    else if (m.type === 'italic' || m.type === 'em') out = `<em>${out}</em>`;
    else if (m.type === 'underline') out = `<u>${out}</u>`;
    else if (m.type === 'strike') out = `<s>${out}</s>`;
    else if (m.type === 'code') out = `<code>${out}</code>`;
    else if (m.type === 'link' && m.attrs?.href) {
      const safeHref = String(m.attrs.href).startsWith('javascript:') ? '#' : escapeHtml(m.attrs.href);
      out = `<a href="${safeHref}" rel="noopener noreferrer">${out}</a>`;
    }
  }
  return out;
}

export function serializeTipTapNode(node) {
  if (!node) return '';
  if (node.type === 'text') return serializeMarks(node.text || '', node.marks);
  const children = Array.isArray(node.content) ? node.content.map(serializeTipTapNode).join('') : '';
  switch (node.type) {
    case 'doc':
      return children;
    case 'paragraph':
      return `<p>${children || '<br />'}</p>`;
    case 'heading': {
      const level = Math.min(6, Math.max(1, Number(node.attrs?.level || 2)));
      return `<h${level}>${children}</h${level}>`;
    }
    case 'bulletList':
      return `<ul>${children}</ul>`;
    case 'orderedList':
      return `<ol>${children}</ol>`;
    case 'listItem':
      return `<li>${children}</li>`;
    case 'blockquote':
      return `<blockquote>${children}</blockquote>`;
    case 'codeBlock':
      return `<pre><code>${children}</code></pre>`;
    case 'horizontalRule':
      return '<hr />';
    case 'hardBreak':
      return '<br />';
    case 'image': {
      const src = node.attrs?.src ? escapeHtml(node.attrs.src) : '';
      if (!src) return '';
      const alt = escapeHtml(node.attrs?.alt || '');
      const title = node.attrs?.title ? `<figcaption>${escapeHtml(node.attrs.title)}</figcaption>` : '';
      return `<figure><img src="${src}" alt="${alt}" />${title}</figure>`;
    }
    default:
      return children;
  }
}

export function resolveArticleHtml(contentJson, contentHtml) {
  if (contentJson && typeof contentJson === 'object' && Array.isArray(contentJson.content)) {
    const serialized = serializeTipTapNode(contentJson);
    if (serialized.trim()) return serialized;
  }
  return sanitizeRawHtml(contentHtml || '');
}

export function injectSeoIntoTemplate(templateHtml, seo, bodyInnerHtml) {
  let html = templateHtml;
  const lang = seo.lang === 'ta' ? 'ta' : 'en';
  html = html.replace(/<html([^>]*)lang="[^"]*"/i, `<html$1lang="${lang}"`);
  if (!/lang="/i.test(html)) {
    html = html.replace(/<html/i, `<html lang="${lang}"`);
  }

  const headTags = [
    `<title>${escapeHtml(seo.title)}</title>`,
    `<meta name="description" content="${escapeHtml(seo.description)}" />`,
    `<meta name="robots" content="${escapeHtml(seo.robots || 'index, follow')}" />`,
    `<link rel="canonical" href="${escapeHtml(seo.canonicalUrl)}" />`,
    `<meta property="og:site_name" content="PostsApp" />`,
    `<meta property="og:type" content="${escapeHtml(seo.ogType || 'website')}" />`,
    `<meta property="og:title" content="${escapeHtml(seo.ogTitle || seo.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(seo.ogDescription || seo.description)}" />`,
    `<meta property="og:url" content="${escapeHtml(seo.canonicalUrl)}" />`,
    `<meta property="og:locale" content="${lang === 'ta' ? 'ta_IN' : 'en_IN'}" />`,
    seo.ogImage ? `<meta property="og:image" content="${escapeHtml(seo.ogImage)}" />` : '',
    seo.publishedTime ? `<meta property="article:published_time" content="${escapeHtml(seo.publishedTime)}" />` : '',
    seo.modifiedTime ? `<meta property="article:modified_time" content="${escapeHtml(seo.modifiedTime)}" />` : '',
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(seo.ogTitle || seo.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(seo.ogDescription || seo.description)}" />`,
    seo.ogImage ? `<meta name="twitter:image" content="${escapeHtml(seo.ogImage)}" />` : '',
    ...(seo.alternates || []).map(
      (a) => `<link rel="alternate" hreflang="${escapeHtml(a.hreflang)}" href="${escapeHtml(a.href)}" data-postsapp-hreflang="1" />`
    ),
    ...(seo.jsonLd || []).map(
      (schema) => `<script type="application/ld+json" data-postsapp-jsonld="1">${JSON.stringify(schema)}</script>`
    ),
  ]
    .filter(Boolean)
    .join('\n    ');

  html = html.replace(/<title>[\s\S]*?<\/title>/i, '');
  html = html.replace(/<\/head>/i, `    ${headTags}\n  </head>`);

  if (bodyInnerHtml) {
    if (/<div id="root"><\/div>/i.test(html)) {
      html = html.replace(/<div id="root"><\/div>/i, `<div id="root">${bodyInnerHtml}</div>`);
    } else {
      html = html.replace(/<div id="root"[^>]*>[\s\S]*?<\/div>/i, `<div id="root">${bodyInnerHtml}</div>`);
    }
  }

  return html;
}

export function buildArticleSeoPayload(siteUrl, article, translations = []) {
  const lang = article.language === 'ta' ? 'ta' : 'en';
  const slug = article.slug || article.id;
  const canonicalUrl = article.canonical_url || `${siteUrl}/${lang}/article/${encodeURIComponent(slug)}`;
  const rawTitle = article.seo_title || article.title || 'PostsApp';
  const title = rawTitle.includes('PostsApp') ? rawTitle : `${rawTitle} | PostsApp`;
  const plain = stripHtml(article.content);
  const description =
    article.seo_description ||
    article.short_description ||
    plain.slice(0, 160) ||
    'Independent English & Tamil journalism on PostsApp.';
  const ogImage = article.og_image || article.thumbnail || `${siteUrl}/assets/icon.png`;

  const alternates = [
    { hreflang: lang, href: `${siteUrl}/${lang}/article/${encodeURIComponent(slug)}` },
  ];
  for (const tr of translations) {
    if (tr.language && tr.slug) {
      alternates.push({
        hreflang: tr.language,
        href: `${siteUrl}/${tr.language}/article/${encodeURIComponent(tr.slug)}`,
      });
    }
  }
  alternates.push({
    hreflang: 'x-default',
    href: alternates.find((a) => a.hreflang === 'en')?.href || canonicalUrl,
  });

  const authorObj = Array.isArray(article.author) ? article.author[0] : article.author;
  const authorDisplay =
    article.author_name ||
    authorObj?.channel_name ||
    authorObj?.username ||
    'PostsApp Newsroom';
  const authorKey = authorObj?.username || article.authorId || '';
  const categoryName =
    article.category === 'custom' && article.custom_category
      ? article.custom_category
      : article.category || 'News';

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      headline: article.title,
      description,
      image: [article.thumbnail || ogImage],
      datePublished: article.published_at || article.createdAt,
      dateModified: article.updatedAt || article.published_at || article.createdAt,
      inLanguage: lang,
      articleSection: categoryName,
      mainEntityOfPage: canonicalUrl,
      author: {
        '@type': 'Person',
        name: authorDisplay,
        ...(authorKey ? { url: `${siteUrl}/${lang}/creator/${encodeURIComponent(authorKey)}` } : {}),
      },
      publisher: {
        '@type': 'Organization',
        name: 'PostsApp',
        logo: { '@type': 'ImageObject', url: `${siteUrl}/assets/icon.png` },
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: lang === 'ta' ? 'முகப்பு' : 'Home', item: `${siteUrl}/${lang}` },
        { '@type': 'ListItem', position: 2, name: categoryName, item: `${siteUrl}/${lang}/category/${encodeURIComponent(String(categoryName).toLowerCase().replace(/\s+/g, '-'))}` },
        { '@type': 'ListItem', position: 3, name: article.title, item: canonicalUrl },
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
    seo: {
      title,
      description,
      canonicalUrl,
      lang,
      ogType: 'article',
      ogTitle: article.og_title || rawTitle,
      ogDescription: article.og_description || description,
      ogImage,
      robots: article.robots_index === false ? 'noindex, follow' : 'index, follow',
      publishedTime: article.published_at || article.createdAt,
      modifiedTime: article.updatedAt,
      alternates,
      jsonLd,
    },
    bodyHtml: buildArticlePrerenderBody(article, categoryName, authorDisplay, translations),
  };
}

export function buildArticlePrerenderBody(article, categoryName, authorDisplay, translations = []) {
  const lang = article.language === 'ta' ? 'ta' : 'en';
  const body = resolveArticleHtml(article.content_json, article.content) || `<p>${escapeHtml(article.short_description || '')}</p>`;
  const pubIso = article.published_at || article.createdAt || '';
  const altLinks = translations
    .map(
      (tr) =>
        `<a href="/${escapeHtml(tr.language)}/article/${encodeURIComponent(tr.slug || tr.id)}">${
          tr.language === 'ta' ? 'தமிழில் படிக்க' : 'Read in English'
        }</a>`
    )
    .join(' | ');

  return `<main id="seo-prerender" lang="${lang}" style="max-width:860px;margin:0 auto;padding:24px;font-family:system-ui,-apple-system,sans-serif;color:#111827">
    <nav aria-label="Breadcrumb"><a href="/${lang}">PostsApp</a> &rsaquo; <span>${escapeHtml(categoryName)}</span></nav>
    <article>
      <header>
        <p>${escapeHtml(categoryName)}</p>
        <h1>${escapeHtml(article.title)}</h1>
        ${article.short_description ? `<p>${escapeHtml(article.short_description)}</p>` : ''}
        <p>By <span>${escapeHtml(authorDisplay)}</span>${pubIso ? ` &bull; <time datetime="${escapeHtml(pubIso)}">${escapeHtml(pubIso)}</time>` : ''}</p>
        ${altLinks ? `<p>${altLinks}</p>` : ''}
        ${article.thumbnail ? `<figure><img src="${escapeHtml(article.thumbnail)}" alt="${escapeHtml(article.featured_image_alt || article.title)}" />${article.featured_image_caption ? `<figcaption>${escapeHtml(article.featured_image_caption)}</figcaption>` : ''}</figure>` : ''}
      </header>
      <section>${body}</section>
    </article>
  </main>`;
}

export function buildHomeSeoPayload(siteUrl, lang, posts = []) {
  const cleanLang = lang === 'ta' ? 'ta' : 'en';
  const title =
    cleanLang === 'ta'
      ? 'PostsApp தமிழ் — முக்கிய செய்திகள், கட்டுரைகள் & வீடியோ'
      : 'PostsApp — Independent Digital Magazine & Bilingual Wire';
  const description =
    cleanLang === 'ta'
      ? 'அரசியல், பொருளாதாரம், தொழில்நுட்பம் மற்றும் தமிழ்நாடு செய்திகளின் நம்பகமான இருமொழி செய்தித் தளம்.'
      : 'Independent bilingual digital news and analysis in English and Tamil covering politics, economy, policy, and culture.';

  const listItems = posts
    .filter((p) => (p.language === 'ta' ? 'ta' : 'en') === cleanLang)
    .slice(0, 24)
    .map((p) => {
      const slug = encodeURIComponent(p.slug || p.id);
      const excerpt = escapeHtml(p.short_description || stripHtml(p.content).slice(0, 140));
      return `<li><article><h2><a href="/${cleanLang}/article/${slug}">${escapeHtml(p.title)}</a></h2><p>${excerpt}</p></article></li>`;
    })
    .join('\n');

  return {
    seo: {
      title,
      description,
      canonicalUrl: `${siteUrl}/${cleanLang}`,
      lang: cleanLang,
      ogType: 'website',
      ogTitle: title,
      ogDescription: description,
      ogImage: `${siteUrl}/assets/icon.png`,
      robots: 'index, follow',
      alternates: [
        { hreflang: 'en', href: `${siteUrl}/en` },
        { hreflang: 'ta', href: `${siteUrl}/ta` },
        { hreflang: 'x-default', href: `${siteUrl}/en` },
      ],
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'PostsApp',
          url: siteUrl,
          logo: `${siteUrl}/assets/icon.png`,
        },
        {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'PostsApp',
          url: `${siteUrl}/${cleanLang}`,
          inLanguage: cleanLang,
          potentialAction: {
            '@type': 'SearchAction',
            target: `${siteUrl}/${cleanLang}/search?q={search_term_string}`,
            'query-input': 'required name=search_term_string',
          },
        },
      ],
    },
    bodyHtml: `<main id="seo-prerender" lang="${cleanLang}" style="max-width:1100px;margin:0 auto;padding:24px;font-family:system-ui,-apple-system,sans-serif;color:#111827">
      <header>
        <h1>${escapeHtml(title)}</h1>
        <p>${escapeHtml(description)}</p>
        <nav><a href="/en">English</a> | <a href="/ta">தமிழ்</a> | <a href="/${cleanLang}/search">Search</a> | <a href="/${cleanLang}/creators">Creators</a></nav>
      </header>
      <ul>${listItems}</ul>
    </main>`,
  };
}

export function buildSitemapArticlesXml(siteUrl, posts, lang) {
  const rows = posts
    .filter((p) => (p.language === 'ta' ? 'ta' : 'en') === lang)
    .map((p) => {
      const slug = encodeURIComponent(p.slug || p.id);
      const lastmod = new Date(p.updatedAt || p.published_at || p.createdAt || Date.now()).toISOString();
      return `  <url>
    <loc>${escapeXml(`${siteUrl}/${lang}/article/${slug}`)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${rows}
</urlset>`;
}

export function buildNewsSitemapXml(siteUrl, posts) {
  const cutoff = Date.now() - 48 * 3600 * 1000;
  const recent = posts.filter((p) => new Date(p.published_at || p.createdAt || 0).getTime() >= cutoff);
  const rows = recent
    .map((p) => {
      const lang = p.language === 'ta' ? 'ta' : 'en';
      const loc = `${siteUrl}/${lang}/article/${encodeURIComponent(p.slug || p.id)}`;
      const pubDate = new Date(p.published_at || p.createdAt).toISOString();
      return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <news:news>
      <news:publication>
        <news:name>PostsApp</news:name>
        <news:language>${lang}</news:language>
      </news:publication>
      <news:publication_date>${pubDate}</news:publication_date>
      <news:title>${escapeXml(p.title)}</news:title>
    </news:news>
  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${rows}
</urlset>`;
}

export function buildRssXml(siteUrl, posts, lang) {
  const cleanLang = lang === 'ta' ? 'ta' : 'en';
  const channelTitle = cleanLang === 'ta' ? 'PostsApp தமிழ் செய்திகள்' : 'PostsApp English News';
  const filtered = posts.filter((p) => (p.language === 'ta' ? 'ta' : 'en') === cleanLang).slice(0, 50);
  const items = filtered
    .map((p) => {
      const link = `${siteUrl}/${cleanLang}/article/${encodeURIComponent(p.slug || p.id)}`;
      const desc = p.short_description || stripHtml(p.content).slice(0, 240);
      return `    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <pubDate>${new Date(p.published_at || p.createdAt || Date.now()).toUTCString()}</pubDate>
      <description>${escapeXml(desc)}</description>
    </item>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(channelTitle)}</title>
    <link>${siteUrl}/${cleanLang}</link>
    <description>PostsApp bilingual digital journalism</description>
    <language>${cleanLang}</language>
${items}
  </channel>
</rss>`;
}
