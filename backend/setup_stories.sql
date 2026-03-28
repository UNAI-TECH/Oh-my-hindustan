-- Story Migration Script
-- Run this in your Supabase SQL Editor. 

-- 1. Create tables
CREATE TABLE IF NOT EXISTS public.stories (
  id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()::TEXT),
  creator_id TEXT NOT NULL REFERENCES public."User"(id) ON DELETE CASCADE,
  media_url TEXT,
  text_content TEXT,
  type TEXT NOT NULL CHECK(type IN ('image', 'video', 'text')),
  background_color TEXT,
  caption TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + interval '24 hours',
  viewers_count INTEGER DEFAULT 0
);

-- Ensure columns exist if table was already created
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS text_content TEXT;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS background_color TEXT;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS caption TEXT;
-- Update constraint if it was already created with old types
ALTER TABLE public.stories DROP CONSTRAINT IF EXISTS stories_type_check;
ALTER TABLE public.stories ADD CONSTRAINT stories_type_check CHECK (type IN ('image', 'video', 'text'));


CREATE TABLE IF NOT EXISTS public.story_views (
  id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()::TEXT),
  story_id TEXT NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES public."User"(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.story_likes (
  id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()::TEXT),
  story_id TEXT NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES public."User"(id) ON DELETE CASCADE,
  liked_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.story_archive (
  id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()::TEXT),
  story_id TEXT NOT NULL,
  creator_id TEXT NOT NULL REFERENCES public."User"(id) ON DELETE CASCADE,
  media_url TEXT,
  text_content TEXT,
  type TEXT,
  background_color TEXT,
  caption TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  archived_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.story_archive ADD COLUMN IF NOT EXISTS text_content TEXT;
ALTER TABLE public.story_archive ADD COLUMN IF NOT EXISTS background_color TEXT;
ALTER TABLE public.story_archive ADD COLUMN IF NOT EXISTS caption TEXT;
ALTER TABLE public.story_archive ADD COLUMN IF NOT EXISTS type TEXT;


-- 2. Turn on Row Level Security
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_archive ENABLE ROW LEVEL SECURITY;

-- 3. Setup Policies
-- STORIES RLS (Anyone see active, owner manage)
DROP POLICY IF EXISTS "Public read active stories" ON public.stories;
CREATE POLICY "Public read active stories" ON public.stories
  FOR SELECT USING (expires_at > NOW() OR (auth.uid())::TEXT = creator_id);
DROP POLICY IF EXISTS "Creator manage own stories" ON public.stories;
CREATE POLICY "Creator manage own stories" ON public.stories
  FOR ALL USING ((auth.uid())::TEXT = creator_id);

-- STORY VIEWS RLS (Viewer can insert, owner can see)
DROP POLICY IF EXISTS "User can insert view" ON public.story_views;
CREATE POLICY "User can insert view" ON public.story_views
  FOR INSERT WITH CHECK ((auth.uid())::TEXT = user_id);
-- Creators can see views of their stories
DROP POLICY IF EXISTS "Creator see story views" ON public.story_views;
CREATE POLICY "Creator see story views" ON public.story_views
  FOR SELECT USING (
    story_id IN (SELECT id FROM public.stories WHERE creator_id = (auth.uid())::TEXT) OR (auth.uid())::TEXT = user_id
  );

-- STORY LIKES RLS (Viewer can insert, read if active)
DROP POLICY IF EXISTS "User can insert like" ON public.story_likes;
CREATE POLICY "User can insert like" ON public.story_likes
  FOR INSERT WITH CHECK ((auth.uid())::TEXT = user_id);
DROP POLICY IF EXISTS "User can delete like" ON public.story_likes;
CREATE POLICY "User can delete like" ON public.story_likes
  FOR DELETE USING ((auth.uid())::TEXT = user_id);
DROP POLICY IF EXISTS "Public read story likes" ON public.story_likes;
CREATE POLICY "Public read story likes" ON public.story_likes
  FOR SELECT USING (
    story_id IN (SELECT id FROM public.stories WHERE expires_at > NOW())
    OR
    story_id IN (SELECT id FROM public.stories WHERE creator_id = (auth.uid())::TEXT)
    OR
    (auth.uid())::TEXT = user_id
  );

-- STORY ARCHIVE RLS (Creator only)
DROP POLICY IF EXISTS "Creator manage own archive" ON public.story_archive;
CREATE POLICY "Creator manage own archive" ON public.story_archive
  FOR ALL USING ((auth.uid())::TEXT = creator_id);

-- 4. Set up Auto-Archiving Function
-- This function can be called defensively before reading stories, or triggered via Edge Functions/Cron.
CREATE OR REPLACE FUNCTION archive_expired_stories() RETURNS void AS $$
BEGIN
    -- Move expired to archive
    INSERT INTO public.story_archive (story_id, creator_id, media_url, text_content, type, background_color, caption, created_at, archived_at)
    SELECT id, creator_id, media_url, text_content, type, background_color, caption, created_at, NOW()
    FROM public.stories
    WHERE expires_at <= NOW();
    
    -- Delete from active table
    DELETE FROM public.stories WHERE expires_at <= NOW();
END;
$$ LANGUAGE plpgsql;

-- 5. Add real time replication
-- Enable realtime for stories and likes using a block to ignore duplicate errors
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.stories;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.story_likes;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;
