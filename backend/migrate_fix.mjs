// Migration script to fix Feedback table and Post columns
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

async function runMigration() {
  console.log('Starting migration...\n');

  // 1. Add status and scheduledFor columns to Post table
  console.log('1. Adding status column to Post table...');
  let { error } = await supabase.rpc('exec_sql', {
    query: `ALTER TABLE public."Post" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'PUBLISHED';`
  });
  if (error) {
    console.log('   RPC not available, trying direct approach...');
    // Try inserting a test row to see what columns exist
    const { data: postCols } = await supabase.from('Post').select('*').limit(1);
    console.log('   Existing Post columns:', postCols && postCols.length > 0 ? Object.keys(postCols[0]).join(', ') : 'empty table');
  } else {
    console.log('   ✓ status column added');
  }

  console.log('2. Adding scheduledFor column to Post table...');
  ({ error } = await supabase.rpc('exec_sql', {
    query: `ALTER TABLE public."Post" ADD COLUMN IF NOT EXISTS "scheduledFor" timestamptz;`
  }));
  if (error) {
    console.log('   ⚠ Could not add via RPC:', error.message);
  } else {
    console.log('   ✓ scheduledFor column added');
  }

  console.log('3. Adding videoUrl column to Post table...');
  ({ error } = await supabase.rpc('exec_sql', {
    query: `ALTER TABLE public."Post" ADD COLUMN IF NOT EXISTS "videoUrl" text;`
  }));
  if (error) {
    console.log('   ⚠ Could not add via RPC:', error.message);
  } else {
    console.log('   ✓ videoUrl column added');
  }

  // 2. Create Feedback table
  console.log('4. Creating Feedback table...');
  ({ error } = await supabase.rpc('exec_sql', {
    query: `
      CREATE TABLE IF NOT EXISTS public."Feedback" (
        "id" text NOT NULL DEFAULT gen_random_uuid()::text,
        "userId" text,
        "content" text NOT NULL,
        "rating" integer NOT NULL DEFAULT 5,
        "status" text NOT NULL DEFAULT 'pending',
        "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "Feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
      );
    `
  }));
  if (error) {
    console.log('   ⚠ Could not create via RPC:', error.message);
  } else {
    console.log('   ✓ Feedback table created');
  }

  // 3. Add RLS policies
  console.log('5. Setting up RLS for Feedback...');
  ({ error } = await supabase.rpc('exec_sql', {
    query: `
      ALTER TABLE public."Feedback" ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "feedback_insert_auth" ON public."Feedback";
      CREATE POLICY "feedback_insert_auth" ON public."Feedback" FOR INSERT TO authenticated WITH CHECK (true);
      DROP POLICY IF EXISTS "feedback_select_all" ON public."Feedback";
      CREATE POLICY "feedback_select_all" ON public."Feedback" FOR SELECT USING (true);
    `
  }));
  if (error) {
    console.log('   ⚠ Could not set up RLS via RPC:', error.message);
  } else {
    console.log('   ✓ RLS policies created for Feedback');
  }

  // 4. Notify PostgREST to reload schema
  console.log('6. Reloading PostgREST schema cache...');
  ({ error } = await supabase.rpc('exec_sql', {
    query: `NOTIFY pgrst, 'reload schema';`
  }));
  if (error) {
    console.log('   ⚠ Could not notify:', error.message);
  } else {
    console.log('   ✓ Schema cache reloaded');
  }

  // 5. Verify
  console.log('\n7. Verifying...');
  const { data: feedbackTest, error: fbErr } = await supabase.from('Feedback').select('*').limit(1);
  console.log('   Feedback table:', fbErr ? `ERROR: ${fbErr.message}` : '✓ accessible');

  const { data: postTest, error: postErr } = await supabase.from('Post').select('status, scheduledFor, videoUrl').limit(1);
  console.log('   Post status/scheduledFor/videoUrl:', postErr ? `ERROR: ${postErr.message}` : '✓ accessible');

  console.log('\nMigration complete!');
}

runMigration().catch(console.error);
