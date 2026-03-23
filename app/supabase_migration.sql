-- ============================================================
-- FINAL BOSS SUPABASE MIGRATION - Targeting the "User" table
-- ============================================================

-- 1. Create a debug table to see why it fails
CREATE TABLE IF NOT EXISTS public.auth_debug_log (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id TEXT,
  error_msg TEXT,
  raw_data JSONB
);

-- 2. Prepare the "User" table for Supabase Auth integration
-- Note: Using quotes because Prisma table names are case-sensitive
ALTER TABLE public."User" ALTER COLUMN username DROP NOT NULL;
ALTER TABLE public."User" ALTER COLUMN password DROP NOT NULL;
ALTER TABLE public."User" ALTER COLUMN "updatedAt" DROP NOT NULL;

-- 3. Add onboarding tracking columns to "User" table if they don't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='User' AND column_name='preferred_language') THEN
    ALTER TABLE public."User" ADD COLUMN preferred_language TEXT DEFAULT NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='User' AND column_name='selected_topics') THEN
    ALTER TABLE public."User" ADD COLUMN selected_topics TEXT[] DEFAULT NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='User' AND column_name='onboarding_complete') THEN
    ALTER TABLE public."User" ADD COLUMN onboarding_complete BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- 4. Relax constraints for initial creation
ALTER TABLE public."User" DROP CONSTRAINT IF EXISTS "User_username_key";
DROP INDEX IF EXISTS "User_username_key";

-- 5. Create proper UNIQUE partial index for username
-- This allows empty usernames during OAuth signup but ensures uniqueness once set
CREATE UNIQUE INDEX "User_username_unique_idx" 
  ON public."User" (username) 
  WHERE (username IS NOT NULL AND username != '');

-- 6. Updated Trigger Function Targeting the "User" table
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  BEGIN
    -- Note: Prisma's "User" table doesn't have full_name, so we omit it.
    -- We set username to a temporary value or NULL (since we made it nullable).
    INSERT INTO public."User" (id, email, username, password, role, onboarding_complete, "updatedAt")
    VALUES (
      NEW.id::text,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), -- Initial username attempt
      'oauth_managed', -- Dummy password for Prisma's NOT NULL constraint
      'CITIZEN', -- Using the enum value
      FALSE,
      NOW()
    )
    ON CONFLICT (id) DO UPDATE 
    SET email = EXCLUDED.email,
        "updatedAt" = NOW();
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO public.auth_debug_log (user_id, error_msg, raw_data)
    VALUES (NEW.id::text, SQLERRM, to_jsonb(NEW));
    RAISE LOG 'handle_new_user error: %', SQLERRM;
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Grant permissions
GRANT ALL ON public."User" TO authenticated;
GRANT ALL ON public."User" TO service_role;
GRANT ALL ON public."User" TO postgres;

-- 8. Re-create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. Enable RLS (Optional but recommended)
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public access" ON public."User";
CREATE POLICY "Public access" ON public."User" FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users update own record" ON public."User";
CREATE POLICY "Users update own record" ON public."User" FOR UPDATE USING (auth.uid()::text = id);

DROP POLICY IF EXISTS "Anyone can insert" ON public."User";
CREATE POLICY "Anyone can insert" ON public."User" FOR INSERT WITH CHECK (true);
