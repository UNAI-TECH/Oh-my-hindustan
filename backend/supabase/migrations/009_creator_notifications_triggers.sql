-- ============================================================================
-- Migration 009: Automatic Creator Notifications on Follows, Likes, Comments,
-- and Comment Replies
-- Safe, idempotent, SECURITY DEFINER triggers (preserves client RLS)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.notify_creator_on_follow()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_follower_name TEXT;
BEGIN
  IF NEW."followingId" IS NULL OR NEW."followerId" IS NULL OR NEW."followingId" = NEW."followerId" THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(NULLIF(username, ''), NULLIF(channel_name, ''), 'A reader')
  INTO v_follower_name
  FROM public."User"
  WHERE id = NEW."followerId"
  LIMIT 1;

  INSERT INTO public."Notification" (
    id, "userId", type, title, message, "isRead", "targetId", "createdAt"
  )
  VALUES (
    gen_random_uuid()::text,
    NEW."followingId",
    'FOLLOW',
    'New Follower',
    '@' || COALESCE(v_follower_name, 'reader') || ' started following your channel',
    false,
    NEW."followerId",
    now()
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_creator_on_follow ON public."Follow";
CREATE TRIGGER trg_notify_creator_on_follow
  AFTER INSERT ON public."Follow"
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_creator_on_follow();

CREATE OR REPLACE FUNCTION public.notify_creator_on_like()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_author_id TEXT;
  v_post_title TEXT;
  v_actor_name TEXT;
BEGIN
  IF NEW.type IS DISTINCT FROM 1 THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.type = 1 THEN
    RETURN NEW;
  END IF;

  SELECT p."authorId", p.title
  INTO v_author_id, v_post_title
  FROM public."Post" p
  WHERE p.id = NEW."postId"
  LIMIT 1;

  IF v_author_id IS NULL OR v_author_id = NEW."userId" THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(NULLIF(username, ''), NULLIF(channel_name, ''), 'A reader')
  INTO v_actor_name
  FROM public."User"
  WHERE id = NEW."userId"
  LIMIT 1;

  INSERT INTO public."Notification" (
    id, "userId", type, title, message, "isRead", "targetId", "createdAt"
  )
  VALUES (
    gen_random_uuid()::text,
    v_author_id,
    'LIKE',
    'New Like',
    '@' || COALESCE(v_actor_name, 'reader') || ' liked your post "' || left(COALESCE(v_post_title, 'your story'), 60) || '"',
    false,
    NEW."postId",
    now()
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_creator_on_like ON public."Vote";
CREATE TRIGGER trg_notify_creator_on_like
  AFTER INSERT OR UPDATE ON public."Vote"
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_creator_on_like();

CREATE OR REPLACE FUNCTION public.notify_on_comment_or_reply()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_author_id TEXT;
  v_post_title TEXT;
  v_actor_name TEXT;
  v_parent_owner_id TEXT;
  v_is_reply BOOLEAN := NEW."parentId" IS NOT NULL;
  v_snippet TEXT := left(regexp_replace(COALESCE(NEW.content, ''), '\s+', ' ', 'g'), 60);
BEGIN
  IF COALESCE(NEW.content, '') = '[SYSTEM_REPOST]' THEN
    RETURN NEW;
  END IF;

  SELECT p."authorId", p.title
  INTO v_author_id, v_post_title
  FROM public."Post" p
  WHERE p.id = NEW."postId"
  LIMIT 1;

  SELECT COALESCE(NULLIF(username, ''), NULLIF(channel_name, ''), 'A reader')
  INTO v_actor_name
  FROM public."User"
  WHERE id = NEW."userId"
  LIMIT 1;

  IF v_is_reply THEN
    SELECT c."userId"
    INTO v_parent_owner_id
    FROM public."Comment" c
    WHERE c.id = NEW."parentId"
    LIMIT 1;
  END IF;

  -- Notify the post creator when another user comments or replies on their post
  IF v_author_id IS NOT NULL AND v_author_id <> NEW."userId" THEN
    INSERT INTO public."Notification" (
      id, "userId", type, title, message, "isRead", "targetId", "createdAt"
    )
    VALUES (
      gen_random_uuid()::text,
      v_author_id,
      'COMMENT',
      CASE WHEN v_is_reply THEN 'New Reply' ELSE 'New Comment' END,
      '@' || COALESCE(v_actor_name, 'reader') ||
        CASE WHEN v_is_reply THEN ' replied "' ELSE ' commented "' END ||
        v_snippet || '" on "' || left(COALESCE(v_post_title, 'your story'), 45) || '"',
      false,
      NEW."postId",
      now()
    );
  END IF;

  -- Notify parent comment author if this is a reply from someone else (and wasn't already notified as post author)
  IF v_is_reply AND v_parent_owner_id IS NOT NULL
     AND v_parent_owner_id <> NEW."userId"
     AND v_parent_owner_id IS DISTINCT FROM v_author_id THEN
    INSERT INTO public."Notification" (
      id, "userId", type, title, message, "isRead", "targetId", "createdAt"
    )
    VALUES (
      gen_random_uuid()::text,
      v_parent_owner_id,
      'COMMENT',
      'New Reply',
      '@' || COALESCE(v_actor_name, 'reader') || ' replied "' || v_snippet || '" to your comment',
      false,
      NEW."postId",
      now()
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_on_comment_or_reply ON public."Comment";
CREATE TRIGGER trg_notify_on_comment_or_reply
  AFTER INSERT ON public."Comment"
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_comment_or_reply();

NOTIFY pgrst, 'reload schema';
