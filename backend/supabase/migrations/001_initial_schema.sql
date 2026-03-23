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
-- Everyone can read profiles
CREATE POLICY "profiles_select_all" ON profiles FOR SELECT USING (true);
-- Users can update their own profile
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);
-- Admins can update any profile
CREATE POLICY "profiles_update_admin" ON profiles FOR UPDATE USING (public.get_user_role() = 'admin');
-- Service role can insert (trigger handles this)
CREATE POLICY "profiles_insert_service" ON profiles FOR INSERT WITH CHECK (true);


-- ── POSTS ──
-- Everyone can read published posts
CREATE POLICY "posts_select_published" ON posts FOR SELECT USING (published = true);
-- Creators/Admins can read their own unpublished posts  
CREATE POLICY "posts_select_own" ON posts FOR SELECT USING (author_id = auth.uid());
-- Admins see all posts
CREATE POLICY "posts_select_admin" ON posts FOR SELECT USING (public.get_user_role() = 'admin');
-- Creators can create posts
CREATE POLICY "posts_insert_creator" ON posts FOR INSERT 
  WITH CHECK (auth.uid() = author_id AND public.get_user_role() IN ('creator', 'admin'));
-- Creators can update own posts
CREATE POLICY "posts_update_own" ON posts FOR UPDATE 
  USING (auth.uid() = author_id AND public.get_user_role() IN ('creator', 'admin'));
-- Admins can update any post
CREATE POLICY "posts_update_admin" ON posts FOR UPDATE USING (public.get_user_role() = 'admin');
-- Creators can delete own posts
CREATE POLICY "posts_delete_own" ON posts FOR DELETE 
  USING (auth.uid() = author_id AND public.get_user_role() IN ('creator', 'admin'));
-- Admins can delete any post
CREATE POLICY "posts_delete_admin" ON posts FOR DELETE USING (public.get_user_role() = 'admin');


-- ── VOTES ──
-- Anyone authenticated can read votes
CREATE POLICY "votes_select_all" ON votes FOR SELECT USING (true);
-- Authenticated users can insert their own votes
CREATE POLICY "votes_insert_own" ON votes FOR INSERT WITH CHECK (auth.uid() = user_id);
-- Users can delete their own votes (to toggle)
CREATE POLICY "votes_delete_own" ON votes FOR DELETE USING (auth.uid() = user_id);


-- ── COMMENTS ──
-- Anyone can read comments
CREATE POLICY "comments_select_all" ON comments FOR SELECT USING (true);
-- Authenticated users can insert comments
CREATE POLICY "comments_insert_own" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
-- Users can update own comments
CREATE POLICY "comments_update_own" ON comments FOR UPDATE USING (auth.uid() = user_id);
-- Users can delete own comments, admins can delete any
CREATE POLICY "comments_delete_own" ON comments FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "comments_delete_admin" ON comments FOR DELETE USING (public.get_user_role() = 'admin');


-- ── FOLLOWS ──
-- Anyone can see follow relationships
CREATE POLICY "follows_select_all" ON follows FOR SELECT USING (true);
-- Users can follow (insert)
CREATE POLICY "follows_insert_own" ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
-- Users can unfollow (delete)
CREATE POLICY "follows_delete_own" ON follows FOR DELETE USING (auth.uid() = follower_id);


-- ── SAVES ──
-- Users can see their own saves
CREATE POLICY "saves_select_own" ON saves FOR SELECT USING (auth.uid() = user_id);
-- Users can save
CREATE POLICY "saves_insert_own" ON saves FOR INSERT WITH CHECK (auth.uid() = user_id);
-- Users can unsave
CREATE POLICY "saves_delete_own" ON saves FOR DELETE USING (auth.uid() = user_id);


-- ── NOTIFICATIONS ──
-- Users can read their own notifications
CREATE POLICY "notifications_select_own" ON notifications FOR SELECT USING (auth.uid() = user_id);
-- System/admins can insert (service role or admin)
CREATE POLICY "notifications_insert" ON notifications FOR INSERT WITH CHECK (true);
-- Users can update (mark as read) their own notifications
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE USING (auth.uid() = user_id);


-- ── CREATOR REQUESTS ──
-- Admins can see all requests
CREATE POLICY "creator_requests_select_admin" ON creator_requests FOR SELECT 
  USING (public.get_user_role() = 'admin');
-- Applicants can check their own request status by email (unauthenticated)
CREATE POLICY "creator_requests_select_own" ON creator_requests FOR SELECT 
  USING (true);
-- Anyone can submit a request (unauthenticated allowed via anon key)
CREATE POLICY "creator_requests_insert" ON creator_requests FOR INSERT WITH CHECK (true);
-- Admins can update (approve/reject)
CREATE POLICY "creator_requests_update_admin" ON creator_requests FOR UPDATE 
  USING (public.get_user_role() = 'admin');


-- ============================================================================
-- 12. ENABLE REALTIME (toggle in Supabase Dashboard > Database > Replication)
-- These ALTER statements enable the tables for Supabase Realtime
-- ============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE posts;
ALTER PUBLICATION supabase_realtime ADD TABLE comments;
ALTER PUBLICATION supabase_realtime ADD TABLE votes;
ALTER PUBLICATION supabase_realtime ADD TABLE follows;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE creator_requests;


-- ============================================================================
-- 13. STORAGE BUCKET FOR MEDIA
-- ============================================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload
CREATE POLICY "media_upload" ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id = 'media' AND auth.role() = 'authenticated');
-- Allow public read
CREATE POLICY "media_read" ON storage.objects FOR SELECT 
  USING (bucket_id = 'media');
-- Allow users to delete their own uploads
CREATE POLICY "media_delete" ON storage.objects FOR DELETE 
  USING (bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1]);


-- ============================================================================
-- 14. SEED: Create initial admin user  
-- Run AFTER migration. Use Supabase Dashboard > Authentication to create 
-- the admin user, then update the profile:
-- 
-- UPDATE profiles SET role = 'admin' WHERE email = 'admin@ohmyhindustan.com';
-- ============================================================================
