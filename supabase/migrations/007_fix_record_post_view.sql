-- Fix record_post_view FK conflict (409) for guest/anonymous visitors
ALTER TABLE public."PostView"
  ALTER COLUMN "userId" DROP NOT NULL;

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

  -- Store v_user_id (NULL for unauthenticated guests) to satisfy postview_userid_fkey
  INSERT INTO public."PostView" (id, "postId", "userId", visitor_key, created_at)
  VALUES (gen_random_uuid()::text, p_post_id, v_user_id, v_key, now())
  ON CONFLICT DO NOTHING;

  UPDATE public."Post"
  SET views_count = views_count + 1
  WHERE id = p_post_id;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_post_view(TEXT, TEXT) TO anon, authenticated;
