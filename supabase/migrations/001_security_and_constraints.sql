-- ============================================================================
-- Migration 001: Security Hardening, Role Enforcement & Core Constraints
-- Non-destructive: preserves all existing users, posts, media, and engagement
-- ============================================================================

-- 1. Account lifecycle & security columns on public."User"
ALTER TABLE public."User"
  ADD COLUMN IF NOT EXISTS account_status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspended_reason TEXT,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

DO $$ BEGIN
  ALTER TABLE public."User"
    ADD CONSTRAINT "User_account_status_check"
    CHECK (account_status IN ('active', 'suspended', 'deactivated'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Remove plaintext temporary passwords (security requirement 20.4)
ALTER TABLE public."User" DROP COLUMN IF EXISTS temporary_password;

-- 2. Auth/Role helper functions (SECURITY DEFINER with locked search_path)
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role::text FROM public."User" WHERE id = auth.uid()::text;
$$;

CREATE OR REPLACE FUNCTION public.is_active_user()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT account_status = 'active' AND deleted_at IS NULL FROM public."User" WHERE id = auth.uid()::text),
    false
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT public.current_user_role() = 'ADMIN' AND public.is_active_user();
$$;

CREATE OR REPLACE FUNCTION public.is_creator_or_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT public.current_user_role() IN ('CREATOR', 'ANALYST', 'ADMIN') AND public.is_active_user();
$$;

-- 3. Prevent client-side role or account_status escalation on public."User"
CREATE OR REPLACE FUNCTION public.prevent_user_privilege_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  jwt_role TEXT := COALESCE(current_setting('request.jwt.claim.role', true), '');
BEGIN
  IF jwt_role = 'service_role' OR current_user IN ('postgres', 'supabase_admin') THEN
    RETURN NEW;
  END IF;

  IF NOT public.is_admin() THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'Forbidden: cannot modify user role';
    END IF;
    IF NEW.account_status IS DISTINCT FROM OLD.account_status
       OR NEW.suspended_at IS DISTINCT FROM OLD.suspended_at
       OR NEW.suspended_reason IS DISTINCT FROM OLD.suspended_reason THEN
      RAISE EXCEPTION 'Forbidden: cannot modify account status';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_user_privilege_escalation ON public."User";
CREATE TRIGGER trg_prevent_user_privilege_escalation
  BEFORE UPDATE ON public."User"
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_user_privilege_escalation();

-- Prevent self-escalation on direct INSERT into public."User"
CREATE OR REPLACE FUNCTION public.enforce_default_citizen_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  jwt_role TEXT := COALESCE(current_setting('request.jwt.claim.role', true), '');
BEGIN
  IF jwt_role = 'service_role' OR current_user IN ('postgres', 'supabase_admin') OR public.is_admin() THEN
    RETURN NEW;
  END IF;
  NEW.role := 'CITIZEN'::"Role";
  NEW.account_status := 'active';
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_default_citizen_on_insert ON public."User";
CREATE TRIGGER trg_enforce_default_citizen_on_insert
  BEFORE INSERT ON public."User"
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_default_citizen_on_insert();

-- 4. Force creator_requests inserts to always start as 'pending' unless admin/service_role
CREATE OR REPLACE FUNCTION public.enforce_pending_creator_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  jwt_role TEXT := COALESCE(current_setting('request.jwt.claim.role', true), '');
BEGIN
  IF jwt_role = 'service_role' OR current_user IN ('postgres', 'supabase_admin') OR public.is_admin() THEN
    RETURN NEW;
  END IF;
  NEW.status := 'pending'::request_status;
  NEW.admin_message := NULL;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_pending_creator_request ON public.creator_requests;
CREATE TRIGGER trg_enforce_pending_creator_request
  BEFORE INSERT ON public.creator_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_pending_creator_request();

-- 5. Safe public RPCs (replacing direct table scans on sensitive tables)
CREATE OR REPLACE FUNCTION public.get_creator_request_status(p_email TEXT)
RETURNS TABLE(status TEXT, admin_message TEXT, created_at TIMESTAMPTZ)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT cr.status::text, cr.admin_message, cr.created_at
  FROM public.creator_requests cr
  WHERE lower(cr.email) = lower(trim(p_email))
     OR lower(COALESCE(cr.channel_email, '')) = lower(trim(p_email))
  ORDER BY cr.created_at DESC
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.check_username_available(p_username TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public."User" WHERE lower(username) = lower(trim(p_username))
  ) AND NOT EXISTS (
    SELECT 1 FROM public.creator_requests WHERE lower(username) = lower(trim(p_username)) AND status <> 'rejected'
  );
$$;

GRANT EXECUTE ON FUNCTION public.get_creator_request_status(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_username_available(TEXT) TO anon, authenticated;

-- 6. Engagement constraints & Feedback extension
DO $$ BEGIN
  ALTER TABLE public."Vote" ADD CONSTRAINT "Vote_type_check" CHECK (type IN (1, -1));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public."Vote" ADD CONSTRAINT "Vote_user_post_unique" UNIQUE ("userId", "postId");
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public."Save" ADD CONSTRAINT "Save_user_post_unique" UNIQUE ("userId", "postId");
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public."Follow" ADD CONSTRAINT "Follow_follower_following_unique" UNIQUE ("followerId", "followingId");
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public."PostView"
  ADD COLUMN IF NOT EXISTS visitor_key TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE public."Feedback"
  ADD COLUMN IF NOT EXISTS response_text TEXT,
  ADD COLUMN IF NOT EXISTS responded_by TEXT,
  ADD COLUMN IF NOT EXISTS responded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 7. Ad Engine hardening (constraints + atomic RPCs + RLS enabled)
DO $$ BEGIN
  ALTER TABLE public.ads ADD CONSTRAINT "ads_budget_non_negative" CHECK (budget_total >= 0 AND budget_remaining >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.ads ADD CONSTRAINT "ads_status_check" CHECK (status IN ('active', 'paused', 'completed'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION public.track_ad_impression(p_ad_id uuid, p_user_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cpm numeric;
  v_pricing text;
  v_cost numeric := 0;
  v_actor text := NULLIF(trim(COALESCE(p_user_id, '')), '');
BEGIN
  IF v_actor IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.ad_impressions (ad_id, user_id)
  VALUES (p_ad_id, v_actor)
  ON CONFLICT (ad_id, user_id) DO NOTHING;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  SELECT pricing_model, COALESCE(cpm_amount, 0)
  INTO v_pricing, v_cpm
  FROM public.ads
  WHERE id = p_ad_id AND status = 'active' AND budget_remaining > 0
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  IF v_pricing = 'cpm' THEN
    v_cost := LEAST(v_cpm / 1000.0, (SELECT budget_remaining FROM public.ads WHERE id = p_ad_id));
  END IF;

  UPDATE public.ads
  SET
    impressions_count = COALESCE(impressions_count, 0) + 1,
    total_spent = COALESCE(total_spent, 0) + v_cost,
    budget_remaining = GREATEST(0, COALESCE(budget_remaining, 0) - v_cost),
    status = CASE WHEN GREATEST(0, COALESCE(budget_remaining, 0) - v_cost) <= 0 THEN 'completed' ELSE status END
  WHERE id = p_ad_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.track_ad_click(p_ad_id uuid, p_user_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cpc numeric;
  v_pricing text;
  v_cost numeric := 0;
  v_rem numeric := 0;
  v_actor text := NULLIF(trim(COALESCE(p_user_id, '')), '');
BEGIN
  IF v_actor IS NULL THEN
    RETURN;
  END IF;

  SELECT pricing_model, COALESCE(cpc_amount, 0), COALESCE(budget_remaining, 0)
  INTO v_pricing, v_cpc, v_rem
  FROM public.ads
  WHERE id = p_ad_id AND status = 'active' AND budget_remaining > 0
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  IF v_pricing = 'cpc' THEN
    v_cost := LEAST(v_cpc, v_rem);
  END IF;

  INSERT INTO public.ad_clicks (ad_id, user_id, cost)
  VALUES (p_ad_id, v_actor, v_cost)
  ON CONFLICT (ad_id, user_id) DO NOTHING;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  UPDATE public.ads
  SET
    clicks_count = COALESCE(clicks_count, 0) + 1,
    total_spent = COALESCE(total_spent, 0) + v_cost,
    budget_remaining = GREATEST(0, COALESCE(budget_remaining, 0) - v_cost),
    status = CASE WHEN GREATEST(0, COALESCE(budget_remaining, 0) - v_cost) <= 0 THEN 'completed' ELSE status END
  WHERE id = p_ad_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.track_video_ad_view(p_video_ad_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.video_ads
  SET
    views = COALESCE(views, 0) + 1,
    revenue = COALESCE(revenue, 0) + COALESCE(revenue_per_view, 0)
  WHERE id = p_video_ad_id AND is_active = true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.track_ad_impression(uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.track_ad_click(uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.track_video_ad_view(text) TO anon, authenticated;

-- 8. Enable and tighten RLS on ALL active tables
-- 8a. "User"
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read users" ON public."User";
DROP POLICY IF EXISTS "Auth users can insert users" ON public."User";
DROP POLICY IF EXISTS "Users can update profiles" ON public."User";
DROP POLICY IF EXISTS "Public access" ON public."User";
DROP POLICY IF EXISTS "Users update own record" ON public."User";
DROP POLICY IF EXISTS "Anyone can insert" ON public."User";
DROP POLICY IF EXISTS "user_select_public_or_own" ON public."User";
DROP POLICY IF EXISTS "user_insert_own" ON public."User";
DROP POLICY IF EXISTS "user_update_own_or_admin" ON public."User";
DROP POLICY IF EXISTS "user_delete_admin" ON public."User";

-- Active users & creators visible for author attribution/login lookup; suspended/deleted hidden except to admin
CREATE POLICY "user_select_public_or_own" ON public."User"
  FOR SELECT USING (
    (COALESCE(account_status, 'active') = 'active' AND deleted_at IS NULL)
    OR auth.uid()::text = id
    OR public.is_admin()
  );
CREATE POLICY "user_insert_own" ON public."User"
  FOR INSERT WITH CHECK (auth.uid()::text = id OR public.is_admin());
CREATE POLICY "user_update_own_or_admin" ON public."User"
  FOR UPDATE USING ((auth.uid()::text = id AND public.is_active_user()) OR public.is_admin())
  WITH CHECK ((auth.uid()::text = id AND public.is_active_user()) OR public.is_admin());
CREATE POLICY "user_delete_admin" ON public."User"
  FOR DELETE USING (public.is_admin());

-- 8b. "Post"
ALTER TABLE public."Post" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read posts" ON public."Post";
DROP POLICY IF EXISTS "Auth users can insert posts" ON public."Post";
DROP POLICY IF EXISTS "Authors can update own posts" ON public."Post";
DROP POLICY IF EXISTS "Authors can delete own posts" ON public."Post";
DROP POLICY IF EXISTS "post_select_visible" ON public."Post";
DROP POLICY IF EXISTS "post_insert_creator" ON public."Post";
DROP POLICY IF EXISTS "post_update_own_or_admin" ON public."Post";
DROP POLICY IF EXISTS "post_delete_own_or_admin" ON public."Post";

CREATE POLICY "post_select_visible" ON public."Post"
  FOR SELECT USING (
    (COALESCE(status, 'PUBLISHED') = 'PUBLISHED' AND COALESCE(is_active, true) = true)
    OR "authorId" = auth.uid()::text
    OR public.is_admin()
  );
CREATE POLICY "post_insert_creator" ON public."Post"
  FOR INSERT WITH CHECK (
    "authorId" = auth.uid()::text AND public.is_creator_or_admin()
  );
CREATE POLICY "post_update_own_or_admin" ON public."Post"
  FOR UPDATE USING (
    ("authorId" = auth.uid()::text AND public.is_creator_or_admin()) OR public.is_admin()
  )
  WITH CHECK (
    ("authorId" = auth.uid()::text AND public.is_creator_or_admin()) OR public.is_admin()
  );
CREATE POLICY "post_delete_own_or_admin" ON public."Post"
  FOR DELETE USING (
    ("authorId" = auth.uid()::text AND public.is_creator_or_admin()) OR public.is_admin()
  );

-- 8c. "Vote"
ALTER TABLE public."Vote" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read votes" ON public."Vote";
DROP POLICY IF EXISTS "Auth users can insert votes" ON public."Vote";
DROP POLICY IF EXISTS "Users can update own votes" ON public."Vote";
DROP POLICY IF EXISTS "Users can delete own votes" ON public."Vote";
CREATE POLICY "vote_select_all" ON public."Vote" FOR SELECT USING (true);
CREATE POLICY "vote_insert_own" ON public."Vote" FOR INSERT WITH CHECK (auth.uid()::text = "userId" AND public.is_active_user());
CREATE POLICY "vote_update_own" ON public."Vote" FOR UPDATE USING (auth.uid()::text = "userId" AND public.is_active_user());
CREATE POLICY "vote_delete_own" ON public."Vote" FOR DELETE USING (auth.uid()::text = "userId" OR public.is_admin());

-- 8d. "Comment" & "CommentVote"
ALTER TABLE public."Comment" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read comments" ON public."Comment";
DROP POLICY IF EXISTS "Auth users can insert comments" ON public."Comment";
DROP POLICY IF EXISTS "Users can update own comments" ON public."Comment";
DROP POLICY IF EXISTS "Users can delete own comments" ON public."Comment";
CREATE POLICY "comment_select_all" ON public."Comment" FOR SELECT USING (true);
CREATE POLICY "comment_insert_own" ON public."Comment" FOR INSERT WITH CHECK (auth.uid()::text = "userId" AND public.is_active_user());
CREATE POLICY "comment_update_own_or_author" ON public."Comment"
  FOR UPDATE USING (
    (auth.uid()::text = "userId" AND public.is_active_user())
    OR EXISTS (SELECT 1 FROM public."Post" p WHERE p.id = "postId" AND p."authorId" = auth.uid()::text)
    OR public.is_admin()
  );
CREATE POLICY "comment_delete_own_or_author" ON public."Comment"
  FOR DELETE USING (
    auth.uid()::text = "userId"
    OR EXISTS (SELECT 1 FROM public."Post" p WHERE p.id = "postId" AND p."authorId" = auth.uid()::text)
    OR public.is_admin()
  );

ALTER TABLE public."CommentVote" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "comment_vote_select" ON public."CommentVote";
DROP POLICY IF EXISTS "comment_vote_insert" ON public."CommentVote";
DROP POLICY IF EXISTS "comment_vote_update" ON public."CommentVote";
DROP POLICY IF EXISTS "comment_vote_delete" ON public."CommentVote";
CREATE POLICY "comment_vote_select" ON public."CommentVote" FOR SELECT USING (true);
CREATE POLICY "comment_vote_insert" ON public."CommentVote" FOR INSERT WITH CHECK (auth.uid()::text = "userId" AND public.is_active_user());
CREATE POLICY "comment_vote_update" ON public."CommentVote" FOR UPDATE USING (auth.uid()::text = "userId" AND public.is_active_user());
CREATE POLICY "comment_vote_delete" ON public."CommentVote" FOR DELETE USING (auth.uid()::text = "userId" OR public.is_admin());

-- 8e. "Save"
ALTER TABLE public."Save" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read saves" ON public."Save";
DROP POLICY IF EXISTS "Auth users can insert saves" ON public."Save";
DROP POLICY IF EXISTS "Users can delete own saves" ON public."Save";
CREATE POLICY "save_select_own" ON public."Save" FOR SELECT USING (auth.uid()::text = "userId" OR public.is_admin());
CREATE POLICY "save_insert_own" ON public."Save" FOR INSERT WITH CHECK (auth.uid()::text = "userId" AND public.is_active_user());
CREATE POLICY "save_delete_own" ON public."Save" FOR DELETE USING (auth.uid()::text = "userId" OR public.is_admin());

-- 8f. "Follow"
ALTER TABLE public."Follow" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read follows" ON public."Follow";
DROP POLICY IF EXISTS "Auth users can insert follows" ON public."Follow";
DROP POLICY IF EXISTS "Users can delete own follows" ON public."Follow";
CREATE POLICY "follow_select_all" ON public."Follow" FOR SELECT USING (true);
CREATE POLICY "follow_insert_own" ON public."Follow" FOR INSERT WITH CHECK (auth.uid()::text = "followerId" AND public.is_active_user());
CREATE POLICY "follow_delete_own" ON public."Follow" FOR DELETE USING (auth.uid()::text = "followerId" OR public.is_admin());

-- 8g. "PostView"
ALTER TABLE public."PostView" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "postview_select_all" ON public."PostView";
DROP POLICY IF EXISTS "postview_insert_auth" ON public."PostView";
CREATE POLICY "postview_select_all" ON public."PostView" FOR SELECT USING (true);
CREATE POLICY "postview_insert_auth" ON public."PostView" FOR INSERT WITH CHECK (auth.uid()::text = "userId" OR public.is_admin());

-- 8h. "Notification" (no unrestricted client inserts!)
ALTER TABLE public."Notification" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read notifications" ON public."Notification";
DROP POLICY IF EXISTS "Auth users can insert notifications" ON public."Notification";
DROP POLICY IF EXISTS "Users can update notifications" ON public."Notification";
CREATE POLICY "notification_select_own" ON public."Notification" FOR SELECT USING (auth.uid()::text = "userId" OR public.is_admin());
CREATE POLICY "notification_insert_admin_only" ON public."Notification" FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "notification_update_own" ON public."Notification" FOR UPDATE USING (auth.uid()::text = "userId" OR public.is_admin());
CREATE POLICY "notification_delete_own" ON public."Notification" FOR DELETE USING (auth.uid()::text = "userId" OR public.is_admin());

-- 8i. "UserDevice"
ALTER TABLE public."UserDevice" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "device_own_all" ON public."UserDevice";
CREATE POLICY "device_own_all" ON public."UserDevice"
  FOR ALL USING (auth.uid()::text = "userId" OR public.is_admin())
  WITH CHECK (auth.uid()::text = "userId" OR public.is_admin());

-- 8j. "Feedback"
ALTER TABLE public."Feedback" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "feedback_insert_auth" ON public."Feedback";
DROP POLICY IF EXISTS "feedback_select_all" ON public."Feedback";
CREATE POLICY "feedback_select_own_or_admin" ON public."Feedback"
  FOR SELECT USING (auth.uid()::text = "userId"::text OR public.is_admin());
CREATE POLICY "feedback_insert_own" ON public."Feedback"
  FOR INSERT WITH CHECK (auth.uid()::text = "userId"::text AND public.is_active_user());
CREATE POLICY "feedback_update_admin" ON public."Feedback"
  FOR UPDATE USING (public.is_admin());
CREATE POLICY "feedback_delete_admin" ON public."Feedback"
  FOR DELETE USING (public.is_admin());

-- 8k. creator_requests
ALTER TABLE public.creator_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "creator_requests_select_admin" ON public.creator_requests;
DROP POLICY IF EXISTS "creator_requests_select_own" ON public.creator_requests;
DROP POLICY IF EXISTS "creator_requests_insert" ON public.creator_requests;
DROP POLICY IF EXISTS "creator_requests_update_admin" ON public.creator_requests;
CREATE POLICY "creator_requests_select_admin" ON public.creator_requests FOR SELECT USING (public.is_admin());
CREATE POLICY "creator_requests_insert_public" ON public.creator_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "creator_requests_update_admin" ON public.creator_requests FOR UPDATE USING (public.is_admin());
CREATE POLICY "creator_requests_delete_admin" ON public.creator_requests FOR DELETE USING (public.is_admin());

-- 8l. Ads & Video Ads tables (RLS ENABLED!)
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ads_select_active_or_admin" ON public.ads;
DROP POLICY IF EXISTS "ads_admin_write" ON public.ads;
CREATE POLICY "ads_select_active_or_admin" ON public.ads
  FOR SELECT USING ((status = 'active' AND budget_remaining > 0) OR public.is_admin());
CREATE POLICY "ads_admin_write" ON public.ads
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

ALTER TABLE public.ad_impressions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ad_imp_admin_only" ON public.ad_impressions;
CREATE POLICY "ad_imp_admin_only" ON public.ad_impressions FOR SELECT USING (public.is_admin());

ALTER TABLE public.ad_clicks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ad_clicks_admin_only" ON public.ad_clicks;
CREATE POLICY "ad_clicks_admin_only" ON public.ad_clicks FOR SELECT USING (public.is_admin());

ALTER TABLE public.video_ads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "video_ads_select" ON public.video_ads;
DROP POLICY IF EXISTS "video_ads_admin_write" ON public.video_ads;
CREATE POLICY "video_ads_select" ON public.video_ads FOR SELECT USING (is_active = true OR public.is_admin());
CREATE POLICY "video_ads_admin_write" ON public.video_ads FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

ALTER TABLE public.video_ad_slots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "video_ad_slots_select" ON public.video_ad_slots;
DROP POLICY IF EXISTS "video_ad_slots_admin_write" ON public.video_ad_slots;
CREATE POLICY "video_ad_slots_select" ON public.video_ad_slots FOR SELECT USING (true);
CREATE POLICY "video_ad_slots_admin_write" ON public.video_ad_slots FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

ALTER TABLE public.midroll_ad_impressions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "midroll_imp_select" ON public.midroll_ad_impressions;
CREATE POLICY "midroll_imp_select" ON public.midroll_ad_impressions
  FOR SELECT USING (auth.uid()::text = user_id OR public.is_admin());

ALTER TABLE public.midroll_ad_clicks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "midroll_click_select" ON public.midroll_ad_clicks;
CREATE POLICY "midroll_click_select" ON public.midroll_ad_clicks
  FOR SELECT USING (auth.uid()::text = user_id OR public.is_admin());

-- 8m. Stories tables
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "stories_select_visible" ON public.stories;
DROP POLICY IF EXISTS "stories_creator_write" ON public.stories;
CREATE POLICY "stories_select_visible" ON public.stories
  FOR SELECT USING ((is_active = true AND expires_at > now()) OR creator_id = auth.uid()::text OR public.is_admin());
CREATE POLICY "stories_creator_write" ON public.stories
  FOR ALL USING ((creator_id = auth.uid()::text AND public.is_creator_or_admin()) OR public.is_admin())
  WITH CHECK ((creator_id = auth.uid()::text AND public.is_creator_or_admin()) OR public.is_admin());

ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "story_views_select" ON public.story_views;
DROP POLICY IF EXISTS "story_views_insert" ON public.story_views;
CREATE POLICY "story_views_select" ON public.story_views FOR SELECT USING (
  auth.uid()::text = user_id
  OR EXISTS (SELECT 1 FROM public.stories s WHERE s.id = story_id AND s.creator_id = auth.uid()::text)
  OR public.is_admin()
);
CREATE POLICY "story_views_insert" ON public.story_views FOR INSERT WITH CHECK (auth.uid()::text = user_id AND public.is_active_user());

ALTER TABLE public.story_likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "story_likes_all" ON public.story_likes;
CREATE POLICY "story_likes_select" ON public.story_likes FOR SELECT USING (true);
CREATE POLICY "story_likes_insert" ON public.story_likes FOR INSERT WITH CHECK (auth.uid()::text = user_id AND public.is_active_user());
CREATE POLICY "story_likes_delete" ON public.story_likes FOR DELETE USING (auth.uid()::text = user_id OR public.is_admin());

ALTER TABLE public.story_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "story_messages_select" ON public.story_messages;
DROP POLICY IF EXISTS "story_messages_insert" ON public.story_messages;
CREATE POLICY "story_messages_select" ON public.story_messages FOR SELECT USING (
  auth.uid()::text = sender_id OR auth.uid()::text = creator_id OR public.is_admin()
);
CREATE POLICY "story_messages_insert" ON public.story_messages FOR INSERT WITH CHECK (auth.uid()::text = sender_id AND public.is_active_user());

ALTER TABLE public.story_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "story_comments_select" ON public.story_comments;
DROP POLICY IF EXISTS "story_comments_insert" ON public.story_comments;
CREATE POLICY "story_comments_select" ON public.story_comments FOR SELECT USING (true);
CREATE POLICY "story_comments_insert" ON public.story_comments FOR INSERT WITH CHECK (auth.uid()::text = user_id AND public.is_active_user());

ALTER TABLE public.story_shares ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "story_shares_select" ON public.story_shares;
DROP POLICY IF EXISTS "story_shares_insert" ON public.story_shares;
CREATE POLICY "story_shares_select" ON public.story_shares FOR SELECT USING (
  auth.uid()::text = user_id
  OR EXISTS (SELECT 1 FROM public.stories s WHERE s.id = story_id AND s.creator_id = auth.uid()::text)
  OR public.is_admin()
);
CREATE POLICY "story_shares_insert" ON public.story_shares FOR INSERT WITH CHECK (auth.uid()::text = user_id AND public.is_active_user());

-- 8n. Lock down auth_debug_log (admin/service only)
ALTER TABLE public.auth_debug_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_debug_admin_only" ON public.auth_debug_log;
CREATE POLICY "auth_debug_admin_only" ON public.auth_debug_log FOR SELECT USING (public.is_admin());

NOTIFY pgrst, 'reload schema';
