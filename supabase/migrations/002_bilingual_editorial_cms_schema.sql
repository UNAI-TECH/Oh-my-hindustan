-- ============================================================================
-- Migration 002: Bilingual (en/ta) Editorial CMS, Categories, Tags, Media,
-- Revisions, Homepage Config, Site Settings, SEO Redirects & Audit Logs
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- 1. Translation Groups
CREATE TABLE IF NOT EXISTS public.translation_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by TEXT REFERENCES public."User"(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Extend public."Post" non-destructively (authoritative content table)
ALTER TABLE public."Post"
  ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS short_description TEXT,
  ADD COLUMN IF NOT EXISTS content_json JSONB,
  ADD COLUMN IF NOT EXISTS featured_image_alt TEXT,
  ADD COLUMN IF NOT EXISTS featured_image_caption TEXT,
  ADD COLUMN IF NOT EXISTS featured_image_credit TEXT,
  ADD COLUMN IF NOT EXISTS translation_group_id UUID REFERENCES public.translation_groups(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS seo_title TEXT,
  ADD COLUMN IF NOT EXISTS seo_description TEXT,
  ADD COLUMN IF NOT EXISTS canonical_url TEXT,
  ADD COLUMN IF NOT EXISTS og_title TEXT,
  ADD COLUMN IF NOT EXISTS og_description TEXT,
  ADD COLUMN IF NOT EXISTS og_image TEXT,
  ADD COLUMN IF NOT EXISTS robots_index BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_breaking BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_editors_pick BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS views_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS likes_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS comments_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reading_time_minutes INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS search_vector TSVECTOR;

DO $$ BEGIN
  ALTER TABLE public."Post" ADD CONSTRAINT "Post_language_check" CHECK (language IN ('en', 'ta'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public."Post" ADD CONSTRAINT "Post_status_check" CHECK (status IN ('DRAFT', 'PUBLISHED', 'SCHEDULED', 'ARCHIVED'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public."Post" ADD CONSTRAINT "Post_non_negative_counters"
    CHECK (views_count >= 0 AND likes_count >= 0 AND comments_count >= 0 AND reading_time_minutes >= 1);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Slug helper for backfill
CREATE OR REPLACE FUNCTION public.slugify_text(p_input TEXT, p_fallback TEXT DEFAULT 'post')
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_clean TEXT;
BEGIN
  v_clean := lower(trim(COALESCE(p_input, '')));
  v_clean := regexp_replace(v_clean, '[''’`]', '', 'g');
  v_clean := regexp_replace(v_clean, '[^\w\u0B80-\u0BFF]+', '-', 'g');
  v_clean := regexp_replace(v_clean, '^-+|-+$', '', 'g');
  IF length(v_clean) > 90 THEN
    v_clean := left(v_clean, 90);
    v_clean := regexp_replace(v_clean, '-+$', '');
  END IF;
  IF v_clean IS NULL OR v_clean = '' THEN
    RETURN p_fallback;
  END IF;
  RETURN v_clean;
END;
$$;

-- Backfill published_at, slug, and authoritative counts for existing posts
DO $$
DECLARE
  r RECORD;
  base_slug TEXT;
  candidate_slug TEXT;
  suffix INT;
BEGIN
  UPDATE public."Post"
  SET published_at = COALESCE(published_at, "createdAt"::timestamptz)
  WHERE status = 'PUBLISHED' AND published_at IS NULL;

  FOR r IN SELECT id, title, language, slug FROM public."Post" WHERE slug IS NULL OR slug = '' LOOP
    base_slug := public.slugify_text(r.title, 'article-' || left(r.id, 8));
    candidate_slug := base_slug;
    suffix := 2;
    WHILE EXISTS (
      SELECT 1 FROM public."Post" p
      WHERE p.language = r.language AND p.slug = candidate_slug AND p.id <> r.id
    ) LOOP
      candidate_slug := left(base_slug, 84) || '-' || suffix;
      suffix := suffix + 1;
    END LOOP;
    UPDATE public."Post" SET slug = candidate_slug WHERE id = r.id;
  END LOOP;

  -- Sync authoritative engagement counters from existing rows
  UPDATE public."Post" p
  SET
    views_count = COALESCE((SELECT count(*)::int FROM public."PostView" pv WHERE pv."postId" = p.id), 0),
    likes_count = COALESCE((SELECT count(*)::int FROM public."Vote" v WHERE v."postId" = p.id AND v.type = 1), 0),
    comments_count = COALESCE((SELECT count(*)::int FROM public."Comment" c WHERE c."postId" = p.id AND c.content <> '[SYSTEM_REPOST]'), 0),
    reading_time_minutes = GREATEST(1, LEAST(30, ceil(GREATEST(1, array_length(regexp_split_to_array(trim(regexp_replace(COALESCE(p.content, p.title, ''), '<[^>]*>', ' ', 'g')), '\s+'), 1)) / 200.0)::int))
  WHERE p.id IS NOT NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_post_language_slug
  ON public."Post"(language, slug) WHERE slug IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_post_translation_group_lang
  ON public."Post"(translation_group_id, language) WHERE translation_group_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_post_feed_query
  ON public."Post"(language, status, is_active, published_at DESC);

CREATE INDEX IF NOT EXISTS idx_post_author_status
  ON public."Post"("authorId", status, "createdAt" DESC);

CREATE INDEX IF NOT EXISTS idx_post_scheduled
  ON public."Post"("scheduledFor") WHERE status = 'SCHEDULED';

CREATE INDEX IF NOT EXISTS idx_post_trending
  ON public."Post"(language, trending_score DESC) WHERE status = 'PUBLISHED' AND COALESCE(is_active, true) = true;

CREATE INDEX IF NOT EXISTS idx_post_title_trgm ON public."Post" USING GIN (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_post_desc_trgm ON public."Post" USING GIN (short_description gin_trgm_ops);

-- 3. Post Revisions
CREATE TABLE IF NOT EXISTS public.post_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id TEXT NOT NULL REFERENCES public."Post"(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  short_description TEXT,
  content TEXT,
  content_json JSONB,
  category_ids UUID[],
  tag_ids UUID[],
  seo_metadata JSONB DEFAULT '{}'::jsonb,
  featured_image TEXT,
  modified_by TEXT REFERENCES public."User"(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, version_number)
);
CREATE INDEX IF NOT EXISTS idx_post_revisions_post ON public.post_revisions(post_id, version_number DESC);

-- 4. Bilingual Categories & Post-Category relations
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en TEXT NOT NULL,
  name_ta TEXT NOT NULL,
  slug_en TEXT NOT NULL UNIQUE,
  slug_ta TEXT NOT NULL UNIQUE,
  description_en TEXT,
  description_ta TEXT,
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  image_url TEXT,
  icon TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  nav_visible BOOLEAN NOT NULL DEFAULT true,
  home_visible BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  seo_title_en TEXT,
  seo_title_ta TEXT,
  seo_description_en TEXT,
  seo_description_ta TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.post_categories (
  post_id TEXT NOT NULL REFERENCES public."Post"(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  PRIMARY KEY (post_id, category_id)
);
CREATE INDEX IF NOT EXISTS idx_post_categories_cat ON public.post_categories(category_id);

-- Seed initial bilingual categories + existing platform categories
INSERT INTO public.categories (name_en, name_ta, slug_en, slug_ta, display_order, nav_visible, home_visible)
VALUES
  ('National', 'தேசியம்', 'national', 'தேசியம்', 1, true, true),
  ('International', 'உலகம்', 'international', 'உலகம்', 2, true, true),
  ('Politics', 'அரசியல்', 'politics', 'அரசியல்', 3, true, true),
  ('Technology', 'தொழில்நுட்பம்', 'technology', 'தொழில்நுட்பம்', 4, true, true),
  ('Business', 'வணிகம்', 'business', 'வணிகம்', 5, true, true),
  ('Economy', 'பொருளாதாரம்', 'economy', 'பொருளாதாரம்', 6, true, true),
  ('Policy', 'கொள்கை', 'policy', 'கொள்கை', 7, true, true),
  ('Education', 'கல்வி', 'education', 'கல்வி', 8, true, true),
  ('Sports', 'விளையாட்டு', 'sports', 'விளையாட்டு', 9, true, true),
  ('Entertainment', 'பொழுதுபோக்கு', 'entertainment', 'பொழுதுபோக்கு', 10, false, true),
  ('Science', 'அறிவியல்', 'science', 'அறிவியல்', 11, true, true),
  ('Culture', 'கலாச்சாரம்', 'culture', 'கலாச்சாரம்', 12, true, true),
  ('Lifestyle', 'வாழ்க்கை முறை', 'lifestyle', 'வாழ்க்கை-முறை', 13, false, true),
  ('General', 'பொது', 'general', 'பொது', 14, false, false)
ON CONFLICT (slug_en) DO NOTHING;

-- Link existing posts to categories without losing custom categories
DO $$
DECLARE
  p_rec RECORD;
  cat_name TEXT;
  cat_slug TEXT;
  cat_id UUID;
BEGIN
  FOR p_rec IN SELECT id, category, custom_category FROM public."Post" LOOP
    cat_name := CASE
      WHEN lower(COALESCE(p_rec.category, '')) = 'custom' AND NULLIF(trim(p_rec.custom_category), '') IS NOT NULL
        THEN initcap(trim(p_rec.custom_category))
      ELSE initcap(COALESCE(NULLIF(trim(p_rec.category), ''), 'General'))
    END;
    cat_slug := public.slugify_text(cat_name, 'general');

    SELECT id INTO cat_id FROM public.categories WHERE slug_en = cat_slug LIMIT 1;
    IF cat_id IS NULL THEN
      INSERT INTO public.categories (name_en, name_ta, slug_en, slug_ta, display_order, nav_visible, home_visible)
      VALUES (cat_name, cat_name, cat_slug, cat_slug, 50, false, false)
      ON CONFLICT (slug_en) DO UPDATE SET name_en = EXCLUDED.name_en
      RETURNING id INTO cat_id;
    END IF;

    INSERT INTO public.post_categories (post_id, category_id, is_primary)
    VALUES (p_rec.id, cat_id, true)
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- 5. Centralized Bilingual Tags & Post-Tag relations
CREATE TABLE IF NOT EXISTS public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en TEXT NOT NULL,
  name_ta TEXT,
  slug_en TEXT NOT NULL UNIQUE,
  slug_ta TEXT UNIQUE,
  description_en TEXT,
  description_ta TEXT,
  seo_title_en TEXT,
  seo_title_ta TEXT,
  seo_description_en TEXT,
  seo_description_ta TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.post_tags (
  post_id TEXT NOT NULL REFERENCES public."Post"(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);
CREATE INDEX IF NOT EXISTS idx_post_tags_tag ON public.post_tags(tag_id);

-- Migrate existing Post.hashtags into tags + post_tags
DO $$
DECLARE
  p_rec RECORD;
  raw_tag TEXT;
  clean_tag TEXT;
  t_slug TEXT;
  t_id UUID;
BEGIN
  FOR p_rec IN SELECT id, hashtags FROM public."Post" WHERE hashtags IS NOT NULL AND array_length(hashtags, 1) > 0 LOOP
    FOREACH raw_tag IN ARRAY p_rec.hashtags LOOP
      clean_tag := trim(regexp_replace(COALESCE(raw_tag, ''), '^#+', ''));
      IF clean_tag <> '' THEN
        t_slug := public.slugify_text(clean_tag, 'tag');
        SELECT id INTO t_id FROM public.tags WHERE slug_en = t_slug LIMIT 1;
        IF t_id IS NULL THEN
          INSERT INTO public.tags (name_en, name_ta, slug_en, slug_ta)
          VALUES (clean_tag, clean_tag, t_slug, t_slug)
          ON CONFLICT (slug_en) DO UPDATE SET name_en = EXCLUDED.name_en
          RETURNING id INTO t_id;
        END IF;
        INSERT INTO public.post_tags (post_id, tag_id) VALUES (p_rec.id, t_id) ON CONFLICT DO NOTHING;
      END IF;
    END LOOP;
  END LOOP;
END $$;

-- 6. Centralized Media Library
CREATE TABLE IF NOT EXISTS public.media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id TEXT REFERENCES public."User"(id) ON DELETE SET NULL,
  bucket TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size BIGINT NOT NULL CHECK (file_size >= 0),
  width INTEGER,
  height INTEGER,
  alt_text TEXT,
  caption TEXT,
  credit TEXT,
  asset_kind TEXT NOT NULL DEFAULT 'article_image' CHECK (asset_kind IN ('article_image', 'avatar', 'cover', 'branding', 'video', 'ad', 'story')),
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_media_assets_owner ON public.media_assets(owner_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.post_media (
  post_id TEXT NOT NULL REFERENCES public."Post"(id) ON DELETE CASCADE,
  media_id UUID NOT NULL REFERENCES public.media_assets(id) ON DELETE RESTRICT,
  role TEXT NOT NULL DEFAULT 'inline' CHECK (role IN ('featured', 'inline', 'gallery', 'video')),
  PRIMARY KEY (post_id, media_id, role)
);

-- 7. Homepage Configuration (bilingual, admin-managed)
CREATE TABLE IF NOT EXISTS public.homepage_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  language TEXT NOT NULL UNIQUE CHECK (language IN ('en', 'ta')),
  sections JSONB NOT NULL DEFAULT '[]'::jsonb,
  breaking_post_ids TEXT[] NOT NULL DEFAULT '{}',
  lead_post_id TEXT REFERENCES public."Post"(id) ON DELETE SET NULL,
  featured_post_ids TEXT[] NOT NULL DEFAULT '{}',
  editors_pick_ids TEXT[] NOT NULL DEFAULT '{}',
  banners JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_by TEXT REFERENCES public."User"(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.homepage_config (language, sections)
VALUES
  ('en', '[
    {"key":"breaking","title":"Breaking News","visible":true,"limit":5,"order":1},
    {"key":"hero","title":"Main News & Picks","visible":true,"limit":8,"order":2},
    {"key":"featured","title":"Featured Stories","visible":true,"limit":4,"order":3},
    {"key":"latest","title":"Latest News","visible":true,"limit":10,"order":4},
    {"key":"trending","title":"Trending Now","visible":true,"limit":6,"order":5},
    {"key":"most_read","title":"Most Read","visible":true,"limit":6,"order":6},
    {"key":"videos","title":"Video Reports","visible":true,"limit":6,"order":7}
  ]'::jsonb),
  ('ta', '[
    {"key":"breaking","title":"முக்கிய செய்திகள்","visible":true,"limit":5,"order":1},
    {"key":"hero","title":"பிரதான செய்திகள்","visible":true,"limit":8,"order":2},
    {"key":"featured","title":"சிறப்புக் கட்டுரைகள்","visible":true,"limit":4,"order":3},
    {"key":"latest","title":"அண்மைச் செய்திகள்","visible":true,"limit":10,"order":4},
    {"key":"trending","title":"டிரெண்டிங்","visible":true,"limit":6,"order":5},
    {"key":"most_read","title":"அதிகம் வாசிக்கப்பட்டவை","visible":true,"limit":6,"order":6},
    {"key":"videos","title":"காணொளிச் செய்திகள்","visible":true,"limit":6,"order":7}
  ]'::jsonb)
ON CONFLICT (language) DO NOTHING;

-- 8. Persistent Site Settings (singleton)
CREATE TABLE IF NOT EXISTS public.site_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  general JSONB NOT NULL DEFAULT '{"siteName":"PostsApp","tagline_en":"Independent Digital Magazine & Wire","tagline_ta":"சுயாதீன டிஜிட்டல் செய்தி மற்றும் பகுப்பாய்வு தளம்","description_en":"PostsApp is an independent digital news, policy analysis, and commentary portal.","description_ta":"போஸ்ட்ஸ்ஆப் (PostsApp) சுயாதீன செய்தி, கொள்கை பகுப்பாய்வு மற்றும் கருத்துத் தளமாகும்.","defaultLanguage":"en","timezone":"Asia/Kolkata"}'::jsonb,
  branding JSONB NOT NULL DEFAULT '{"logoUrl":"/logo-postsapp-light.png","mobileLogoUrl":"/logo-postsapp-dark.png","faviconUrl":"/favicon.ico","defaultOgImage":"/og-default.png"}'::jsonb,
  contact JSONB NOT NULL DEFAULT '{"email":"editorial@postsapp.com","phone":"","address":"New Delhi • Chennai • Bengaluru • Mumbai","contactEnabled":true}'::jsonb,
  social JSONB NOT NULL DEFAULT '{"facebook":"","instagram":"","x":"","linkedin":"","youtube":"https://www.youtube.com/@postsapp","telegram":""}'::jsonb,
  navigation JSONB NOT NULL DEFAULT '{"headerLinks":[],"footerLinks":[]}'::jsonb,
  editorial JSONB NOT NULL DEFAULT '{"newsletterEnabled":true,"defaultCategory":"general","trendingWindowHours":72}'::jsonb,
  seo JSONB NOT NULL DEFAULT '{"defaultMetaTitle_en":"PostsApp — Independent Digital Magazine & Wire","defaultMetaTitle_ta":"PostsApp — சுயாதீன டிஜிட்டல் செய்தி தளம்","defaultMetaDescription_en":"Breaking news, policy analysis, technology, economy, and culture from independent voices across India.","defaultMetaDescription_ta":"இந்தியா முழுவதும் உள்ள சுயாதீன குரல்களின் முக்கிய செய்திகள், கொள்கை பகுப்பாய்வு மற்றும் கலாச்சாரக் கட்டுரைகள்.","publisherName":"PostsApp Digital Media","canonicalDomain":"https://postsapp.com","allowIndexing":true}'::jsonb,
  integrations JSONB NOT NULL DEFAULT '{"ga4MeasurementId":"","gscVerification":"","gtmId":""}'::jsonb,
  legal JSONB NOT NULL DEFAULT '{"about_en":"Editorial review pending: configure About Us content in Admin Site Settings.","about_ta":"உள்ளடக்கம் நிர்வாக அமைப்புகளில் புதுப்பிக்கப்பட உள்ளது.","privacy_en":"Privacy policy pending editorial review.","privacy_ta":"தனியுரிமைக் கொள்கை விரைவில் புதுப்பிக்கப்படும்.","terms_en":"Terms and conditions pending editorial review.","terms_ta":"விதிமுறைகள் மற்றும் நிபந்தனைகள் விரைவில் புதுப்பிக்கப்படும்.","editorialPolicy_en":"Editorial policy pending editorial review.","editorialPolicy_ta":"ஆசிரியர் கொள்கை விரைவில் புதுப்பிக்கப்படும்.","correctionsPolicy_en":"Corrections policy pending editorial review.","correctionsPolicy_ta":"திருத்தக் கொள்கை விரைவில் புதுப்பிக்கப்படும்."}'::jsonb,
  updated_by TEXT REFERENCES public."User"(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.site_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- 9. SEO Redirects
CREATE TABLE IF NOT EXISTS public.seo_redirects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_path TEXT NOT NULL UNIQUE,
  target_path TEXT NOT NULL,
  status_code INTEGER NOT NULL DEFAULT 301 CHECK (status_code IN (301, 302, 307, 308)),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. Append-Only Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id TEXT,
  actor_role TEXT,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  previous_values JSONB,
  updated_values JSONB,
  outcome TEXT NOT NULL DEFAULT 'success' CHECK (outcome IN ('success', 'failure')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_id, action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON public.audit_logs(resource_type, resource_id);

-- 11. Scheduled Publish Jobs & Notification Idempotency
CREATE TABLE IF NOT EXISTS public.scheduled_publish_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id TEXT NOT NULL REFERENCES public."Post"(id) ON DELETE CASCADE,
  scheduled_for TIMESTAMPTZ NOT NULL,
  executed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'published', 'failed', 'cancelled')),
  attempts INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notification_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_key TEXT NOT NULL UNIQUE,
  post_id TEXT REFERENCES public."Post"(id) ON DELETE CASCADE,
  recipients_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. RLS Policies for all new CMS/Config/Audit tables
ALTER TABLE public.translation_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tg_select_all" ON public.translation_groups FOR SELECT USING (true);
CREATE POLICY "tg_creator_write" ON public.translation_groups FOR ALL USING (public.is_creator_or_admin()) WITH CHECK (public.is_creator_or_admin());

ALTER TABLE public.post_revisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "revisions_select_owner_or_admin" ON public.post_revisions FOR SELECT USING (
  public.is_admin() OR EXISTS (SELECT 1 FROM public."Post" p WHERE p.id = post_id AND p."authorId" = auth.uid()::text)
);
CREATE POLICY "revisions_insert_owner_or_admin" ON public.post_revisions FOR INSERT WITH CHECK (
  public.is_admin() OR EXISTS (SELECT 1 FROM public."Post" p WHERE p.id = post_id AND p."authorId" = auth.uid()::text AND public.is_creator_or_admin())
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories_select_all" ON public.categories FOR SELECT USING (is_active = true OR public.is_admin());
CREATE POLICY "categories_admin_write" ON public.categories FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

ALTER TABLE public.post_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "post_categories_select_all" ON public.post_categories FOR SELECT USING (true);
CREATE POLICY "post_categories_write" ON public.post_categories FOR ALL USING (
  public.is_admin() OR EXISTS (SELECT 1 FROM public."Post" p WHERE p.id = post_id AND p."authorId" = auth.uid()::text AND public.is_creator_or_admin())
) WITH CHECK (
  public.is_admin() OR EXISTS (SELECT 1 FROM public."Post" p WHERE p.id = post_id AND p."authorId" = auth.uid()::text AND public.is_creator_or_admin())
);

ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tags_select_all" ON public.tags FOR SELECT USING (true);
CREATE POLICY "tags_creator_admin_write" ON public.tags FOR INSERT WITH CHECK (public.is_creator_or_admin());
CREATE POLICY "tags_admin_update_delete" ON public.tags FOR UPDATE USING (public.is_admin());
CREATE POLICY "tags_admin_delete" ON public.tags FOR DELETE USING (public.is_admin());

ALTER TABLE public.post_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "post_tags_select_all" ON public.post_tags FOR SELECT USING (true);
CREATE POLICY "post_tags_write" ON public.post_tags FOR ALL USING (
  public.is_admin() OR EXISTS (SELECT 1 FROM public."Post" p WHERE p.id = post_id AND p."authorId" = auth.uid()::text AND public.is_creator_or_admin())
) WITH CHECK (
  public.is_admin() OR EXISTS (SELECT 1 FROM public."Post" p WHERE p.id = post_id AND p."authorId" = auth.uid()::text AND public.is_creator_or_admin())
);

ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "media_assets_select" ON public.media_assets FOR SELECT USING (
  is_public = true OR owner_id = auth.uid()::text OR public.is_admin()
);
CREATE POLICY "media_assets_insert" ON public.media_assets FOR INSERT WITH CHECK (
  owner_id = auth.uid()::text AND public.is_active_user()
);
CREATE POLICY "media_assets_update_delete" ON public.media_assets FOR ALL USING (
  owner_id = auth.uid()::text OR public.is_admin()
) WITH CHECK (
  owner_id = auth.uid()::text OR public.is_admin()
);

ALTER TABLE public.post_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "post_media_select_all" ON public.post_media FOR SELECT USING (true);
CREATE POLICY "post_media_write" ON public.post_media FOR ALL USING (
  public.is_admin() OR EXISTS (SELECT 1 FROM public."Post" p WHERE p.id = post_id AND p."authorId" = auth.uid()::text AND public.is_creator_or_admin())
) WITH CHECK (
  public.is_admin() OR EXISTS (SELECT 1 FROM public."Post" p WHERE p.id = post_id AND p."authorId" = auth.uid()::text AND public.is_creator_or_admin())
);

ALTER TABLE public.homepage_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "homepage_config_select_all" ON public.homepage_config FOR SELECT USING (true);
CREATE POLICY "homepage_config_admin_write" ON public.homepage_config FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "site_settings_select_all" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "site_settings_admin_write" ON public.site_settings FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

ALTER TABLE public.seo_redirects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "seo_redirects_select_all" ON public.seo_redirects FOR SELECT USING (is_active = true OR public.is_admin());
CREATE POLICY "seo_redirects_admin_write" ON public.seo_redirects FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_logs_admin_select_only" ON public.audit_logs FOR SELECT USING (public.is_admin());

ALTER TABLE public.scheduled_publish_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sched_jobs_select_owner_or_admin" ON public.scheduled_publish_jobs FOR SELECT USING (
  public.is_admin() OR EXISTS (SELECT 1 FROM public."Post" p WHERE p.id = post_id AND p."authorId" = auth.uid()::text)
);

ALTER TABLE public.notification_deliveries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notif_deliv_admin_only" ON public.notification_deliveries FOR SELECT USING (public.is_admin());

NOTIFY pgrst, 'reload schema';
