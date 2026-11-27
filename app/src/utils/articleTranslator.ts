export interface TranslatedArticlePayload {
  title: string;
  shortDescription: string;
  bodyHtml: string;
  targetLang: 'en' | 'ta';
}

const translationCache = new Map<string, TranslatedArticlePayload>();

async function translateChunk(
  chunk: string,
  sourceLang: 'en' | 'ta',
  targetLang: 'en' | 'ta'
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const primaryUrl = `https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=${sourceLang}&tl=${targetLang}&q=${encodeURIComponent(
      chunk
    )}`;
    const res = await fetch(primaryUrl, { signal: controller.signal });
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json)) {
        const flat = json.map((item: any) => (Array.isArray(item) ? item[0] : item)).filter(Boolean).join('');
        if (flat.trim()) return flat;
      }
    }
  } catch {
    // fallback below
  } finally {
    clearTimeout(timeout);
  }

  const fbController = new AbortController();
  const fbTimeout = setTimeout(() => fbController.abort(), 8000);
  try {
    const fbUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk)}&langpair=${sourceLang}|${targetLang}`;
    const fbRes = await fetch(fbUrl, { signal: fbController.signal });
    if (fbRes.ok) {
      const fbJson = await fbRes.json();
      const out = fbJson?.responseData?.translatedText;
      if (typeof out === 'string' && out.trim()) return out;
    }
  } catch {
    // keep original on total failure
  } finally {
    clearTimeout(fbTimeout);
  }
  return chunk;
}

async function translatePlainText(
  text: string,
  sourceLang: 'en' | 'ta',
  targetLang: 'en' | 'ta'
): Promise<string> {
  const trimmed = String(text || '').trim();
  if (!trimmed || sourceLang === targetLang) return text;

  // Split long paragraphs safely under 450 chars at sentence boundaries
  if (trimmed.length <= 450) {
    return translateChunk(trimmed, sourceLang, targetLang);
  }
  const sentences = trimmed.match(/[^.!?।]+[.!?।]*\s*/g) || [trimmed];
  const chunks: string[] = [];
  let buf = '';
  for (const s of sentences) {
    if ((buf + s).length > 440 && buf.trim()) {
      chunks.push(buf.trim());
      buf = s;
    } else {
      buf += s;
    }
  }
  if (buf.trim()) chunks.push(buf.trim());
  const translated = await Promise.all(chunks.map((c) => translateChunk(c, sourceLang, targetLang)));
  return translated.join(' ');
}

async function translateHtmlBlocks(
  html: string,
  sourceLang: 'en' | 'ta',
  targetLang: 'en' | 'ta'
): Promise<string> {
  const raw = String(html || '').trim();
  if (!raw || sourceLang === targetLang) return raw;

  // Preserve non-textual tags like figure/img/iframe/hr while translating textual blocks
  const blockRegex = /(<(?:p|h[1-6]|blockquote|li|figcaption)[^>]*>)([\s\S]*?)(<\/(?:p|h[1-6]|blockquote|li|figcaption)>)/gi;
  const parts: Array<{ full: string; open: string; inner: string; close: string; start: number; end: number }> = [];

  let match: RegExpExecArray | null;
  while ((match = blockRegex.exec(raw)) !== null) {
    parts.push({
      full: match[0],
      open: match[1],
      inner: match[2],
      close: match[3],
      start: match.index,
      end: match.index + match[0].length,
    });
  }

  if (parts.length === 0) {
    const plain = raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (!plain) return raw;
    const translated = await translatePlainText(plain, sourceLang, targetLang);
    return `<p>${translated}</p>`;
  }

  // Translate paragraphs in batches to keep latency low
  const translatedInnerList = await Promise.all(
    parts.map(async (part) => {
      const plainInner = part.inner.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      if (!plainInner) return part.inner;
      return translatePlainText(plainInner, sourceLang, targetLang);
    })
  );

  let out = '';
  let cursor = 0;
  parts.forEach((part, idx) => {
    out += raw.slice(cursor, part.start);
    out += `${part.open}${translatedInnerList[idx]}${part.close}`;
    cursor = part.end;
  });
  out += raw.slice(cursor);
  return out;
}

export async function translateArticleContent(params: {
  articleId: string;
  title: string;
  shortDescription?: string | null;
  bodyHtml: string;
  sourceLang: 'en' | 'ta';
  targetLang: 'en' | 'ta';
}): Promise<TranslatedArticlePayload> {
  const { articleId, title, shortDescription, bodyHtml, sourceLang, targetLang } = params;
  const cacheKey = `${articleId}:${targetLang}`;
  const cached = translationCache.get(cacheKey);
  if (cached) return cached;

  const [trTitle, trDesc, trBody] = await Promise.all([
    translatePlainText(title, sourceLang, targetLang),
    shortDescription ? translatePlainText(shortDescription, sourceLang, targetLang) : Promise.resolve(''),
    translateHtmlBlocks(bodyHtml, sourceLang, targetLang),
  ]);

  const result: TranslatedArticlePayload = {
    title: trTitle || title,
    shortDescription: trDesc || shortDescription || '',
    bodyHtml: trBody || bodyHtml,
    targetLang,
  };
  translationCache.set(cacheKey, result);
  return result;
}
