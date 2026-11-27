-- ============================================================================
-- Migration 006: Drop Legacy Permissive RLS Policies & Fix Tamil Post Language
-- Non-destructive: drops old overly-permissive policy names left over prior
-- to Migration 001, re-verifies clean policies, and fixes existing Tamil posts.
-- ============================================================================

DO $$
DECLARE
  pol RECORD;
  allowed_policies TEXT[] := ARRAY[
    -- User
    'user_select_public_or_own', 'user_insert_own', 'user_update_own_or_admin', 'user_delete_admin',
    -- Post
    'post_select_visible', 'post_insert_creator', 'post_update_own_or_admin', 'post_delete_own_or_admin',
    -- Vote
    'vote_select_all', 'vote_insert_own', 'vote_update_own', 'vote_delete_own',
    -- Comment & CommentVote
    'comment_select_all', 'comment_insert_own', 'comment_update_own_or_author', 'comment_delete_own_or_author',
    'comment_vote_select', 'comment_vote_insert', 'comment_vote_update', 'comment_vote_delete',
    -- Save
    'save_select_own', 'save_insert_own', 'save_delete_own',
    -- Follow
    'follow_select_all', 'follow_insert_own', 'follow_delete_own',
    -- PostView
    'postview_select_all', 'postview_insert_auth',
    -- Notification
    'notification_select_own', 'notification_insert_admin_only', 'notification_update_own', 'notification_delete_own',
    -- UserDevice
    'device_own_all',
    -- Feedback
    'feedback_select_own_or_admin', 'feedback_insert_own', 'feedback_update_admin', 'feedback_delete_admin',
    -- creator_requests
    'creator_requests_select_admin', 'creator_requests_insert_public', 'creator_requests_update_admin', 'creator_requests_delete_admin',
    -- Ads & Video Ads
    'ads_select_active_or_admin', 'ads_admin_write',
    'ad_imp_admin_only', 'ad_clicks_admin_only',
    'video_ads_select', 'video_ads_admin_write',
    'video_ad_slots_select', 'video_ad_slots_admin_write',
    'midroll_imp_select', 'midroll_click_select',
    -- Stories
    'stories_select_visible', 'stories_creator_write',
    'story_views_select', 'story_views_insert',
    'story_likes_select', 'story_likes_insert', 'story_likes_delete',
    'story_messages_select', 'story_messages_insert',
    'story_comments_select', 'story_comments_insert',
    'story_shares_select', 'story_shares_insert',
    -- auth_debug_log
    'auth_debug_admin_only'
  ];
  target_tables TEXT[] := ARRAY[
    'User', 'Post', 'Vote', 'Comment', 'CommentVote', 'Save', 'Follow',
    'PostView', 'Notification', 'UserDevice', 'Feedback', 'creator_requests',
    'ads', 'ad_impressions', 'ad_clicks', 'video_ads', 'video_ad_slots',
    'midroll_ad_impressions', 'midroll_ad_clicks',
    'stories', 'story_views', 'story_likes', 'story_messages', 'story_comments', 'story_shares',
    'auth_debug_log'
  ];
BEGIN
  FOR pol IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = ANY(target_tables)
      AND NOT (policyname = ANY(allowed_policies))
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I;', pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;
END $$;

-- Ensure midroll inserts still go through a controlled check or authenticated active users if client-triggered
-- (client inserts into midroll_ad_* are permitted for active users / anon via existing RPC; keep insert safe)
DROP POLICY IF EXISTS "midroll_imp_insert_safe" ON public.midroll_ad_impressions;
CREATE POLICY "midroll_imp_insert_safe" ON public.midroll_ad_impressions
  FOR INSERT WITH CHECK (user_id IS NULL OR auth.uid()::text = user_id);

DROP POLICY IF EXISTS "midroll_click_insert_safe" ON public.midroll_ad_clicks;
CREATE POLICY "midroll_click_insert_safe" ON public.midroll_ad_clicks
  FOR INSERT WITH CHECK (user_id IS NULL OR auth.uid()::text = user_id);

-- Fix existing Tamil posts misclassified as 'en' during Migration 002 backfill
DO $$
DECLARE
  tamil_pattern TEXT := '[' || chr(x'0B80'::int) || '-' || chr(x'0BFF'::int) || ']';
BEGIN
  UPDATE public."Post"
  SET language = 'ta'
  WHERE language <> 'ta'
    AND (title ~ tamil_pattern OR COALESCE(content, '') ~ tamil_pattern);
END $$;

-- Populate initial TipTap doc content_json stubs for existing posts that only have legacy HTML content
DO $$
DECLARE
  rec RECORD;
  plain_text TEXT;
  paras TEXT[];
  p_txt TEXT;
  nodes JSONB;
BEGIN
  FOR rec IN
    SELECT id, COALESCE(content, '') AS raw_content
    FROM public."Post"
    WHERE content_json IS NULL
  LOOP
    -- Split by block boundaries cleanly into plain paragraph nodes while keeping original HTML in content column
    plain_text := regexp_replace(rec.raw_content, '<(br|\/p|\/div|\/h[1-6]|\/li)[^>]*>', E'\n', 'gi');
    plain_text := regexp_replace(plain_text, '<[^>]+>', '', 'g');
    plain_text := replace(replace(replace(replace(plain_text, '&nbsp;', ' '), '&amp;', '&'), '&quot;', '"'), '&#39;', '''');
    paras := string_to_array(trim(plain_text), E'\n');
    nodes := '[]'::jsonb;

    IF paras IS NOT NULL THEN
      FOREACH p_txt IN ARRAY paras LOOP
        p_txt := trim(p_txt);
        IF p_txt <> '' THEN
          nodes := nodes || jsonb_build_array(
            jsonb_build_object(
              'type', 'paragraph',
              'content', jsonb_build_array(
                jsonb_build_object('type', 'text', 'text', p_txt)
              )
            )
          );
        END IF;
      END LOOP;
    END IF;

    IF jsonb_array_length(nodes) = 0 THEN
      nodes := jsonb_build_array(jsonb_build_object('type', 'paragraph'));
    END IF;

    UPDATE public."Post"
    SET content_json = jsonb_build_object('type', 'doc', 'content', nodes)
    WHERE id = rec.id;
  END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';
