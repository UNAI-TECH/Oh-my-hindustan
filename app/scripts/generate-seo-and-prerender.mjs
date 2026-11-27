import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  getSupabaseConfig,
  sbSelect,
  escapeHtml,
  escapeXml,
  injectSeoIntoTemplate,
  buildArticleSeoPayload,
  buildHomeSeoPayload,
  buildSitemapArticlesXml,
  buildNewsSitemapXml,
  buildRssXml,
} from './seo-shared.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const APP_ROOT = path.resolve(__dirname, '..');
const DIST_DIR = path.join(APP_ROOT, 'dist');

function writeDistFile(relPath, content) {
  const fullPath = path.join(DIST_DIR, relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
}

const STATIC_PAGES = [
  { key: 'about', titleEn: 'About PostsApp', titleTa: 'PostsApp பற்றி', descEn: 'About PostsApp independent bilingual newsroom.', descTa: 'PostsApp இருமொழி செய்தித் தளம் பற்றி.' },
  { key: 'contact', titleEn: 'Contact Newsroom', titleTa: 'தொடர்பு கொள்ள', descEn: 'Contact the PostsApp editorial desk.', descTa: 'PostsApp செய்திப் பிரிவைத் தொடர்பு கொள்ள.' },
  { key: 'editorial-policy', titleEn: 'Editorial Policy', titleTa: 'ஆசிரியர் கொள்கை', descEn: 'PostsApp editorial standards and ethics.', descTa: 'PostsApp ஆசிரியர் மற்றும் செய்தித் தரநிலைகள்.' },
  { key: 'corrections-policy', titleEn: 'Corrections Policy', titleTa: 'திருத்தக் கொள்கை', descEn: 'How PostsApp handles factual corrections.', descTa: 'செய்தித் திருத்தங்களை PostsApp கையாளும் முறை.' },
  { key: 'privacy-policy', titleEn: 'Privacy Policy', titleTa: 'தனியுரிமைக் கொள்கை', descEn: 'PostsApp reader privacy policy.', descTa: 'PostsApp வாசகர் தனியுரிமைக் கொள்கை.' },
  { key: 'terms', titleEn: 'Terms of Service', titleTa: 'சேவை விதிமுறைகள்', descEn: 'PostsApp terms of service.', descTa: 'PostsApp பயன்பாட்டு விதிமுறைகள்.' },
  { key: 'advertise', titleEn: 'Advertise With Us', titleTa: 'விளம்பரம் செய்ய', descEn: 'Sponsor or advertise on PostsApp.', descTa: 'PostsApp தளத்தில் விளம்பரப்படுத்த.' },
];

async function main() {
  const indexHtmlPath = path.join(DIST_DIR, 'index.html');
  if (!fs.existsSync(indexHtmlPath)) {
    throw new Error(`Missing ${indexHtmlPath}. Run "expo export --platform web" first.`);
  }
  const templateHtml = fs.readFileSync(indexHtmlPath, 'utf8');
  const config = getSupabaseConfig(APP_ROOT);
  const { siteUrl } = config;

  console.log('[SEO Prerender] Fetching published content from Supabase...');
  const [posts, categories, tags, creators] = await Promise.all([
    sbSelect(
      config,
      'Post',
      'select=id,title,short_description,content,content_json,type,language,slug,thumbnail,featured_image_alt,featured_image_caption,category,custom_category,videoUrl,published_at,updatedAt,createdAt,translation_group_id,seo_title,seo_description,canonical_url,og_title,og_description,og_image,robots_index,author_name,authorId,author:User!authorId(id,username,channel_name)&status=eq.PUBLISHED&or=(is_active.eq.true,is_active.is.null)&order=published_at.desc&limit=1500'
    ).catch(() => []),
    sbSelect(
      config,
      'categories',
      'select=id,name_en,name_ta,slug_en,slug_ta,description_en,description_ta&is_active=eq.true&order=display_order.asc'
    ).catch(() => []),
    sbSelect(
      config,
      'tags',
      'select=id,name_en,name_ta,slug_en,slug_ta&limit=500'
    ).catch(() => []),
    sbSelect(
      config,
      'User',
      'select=id,username,channel_name,bio,avatarUrl&role=in.(ANALYST,CREATOR)&limit=500'
    ).catch(() => []),
  ]);

  // Index translation siblings by translation_group_id
  const groups = new Map();
  for (const p of posts) {
    if (p.translation_group_id) {
      if (!groups.has(p.translation_group_id)) groups.set(p.translation_group_id, []);
      groups.get(p.translation_group_id).push(p);
    }
  }

  // 1. robots.txt
  const robotsTxt = `User-agent: *
Allow: /
Disallow: /login
Disallow: /signup
Disallow: /profile
Disallow: /settings
Disallow: /notifications
Disallow: /library

Sitemap: ${siteUrl}/sitemap.xml
Sitemap: ${siteUrl}/news-sitemap.xml
Sitemap: ${siteUrl}/sitemap-articles-en.xml
Sitemap: ${siteUrl}/sitemap-articles-ta.xml
`;
  writeDistFile('robots.txt', robotsTxt);

  // 2. Sub-sitemaps + Sitemap Index + News Sitemap + RSS feeds
  const nowIso = new Date().toISOString();
  writeDistFile('sitemap-articles-en.xml', buildSitemapArticlesXml(siteUrl, posts, 'en'));
  writeDistFile('sitemap-articles-ta.xml', buildSitemapArticlesXml(siteUrl, posts, 'ta'));
  writeDistFile('news-sitemap.xml', buildNewsSitemapXml(siteUrl, posts));
  writeDistFile('en/rss.xml', buildRssXml(siteUrl, posts, 'en'));
  writeDistFile('ta/rss.xml', buildRssXml(siteUrl, posts, 'ta'));

  const catXmlRows = [
    `  <url><loc>${escapeXml(`${siteUrl}/en`)}</loc><changefreq>hourly</changefreq><priority>1.0</priority></url>`,
    `  <url><loc>${escapeXml(`${siteUrl}/ta`)}</loc><changefreq>hourly</changefreq><priority>1.0</priority></url>`,
    ...categories.flatMap((c) => [
      `  <url><loc>${escapeXml(`${siteUrl}/en/category/${encodeURIComponent(c.slug_en)}`)}</loc><changefreq>daily</changefreq><priority>0.7</priority></url>`,
      `  <url><loc>${escapeXml(`${siteUrl}/ta/category/${encodeURIComponent(c.slug_ta || c.slug_en)}`)}</loc><changefreq>daily</changefreq><priority>0.7</priority></url>`,
    ]),
  ].join('\n');
  writeDistFile(
    'sitemap-categories.xml',
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${catXmlRows}\n</urlset>`
  );

  const tagXmlRows = tags
    .flatMap((tg) => [
      `  <url><loc>${escapeXml(`${siteUrl}/en/tag/${encodeURIComponent(tg.slug_en)}`)}</loc><changefreq>weekly</changefreq><priority>0.6</priority></url>`,
      `  <url><loc>${escapeXml(`${siteUrl}/ta/tag/${encodeURIComponent(tg.slug_ta || tg.slug_en)}`)}</loc><changefreq>weekly</changefreq><priority>0.6</priority></url>`,
    ])
    .join('\n');
  writeDistFile(
    'sitemap-tags.xml',
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${tagXmlRows}\n</urlset>`
  );

  const authorXmlRows = creators
    .flatMap((cr) => {
      const handle = encodeURIComponent(cr.username || cr.id);
      return [
        `  <url><loc>${escapeXml(`${siteUrl}/en/creator/${handle}`)}</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>`,
        `  <url><loc>${escapeXml(`${siteUrl}/ta/creator/${handle}`)}</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>`,
      ];
    })
    .join('\n');
  writeDistFile(
    'sitemap-authors.xml',
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${authorXmlRows}\n</urlset>`
  );

  const sitemapIndexXml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>${escapeXml(`${siteUrl}/sitemap-articles-en.xml`)}</loc><lastmod>${nowIso}</lastmod></sitemap>
  <sitemap><loc>${escapeXml(`${siteUrl}/sitemap-articles-ta.xml`)}</loc><lastmod>${nowIso}</lastmod></sitemap>
  <sitemap><loc>${escapeXml(`${siteUrl}/sitemap-categories.xml`)}</loc><lastmod>${nowIso}</lastmod></sitemap>
  <sitemap><loc>${escapeXml(`${siteUrl}/sitemap-tags.xml`)}</loc><lastmod>${nowIso}</lastmod></sitemap>
  <sitemap><loc>${escapeXml(`${siteUrl}/sitemap-authors.xml`)}</loc><lastmod>${nowIso}</lastmod></sitemap>
  <sitemap><loc>${escapeXml(`${siteUrl}/news-sitemap.xml`)}</loc><lastmod>${nowIso}</lastmod></sitemap>
</sitemapindex>`;
  writeDistFile('sitemap.xml', sitemapIndexXml);

  // 3. Homepages (/en, /ta, and root index.html enriched with EN SEO + bilingual alternates)
  const enHome = buildHomeSeoPayload(siteUrl, 'en', posts);
  const taHome = buildHomeSeoPayload(siteUrl, 'ta', posts);
  writeDistFile('en/index.html', injectSeoIntoTemplate(templateHtml, enHome.seo, enHome.bodyHtml));
  writeDistFile('ta/index.html', injectSeoIntoTemplate(templateHtml, taHome.seo, taHome.bodyHtml));
  writeDistFile('index.html', injectSeoIntoTemplate(templateHtml, enHome.seo, enHome.bodyHtml));

  // 4. Prerendered Articles (/en/article/<slug> and /ta/article/<slug>)
  let articleCount = 0;
  for (const post of posts) {
    const lang = post.language === 'ta' ? 'ta' : 'en';
    const rawSlug = post.slug || post.id;
    const safeDirSlug = String(rawSlug).replace(/[<>:"|?*\\/]/g, '-');
    const siblings = post.translation_group_id
      ? (groups.get(post.translation_group_id) || []).filter((s) => s.id !== post.id)
      : [];
    const { seo, bodyHtml } = buildArticleSeoPayload(siteUrl, post, siblings);
    const rendered = injectSeoIntoTemplate(templateHtml, seo, bodyHtml);
    writeDistFile(path.join(lang, 'article', safeDirSlug, 'index.html'), rendered);
    articleCount += 1;
  }

  // 5. Categories
  for (const cat of categories) {
    for (const lang of ['en', 'ta']) {
      const slug = lang === 'ta' ? (cat.slug_ta || cat.slug_en) : cat.slug_en;
      const name = lang === 'ta' ? (cat.name_ta || cat.name_en) : cat.name_en;
      const desc = (lang === 'ta' ? cat.description_ta : cat.description_en) || `${name} news and analysis on PostsApp.`;
      const canonicalUrl = `${siteUrl}/${lang}/category/${encodeURIComponent(slug)}`;
      const seo = {
        title: `${name} | PostsApp`,
        description: desc,
        canonicalUrl,
        lang,
        ogType: 'website',
        alternates: [
          { hreflang: 'en', href: `${siteUrl}/en/category/${encodeURIComponent(cat.slug_en)}` },
          { hreflang: 'ta', href: `${siteUrl}/ta/category/${encodeURIComponent(cat.slug_ta || cat.slug_en)}` },
          { hreflang: 'x-default', href: `${siteUrl}/en/category/${encodeURIComponent(cat.slug_en)}` },
        ],
      };
      const bodyHtml = `<main id="seo-prerender" lang="${lang}" style="max-width:960px;margin:0 auto;padding:24px;font-family:system-ui,sans-serif"><h1>${escapeHtml(name)}</h1><p>${escapeHtml(desc)}</p></main>`;
      writeDistFile(path.join(lang, 'category', String(slug).replace(/[<>:"|?*\\/]/g, '-'), 'index.html'), injectSeoIntoTemplate(templateHtml, seo, bodyHtml));
    }
  }

  // 6. Tags
  for (const tag of tags) {
    for (const lang of ['en', 'ta']) {
      const slug = lang === 'ta' ? (tag.slug_ta || tag.slug_en) : tag.slug_en;
      const name = lang === 'ta' ? (tag.name_ta || tag.name_en) : tag.name_en;
      const seo = {
        title: `#${name} | PostsApp`,
        description: `Stories tagged #${name} on PostsApp.`,
        canonicalUrl: `${siteUrl}/${lang}/tag/${encodeURIComponent(slug)}`,
        lang,
        ogType: 'website',
      };
      const bodyHtml = `<main id="seo-prerender" lang="${lang}" style="max-width:960px;margin:0 auto;padding:24px;font-family:system-ui,sans-serif"><h1>#${escapeHtml(name)}</h1></main>`;
      writeDistFile(path.join(lang, 'tag', String(slug).replace(/[<>:"|?*\\/]/g, '-'), 'index.html'), injectSeoIntoTemplate(templateHtml, seo, bodyHtml));
    }
  }

  // 7. Creators & Static Pages & 404.html
  for (const lang of ['en', 'ta']) {
    const dirSeo = {
      title: lang === 'ta' ? 'படைப்பாளர்கள் | PostsApp' : 'Creators Directory | PostsApp',
      description: 'Journalists, analysts, and creators publishing on PostsApp.',
      canonicalUrl: `${siteUrl}/${lang}/creators`,
      lang,
    };
    writeDistFile(
      path.join(lang, 'creators', 'index.html'),
      injectSeoIntoTemplate(
        templateHtml,
        dirSeo,
        `<main id="seo-prerender" lang="${lang}" style="max-width:960px;margin:0 auto;padding:24px;font-family:system-ui,sans-serif"><h1>${escapeHtml(dirSeo.title)}</h1></main>`
      )
    );

    for (const cr of creators) {
      const handle = String(cr.username || cr.id).replace(/[<>:"|?*\\/]/g, '-');
      const displayName = cr.channel_name || cr.username || 'Creator';
      const seo = {
        title: `${displayName} | PostsApp`,
        description: cr.bio || `${displayName} on PostsApp.`,
        canonicalUrl: `${siteUrl}/${lang}/creator/${encodeURIComponent(cr.username || cr.id)}`,
        lang,
        ogType: 'profile',
        ogImage: cr.avatarUrl || `${siteUrl}/assets/icon.png`,
      };
      writeDistFile(
        path.join(lang, 'creator', handle, 'index.html'),
        injectSeoIntoTemplate(
          templateHtml,
          seo,
          `<main id="seo-prerender" lang="${lang}" style="max-width:960px;margin:0 auto;padding:24px;font-family:system-ui,sans-serif"><h1>${escapeHtml(displayName)}</h1><p>${escapeHtml(seo.description)}</p></main>`
        )
      );
    }

    for (const pg of STATIC_PAGES) {
      const title = lang === 'ta' ? `${pg.titleTa} | PostsApp` : `${pg.titleEn} | PostsApp`;
      const desc = lang === 'ta' ? pg.descTa : pg.descEn;
      const seo = {
        title,
        description: desc,
        canonicalUrl: `${siteUrl}/${lang}/${pg.key}`,
        lang,
        alternates: [
          { hreflang: 'en', href: `${siteUrl}/en/${pg.key}` },
          { hreflang: 'ta', href: `${siteUrl}/ta/${pg.key}` },
          { hreflang: 'x-default', href: `${siteUrl}/en/${pg.key}` },
        ],
      };
      writeDistFile(
        path.join(lang, pg.key, 'index.html'),
        injectSeoIntoTemplate(
          templateHtml,
          seo,
          `<main id="seo-prerender" lang="${lang}" style="max-width:860px;margin:0 auto;padding:24px;font-family:system-ui,sans-serif"><h1>${escapeHtml(lang === 'ta' ? pg.titleTa : pg.titleEn)}</h1><p>${escapeHtml(desc)}</p></main>`
        )
      );
    }
  }

  writeDistFile(
    '404.html',
    injectSeoIntoTemplate(
      templateHtml,
      {
        title: 'Page Not Found | PostsApp',
        description: 'The requested page could not be found on PostsApp.',
        canonicalUrl: `${siteUrl}/en`,
        lang: 'en',
        robots: 'noindex, follow',
      },
      '<main id="seo-prerender" style="max-width:680px;margin:64px auto;padding:24px;font-family:system-ui,sans-serif"><h1>404 — Page Not Found</h1><p><a href="/en">Return to PostsApp</a></p></main>'
    )
  );

  console.log(
    `[SEO Prerender] Generated robots.txt, 7 XML sitemaps, 2 RSS feeds, ${articleCount} articles, ${categories.length} categories, ${tags.length} tags, ${creators.length} creators.`
  );
}

main().catch((err) => {
  console.error('[SEO Prerender] Failed:', err);
  process.exit(1);
});
