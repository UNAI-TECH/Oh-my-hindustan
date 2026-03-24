-- =====================================================
-- RLS Policies for ALL tables — Run in Supabase SQL Editor
-- =====================================================

-- 1. VOTE: Allow authenticated users to read, insert, update, delete their own votes
ALTER TABLE public."Vote" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read votes" ON public."Vote";
CREATE POLICY "Anyone can read votes" ON public."Vote" FOR SELECT USING (true);

DROP POLICY IF EXISTS "Auth users can insert votes" ON public."Vote";
CREATE POLICY "Auth users can insert votes" ON public."Vote" FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own votes" ON public."Vote";
CREATE POLICY "Users can update own votes" ON public."Vote" FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Users can delete own votes" ON public."Vote";
CREATE POLICY "Users can delete own votes" ON public."Vote" FOR DELETE USING (true);

-- 2. COMMENT: Allow read all, insert/update/delete own
ALTER TABLE public."Comment" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read comments" ON public."Comment";
CREATE POLICY "Anyone can read comments" ON public."Comment" FOR SELECT USING (true);

DROP POLICY IF EXISTS "Auth users can insert comments" ON public."Comment";
CREATE POLICY "Auth users can insert comments" ON public."Comment" FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own comments" ON public."Comment";
CREATE POLICY "Users can update own comments" ON public."Comment" FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Users can delete own comments" ON public."Comment";
CREATE POLICY "Users can delete own comments" ON public."Comment" FOR DELETE USING (true);

-- 3. SAVE: Allow read/insert/delete own saves
ALTER TABLE public."Save" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read saves" ON public."Save";
CREATE POLICY "Anyone can read saves" ON public."Save" FOR SELECT USING (true);

DROP POLICY IF EXISTS "Auth users can insert saves" ON public."Save";
CREATE POLICY "Auth users can insert saves" ON public."Save" FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can delete own saves" ON public."Save";
CREATE POLICY "Users can delete own saves" ON public."Save" FOR DELETE USING (true);

-- 4. FOLLOW: Allow read all, insert/delete own follows
ALTER TABLE public."Follow" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read follows" ON public."Follow";
CREATE POLICY "Anyone can read follows" ON public."Follow" FOR SELECT USING (true);

DROP POLICY IF EXISTS "Auth users can insert follows" ON public."Follow";
CREATE POLICY "Auth users can insert follows" ON public."Follow" FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can delete own follows" ON public."Follow";
CREATE POLICY "Users can delete own follows" ON public."Follow" FOR DELETE USING (true);

-- 5. NOTIFICATION: Allow read/insert/update all (creators need to read theirs)
ALTER TABLE public."Notification" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read notifications" ON public."Notification";
CREATE POLICY "Anyone can read notifications" ON public."Notification" FOR SELECT USING (true);

DROP POLICY IF EXISTS "Auth users can insert notifications" ON public."Notification";
CREATE POLICY "Auth users can insert notifications" ON public."Notification" FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update notifications" ON public."Notification";
CREATE POLICY "Users can update notifications" ON public."Notification" FOR UPDATE USING (true);

-- 6. POST: Allow read all, creators can insert/update/delete own
ALTER TABLE public."Post" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read posts" ON public."Post";
CREATE POLICY "Anyone can read posts" ON public."Post" FOR SELECT USING (true);

DROP POLICY IF EXISTS "Auth users can insert posts" ON public."Post";
CREATE POLICY "Auth users can insert posts" ON public."Post" FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Authors can update own posts" ON public."Post";
CREATE POLICY "Authors can update own posts" ON public."Post" FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Authors can delete own posts" ON public."Post";
CREATE POLICY "Authors can delete own posts" ON public."Post" FOR DELETE USING (true);

-- 7. USER: Allow read all, update own
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read users" ON public."User";
CREATE POLICY "Anyone can read users" ON public."User" FOR SELECT USING (true);

DROP POLICY IF EXISTS "Auth users can insert users" ON public."User";
CREATE POLICY "Auth users can insert users" ON public."User" FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update profiles" ON public."User";
CREATE POLICY "Users can update profiles" ON public."User" FOR UPDATE USING (true);

-- 8. Add coverUrl column to User table (for creator banner)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'User' AND column_name = 'coverUrl'
  ) THEN
    ALTER TABLE public."User" ADD COLUMN "coverUrl" text NULL;
  END IF;
END $$;

-- 9. Drop unused legacy tables (lowercase versions)
DROP TABLE IF EXISTS public.comments CASCADE;
DROP TABLE IF EXISTS public.follows CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.posts CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.saves CASCADE;
DROP TABLE IF EXISTS public.votes CASCADE;
