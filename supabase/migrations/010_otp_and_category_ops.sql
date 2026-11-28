-- ============================================================================
-- Migration 010: Creator OTP Onboarding Credentials, Safe Category Deletion,
-- Published Revision Concurrency Guard & Realtime Categories Sync
-- Safe & Idempotent
-- ============================================================================

-- 1. Locked table storing admin-issued Creator One-Time Password metadata
-- Kept strictly admin/service-only (never exposed via public "User" SELECT policy)
CREATE TABLE IF NOT EXISTS public.creator_otp_credentials (
  user_id TEXT PRIMARY KEY REFERENCES public."User"(id) ON DELETE CASCADE,
  otp_hash TEXT,
  issued_by TEXT REFERENCES public."User"(id) ON DELETE SET NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '48 hours'),
  consumed_at TIMESTAMPTZ,
  must_change_password BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.creator_otp_credentials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "creator_otp_admin_only" ON public.creator_otp_credentials;
CREATE POLICY "creator_otp_admin_only" ON public.creator_otp_credentials
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 2. Harden save_editorial_post for already-published edits & safe slug/translation_group handling
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
  v_translation_group_id UUID;
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

  IF v_status = 'PUBLISHED' THEN
    v_published_at := COALESCE(v_existing.published_at, now());
  ELSE
    v_published_at := v_existing.published_at;
  END IF;

  BEGIN
    IF p_payload ? 'translation_group_id' THEN
      v_translation_group_id := NULLIF(trim(COALESCE(p_payload->>'translation_group_id', '')), '')::uuid;
    ELSE
      v_translation_group_id := v_existing.translation_group_id;
    END IF;
  EXCEPTION WHEN invalid_text_representation THEN
    v_translation_group_id := v_existing.translation_group_id;
  END;

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
      v_translation_group_id,
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
      translation_group_id = v_translation_group_id,
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

  IF p_payload ? 'category_ids' AND jsonb_typeof(p_payload->'category_ids') = 'array' THEN
    v_cat_ids := ARRAY(SELECT (jsonb_array_elements_text(p_payload->'category_ids'))::uuid);
    DELETE FROM public.post_categories WHERE post_id = v_target_id;
    IF array_length(v_cat_ids, 1) > 0 THEN
      INSERT INTO public.post_categories (post_id, category_id, is_primary)
      SELECT v_target_id, cid, (idx = 1)
      FROM unnest(v_cat_ids) WITH ORDINALITY AS t(cid, idx)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  IF p_payload ? 'tag_ids' AND jsonb_typeof(p_payload->'tag_ids') = 'array' THEN
    v_tag_ids := ARRAY(SELECT (jsonb_array_elements_text(p_payload->'tag_ids'))::uuid);
    DELETE FROM public.post_tags WHERE post_id = v_target_id;
    IF array_length(v_tag_ids, 1) > 0 THEN
      INSERT INTO public.post_tags (post_id, tag_id)
      SELECT v_target_id, tid FROM unnest(v_tag_ids) AS tid
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

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
    )
    ON CONFLICT (post_id, version_number) DO NOTHING;
  END IF;

  IF v_status = 'SCHEDULED' THEN
    UPDATE public.scheduled_publish_jobs SET status = 'cancelled' WHERE post_id = v_target_id AND status = 'pending';
    INSERT INTO public.scheduled_publish_jobs (post_id, scheduled_for, status)
    VALUES (v_target_id, v_sched, 'pending');
  END IF;

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

NOTIFY pgrst, 'reload schema';
