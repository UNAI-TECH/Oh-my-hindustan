-- ============================================================================
-- Migration 004: Server-Side Scheduled Publishing & Trending Refresh via pg_cron
-- ============================================================================

CREATE OR REPLACE FUNCTION public.publish_due_scheduled_posts()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec RECORD;
  published_count INT := 0;
  failed_count INT := 0;
  next_ver INT;
BEGIN
  FOR rec IN
    SELECT * FROM public."Post"
    WHERE status = 'SCHEDULED'
      AND "scheduledFor" IS NOT NULL
      AND "scheduledFor" <= now()
    ORDER BY "scheduledFor" ASC
    FOR UPDATE SKIP LOCKED
  LOOP
    BEGIN
      UPDATE public."Post"
      SET
        status = 'PUBLISHED',
        published_at = COALESCE(published_at, rec."scheduledFor", now()),
        "updatedAt" = now()
      WHERE id = rec.id;

      SELECT COALESCE(MAX(version_number), 0) + 1 INTO next_ver
      FROM public.post_revisions WHERE post_id = rec.id;

      INSERT INTO public.post_revisions (
        post_id, version_number, title, subtitle, short_description, content, content_json,
        featured_image, modified_by
      )
      VALUES (
        rec.id, next_ver, rec.title, rec.subtitle, rec.short_description, rec.content, rec.content_json,
        rec.thumbnail, rec."authorId"
      );

      UPDATE public.scheduled_publish_jobs
      SET status = 'published', executed_at = now(), attempts = attempts + 1
      WHERE post_id = rec.id AND status = 'pending';

      IF NOT FOUND THEN
        INSERT INTO public.scheduled_publish_jobs (post_id, scheduled_for, executed_at, status, attempts)
        VALUES (rec.id, rec."scheduledFor", now(), 'published', 1);
      END IF;

      PERFORM public.write_audit_log(
        rec."authorId",
        'SYSTEM_CRON',
        'post.scheduled_publish',
        'Post',
        rec.id,
        jsonb_build_object('status', 'SCHEDULED', 'scheduledFor', rec."scheduledFor"),
        jsonb_build_object('status', 'PUBLISHED', 'published_at', now())
      );

      published_count := published_count + 1;
    EXCEPTION WHEN OTHERS THEN
      failed_count := failed_count + 1;
      UPDATE public.scheduled_publish_jobs
      SET status = 'failed', attempts = attempts + 1, error_message = SQLERRM
      WHERE post_id = rec.id AND status = 'pending';
    END;
  END LOOP;

  RETURN jsonb_build_object('published', published_count, 'failed', failed_count, 'ran_at', now());
END;
$$;

-- Enable pg_cron if permitted and schedule every-minute publishing + 15-minute trending refresh
DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS pg_cron;
  PERFORM cron.unschedule('postsapp-scheduled-publisher')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'postsapp-scheduled-publisher');

  PERFORM cron.schedule(
    'postsapp-scheduled-publisher',
    '* * * * *',
    'SELECT public.publish_due_scheduled_posts();'
  );

  PERFORM cron.unschedule('postsapp-refresh-trending')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'postsapp-refresh-trending');

  PERFORM cron.schedule(
    'postsapp-refresh-trending',
    '*/15 * * * *',
    'SELECT public.refresh_trending_scores();'
  );
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron setup skipped or requires dashboard enablement: %', SQLERRM;
END $$;

NOTIFY pgrst, 'reload schema';
