-- ============================================================================
-- Migration 003: Search Vectors (en + ta), View Deduplication, Trending Rank,
-- Atomic Publish Transaction, Audit Helper & Notification Publish Trigger
-- ============================================================================

-- 1. Helper to extract plain text from TipTap JSON for search & reading time
CREATE OR REPLACE FUNCTION public.extract_tiptap_text(doc JSONB)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  res TEXT := '';
  child JSONB;
BEGIN
  IF doc IS NULL THEN
    RETURN '';
  END IF;
  IF doc ? 'text' THEN
    res := res || ' ' || COALESCE(doc->>'text', '');
  END IF;
  IF doc ? 'content' AND jsonb_typeof(doc->'content') = 'array' THEN
    FOR child IN SELECT jsonb_array_elements(doc->'content') LOOP
      res := res || ' ' || public.extract_tiptap_text(child);
    END LOOP;
  END IF;
  RETURN trim(res);
END;
$$;

-- 2. Trigger to keep Post.search_vector and reading_time_minutes synced
CREATE OR REPLACE FUNCTION public.update_post_search_vector()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  body_text TEXT;
  word_count INT;
BEGIN
  body_text := COALESCE(
    NULLIF(trim(public.extract_tiptap_text(NEW.content_json)), ''),
    trim(regexp_replace(COALESCE(NEW.content, ''), '<[^>]*>', ' ', 'g'))
  );
  word_count := COALESCE(array_length(regexp_split_to_array(NULLIF(trim(body_text), ''), '\s+'), 1), 0);
  NEW.reading_time_minutes := GREATEST(1, LEAST(45, ceil(GREATEST(1, word_count) / 200.0)::int));

  NEW.search_vector :=
    setweight(to_tsvector((CASE WHEN NEW.language = 'en' THEN 'english' ELSE 'simple' END)::regconfig, COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector((CASE WHEN NEW.language = 'en' THEN 'english' ELSE 'simple' END)::regconfig, COALESCE(NEW.subtitle, '') || ' ' || COALESCE(NEW.short_description, '')), 'B') ||
    setweight(to_tsvector((CASE WHEN NEW.language = 'en' THEN 'english' ELSE 'simple' END)::regconfig, COALESCE(NEW.category, '') || ' ' || COALESCE(array_to_string(NEW.hashtags, ' '), '') || ' ' || COALESCE(NEW.author_name, '')), 'C') ||
    setweight(to_tsvector((CASE WHEN NEW.language = 'en' THEN 'english' ELSE 'simple' END)::regconfig, left(COALESCE(body_text, ''), 20000)), 'D');

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_post_search_vector ON public."Post";
CREATE TRIGGER trg_update_post_search_vector
  BEFORE INSERT OR UPDATE OF title, subtitle, short_description, content, content_json, category, hashtags, author_name, language
  ON public."Post"
  FOR EACH ROW
  EXECUTE FUNCTION public.update_post_search_vector();

-- Backfill search_vector on existing posts
UPDATE public."Post" SET title = title WHERE id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_post_search_vector ON public."Post" USING GIN (search_vector);

-- 3. Bilingual Full-Text + Trigram Search RPC (English FTS + Unicode Tamil)
CREATE OR REPLACE FUNCTION public.search_articles(
  p_query TEXT DEFAULT '',
  p_language TEXT DEFAULT NULL,
  p_category_slug TEXT DEFAULT NULL,
  p_type TEXT DEFAULT NULL,
  p_author_id TEXT DEFAULT NULL,
  p_date_from TIMESTAMPTZ DEFAULT NULL,
  p_date_to TIMESTAMPTZ DEFAULT NULL,
  p_sort TEXT DEFAULT 'relevance',
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id TEXT,
  title TEXT,
  subtitle TEXT,
  short_description TEXT,
  slug TEXT,
  language TEXT,
  type TEXT,
  category TEXT,
  thumbnail TEXT,
  "videoUrl" TEXT,
  "videoDuration" TEXT,
  "authorId" TEXT,
  author_username TEXT,
  author_channel_name TEXT,
  author_avatar TEXT,
  published_at TIMESTAMPTZ,
  views_count INT,
  likes_count INT,
  comments_count INT,
  reading_time_minutes INT,
  trending_score DOUBLE PRECISION,
  rank REAL,
  total_count BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH base AS (
    SELECT
      p.id,
      p.title,
      p.subtitle,
      p.short_description,
      p.slug,
      p.language,
      p.type::text,
      p.category,
      p.thumbnail,
      p."videoUrl",
      p."videoDuration",
      p."authorId",
      u.username AS author_username,
      u.channel_name AS author_channel_name,
      u."avatarUrl" AS author_avatar,
      COALESCE(p.published_at, p."createdAt"::timestamptz) AS published_at,
      p.views_count,
      p.likes_count,
      p.comments_count,
      p.reading_time_minutes,
      COALESCE(p.trending_score, 0) AS trending_score,
      CASE
        WHEN NULLIF(trim(COALESCE(p_query, '')), '') IS NULL THEN 1.0::real
        ELSE (
          COALESCE(ts_rank_cd(p.search_vector, websearch_to_tsquery('simple', trim(p_query))), 0) * 2.0 +
          CASE WHEN p.language = 'en' THEN COALESCE(ts_rank_cd(p.search_vector, websearch_to_tsquery('english', trim(p_query))), 0) * 2.0 ELSE 0 END +
          COALESCE(similarity(p.title, trim(p_query)), 0) * 1.5 +
          CASE WHEN lower(p.title) LIKE '%' || lower(trim(p_query)) || '%' THEN 1.5 ELSE 0 END +
          CASE WHEN lower(COALESCE(p.short_description, '')) LIKE '%' || lower(trim(p_query)) || '%' THEN 0.7 ELSE 0 END +
          CASE WHEN lower(COALESCE(u.username, '') || ' ' || COALESCE(u.channel_name, '')) LIKE '%' || lower(trim(p_query)) || '%' THEN 0.8 ELSE 0 END
        )::real
      END AS rank
    FROM public."Post" p
    JOIN public."User" u ON u.id = p."authorId"
    WHERE p.status = 'PUBLISHED'
      AND COALESCE(p.is_active, true) = true
      AND COALESCE(u.account_status, 'active') = 'active'
      AND (p_language IS NULL OR p.language = p_language)
      AND (p_type IS NULL OR upper(p.type::text) = upper(p_type))
      AND (p_author_id IS NULL OR p."authorId" = p_author_id)
      AND (p_date_from IS NULL OR COALESCE(p.published_at, p."createdAt"::timestamptz) >= p_date_from)
      AND (p_date_to IS NULL OR COALESCE(p.published_at, p."createdAt"::timestamptz) <= p_date_to)
      AND (
        p_category_slug IS NULL OR EXISTS (
          SELECT 1 FROM public.post_categories pc
          JOIN public.categories c ON c.id = pc.category_id
          WHERE pc.post_id = p.id AND (c.slug_en = p_category_slug OR c.slug_ta = p_category_slug)
        )
      )
      AND (
        NULLIF(trim(COALESCE(p_query, '')), '') IS NULL
        OR p.search_vector @@ websearch_to_tsquery('simple', trim(p_query))
        OR (p.language = 'en' AND p.search_vector @@ websearch_to_tsquery('english', trim(p_query)))
        OR p.title ILIKE '%' || trim(p_query) || '%'
        OR COALESCE(p.short_description, '') ILIKE '%' || trim(p_query) || '%'
        OR COALESCE(p.content, '') ILIKE '%' || trim(p_query) || '%'
        OR COALESCE(u.username, '') ILIKE '%' || trim(p_query) || '%'
        OR COALESCE(u.channel_name, '') ILIKE '%' || trim(p_query) || '%'
        OR EXISTS (
          SELECT 1 FROM public.post_tags pt
          JOIN public.tags t ON t.id = pt.tag_id
          WHERE pt.post_id = p.id
            AND (t.name_en ILIKE '%' || trim(p_query) || '%' OR COALESCE(t.name_ta, '') ILIKE '%' || trim(p_query) || '%')
        )
      )
  ),
  counted AS (
    SELECT *, count(*) OVER () AS total_count FROM base
  )
  SELECT * FROM counted
  ORDER BY
    CASE WHEN p_sort = 'latest' THEN published_at END DESC NULLS LAST,
    CASE WHEN p_sort = 'popular' THEN (views_count * 2 + likes_count * 5 + comments_count * 3) END DESC NULLS LAST,
    CASE WHEN p_sort = 'trending' THEN trending_score END DESC NULLS LAST,
    rank DESC,
    published_at DESC
  LIMIT GREATEST(1, LEAST(p_limit, 100))
  OFFSET GREATEST(0, p_offset);
$$;

GRANT EXECUTE ON FUNCTION public.search_articles TO anon, authenticated;

-- 4. Server-side Deduplicated View Recording + Authoritative Engagement Counters
CREATE OR REPLACE FUNCTION public.record_post_view(
  p_post_id TEXT,
  p_visitor_key TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id TEXT := auth.uid()::text;
  v_key TEXT := COALESCE(v_user_id, NULLIF(trim(p_visitor_key), ''));
  v_already BOOLEAN := false;
BEGIN
  IF p_post_id IS NULL OR v_key IS NULL THEN
    RETURN false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public."Post" WHERE id = p_post_id AND status = 'PUBLISHED' AND COALESCE(is_active, true) = true) THEN
    RETURN false;
  END IF;

  -- Deduplicate within 12-hour window per user/visitor
  SELECT EXISTS (
    SELECT 1 FROM public."PostView"
    WHERE "postId" = p_post_id
      AND (
        (v_user_id IS NOT NULL AND "userId" = v_user_id)
        OR (visitor_key IS NOT NULL AND visitor_key = v_key)
      )
      AND COALESCE(created_at, "createdAt"::timestamptz, now()) > now() - interval '12 hours'
  ) INTO v_already;

  IF v_already THEN
    RETURN false;
  END IF;

  INSERT INTO public."PostView" (id, "postId", "userId", visitor_key, created_at)
  VALUES (gen_random_uuid()::text, p_post_id, COALESCE(v_user_id, v_key), v_key, now());

  UPDATE public."Post"
  SET views_count = views_count + 1
  WHERE id = p_post_id;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_post_view(TEXT, TEXT) TO anon, authenticated;

-- Keep Post.likes_count and Post.comments_count synchronized via triggers
CREATE OR REPLACE FUNCTION public.sync_post_vote_counters()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_post_id TEXT := COALESCE(NEW."postId", OLD."postId");
BEGIN
  UPDATE public."Post"
  SET likes_count = COALESCE((SELECT count(*)::int FROM public."Vote" WHERE "postId" = target_post_id AND type = 1), 0)
  WHERE id = target_post_id;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_post_vote_counters ON public."Vote";
CREATE TRIGGER trg_sync_post_vote_counters
  AFTER INSERT OR UPDATE OR DELETE ON public."Vote"
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_post_vote_counters();

CREATE OR REPLACE FUNCTION public.sync_post_comment_counters()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_post_id TEXT := COALESCE(NEW."postId", OLD."postId");
BEGIN
  UPDATE public."Post"
  SET comments_count = COALESCE((SELECT count(*)::int FROM public."Comment" WHERE "postId" = target_post_id AND content <> '[SYSTEM_REPOST]'), 0)
  WHERE id = target_post_id;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_post_comment_counters ON public."Comment";
CREATE TRIGGER trg_sync_post_comment_counters
  AFTER INSERT OR UPDATE OR DELETE ON public."Comment"
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_post_comment_counters();

-- 5. Recalculate Trending Score (Freshness + Time Decay + Views + Likes + Comments)
CREATE OR REPLACE FUNCTION public.refresh_trending_scores()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_rows INT;
BEGIN
  UPDATE public."Post" p
  SET trending_score = ROUND((
    (
      COALESCE(p.views_count, 0) * 1.0 +
      COALESCE(p.likes_count, 0) * 5.0 +
      COALESCE(p.comments_count, 0) * 4.0 +
      CASE WHEN p."isTrending" THEN 50.0 ELSE 0.0 END
    ) / POWER(GREATEST(1.0, EXTRACT(EPOCH FROM (now() - COALESCE(p.published_at, p."createdAt"::timestamptz))) / 3600.0 + 2.0), 1.35)
  )::numeric, 4)::double precision
  WHERE p.status = 'PUBLISHED' AND COALESCE(p.is_active, true) = true;

  GET DIAGNOSTICS updated_rows = ROW_COUNT;
  RETURN updated_rows;
END;
$$;

SELECT public.refresh_trending_scores();

-- 6. Audit Log Helper
CREATE OR REPLACE FUNCTION public.write_audit_log(
  p_actor_id TEXT,
  p_actor_role TEXT,
  p_action TEXT,
  p_resource_type TEXT,
  p_resource_id TEXT,
  p_previous JSONB DEFAULT NULL,
  p_updated JSONB DEFAULT NULL,
  p_outcome TEXT DEFAULT 'success',
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.audit_logs (
    actor_id, actor_role, action, resource_type, resource_id,
    previous_values, updated_values, outcome, metadata
  )
  VALUES (
    p_actor_id, p_actor_role, p_action, p_resource_type, p_resource_id,
    p_previous, p_updated, p_outcome, p_metadata
  )
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- 7. Atomic Publish / Save / Revision / Audit RPC
CREATE OR REPLACE FUNCTION public.save_editorial_post(
  p_post_id TEXT DEFAULT NULL,
  p_payload JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid TEXT := auth.uid()::text;
  v_role TEXT := public.current_user_role();
  v_active BOOLEAN := public.is_active_user();
  v_existing public."Post"%ROWTYPE;
  v_is_new BOOLEAN := false;
  v_target_id TEXT;
  v_status TEXT;
  v_lang TEXT;
  v_slug TEXT;
  v_title TEXT;
  v_type TEXT;
  v_published_at TIMESTAMPTZ;
  v_sched TIMESTAMPTZ;
  v_next_version INT;
  v_cat_ids UUID[];
  v_tag_ids UUID[];
  v_result public."Post"%ROWTYPE;
BEGIN
  IF v_uid IS NULL OR NOT v_active OR v_role NOT IN ('CREATOR', 'ANALYST', 'ADMIN') THEN
    RAISE EXCEPTION 'Forbidden: active creator or admin account required';
  END IF;

  IF p_post_id IS NOT NULL AND p_post_id <> '' THEN
    SELECT * INTO v_existing FROM public."Post" WHERE id = p_post_id FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Post not found';
    END IF;
    IF v_existing."authorId" <> v_uid AND v_role <> 'ADMIN' THEN
      RAISE EXCEPTION 'Forbidden: you do not own this post';
    END IF;
    v_target_id := v_existing.id;
  ELSE
    v_is_new := true;
    v_target_id := gen_random_uuid()::text;
  END IF;

  v_title := COALESCE(NULLIF(trim(p_payload->>'title'), ''), v_existing.title);
  IF v_title IS NULL OR v_title = '' THEN
    RAISE EXCEPTION 'Validation failed: title is required';
  END IF;

  v_lang := COALESCE(NULLIF(trim(p_payload->>'language'), ''), v_existing.language, 'en');
  IF v_lang NOT IN ('en', 'ta') THEN
    RAISE EXCEPTION 'Validation failed: unsupported language %', v_lang;
  END IF;

  v_status := UPPER(COALESCE(NULLIF(trim(p_payload->>'status'), ''), v_existing.status, 'DRAFT'));
  IF v_status NOT IN ('DRAFT', 'PUBLISHED', 'SCHEDULED', 'ARCHIVED') THEN
    RAISE EXCEPTION 'Validation failed: invalid status %', v_status;
  END IF;

  v_type := UPPER(COALESCE(NULLIF(trim(p_payload->>'type'), ''), v_existing.type::text, 'NEWS'));
  v_slug := public.slugify_text(COALESCE(NULLIF(trim(p_payload->>'slug'), ''), v_existing.slug, v_title), 'article-' || left(v_target_id, 8));

  IF EXISTS (SELECT 1 FROM public."Post" WHERE language = v_lang AND slug = v_slug AND id <> v_target_id) THEN
    RAISE EXCEPTION 'Duplicate slug "%" already exists for language "%"', v_slug, v_lang;
  END IF;

  -- Record SEO redirect if published post slug changed
  IF NOT v_is_new AND v_existing.slug IS NOT NULL AND v_existing.slug <> v_slug AND v_existing.status = 'PUBLISHED' THEN
    INSERT INTO public.seo_redirects (source_path, target_path, status_code)
    VALUES ('/' || v_existing.language || '/article/' || v_existing.slug, '/' || v_lang || '/article/' || v_slug, 301)
    ON CONFLICT (source_path) DO UPDATE SET target_path = EXCLUDED.target_path, is_active = true;
  END IF;

  v_sched := CASE
    WHEN p_payload ? 'scheduledFor' AND NULLIF(p_payload->>'scheduledFor', '') IS NOT NULL
      THEN (p_payload->>'scheduledFor')::timestamptz
    ELSE v_existing."scheduledFor"
  END;

  IF v_status = 'SCHEDULED' AND (v_sched IS NULL OR v_sched <= now()) THEN
    RAISE EXCEPTION 'Validation failed: scheduledFor must be in the future';
  END IF;

  -- Preserve original published_at across normal updates
  IF v_status = 'PUBLISHED' THEN
    v_published_at := COALESCE(v_existing.published_at, now());
  ELSE
    v_published_at := v_existing.published_at;
  END IF;

  IF v_is_new THEN
    INSERT INTO public."Post" (
      id, title, subtitle, short_description, content, content_json,
      type, category, custom_category, thumbnail, "videoUrl", "videoDuration",
      "authorId", author_name, author_position, hashtags,
      language, slug, featured_image_alt, featured_image_caption, featured_image_credit,
      translation_group_id, status, "scheduledFor", published_at, is_active,
      seo_title, seo_description, canonical_url, og_title, og_description, og_image, robots_index,
      "createdAt", "updatedAt"
    )
    VALUES (
      v_target_id,
      v_title,
      p_payload->>'subtitle',
      p_payload->>'short_description',
      COALESCE(p_payload->>'content', ''),
      p_payload->'content_json',
      v_type::"PostType",
      COALESCE(p_payload->>'category', 'General'),
      p_payload->>'custom_category',
      p_payload->>'thumbnail',
      p_payload->>'videoUrl',
      p_payload->>'videoDuration',
      v_uid,
      p_payload->>'author_name',
      p_payload->>'author_position',
      CASE WHEN jsonb_typeof(p_payload->'hashtags') = 'array'
        THEN ARRAY(SELECT jsonb_array_elements_text(p_payload->'hashtags'))
        ELSE NULL END,
      v_lang,
      v_slug,
      p_payload->>'featured_image_alt',
      p_payload->>'featured_image_caption',
      p_payload->>'featured_image_credit',
      NULLIF(p_payload->>'translation_group_id', '')::uuid,
      v_status,
      CASE WHEN v_status = 'SCHEDULED' THEN v_sched ELSE NULL END,
      v_published_at,
      COALESCE((p_payload->>'is_active')::boolean, true),
      p_payload->>'seo_title',
      p_payload->>'seo_description',
      p_payload->>'canonical_url',
      p_payload->>'og_title',
      p_payload->>'og_description',
      p_payload->>'og_image',
      COALESCE((p_payload->>'robots_index')::boolean, true),
      now(),
      now()
    )
    RETURNING * INTO v_result;
  ELSE
    UPDATE public."Post"
    SET
      title = v_title,
      subtitle = COALESCE(p_payload->>'subtitle', subtitle),
      short_description = COALESCE(p_payload->>'short_description', short_description),
      content = COALESCE(p_payload->>'content', content),
      content_json = CASE WHEN p_payload ? 'content_json' THEN p_payload->'content_json' ELSE content_json END,
      type = v_type::"PostType",
      category = COALESCE(p_payload->>'category', category),
      custom_category = CASE WHEN p_payload ? 'custom_category' THEN p_payload->>'custom_category' ELSE custom_category END,
      thumbnail = CASE WHEN p_payload ? 'thumbnail' THEN p_payload->>'thumbnail' ELSE thumbnail END,
      "videoUrl" = CASE WHEN p_payload ? 'videoUrl' THEN p_payload->>'videoUrl' ELSE "videoUrl" END,
      "videoDuration" = CASE WHEN p_payload ? 'videoDuration' THEN p_payload->>'videoDuration' ELSE "videoDuration" END,
      author_name = CASE WHEN p_payload ? 'author_name' THEN p_payload->>'author_name' ELSE author_name END,
      author_position = CASE WHEN p_payload ? 'author_position' THEN p_payload->>'author_position' ELSE author_position END,
      hashtags = CASE WHEN p_payload ? 'hashtags' AND jsonb_typeof(p_payload->'hashtags') = 'array'
        THEN ARRAY(SELECT jsonb_array_elements_text(p_payload->'hashtags'))
        ELSE hashtags END,
      language = v_lang,
      slug = v_slug,
      featured_image_alt = CASE WHEN p_payload ? 'featured_image_alt' THEN p_payload->>'featured_image_alt' ELSE featured_image_alt END,
      featured_image_caption = CASE WHEN p_payload ? 'featured_image_caption' THEN p_payload->>'featured_image_caption' ELSE featured_image_caption END,
      featured_image_credit = CASE WHEN p_payload ? 'featured_image_credit' THEN p_payload->>'featured_image_credit' ELSE featured_image_credit END,
      translation_group_id = CASE WHEN p_payload ? 'translation_group_id' THEN NULLIF(p_payload->>'translation_group_id', '')::uuid ELSE translation_group_id END,
      status = v_status,
      "scheduledFor" = CASE WHEN v_status = 'SCHEDULED' THEN v_sched ELSE NULL END,
      published_at = v_published_at,
      is_active = COALESCE((p_payload->>'is_active')::boolean, is_active),
      seo_title = CASE WHEN p_payload ? 'seo_title' THEN p_payload->>'seo_title' ELSE seo_title END,
      seo_description = CASE WHEN p_payload ? 'seo_description' THEN p_payload->>'seo_description' ELSE seo_description END,
      canonical_url = CASE WHEN p_payload ? 'canonical_url' THEN p_payload->>'canonical_url' ELSE canonical_url END,
      og_title = CASE WHEN p_payload ? 'og_title' THEN p_payload->>'og_title' ELSE og_title END,
      og_description = CASE WHEN p_payload ? 'og_description' THEN p_payload->>'og_description' ELSE og_description END,
      og_image = CASE WHEN p_payload ? 'og_image' THEN p_payload->>'og_image' ELSE og_image END,
      robots_index = COALESCE((p_payload->>'robots_index')::boolean, robots_index),
      "updatedAt" = now()
    WHERE id = v_target_id
    RETURNING * INTO v_result;
  END IF;

  -- Sync categories if provided
  IF p_payload ? 'category_ids' AND jsonb_typeof(p_payload->'category_ids') = 'array' THEN
    v_cat_ids := ARRAY(SELECT (jsonb_array_elements_text(p_payload->'category_ids'))::uuid);
    DELETE FROM public.post_categories WHERE post_id = v_target_id;
    IF array_length(v_cat_ids, 1) > 0 THEN
      INSERT INTO public.post_categories (post_id, category_id, is_primary)
      SELECT v_target_id, cid, (idx = 1)
      FROM unnest(v_cat_ids) WITH ORDINALITY AS t(cid, idx);
    END IF;
  END IF;

  -- Sync tags if provided
  IF p_payload ? 'tag_ids' AND jsonb_typeof(p_payload->'tag_ids') = 'array' THEN
    v_tag_ids := ARRAY(SELECT (jsonb_array_elements_text(p_payload->'tag_ids'))::uuid);
    DELETE FROM public.post_tags WHERE post_id = v_target_id;
    IF array_length(v_tag_ids, 1) > 0 THEN
      INSERT INTO public.post_tags (post_id, tag_id)
      SELECT v_target_id, tid FROM unnest(v_tag_ids) AS tid
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  -- Create revision snapshot on publish, status transition, or explicit revision flag
  IF v_status = 'PUBLISHED' OR COALESCE((p_payload->>'create_revision')::boolean, false) THEN
    SELECT COALESCE(MAX(version_number), 0) + 1 INTO v_next_version
    FROM public.post_revisions WHERE post_id = v_target_id;

    INSERT INTO public.post_revisions (
      post_id, version_number, title, subtitle, short_description, content, content_json,
      category_ids, tag_ids, seo_metadata, featured_image, modified_by
    )
    VALUES (
      v_target_id, v_next_version, v_result.title, v_result.subtitle, v_result.short_description,
      v_result.content, v_result.content_json,
      ARRAY(SELECT category_id FROM public.post_categories WHERE post_id = v_target_id),
      ARRAY(SELECT tag_id FROM public.post_tags WHERE post_id = v_target_id),
      jsonb_build_object(
        'seo_title', v_result.seo_title,
        'seo_description', v_result.seo_description,
        'canonical_url', v_result.canonical_url,
        'og_title', v_result.og_title,
        'og_description', v_result.og_description,
        'og_image', v_result.og_image,
        'robots_index', v_result.robots_index,
        'slug', v_result.slug,
        'language', v_result.language
      ),
      v_result.thumbnail,
      v_uid
    );
  END IF;

  -- Track scheduled job entry if SCHEDULED
  IF v_status = 'SCHEDULED' THEN
    UPDATE public.scheduled_publish_jobs SET status = 'cancelled' WHERE post_id = v_target_id AND status = 'pending';
    INSERT INTO public.scheduled_publish_jobs (post_id, scheduled_for, status)
    VALUES (v_target_id, v_sched, 'pending');
  END IF;

  -- Write audit log for meaningful lifecycle mutations
  IF v_is_new OR v_existing.status IS DISTINCT FROM v_result.status OR v_role = 'ADMIN' THEN
    PERFORM public.write_audit_log(
      v_uid,
      v_role,
      CASE
        WHEN v_result.status = 'PUBLISHED' AND (v_is_new OR v_existing.status <> 'PUBLISHED') THEN 'post.publish'
        WHEN v_result.status = 'ARCHIVED' THEN 'post.archive'
        WHEN v_is_new THEN 'post.create'
        ELSE 'post.update'
      END,
      'Post',
      v_target_id,
      CASE WHEN v_is_new THEN NULL ELSE jsonb_build_object('status', v_existing.status, 'title', v_existing.title, 'slug', v_existing.slug) END,
      jsonb_build_object('status', v_result.status, 'title', v_result.title, 'slug', v_result.slug, 'language', v_result.language)
    );
  END IF;

  RETURN to_jsonb(v_result);
END;
$$;

GRANT EXECUTE ON FUNCTION public.save_editorial_post(TEXT, JSONB) TO authenticated;

-- 8. Update notify-followers webhook trigger to fire ONLY when post becomes PUBLISHED
CREATE OR REPLACE FUNCTION public.handle_new_post_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  service_key TEXT;
BEGIN
  IF NEW.status = 'PUBLISHED' AND COALESCE(NEW.is_active, true) = true THEN
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM 'PUBLISHED') THEN
      BEGIN
        SELECT decrypted_secret INTO service_key
        FROM vault.decrypted_secrets
        WHERE name = 'SUPABASE_SERVICE_ROLE_KEY'
        LIMIT 1;
      EXCEPTION WHEN OTHERS THEN
        service_key := NULL;
      END;

      IF service_key IS NOT NULL THEN
        PERFORM net.http_post(
          url := 'https://vxenjlgoatbkfrfrkoeq.supabase.co/functions/v1/notify-followers',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || service_key
          ),
          body := jsonb_build_object('record', row_to_json(NEW))
        );
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_post_created ON public."Post";
CREATE TRIGGER on_post_created
  AFTER INSERT OR UPDATE OF status ON public."Post"
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_post_notification();

NOTIFY pgrst, 'reload schema';
