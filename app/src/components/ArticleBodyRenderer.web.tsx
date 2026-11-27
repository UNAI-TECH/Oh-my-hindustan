import React, { useMemo } from 'react';
import { resolveArticleHtml } from '../utils/tiptapSerializer';

interface ArticleBodyRendererProps {
  contentJson?: any;
  contentHtml?: string | null;
  language?: 'en' | 'ta';
}

export default function ArticleBodyRenderer({
  contentJson,
  contentHtml,
  language = 'en',
}: ArticleBodyRendererProps) {
  const html = useMemo(() => resolveArticleHtml(contentJson, contentHtml), [contentJson, contentHtml]);

  return (
    <div
      lang={language}
      className="postsapp-article-body"
      style={{
        fontSize: 17,
        lineHeight: 1.82,
        color: '#1E293B',
        fontFamily: language === 'ta' ? '"Noto Sans Tamil", system-ui, sans-serif' : 'inherit',
      }}
    >
      <style>{`
        .postsapp-article-body h2 { font-size: 1.5rem; font-weight: 800; color: #111827; margin: 1.6rem 0 0.75rem; line-height: 1.3; }
        .postsapp-article-body h3 { font-size: 1.25rem; font-weight: 700; color: #111827; margin: 1.3rem 0 0.55rem; line-height: 1.35; }
        .postsapp-article-body p { margin-bottom: 1.15rem; line-height: 1.82; }
        .postsapp-article-body blockquote { border-left: 4px solid #D4191F; background: #F8FAFC; padding: 0.9rem 1.2rem; margin: 1.4rem 0; font-style: italic; color: #334155; }
        .postsapp-article-body ul { list-style: disc; padding-left: 1.5rem; margin-bottom: 1.15rem; }
        .postsapp-article-body ol { list-style: decimal; padding-left: 1.5rem; margin-bottom: 1.15rem; }
        .postsapp-article-body a { color: #D4191F; text-decoration: underline; text-underline-offset: 2px; }
        .postsapp-article-body figure { margin: 1.5rem 0; text-align: center; }
        .postsapp-article-body figure img, .postsapp-article-body img { max-width: 100%; max-height: 540px; border-radius: 10px; height: auto; }
        .postsapp-article-body figcaption { font-size: 12px; color: #64748B; margin-top: 6px; }
        .postsapp-article-body hr { border: 0; border-top: 1px solid #E2E8F0; margin: 1.75rem 0; }
        .postsapp-article-body pre { background: #111827; color: #F8FAFC; padding: 1rem; border-radius: 10px; overflow-x: auto; font-size: 0.875rem; margin: 1.25rem 0; }
        .postsapp-video-embed { position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 12px; margin: 1.5rem 0; background: #000; }
        .postsapp-video-embed iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }
      `}</style>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
