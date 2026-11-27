export interface TipTapNode {
  type?: string;
  text?: string;
  attrs?: Record<string, any>;
  marks?: Array<{ type: string; attrs?: Record<string, any> }>;
  content?: TipTapNode[];
}

function escapeHtml(raw: string): string {
  return String(raw || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function safeUrl(raw?: string | null): string {
  const val = String(raw || '').trim();
  if (/^(https?:\/\/|\/|mailto:|tel:)/i.test(val)) return val;
  return '#';
}

function renderMarksHtml(node: TipTapNode): string {
  let out = escapeHtml(node.text || '');
  if (!node.marks || node.marks.length === 0) return out;
  for (const mark of node.marks) {
    if (mark.type === 'bold') out = `<strong>${out}</strong>`;
    else if (mark.type === 'italic') out = `<em>${out}</em>`;
    else if (mark.type === 'underline') out = `<u>${out}</u>`;
    else if (mark.type === 'strike') out = `<s>${out}</s>`;
    else if (mark.type === 'code') out = `<code>${out}</code>`;
    else if (mark.type === 'link') {
      const href = escapeHtml(safeUrl(mark.attrs?.href));
      out = `<a href="${href}" target="_blank" rel="noopener noreferrer nofollow">${out}</a>`;
    }
  }
  return out;
}

function serializeNode(node: TipTapNode): string {
  if (!node || typeof node !== 'object') return '';
  if (node.type === 'text') return renderMarksHtml(node);

  const inner = Array.isArray(node.content) ? node.content.map(serializeNode).join('') : '';
  const align = ['left', 'center', 'right', 'justify'].includes(node.attrs?.textAlign)
    ? ` style="text-align:${node.attrs?.textAlign}"`
    : '';

  switch (node.type) {
    case 'doc':
      return inner;
    case 'paragraph':
      return `<p${align}>${inner || '<br />'}</p>`;
    case 'heading': {
      const level = Math.min(4, Math.max(2, Number(node.attrs?.level) || 2));
      return `<h${level}${align}>${inner}</h${level}>`;
    }
    case 'bulletList':
      return `<ul>${inner}</ul>`;
    case 'orderedList':
      return `<ol>${inner}</ol>`;
    case 'listItem':
      return `<li>${inner}</li>`;
    case 'blockquote':
      return `<blockquote>${inner}</blockquote>`;
    case 'codeBlock':
      return `<pre><code>${inner}</code></pre>`;
    case 'horizontalRule':
      return `<hr />`;
    case 'hardBreak':
      return `<br />`;
    case 'image': {
      const src = escapeHtml(safeUrl(node.attrs?.src));
      if (src === '#') return '';
      const alt = escapeHtml(node.attrs?.alt || '');
      const title = node.attrs?.title ? escapeHtml(node.attrs.title) : '';
      return title
        ? `<figure><img src="${src}" alt="${alt}" loading="lazy" /><figcaption>${title}</figcaption></figure>`
        : `<figure><img src="${src}" alt="${alt}" loading="lazy" /></figure>`;
    }
    case 'youtube': {
      const rawSrc = String(node.attrs?.src || '');
      const match = rawSrc.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
      const vidId = match?.[1];
      if (!vidId) return '';
      return `<div class="postsapp-video-embed"><iframe src="https://www.youtube-nocookie.com/embed/${vidId}" title="Embedded Video" allowfullscreen loading="lazy"></iframe></div>`;
    }
    default:
      return inner;
  }
}

export function isPlainStubJson(contentJson: any, contentHtml?: string | null): boolean {
  const hasRichHtml = /<(strong|b|em|i|u|h[1-6]|ul|ol|blockquote|img|a|iframe)\b/i.test(contentHtml || '');
  if (!hasRichHtml) return false;
  return Boolean(
    contentJson &&
      typeof contentJson === 'object' &&
      Array.isArray(contentJson.content) &&
      contentJson.content.every(
        (n: any) => n.type === 'paragraph' && (!n.content || n.content.every((c: any) => !c.marks))
      )
  );
}

export function sanitizeRawHtml(html?: string | null): string {
  return String(html || '')
    .replace(/<(script|style|object|embed)[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/javascript:/gi, '');
}

export function resolveArticleHtml(contentJson?: any, contentHtml?: string | null): string {
  if (
    contentJson &&
    typeof contentJson === 'object' &&
    contentJson.type === 'doc' &&
    !isPlainStubJson(contentJson, contentHtml)
  ) {
    return serializeNode(contentJson as TipTapNode);
  }
  return sanitizeRawHtml(contentHtml || '');
}

/**
 * Splits article HTML into an initial readable teaser for guests and a masked
 * continuation block rendered behind the sign-in paywall overlay.
 */
export function splitHtmlForGuestPreview(
  fullHtml: string,
  maxPreviewChars = 260
): { previewHtml: string; remainderHtml: string; hasMore: boolean } {
  const clean = String(fullHtml || '').trim();
  if (!clean) return { previewHtml: '', remainderHtml: '', hasMore: false };

  const blocks = clean.match(/<(?:p|h[1-6]|blockquote|ul|ol|div|figure)[^>]*>[\s\S]*?<\/(?:p|h[1-6]|blockquote|ul|ol|div|figure)>/gi);
  if (blocks && blocks.length > 1) {
    let charAcc = 0;
    let splitIdx = 1;
    for (let i = 0; i < blocks.length; i++) {
      const textLen = blocks[i].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().length;
      if (i > 0 && charAcc + textLen > maxPreviewChars) {
        splitIdx = i;
        break;
      }
      charAcc += textLen;
      splitIdx = i + 1;
    }
    if (splitIdx < blocks.length) {
      return {
        previewHtml: blocks.slice(0, splitIdx).join(''),
        remainderHtml: blocks.slice(splitIdx, splitIdx + 3).join(''),
        hasMore: true,
      };
    }
  }

  // Fallback for single long paragraph or plain text
  const plain = clean.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (plain.length <= 160) {
    return { previewHtml: clean, remainderHtml: '', hasMore: false };
  }
  const cut = Math.min(plain.length - 40, maxPreviewChars);
  const spaceIdx = plain.lastIndexOf(' ', cut);
  const splitAt = spaceIdx > 80 ? spaceIdx : cut;
  return {
    previewHtml: `<p>${escapeHtml(plain.slice(0, splitAt))}...</p>`,
    remainderHtml: `<p>${escapeHtml(plain.slice(splitAt, splitAt + 420))}</p>`,
    hasMore: true,
  };
}
