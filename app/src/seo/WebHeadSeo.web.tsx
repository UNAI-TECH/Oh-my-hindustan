import { useEffect } from 'react';
import type { PageSeoConfig } from './seoUtils';

function upsertMeta(attr: 'name' | 'property', key: string, content?: string) {
  if (typeof document === 'undefined') return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!content) {
    if (el) el.remove();
    return;
  }
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertCanonical(href: string) {
  if (typeof document === 'undefined') return;
  let link = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

export default function WebHeadSeo({ config }: { config: PageSeoConfig | null }) {
  useEffect(() => {
    if (!config || typeof document === 'undefined') return;

    document.title = config.title;
    document.documentElement.lang = config.lang;

    upsertCanonical(config.canonicalUrl);
    upsertMeta('name', 'description', config.description);
    upsertMeta('name', 'robots', config.robots || 'index, follow');

    upsertMeta('property', 'og:site_name', 'PostsApp');
    upsertMeta('property', 'og:type', config.ogType || 'website');
    upsertMeta('property', 'og:title', config.ogTitle || config.title);
    upsertMeta('property', 'og:description', config.ogDescription || config.description);
    upsertMeta('property', 'og:url', config.canonicalUrl);
    upsertMeta('property', 'og:locale', config.lang === 'ta' ? 'ta_IN' : 'en_IN');
    if (config.ogImage) upsertMeta('property', 'og:image', config.ogImage);
    if (config.publishedTime) upsertMeta('property', 'article:published_time', config.publishedTime);
    if (config.modifiedTime) upsertMeta('property', 'article:modified_time', config.modifiedTime);

    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', config.ogTitle || config.title);
    upsertMeta('name', 'twitter:description', config.ogDescription || config.description);
    if (config.ogImage) upsertMeta('name', 'twitter:image', config.ogImage);

    // Replace alternate hreflang links
    document.head.querySelectorAll('link[data-postsapp-hreflang="1"]').forEach((n) => n.remove());
    (config.alternates || []).forEach((alt) => {
      const link = document.createElement('link');
      link.setAttribute('rel', 'alternate');
      link.setAttribute('hreflang', alt.hreflang);
      link.setAttribute('href', alt.href);
      link.setAttribute('data-postsapp-hreflang', '1');
      document.head.appendChild(link);
    });

    // Replace JSON-LD scripts
    document.head.querySelectorAll('script[data-postsapp-jsonld="1"]').forEach((n) => n.remove());
    (config.jsonLd || []).forEach((schema) => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-postsapp-jsonld', '1');
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    });
  }, [config]);

  return null;
}
