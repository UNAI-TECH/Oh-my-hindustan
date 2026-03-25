import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envFile = fs.readFileSync(path.resolve('.env'), 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...vals] = line.split('=');
  if (key && vals.length) env[key.trim()] = vals.join('=').trim().replace(/['"]/g, '');
});

const supabaseAdmin = createClient(
  env.VITE_SUPABASE_URL,
  env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  console.log('Running migration...\n');

  // Step 1: Add columns to Post table + Create Feedback table
  const migrationSQL = `
    -- Add status and scheduledFor columns to Post
    ALTER TABLE public."Post" 
    ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'PUBLISHED',
    ADD COLUMN IF NOT EXISTS "scheduledFor" timestamp with time zone,
    ADD COLUMN IF NOT EXISTS "videoUrl" text;

    -- Create Feedback table
    CREATE TABLE IF NOT EXISTS public."Feedback" (
      "id" text NOT NULL DEFAULT gen_random_uuid()::text,
      "userId" text,
      "content" text NOT NULL,
      "rating" integer NOT NULL DEFAULT 5,
      "status" text NOT NULL DEFAULT 'pending',
      "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "Feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"("id") ON DELETE SET NULL ON UPDATE CASCADE
    );

    -- Enable RLS on Feedback
    ALTER TABLE public."Feedback" ENABLE ROW LEVEL SECURITY;

    -- Reload schema cache
    NOTIFY pgrst, 'reload schema';
  `;

  const res = await supabaseAdmin.rpc('exec_sql', { query: migrationSQL });
  console.log('Migration result:', JSON.stringify(res, null, 2));

  if (res.error) {
    console.log('\n⚠ exec_sql RPC failed. Trying individual statements...\n');
    
    // Try statements individually
    const statements = [
      { label: 'Post columns', sql: `ALTER TABLE public."Post" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'PUBLISHED', ADD COLUMN IF NOT EXISTS "scheduledFor" timestamp with time zone, ADD COLUMN IF NOT EXISTS "videoUrl" text;` },
      { label: 'Feedback table', sql: `CREATE TABLE IF NOT EXISTS public."Feedback" ("id" text NOT NULL DEFAULT gen_random_uuid()::text, "userId" text, "content" text NOT NULL, "rating" integer NOT NULL DEFAULT 5, "status" text NOT NULL DEFAULT 'pending', "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id"), CONSTRAINT "Feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"("id") ON DELETE SET NULL ON UPDATE CASCADE);` },
      { label: 'RLS', sql: `ALTER TABLE public."Feedback" ENABLE ROW LEVEL SECURITY;` },
      { label: 'Schema reload', sql: `NOTIFY pgrst, 'reload schema';` },
    ];

    for (const stmt of statements) {
      const r = await supabaseAdmin.rpc('exec_sql', { query: stmt.sql });
      console.log(`  ${stmt.label}:`, r.error ? `✗ ${r.error.message}` : '✓');
    }
  }

  // Step 2: Add RLS policies  
  console.log('\nAdding RLS policies...');
  const policySQL = `
    DO $$ BEGIN CREATE POLICY "feedback_insert_auth" ON public."Feedback" FOR INSERT TO authenticated WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  `;
  const p1 = await supabaseAdmin.rpc('exec_sql', { query: policySQL });
  console.log('  Insert policy:', p1.error ? `✗ ${p1.error.message}` : '✓');

  const policySQL2 = `
    DO $$ BEGIN CREATE POLICY "feedback_select_all" ON public."Feedback" FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  `;
  const p2 = await supabaseAdmin.rpc('exec_sql', { query: policySQL2 });
  console.log('  Select policy:', p2.error ? `✗ ${p2.error.message}` : '✓');

  // Reload schema again after policies
  await supabaseAdmin.rpc('exec_sql', { query: `NOTIFY pgrst, 'reload schema';` });

  // Step 3: Verify
  console.log('\nVerification:');
  const { error: fbErr } = await supabaseAdmin.from('Feedback').select('*').limit(1);
  console.log('  Feedback table:', fbErr ? `✗ ${fbErr.message}` : '✓ accessible');

  const { error: postErr } = await supabaseAdmin.from('Post').select('status, scheduledFor, videoUrl').limit(1);
  console.log('  Post columns:', postErr ? `✗ ${postErr.message}` : '✓ accessible');

  console.log('\nDone!');
}

run().catch(console.error);
