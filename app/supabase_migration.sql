-- ============================================================
-- FINAL BOSS SUPABASE MIGRATION - Run in Supabase SQL Editor
-- This version handles errors and logging!
-- ============================================================

-- 1. Create a debug table to see why it fails
CREATE TABLE IF NOT EXISTS public.auth_debug_log (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID,
  error_msg TEXT,
  raw_data JSONB
);

-- 2. Create profiles table (ensure name matches what app uses)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  username TEXT, -- NO UNIQUE here until it's non-null
  full_name TEXT,
  role TEXT DEFAULT 'CITIZEN',
  preferred_language TEXT DEFAULT NULL,
  selected_topics TEXT[] DEFAULT NULL,
  onboarding_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Relax all constraints for initial creation
ALTER TABLE public.profiles ALTER COLUMN username DROP NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN username SET DEFAULT NULL;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_username_key;

-- 4. Create proper UNIQUE partial index for username
DROP INDEX IF EXISTS profiles_username_unique_idx;
CREATE UNIQUE INDEX profiles_username_unique_idx 
  ON public.profiles (username) 
  WHERE (username IS NOT NULL AND username != '');

-- 5. Updated Trigger Function with Error Catching
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  BEGIN
    INSERT INTO public.profiles (id, email, full_name, role, onboarding_complete)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      'CITIZEN',
      FALSE
    )
    ON CONFLICT (id) DO UPDATE 
    SET email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, profiles.full_name);
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO public.auth_debug_log (user_id, error_msg, raw_data)
    VALUES (NEW.id, SQLERRM, to_jsonb(NEW));
    -- Re-raise to show in Supabase logs but with more info
    RAISE LOG 'handle_new_user error: %', SQLERRM;
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Grant permissions to the authenticator role (just in case)
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.profiles TO postgres;

-- 7. Re-create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles read" ON public.profiles;
CREATE POLICY "Public profiles read" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Anyone can insert" ON public.profiles;
CREATE POLICY "Anyone can insert" ON public.profiles FOR INSERT WITH CHECK (true);
