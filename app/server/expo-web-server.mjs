import http from 'node:http';
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
} from '../scripts/seo-shared.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const APP_ROOT = path.resolve(__dirname, '..');
const DIST_DIR = path.join(APP_ROOT, 'dist');
const PORT = Number(process.env.PORT || 3000);
const config = getSupabaseConfig(APP_ROOT);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

let cachedTemplate = null;
function getBaseTemplate() {
  if (!cachedTemplate) {
    const rawHtmlPath = path.join(DIST_DIR, 'index.html');
    cachedTemplate = fs.readFileSync(rawHtmlPath, 'utf8');
  }
  return cachedTemplate;
}

let redirectCache = { at: 0, map: new Map() };
async function findSeoRedirect(pathname) {
  const now = Date.now();
  if (now - redirectCache.at > 30000) {
    const rows = await sbSelect(
      config,
      'seo_redirects',
      'select=source_path,target_path,status_code&is_active=eq.true'
    ).catch(() => []);
    const nextMap = new Map();
    for (const r of rows) {
      if (r.source_path && r.target_path) {
        const cleanSrc = r.source_path.startsWith('/') ? r.source_path : `/${r.source_path}`;
        nextMap.set(cleanSrc, { target: r.target_path, code: Number(r.status_code) === 302 ? 302 : 301 });
      }
    }
    redirectCache = { at: now, map: nextMap };
  }
  return redirectCache.map.get(pathname) || null;
}

function send(res, status, contentType, body, extraHeaders = {}) {
  res.writeHead(status, {
    'Content-Type': contentType,
    ...extraHeaders,
  });
  res.end(body);
}

function tryServeStaticAsset(pathname, res) {
  const normalized = path.posix.normalize(pathname).replace(/^\/+/, '');
  const candidate = path.join(DIST_DIR, normalized);
  if (!candidate.startsWith(DIST_DIR)) return false;
  if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
    const ext = path.extname(candidate).toLowerCase();
    const mime = MIME_TYPES[ext] || 'application/octet-stream';
    const cache = pathname.startsWith('/_expo/')
      ? 'public, max-age=31536000, immutable'
      : 'public, max-age=300';
    res.writeHead(200, { 'Content-Type': mime, 'Cache-Control': cache });
    fs.createReadStream(candidate).pipe(res);
    return true;
  }
  return false;
}

const server = http.createServer(async (req, res) => {
  try {
    const urlObj = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const pathname = decodeURIComponent(urlObj.pathname).replace(/\/+$/, '') || '/';

    // 1. Live static bundle assets (/_expo/*, /assets/*, favicon, etc.)
    if (
      pathname.startsWith('/_expo/') ||
      pathname.startsWith('/assets/') ||
      pathname === '/favicon.ico' ||
      pathname === '/robots.txt'
    ) {
      if (tryServeStaticAsset(pathname, res)) return;
    }

    // 2. Database-managed seo_redirects (301 / 302)
    const redirect = await findSeoRedirect(pathname);
    if (redirect) {
      res.writeHead(redirect.code, { Location: redirect.target });
      res.end();
      return;
    }

    // 3. Live XML Sitemaps & RSS Feeds
    if (pathname === '/sitemap.xml') {
      const { siteUrl } = config;
      const nowIso = new Date().toISOString();
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>${escapeXml(`${siteUrl}/sitemap-articles-en.xml`)}</loc><lastmod>${nowIso}</lastmod></sitemap>
  <sitemap><loc>${escapeXml(`${siteUrl}/sitemap-articles-ta.xml`)}</loc><lastmod>${nowIso}</lastmod></sitemap>
  <sitemap><loc>${escapeXml(`${siteUrl}/sitemap-categories.xml`)}</loc><lastmod>${nowIso}</lastmod></sitemap>
  <sitemap><loc>${escapeXml(`${siteUrl}/sitemap-tags.xml`)}</loc><lastmod>${nowIso}</lastmod></sitemap>
  <sitemap><loc>${escapeXml(`${siteUrl}/sitemap-authors.xml`)}</loc><lastmod>${nowIso}</lastmod></sitemap>
  <sitemap><loc>${escapeXml(`${siteUrl}/news-sitemap.xml`)}</loc><lastmod>${nowIso}</lastmod></sitemap>
</sitemapindex>`;
      return send(res, 200, 'application/xml; charset=utf-8', xml);
    }

    if (pathname === '/sitemap-articles-en.xml' || pathname === '/sitemap-articles-ta.xml' || pathname === '/news-sitemap.xml') {
      const posts = await sbSelect(
        config,
        'Post',
        'select=id,title,slug,language,published_at,updatedAt,createdAt&status=eq.PUBLISHED&or=(is_active.eq.true,is_active.is.null)&order=published_at.desc&limit=1000'
      );
      if (posts.length === 0 && tryServeStaticAsset(pathname, res)) return;
      if (pathname === '/news-sitemap.xml') {
        return send(res, 200, 'application/xml; charset=utf-8', buildNewsSitemapXml(config.siteUrl, posts));
      }
      const l = pathname.endsWith('-ta.xml') ? 'ta' : 'en';
      return send(res, 200, 'application/xml; charset=utf-8', buildSitemapArticlesXml(config.siteUrl, posts, l));
    }

    if (pathname === '/en/rss.xml' || pathname === '/ta/rss.xml') {
      const l = pathname.startsWith('/ta/') ? 'ta' : 'en';
      const posts = await sbSelect(
        config,
        'Post',
        `select=id,title,short_description,content,slug,language,published_at,createdAt&status=eq.PUBLISHED&language=eq.${l}&or=(is_active.eq.true,is_active.is.null)&order=published_at.desc&limit=50`
      );
      if (posts.length === 0 && tryServeStaticAsset(pathname, res)) return;
      return send(res, 200, 'application/rss+xml; charset=utf-8', buildRssXml(config.siteUrl, posts, l));
    }

    if (pathname.endsWith('.xml')) {
      if (tryServeStaticAsset(pathname, res)) return;
    }

    // 4. Root "/" locale redirect based on cookie or Accept-Language
    if (pathname === '/') {
      const cookieHeader = String(req.headers.cookie || '');
      const acceptLang = String(req.headers['accept-language'] || '').toLowerCase();
      const target = /postsapp_lang=ta/i.test(cookieHeader) || acceptLang.includes('ta') ? '/ta' : '/en';
      res.writeHead(302, { Location: target });
      res.end();
      return;
    }

    // 5. Dynamic Article Pages (/en/article/:slug, /ta/article/:slug, /article/:slug) -> HTTP 200 or real 404
    const articleMatch = pathname.match(/^\/(?:(en|ta)\/)?article\/([^/]+)$/);
    if (articleMatch) {
      const slugOrId = articleMatch[2];
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);
      const filter = isUuid
        ? `or=(id.eq.${encodeURIComponent(slugOrId)},slug.eq.${encodeURIComponent(slugOrId)})`
        : `slug=eq.${encodeURIComponent(slugOrId)}`;
      const rows = await sbSelect(
        config,
        'Post',
        `select=id,title,short_description,content,content_json,type,language,slug,thumbnail,featured_image_alt,featured_image_caption,category,custom_category,videoUrl,published_at,updatedAt,createdAt,translation_group_id,seo_title,seo_description,canonical_url,og_title,og_description,og_image,robots_index,author_name,authorId,author:User!authorId(id,username,channel_name)&${filter}&status=eq.PUBLISHED&or=(is_active.eq.true,is_active.is.null)&limit=1`
      );
      const article = rows[0];
      if (!article) {
        const notFoundHtml = injectSeoIntoTemplate(
          getBaseTemplate(),
          {
            title: 'Article Unavailable | PostsApp',
            description: 'This article may have been archived, removed, or moved.',
            canonicalUrl: `${config.siteUrl}${pathname}`,
            lang: articleMatch[1] === 'ta' ? 'ta' : 'en',
            robots: 'noindex, follow',
          },
          `<main id="seo-prerender" style="max-width:680px;margin:64px auto;padding:24px;font-family:system-ui,sans-serif"><h1>Article Unavailable</h1><p><a href="/en">Back to Home</a></p></main>`
        );
        return send(res, 404, 'text/html; charset=utf-8', notFoundHtml);
      }

      let translations = [];
      if (article.translation_group_id) {
        translations = await sbSelect(
          config,
          'Post',
          `select=id,slug,language,title&translation_group_id=eq.${encodeURIComponent(article.translation_group_id)}&status=eq.PUBLISHED&or=(is_active.eq.true,is_active.is.null)&id=neq.${encodeURIComponent(article.id)}`
        ).catch(() => []);
      }
      const { seo, bodyHtml } = buildArticleSeoPayload(config.siteUrl, article, translations);
      return send(res, 200, 'text/html; charset=utf-8', injectSeoIntoTemplate(getBaseTemplate(), seo, bodyHtml));
    }

    // 6. Bilingual Homepages (/en, /ta)
    if (pathname === '/en' || pathname === '/ta') {
      const lang = pathname.slice(1);
      const posts = await sbSelect(
        config,
        'Post',
        `select=id,title,short_description,content,slug,language,published_at,createdAt&status=eq.PUBLISHED&language=eq.${lang}&or=(is_active.eq.true,is_active.is.null)&order=published_at.desc&limit=24`
      ).catch(() => []);
      const { seo, bodyHtml } = buildHomeSeoPayload(config.siteUrl, lang, posts);
      return send(res, 200, 'text/html; charset=utf-8', injectSeoIntoTemplate(getBaseTemplate(), seo, bodyHtml));
    }

    // 7. Prerendered subpage HTML if present in dist/<path>/index.html
    const prerenderIndex = path.join(DIST_DIR, pathname.replace(/^\/+/, ''), 'index.html');
    if (prerenderIndex.startsWith(DIST_DIR) && fs.existsSync(prerenderIndex)) {
      return send(res, 200, 'text/html; charset=utf-8', fs.readFileSync(prerenderIndex, 'utf8'));
    }

    // 7.5 Normalize duplicate /category/category/... paths cleanly
    const dupCatMatch = pathname.match(/^\/(?:(en|ta)\/)?(?:category\/){2,}(.+)$/);
    if (dupCatMatch) {
      const targetLang = dupCatMatch[1] || 'en';
      const tailSlug = dupCatMatch[2].replace(/^\/+|\/+$/g, '').toLowerCase();
      const targetUrl = !tailSlug || tailSlug === 'home' ? `/${targetLang}` : `/${targetLang}/category/${tailSlug}`;
      res.writeHead(301, { Location: targetUrl });
      res.end();
      return;
    }

    // 8. Known interactive SPA routes (/login, /signup, /auth/callback, /profile, /library, /settings, /notifications, /en/search, /ta/search, etc.)
    const knownSpaPattern =
      /^\/(?:(?:en|ta)\/)?(?:home|latest|trending|most-read|search|explore|stories|creators|login|signup|otp|auth\/callback|onboarding\/[^/]+|profile|library|settings|notifications|privacy|about|contact|editorial-policy|corrections-policy|privacy-policy|terms|advertise|info\/[^/]+|category\/[^/]+|tag\/[^/]+|creator\/[^/]+)$/;
    if (knownSpaPattern.test(pathname)) {
      const lang = pathname.startsWith('/ta/') ? 'ta' : 'en';
      const title = `PostsApp`;
      const html = injectSeoIntoTemplate(
        getBaseTemplate(),
        {
          title,
          description: 'PostsApp bilingual digital news and community platform.',
          canonicalUrl: `${config.siteUrl}${pathname}`,
          lang,
          robots: /\/(login|signup|otp|auth\/callback|onboarding|profile|library|settings|notifications|search)/.test(pathname)
            ? 'noindex, follow'
            : 'index, follow',
        },
        `<main id="seo-prerender" lang="${lang}" style="max-width:860px;margin:40px auto;padding:24px;font-family:system-ui,sans-serif"><h1>PostsApp</h1></main>`
      );
      return send(res, 200, 'text/html; charset=utf-8', html);
    }

    // 8.5 Bare published-post slug redirect (/<slug> or /(en|ta)/<slug> -> /{lang}/article/{slug})
    const bareSlugMatch = pathname.match(/^\/(?:(en|ta)\/)?([^/]+)$/);
    if (bareSlugMatch) {
      const candidateSlug = decodeURIComponent(bareSlugMatch[2] || '').trim();
      const lowerSlug = candidateSlug.toLowerCase();
      const reservedSlugs = new Set([
        'home', 'latest', 'trending', 'most-read', 'search', 'explore', 'stories', 'creators',
        'login', 'signup', 'otp', 'profile', 'library', 'settings', 'notifications',
        'privacy', 'about', 'contact', 'editorial-policy', 'corrections-policy',
        'privacy-policy', 'terms', 'advertise', 'robots.txt', 'favicon.ico', 'sitemap.xml',
      ]);
      if (candidateSlug && !reservedSlugs.has(lowerSlug) && !lowerSlug.includes('.')) {
        const posts = await sbSelect(
          config,
          'Post',
          `select=slug,language&slug=eq.${encodeURIComponent(candidateSlug)}&status=eq.PUBLISHED&or=(is_active.eq.true,is_active.is.null)&limit=1`
        ).catch(() => []);
        if (posts && posts[0]?.slug) {
          const targetLang = bareSlugMatch[1] || (posts[0].language === 'ta' ? 'ta' : 'en');
          res.writeHead(301, { Location: `/${targetLang}/article/${encodeURIComponent(posts[0].slug)}` });
          res.end();
          return;
        }
      }
    }

    // 9. Unknown routes return HTTP 404 with Expo SPA fallback UI
    const notFoundHtml = injectSeoIntoTemplate(
      getBaseTemplate(),
      {
        title: 'Page Not Found | PostsApp',
        description: 'The requested page could not be found on PostsApp.',
        canonicalUrl: `${config.siteUrl}${pathname}`,
        lang: 'en',
        robots: 'noindex, follow',
      },
      `<main id="seo-prerender" style="max-width:680px;margin:64px auto;padding:24px;font-family:system-ui,sans-serif"><h1>404 — Page Not Found</h1><p>${escapeHtml(pathname)}</p><p><a href="/en">Return to PostsApp</a></p></main>`
    );
    return send(res, 404, 'text/html; charset=utf-8', notFoundHtml);
  } catch (err) {
    console.error('[Expo Web Server] Error:', err);
    return send(res, 500, 'text/plain; charset=utf-8', 'Internal Server Error');
  }
});

server.listen(PORT, () => {
  console.log(`[PostsApp Expo Web Server] Listening on http://localhost:${PORT}`);
});
