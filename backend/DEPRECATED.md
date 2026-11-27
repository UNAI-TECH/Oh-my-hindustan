# Deprecated Legacy Express Server

This standalone Node/Express server (`backend/src`) is **deprecated** and replaced in production by:

- **Supabase Authentication** + strict PostgreSQL **Row-Level Security (RLS)** (`supabase/migrations/001`–`006`)
- **PostgreSQL RPC Functions** (`save_editorial_post`, `restore_post_revision`, `search_articles`, `record_post_view`, `get_creator_analytics`, `get_seo_audit_report`, `track_ad_impression`, `track_ad_click`, `track_video_ad_view`, `check_username_available`, `get_creator_request_status`)
- **Supabase Edge Functions** (`backend/supabase/functions/admin-api`, `account-lifecycle`, `notify-followers`, `send-credentials`)
- **PostgreSQL Cron (`pg_cron`)** (`publish_due_scheduled_posts`, `refresh_trending_scores`)

All active applications (`web`, `app`, `Hindusthan_creators`, `admin`) communicate directly with the shared Supabase backend (`vxenjlgoatbkfrfrkoeq`) and Edge Functions. Do not deploy or route production traffic to the legacy Express process in `backend/src`.
