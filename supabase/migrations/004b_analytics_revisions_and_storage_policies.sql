-- ============================================================================
-- Migration 004b: Revision Restore RPC, Creator/Admin Analytics RPCs,
-- SEO Audit Report RPC & Storage Bucket Security Policies
-- ============================================================================

-- 1. Restore Post Revision RPC (creates a new revision; preserves original published_at)
CREATE OR REPLACE FUNCTION public.restore_post_revision(p_revision_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid TEXT := auth.uid()::text;
  v_role TEXT := public.current_user_role();
  v_rev public.post_revisions%ROWTYPE;
  v_post public."Post"%ROWTYPE;
  v_next_ver INT;
  v_updated public."Post"%ROWTYPE;
BEGIN
  IF v_uid IS NULL OR NOT public.is_active_user() OR v_role NOT IN ('CREATOR', 'ANALYST', 'ADMIN') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT * INTO v_rev FROM public.post_revisions WHERE id = p_revision_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Revision not found';
  END IF;

  SELECT * INTO v_post FROM public."Post" WHERE id = v_rev.post_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Post not found';
  END IF;

  IF v_post."authorId" <> v_uid AND v_role <> 'ADMIN' THEN
    RAISE EXCEPTION 'Forbidden: ownership check failed';
  END IF;

  UPDATE public."Post"
  SET
    title = v_rev.title,
    subtitle = v_rev.subtitle,
    short_description = v_rev.short_description,
    content = COALESCE(v_rev.content, content),
    content_json = COALESCE(v_rev.content_json, content_json),
    thumbnail = COALESCE(v_rev.featured_image, thumbnail),
    seo_title = COALESCE(v_rev.seo_metadata->>'seo_title', seo_title),
    seo_description = COALESCE(v_rev.seo_metadata->>'seo_description', seo_description),
    canonical_url = COALESCE(v_rev.seo_metadata->>'canonical_url', canonical_url),
    og_title = COALESCE(v_rev.seo_metadata->>'og_title', og_title),
    og_description = COALESCE(v_rev.seo_metadata->>'og_description', og_description),
    og_image = COALESCE(v_rev.seo_metadata->>'og_image', og_image),
    "updatedAt" = now()
  WHERE id = v_post.id
  RETURNING * INTO v_updated;

  SELECT COALESCE(MAX(version_number), 0) + 1 INTO v_next_ver
  FROM public.post_revisions WHERE post_id = v_post.id;

  INSERT INTO public.post_revisions (
    post_id, version_number, title, subtitle, short_description, content, content_json,
    category_ids, tag_ids, seo_metadata, featured_image, modified_by
  )
  VALUES (
    v_post.id, v_next_ver, v_updated.title, v_updated.subtitle, v_updated.short_description,
    v_updated.content, v_updated.content_json, v_rev.category_ids, v_rev.tag_ids,
    v_rev.seo_metadata, v_updated.thumbnail, v_uid
  );

  PERFORM public.write_audit_log(
    v_uid, v_role, 'post.revision_restore', 'Post', v_post.id,
    jsonb_build_object('title', v_post.title),
    jsonb_build_object('restored_version', v_rev.version_number, 'new_version', v_next_ver)
  );

  RETURN to_jsonb(v_updated);
END;
$$;

GRANT EXECUTE ON FUNCTION public.restore_post_revision(UUID) TO authenticated;

-- 2. Creator Analytics RPC (strictly scoped to caller or admin)
CREATE OR REPLACE FUNCTION public.get_creator_analytics(
  p_creator_id TEXT DEFAULT NULL,
  p_from TIMESTAMPTZ DEFAULT (now() - interval '30 days'),
  p_to TIMESTAMPTZ DEFAULT now()
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid TEXT := auth.uid()::text;
  v_role TEXT := public.current_user_role();
  v_target TEXT := COALESCE(NULLIF(p_creator_id, ''), v_uid);
  v_summary JSONB;
  v_timeseries JSONB;
  v_top_posts JSONB;
  v_categories JSONB;
BEGIN
  IF v_uid IS NULL OR NOT public.is_active_user() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  IF v_target <> v_uid AND v_role <> 'ADMIN' THEN
    RAISE EXCEPTION 'Forbidden: cannot access another creator analytics';
  END IF;

  SELECT jsonb_build_object(
    'totalPosts', count(*),
    'publishedPosts', count(*) FILTER (WHERE status = 'PUBLISHED'),
    'draftPosts', count(*) FILTER (WHERE status = 'DRAFT'),
    'scheduledPosts', count(*) FILTER (WHERE status = 'SCHEDULED'),
    'archivedPosts', count(*) FILTER (WHERE status = 'ARCHIVED'),
    'blogCount', count(*) FILTER (WHERE type = 'BLOG'),
    'newsCount', count(*) FILTER (WHERE type = 'NEWS'),
    'videoCount', count(*) FILTER (WHERE type = 'VIDEO'),
    'englishCount', count(*) FILTER (WHERE language = 'en'),
    'tamilCount', count(*) FILTER (WHERE language = 'ta'),
    'totalViews', COALESCE(sum(views_count), 0),
    'totalLikes', COALESCE(sum(likes_count), 0),
    'totalComments', COALESCE(sum(comments_count), 0),
    'totalFollowers', (SELECT count(*) FROM public."Follow" WHERE "followingId" = v_target),
    'storyViews', (SELECT COALESCE(sum(viewers_count), 0) FROM public.stories WHERE creator_id = v_target)
  ) INTO v_summary
  FROM public."Post"
  WHERE "authorId" = v_target
    AND "createdAt"::timestamptz BETWEEN p_from AND p_to;

  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO v_timeseries
  FROM (
    SELECT
      to_char(date_trunc('day', COALESCE(pv.created_at, pv."createdAt"::timestamptz)), 'YYYY-MM-DD') AS day,
      count(*) AS views
    FROM public."PostView" pv
    JOIN public."Post" p ON p.id = pv."postId"
    WHERE p."authorId" = v_target
      AND COALESCE(pv.created_at, pv."createdAt"::timestamptz) BETWEEN p_from AND p_to
    GROUP BY 1
    ORDER BY 1 ASC
  ) t;

  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO v_top_posts
  FROM (
    SELECT id, title, slug, language, type::text, category, views_count, likes_count, comments_count, published_at
    FROM public."Post"
    WHERE "authorId" = v_target AND status = 'PUBLISHED'
    ORDER BY views_count DESC, likes_count DESC
    LIMIT 10
  ) t;

  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO v_categories
  FROM (
    SELECT COALESCE(NULLIF(custom_category, ''), category, 'General') AS name,
           count(*) AS posts,
           COALESCE(sum(views_count), 0) AS views,
           COALESCE(sum(likes_count), 0) AS likes
    FROM public."Post"
    WHERE "authorId" = v_target
    GROUP BY 1
    ORDER BY views DESC
  ) t;

  RETURN jsonb_build_object(
    'summary', v_summary,
    'viewsSeries', v_timeseries,
    'topPosts', v_top_posts,
    'byCategory', v_categories
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_creator_analytics(TEXT, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;

-- 3. Admin SEO Audit Report RPC
CREATE OR REPLACE FUNCTION public.get_seo_audit_report()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_counts JSONB;
  v_issues JSONB;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Forbidden: Admin access required';
  END IF;

  SELECT jsonb_build_object(
    'totalPublished', count(*) FILTER (WHERE status = 'PUBLISHED' AND COALESCE(is_active, true) = true),
    'indexableCount', count(*) FILTER (WHERE status = 'PUBLISHED' AND COALESCE(is_active, true) = true AND robots_index = true),
    'missingSeoTitle', count(*) FILTER (WHERE status = 'PUBLISHED' AND NULLIF(trim(COALESCE(seo_title, '')), '') IS NULL),
    'missingMetaDescription', count(*) FILTER (WHERE status = 'PUBLISHED' AND NULLIF(trim(COALESCE(seo_description, short_description, '')), '') IS NULL),
    'missingAltText', count(*) FILTER (WHERE status = 'PUBLISHED' AND NULLIF(trim(COALESCE(thumbnail, '')), '') IS NOT NULL AND NULLIF(trim(COALESCE(featured_image_alt, '')), '') IS NULL),
    'untranslatedPosts', count(*) FILTER (WHERE status = 'PUBLISHED' AND translation_group_id IS NULL),
    'englishPublished', count(*) FILTER (WHERE status = 'PUBLISHED' AND language = 'en'),
    'tamilPublished', count(*) FILTER (WHERE status = 'PUBLISHED' AND language = 'ta')
  ) INTO v_counts
  FROM public."Post";

  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO v_issues
  FROM (
    SELECT
      p.id, p.title, p.slug, p.language, p.status, p.seo_title, p.seo_description,
      p.featured_image_alt, p.canonical_url, p.robots_index, p.translation_group_id,
      u.username AS author_username, p.category, p."updatedAt"
    FROM public."Post" p
    LEFT JOIN public."User" u ON u.id = p."authorId"
    WHERE p.status = 'PUBLISHED'
      AND (
        NULLIF(trim(COALESCE(p.seo_title, '')), '') IS NULL
        OR NULLIF(trim(COALESCE(p.seo_description, p.short_description, '')), '') IS NULL
        OR (NULLIF(trim(COALESCE(p.thumbnail, '')), '') IS NOT NULL AND NULLIF(trim(COALESCE(p.featured_image_alt, '')), '') IS NULL)
      )
    ORDER BY p."updatedAt" DESC
    LIMIT 100
  ) t;

  RETURN jsonb_build_object('counts', v_counts, 'issues', v_issues);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_seo_audit_report() TO authenticated;

-- 4. Storage Bucket Policies (media, videos, ads, ad-videos)
DO $$
BEGIN
  DROP POLICY IF EXISTS "media_upload" ON storage.objects;
  DROP POLICY IF EXISTS "media_read" ON storage.objects;
  DROP POLICY IF EXISTS "media_delete" ON storage.objects;
  DROP POLICY IF EXISTS "postsapp_storage_public_read" ON storage.objects;
  DROP POLICY IF EXISTS "postsapp_storage_auth_upload" ON storage.objects;
  DROP POLICY IF EXISTS "postsapp_storage_owner_delete" ON storage.objects;
  DROP POLICY IF EXISTS "postsapp_storage_admin_ads" ON storage.objects;

  CREATE POLICY "postsapp_storage_public_read" ON storage.objects
    FOR SELECT USING (bucket_id IN ('media', 'videos', 'ads', 'ad-videos'));

  CREATE POLICY "postsapp_storage_auth_upload" ON storage.objects
    FOR INSERT WITH CHECK (
      bucket_id IN ('media', 'videos')
      AND auth.role() = 'authenticated'
      AND auth.uid()::text = (storage.foldername(name))[1]
      AND public.is_active_user()
    );

  CREATE POLICY "postsapp_storage_owner_delete" ON storage.objects
    FOR DELETE USING (
      (bucket_id IN ('media', 'videos') AND auth.uid()::text = (storage.foldername(name))[1])
      OR public.is_admin()
    );

  CREATE POLICY "postsapp_storage_admin_ads" ON storage.objects
    FOR ALL USING (
      bucket_id IN ('ads', 'ad-videos') AND public.is_admin()
    )
    WITH CHECK (
      bucket_id IN ('ads', 'ad-videos') AND public.is_admin()
    );
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Storage policy update skipped: %', SQLERRM;
END $$;

NOTIFY pgrst, 'reload schema';
