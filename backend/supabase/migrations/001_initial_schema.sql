-- ============================================================================
-- Oh My Hindustan — Supabase Migration: Full Schema + RLS + Triggers
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================================================

-- 1. ENUMS
-- ============================================================================
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'creator', 'viewer');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE post_type AS ENUM ('forum', 'policy_type', 'debate', 'update', 'news', 'blog', 'video', 'promo');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE request_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN null;
END $$;


-- 2. PROFILES TABLE (linked to auth.users)
-- ============================================================================
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  username    TEXT UNIQUE,
  full_name   TEXT,
  bio         TEXT,
  avatar_url  TEXT,
  phone       TEXT,
  role        user_role NOT NULL DEFAULT 'viewer',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;


-- 3. POSTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS posts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  subtitle        TEXT,
  content         TEXT,
  type            post_type NOT NULL DEFAULT 'news',
  category        TEXT,
  thumbnail       TEXT,
  video_url       TEXT,
  video_duration  TEXT,
  published       BOOLEAN NOT NULL DEFAULT false,
  is_trending     BOOLEAN NOT NULL DEFAULT false,
  author_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;


-- 4. VOTES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS votes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vote_type   INT NOT NULL CHECK (vote_type IN (1, -1)),  -- 1 = upvote, -1 = downvote
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id     UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

ALTER TABLE votes ENABLE ROW LEVEL SECURITY;


-- 5. COMMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content     TEXT NOT NULL,
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id     UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;


-- 6. FOLLOWS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS follows (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

ALTER TABLE follows ENABLE ROW LEVEL SECURITY;


-- 7. SAVES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS saves (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id     UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

ALTER TABLE saves ENABLE ROW LEVEL SECURITY;


-- 8. NOTIFICATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  is_read     BOOLEAN NOT NULL DEFAULT false,
  target_id   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;


-- 9. CREATOR REQUESTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS creator_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  email           TEXT NOT NULL UNIQUE,
  bio             TEXT NOT NULL,
  portfolio_url   TEXT,
  status          request_status NOT NULL DEFAULT 'pending',
  admin_message   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE creator_requests ENABLE ROW LEVEL SECURITY;


-- ============================================================================
-- 10. TRIGGERS & FUNCTIONS
-- ============================================================================

-- Auto-create profile when a new user signs up via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  _role user_role := 'viewer';
BEGIN
  -- Safely cast role from metadata, default to 'viewer' if invalid
  BEGIN
    IF NEW.raw_user_meta_data->>'role' IS NOT NULL 
       AND NEW.raw_user_meta_data->>'role' != '' THEN
      _role := (NEW.raw_user_meta_data->>'role')::user_role;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    _role := 'viewer';
  END;

  INSERT INTO public.profiles (id, email, username, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    _role
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON profiles;
CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_posts_updated_at ON posts;
CREATE TRIGGER set_posts_updated_at BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_comments_updated_at ON comments;
CREATE TRIGGER set_comments_updated_at BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_creator_requests_updated_at ON creator_requests;
CREATE TRIGGER set_creator_requests_updated_at BEFORE UPDATE ON creator_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- ============================================================================
-- 11. ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Helper: get role of the current authenticated user
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;


-- ── PROFILES ──
DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
CREATE POLICY "profiles_select_all" ON profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_admin" ON profiles;
CREATE POLICY "profiles_update_admin" ON profiles FOR UPDATE USING (public.get_user_role() = 'admin');

DROP POLICY IF EXISTS "profiles_insert_service" ON profiles;
CREATE POLICY "profiles_insert_service" ON profiles FOR INSERT WITH CHECK (true);


-- ── POSTS ──
DROP POLICY IF EXISTS "posts_select_published" ON posts;
CREATE POLICY "posts_select_published" ON posts FOR SELECT USING (published = true);

DROP POLICY IF EXISTS "posts_select_own" ON posts;
CREATE POLICY "posts_select_own" ON posts FOR SELECT USING (author_id = auth.uid());

DROP POLICY IF EXISTS "posts_select_admin" ON posts;
CREATE POLICY "posts_select_admin" ON posts FOR SELECT USING (public.get_user_role() = 'admin');

DROP POLICY IF EXISTS "posts_insert_creator" ON posts;
CREATE POLICY "posts_insert_creator" ON posts FOR INSERT 
  WITH CHECK (auth.uid() = author_id AND public.get_user_role() IN ('creator', 'admin'));

DROP POLICY IF EXISTS "posts_update_own" ON posts;
CREATE POLICY "posts_update_own" ON posts FOR UPDATE 
  USING (auth.uid() = author_id AND public.get_user_role() IN ('creator', 'admin'));

DROP POLICY IF EXISTS "posts_update_admin" ON posts;
CREATE POLICY "posts_update_admin" ON posts FOR UPDATE USING (public.get_user_role() = 'admin');

DROP POLICY IF EXISTS "posts_delete_own" ON posts;
CREATE POLICY "posts_delete_own" ON posts FOR DELETE 
  USING (auth.uid() = author_id AND public.get_user_role() IN ('creator', 'admin'));

DROP POLICY IF EXISTS "posts_delete_admin" ON posts;
CREATE POLICY "posts_delete_admin" ON posts FOR DELETE USING (public.get_user_role() = 'admin');


-- ── VOTES ──
DROP POLICY IF EXISTS "votes_select_all" ON votes;
CREATE POLICY "votes_select_all" ON votes FOR SELECT USING (true);
DROP POLICY IF EXISTS "votes_insert_own" ON votes;
CREATE POLICY "votes_insert_own" ON votes FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "votes_delete_own" ON votes;
CREATE POLICY "votes_delete_own" ON votes FOR DELETE USING (auth.uid() = user_id);

-- ── COMMENTS ──
DROP POLICY IF EXISTS "comments_select_all" ON comments;
CREATE POLICY "comments_select_all" ON comments FOR SELECT USING (true);
DROP POLICY IF EXISTS "comments_insert_own" ON comments;
CREATE POLICY "comments_insert_own" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "comments_update_own" ON comments;
CREATE POLICY "comments_update_own" ON comments FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "comments_delete_own" ON comments;
CREATE POLICY "comments_delete_own" ON comments FOR DELETE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "comments_delete_admin" ON comments;
CREATE POLICY "comments_delete_admin" ON comments FOR DELETE USING (public.get_user_role() = 'admin');


-- ── FOLLOWS ──
DROP POLICY IF EXISTS "follows_select_all" ON follows;
CREATE POLICY "follows_select_all" ON follows FOR SELECT USING (true);
DROP POLICY IF EXISTS "follows_insert_own" ON follows;
CREATE POLICY "follows_insert_own" ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
DROP POLICY IF EXISTS "follows_delete_own" ON follows;
CREATE POLICY "follows_delete_own" ON follows FOR DELETE USING (auth.uid() = follower_id);

-- ── SAVES ──
DROP POLICY IF EXISTS "saves_select_own" ON saves;
CREATE POLICY "saves_select_own" ON saves FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "saves_insert_own" ON saves;
CREATE POLICY "saves_insert_own" ON saves FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "saves_delete_own" ON saves;
CREATE POLICY "saves_delete_own" ON saves FOR DELETE USING (auth.uid() = user_id);

-- ── NOTIFICATIONS ──
DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
CREATE POLICY "notifications_select_own" ON notifications FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "notifications_insert" ON notifications;
CREATE POLICY "notifications_insert" ON notifications FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "notifications_update_own" ON notifications;
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE USING (auth.uid() = user_id);


-- ── CREATOR REQUESTS ──
DROP POLICY IF EXISTS "creator_requests_select_admin" ON creator_requests;
CREATE POLICY "creator_requests_select_admin" ON creator_requests FOR SELECT 
  USING (public.get_user_role() = 'admin');

DROP POLICY IF EXISTS "creator_requests_select_own" ON creator_requests;
CREATE POLICY "creator_requests_select_own" ON creator_requests FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "creator_requests_insert" ON creator_requests;
CREATE POLICY "creator_requests_insert" ON creator_requests FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "creator_requests_update_admin" ON creator_requests;
CREATE POLICY "creator_requests_update_admin" ON creator_requests FOR UPDATE 
  USING (public.get_user_role() = 'admin');


-- ============================================================================
-- 12. ENABLE REALTIME (toggle in Supabase Dashboard > Database > Replication)
-- These ALTER statements enable the tables for Supabase Realtime
-- ============================================================================
-- 12. ENABLE REALTIME
-- ============================================================================
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'posts') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE posts;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'comments') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE comments;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'votes') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE votes;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'follows') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE follows;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'notifications') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'creator_requests') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE creator_requests;
  END IF;
END $$;


-- ============================================================================
-- 14. STORAGE BUCKET FOR MEDIA
-- ============================================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('media', 'media', true), ('videos', 'videos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload
DROP POLICY IF EXISTS "media_upload" ON storage.objects;
CREATE POLICY "media_upload" ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id IN ('media', 'videos') AND auth.role() = 'authenticated');
-- Allow public read
DROP POLICY IF EXISTS "media_read" ON storage.objects;
CREATE POLICY "media_read" ON storage.objects FOR SELECT 
  USING (bucket_id IN ('media', 'videos'));
-- Allow users to delete their own uploads
DROP POLICY IF EXISTS "media_delete" ON storage.objects;
CREATE POLICY "media_delete" ON storage.objects FOR DELETE 
  USING (bucket_id IN ('media', 'videos') AND auth.uid()::text = (storage.foldername(name))[1]);


-- ============================================================================
-- 14. SEED: Create initial admin user  
-- Run AFTER migration. Use Supabase Dashboard > Authentication to create 
-- the admin user, then update the profile:
-- 
-- UPDATE profiles SET role = 'admin' WHERE email = 'admin@ohmyhindustan.com';
-- ============================================================================
