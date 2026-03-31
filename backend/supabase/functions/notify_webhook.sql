-- 1. Enable pg_net Extension (required for webhooks)
CREATE EXTENSION IF NOT EXISTS "pg_net";

-- 2. Create the Trigger Function to call the Edge Function
CREATE OR REPLACE FUNCTION public.handle_new_post_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Call the notify-followers Edge Function
  -- URL: https://vxenjlgoatbkfrfrkoeq.supabase.co/functions/v1/notify-followers
  PERFORM
    net.http_post(
      url := 'https://vxenjlgoatbkfrfrkoeq.supabase.co/functions/v1/notify-followers',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (SELECT value FROM get_secret('SUPABASE_SERVICE_ROLE_KEY'))
      ),
      body := jsonb_build_object('record', row_to_json(NEW))
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create the Trigger on the Post table
DROP TRIGGER IF EXISTS on_post_created ON public."Post";
CREATE TRIGGER on_post_created
  AFTER INSERT ON public."Post"
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_post_notification();

-- NOTE: If your Supabase project doesn't have a 'get_secret' function, 
-- you can replace the Authorization header with your actual SERVICE_ROLE_KEY 
-- or simply remove it if the function is set to 'no-auth' (not recommended).
