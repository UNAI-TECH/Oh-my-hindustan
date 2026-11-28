-- ============================================================================
-- Migration 008: Realtime Publication, Post Shares & Saves Tracking,
-- Creator Analytics Enhancement, and Resilient Citizen Profile Provisioning
-- Non-destructive & idempotent
-- ============================================================================

-- 1. Authoritative saves_count & shares_count columns on public."Post"
ALTER TABLE public."Post"
  ADD COLUMN IF NOT EXISTS saves_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shares_count INTEGER NOT NULL DEFAULT 0;

-- 2. Tracked Article Shares table (supports both authenticated readers & guests)
CREATE TABLE IF NOT EXISTS public.post_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id TEXT NOT NULL REFERENCES public."Post"(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES public."User"(id) ON DELETE SET NULL,
  visitor_key TEXT,
  channel TEXT NOT NULL DEFAULT 'share',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_post_shares_post_created
  ON public.post_shares(post_id, created_at DESC);

ALTER TABLE public.post_shares ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "post_shares_select" ON public.post_shares;
CREATE POLICY "post_shares_select" ON public.post_shares
  FOR SELECT USING (
    auth.uid()::text = user_id
    OR EXISTS (
      SELECT 1 FROM public."Post" p
      WHERE p.id = post_id AND p."authorId" = auth.uid()::text
    )
    OR public.is_admin()
  );

-- Allow creators to read & subscribe to saves on their own posts for realtime counters
DROP POLICY IF EXISTS "save_select_own" ON public."Save";
CREATE POLICY "save_select_own" ON public."Save"
  FOR SELECT USING (
    auth.uid()::text = "userId"
    OR EXISTS (
      SELECT 1 FROM public."Post" p
      WHERE p.id = "postId" AND p."authorId" = auth.uid()::text
    )
    OR public.is_admin()
  );

-- Backfill saves_count and shares_count safely
UPDATE public."Post" p
SET
  saves_count = COALESCE((SELECT count(*)::int FROM public."Save" s WHERE s."postId" = p.id), 0),
  shares_count = COALESCE((SELECT count(*)::int FROM public.post_shares sh WHERE sh.post_id = p.id), 0)
    + COALESCE((SELECT count(*)::int FROM public."Comment" c WHERE c."postId" = p.id AND c.content = '[SYSTEM_REPOST]'), 0)
WHERE p.id IS NOT NULL;

-- 3. Trigger functions to keep Post.saves_count & Post.shares_count synced
CREATE OR REPLACE FUNCTION public.sync_post_save_counters()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_post_id TEXT := COALESCE(NEW."postId", OLD."postId");
BEGIN
  UPDATE public."Post"
  SET saves_count = COALESCE((SELECT count(*)::int FROM public."Save" WHERE "postId" = target_post_id), 0)
  WHERE id = target_post_id;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_post_save_counters ON public."Save";
CREATE TRIGGER trg_sync_post_save_counters
  AFTER INSERT OR DELETE ON public."Save"
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_post_save_counters();

CREATE OR REPLACE FUNCTION public.sync_post_share_counters()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_post_id TEXT := COALESCE(NEW.post_id, OLD.post_id);
BEGIN
  UPDATE public."Post"
  SET shares_count =
    COALESCE((SELECT count(*)::int FROM public.post_shares WHERE post_id = target_post_id), 0)
    + COALESCE((SELECT count(*)::int FROM public."Comment" WHERE "postId" = target_post_id AND content = '[SYSTEM_REPOST]'), 0)
  WHERE id = target_post_id;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_post_share_counters ON public.post_shares;
CREATE TRIGGER trg_sync_post_share_counters
  AFTER INSERT OR DELETE ON public.post_shares
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_post_share_counters();

-- 4. RPC: Record article share cleanly for both guests & authenticated users
CREATE OR REPLACE FUNCTION public.record_post_share(
  p_post_id TEXT,
  p_channel TEXT DEFAULT 'share',
  p_visitor_key TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id TEXT := auth.uid()::text;
  v_channel TEXT := COALESCE(NULLIF(left(trim(p_channel), 32), ''), 'share');
BEGIN
  IF p_post_id IS NULL THEN
    RETURN false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public."Post"
    WHERE id = p_post_id AND status = 'PUBLISHED' AND COALESCE(is_active, true) = true
  ) THEN
    RETURN false;
  END IF;

  INSERT INTO public.post_shares (post_id, user_id, visitor_key, channel, created_at)
  VALUES (
    p_post_id,
    CASE WHEN v_user_id IS NOT NULL AND EXISTS (SELECT 1 FROM public."User" WHERE id = v_user_id) THEN v_user_id ELSE NULL END,
    COALESCE(v_user_id, NULLIF(trim(p_visitor_key), '')),
    v_channel,
    now()
  );

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_post_share(TEXT, TEXT, TEXT) TO anon, authenticated;

-- 5. Resilient Citizen Profile Provisioning (fixes OAuth/email missing User row causing RLS blocks)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT := lower(trim(COALESCE(NEW.email, '')));
  v_full_name TEXT := NULLIF(trim(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '')), '');
  v_avatar TEXT := NULLIF(trim(COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', '')), '');
BEGIN
  BEGIN
    INSERT INTO public."User" (
      id, email, username, password, role, channel_name, "avatarUrl",
      account_status, onboarding_complete, "createdAt", "updatedAt"
    )
    VALUES (
      NEW.id::text,
      v_email,
      NULL,
      'oauth_managed',
      'CITIZEN'::"Role",
      v_full_name,
      v_avatar,
      'active',
      false,
      now(),
      now()
    )
    ON CONFLICT (id) DO UPDATE SET
      email = CASE WHEN EXCLUDED.email <> '' THEN EXCLUDED.email ELSE public."User".email END,
      channel_name = COALESCE(public."User".channel_name, EXCLUDED.channel_name),
      "avatarUrl" = COALESCE(public."User"."avatarUrl", EXCLUDED."avatarUrl"),
      "updatedAt" = now();
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO public.auth_debug_log (user_id, error_msg, raw_data)
    VALUES (NEW.id::text, SQLERRM, to_jsonb(NEW));
  END;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.ensure_citizen_profile()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid TEXT := auth.uid()::text;
  v_auth RECORD;
  v_row public."User"%ROWTYPE;
  v_email TEXT;
  v_name TEXT;
  v_avatar TEXT;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT * INTO v_row FROM public."User" WHERE id = v_uid LIMIT 1;
  IF FOUND THEN
    SELECT email, raw_user_meta_data INTO v_auth FROM auth.users WHERE id = v_uid::uuid;
    v_name := NULLIF(trim(COALESCE(v_auth.raw_user_meta_data->>'full_name', v_auth.raw_user_meta_data->>'name', '')), '');
    v_avatar := NULLIF(trim(COALESCE(v_auth.raw_user_meta_data->>'avatar_url', v_auth.raw_user_meta_data->>'picture', '')), '');

    IF (v_row.channel_name IS NULL AND v_name IS NOT NULL)
       OR (v_row."avatarUrl" IS NULL AND v_avatar IS NOT NULL)
       OR v_row.account_status IS NULL THEN
      UPDATE public."User"
      SET
        channel_name = COALESCE(channel_name, v_name),
        "avatarUrl" = COALESCE("avatarUrl", v_avatar),
        account_status = COALESCE(NULLIF(account_status, ''), 'active'),
        "updatedAt" = now()
      WHERE id = v_uid
      RETURNING * INTO v_row;
    END IF;
    RETURN to_jsonb(v_row);
  END IF;

  SELECT email, raw_user_meta_data INTO v_auth FROM auth.users WHERE id = v_uid::uuid;
  v_email := lower(trim(COALESCE(v_auth.email, '')));
  v_name := NULLIF(trim(COALESCE(v_auth.raw_user_meta_data->>'full_name', v_auth.raw_user_meta_data->>'name', '')), '');
  v_avatar := NULLIF(trim(COALESCE(v_auth.raw_user_meta_data->>'avatar_url', v_auth.raw_user_meta_data->>'picture', '')), '');

  BEGIN
    INSERT INTO public."User" (
      id, email, username, password, role, channel_name, "avatarUrl",
      account_status, onboarding_complete, "createdAt", "updatedAt"
    )
    VALUES (
      v_uid,
      v_email,
      NULL,
      'oauth_managed',
      'CITIZEN'::"Role",
      v_name,
      v_avatar,
      'active',
      false,
      now(),
      now()
    )
    ON CONFLICT (id) DO UPDATE SET
      account_status = COALESCE(NULLIF(public."User".account_status, ''), 'active'),
      channel_name = COALESCE(public."User".channel_name, EXCLUDED.channel_name),
      "avatarUrl" = COALESCE(public."User"."avatarUrl", EXCLUDED."avatarUrl"),
      "updatedAt" = now()
    RETURNING * INTO v_row;
  EXCEPTION WHEN unique_violation THEN
    -- Handle legacy User row sharing the same email under an older auth ID
    SELECT * INTO v_row FROM public."User" WHERE lower(email) = v_email LIMIT 1;
    IF NOT FOUND THEN
      INSERT INTO public."User" (
        id, email, username, password, role, channel_name, "avatarUrl",
        account_status, onboarding_complete, "createdAt", "updatedAt"
      )
      VALUES (
        v_uid,
        v_uid || '+' || COALESCE(NULLIF(v_email, ''), 'user@postsapp.in'),
        NULL,
        'oauth_managed',
        'CITIZEN'::"Role",
        v_name,
        v_avatar,
        'active',
        false,
        now(),
        now()
      )
      RETURNING * INTO v_row;
    END IF;
  END;

  RETURN to_jsonb(v_row);
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_citizen_profile() TO authenticated;

-- 6. Enhanced Creator Analytics RPC (adds totalSaves, totalShares, and daily saves/shares breakdown)
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
    'totalSaves', COALESCE(sum(saves_count), 0),
    'totalShares', COALESCE(sum(shares_count), 0),
    'totalFollowers', (SELECT count(*) FROM public."Follow" WHERE "followingId" = v_target),
    'storyViews', (SELECT COALESCE(sum(viewers_count), 0) FROM public.stories WHERE creator_id = v_target)
  ) INTO v_summary
  FROM public."Post"
  WHERE "authorId" = v_target
    AND "createdAt"::timestamptz BETWEEN p_from AND p_to;

  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO v_timeseries
  FROM (
    WITH days AS (
      SELECT to_char(date_trunc('day', COALESCE(pv.created_at, pv."createdAt"::timestamptz)), 'YYYY-MM-DD') AS day,
             count(*)::int AS views, 0::int AS saves, 0::int AS shares
      FROM public."PostView" pv
      JOIN public."Post" p ON p.id = pv."postId"
      WHERE p."authorId" = v_target
        AND COALESCE(pv.created_at, pv."createdAt"::timestamptz) BETWEEN p_from AND p_to
      GROUP BY 1
      UNION ALL
      SELECT to_char(date_trunc('day', s."createdAt"::timestamptz), 'YYYY-MM-DD') AS day,
             0::int AS views, count(*)::int AS saves, 0::int AS shares
      FROM public."Save" s
      JOIN public."Post" p ON p.id = s."postId"
      WHERE p."authorId" = v_target
        AND s."createdAt"::timestamptz BETWEEN p_from AND p_to
      GROUP BY 1
      UNION ALL
      SELECT to_char(date_trunc('day', sh.created_at), 'YYYY-MM-DD') AS day,
             0::int AS views, 0::int AS saves, count(*)::int AS shares
      FROM public.post_shares sh
      JOIN public."Post" p ON p.id = sh.post_id
      WHERE p."authorId" = v_target
        AND sh.created_at BETWEEN p_from AND p_to
      GROUP BY 1
    )
    SELECT day, sum(views)::int AS views, sum(saves)::int AS saves, sum(shares)::int AS shares
    FROM days
    GROUP BY day
    ORDER BY day ASC
  ) t;

  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO v_top_posts
  FROM (
    SELECT id, title, slug, language, type::text, category,
           views_count, likes_count, comments_count, saves_count, shares_count, published_at
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
           COALESCE(sum(likes_count), 0) AS likes,
           COALESCE(sum(saves_count), 0) AS saves,
           COALESCE(sum(shares_count), 0) AS shares
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

-- 7. Ensure Supabase Realtime publication covers all live tables across Public, Creator & Admin
DO $$
DECLARE
  tbl TEXT;
  realtime_tables TEXT[] := ARRAY[
    'homepage_config',
    'categories',
    'tags',
    'site_settings',
    'ads',
    'Post',
    'Vote',
    'Comment',
    'Save',
    'Follow',
    'PostView',
    'post_shares',
    'User',
    'stories',
    'story_views',
    'story_likes',
    'story_shares',
    'Notification'
  ];
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    FOREACH tbl IN ARRAY realtime_tables LOOP
      IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = tbl
      ) THEN
        EXECUTE format('ALTER TABLE public.%I REPLICA IDENTITY FULL;', tbl);
        IF NOT EXISTS (
          SELECT 1 FROM pg_publication_tables
          WHERE pubname = 'supabase_realtime'
            AND schemaname = 'public'
            AND tablename = tbl
        ) THEN
          EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I;', tbl);
        END IF;
      END IF;
    END LOOP;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
