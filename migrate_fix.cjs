// Migration script - run from admin directory
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

async function runMigration() {
  console.log('Starting migration...\n');

  // Step 1: Try to add columns to Post table via exec_sql RPC
  const sqlStatements = [
    {
      label: 'Add status column to Post',
      sql: `ALTER TABLE public."Post" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'PUBLISHED';`
    },
    {
      label: 'Add scheduledFor column to Post',
      sql: `ALTER TABLE public."Post" ADD COLUMN IF NOT EXISTS "scheduledFor" timestamptz;`
    },
    {
      label: 'Add videoUrl column to Post',
      sql: `ALTER TABLE public."Post" ADD COLUMN IF NOT EXISTS "videoUrl" text;`
    },
    {
      label: 'Create Feedback table',
      sql: `
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
      `
    },
    {
      label: 'Enable RLS on Feedback',
      sql: `ALTER TABLE public."Feedback" ENABLE ROW LEVEL SECURITY;`
    },
    {
      label: 'Create insert policy',
      sql: `DO $$ BEGIN CREATE POLICY "feedback_insert_auth" ON public."Feedback" FOR INSERT TO authenticated WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`
    },
    {
      label: 'Create select policy',
      sql: `DO $$ BEGIN CREATE POLICY "feedback_select_all" ON public."Feedback" FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`
    },
    {
      label: 'Reload schema',
      sql: `NOTIFY pgrst, 'reload schema';`
    }
  ];

  let rpcAvailable = true;

  for (const stmt of sqlStatements) {
    process.stdout.write(`  ${stmt.label}... `);
    const { error } = await supabase.rpc('exec_sql', { query: stmt.sql });
    if (error) {
      if (error.message.includes('function') || error.code === '42883') {
        rpcAvailable = false;
        console.log('RPC not available');
        break;
      }
      console.log(`⚠ ${error.message}`);
    } else {
      console.log('✓');
    }
  }

  if (!rpcAvailable) {
    console.log('\nexec_sql RPC not available. Trying Supabase Management API...');
    
    // Use the Supabase Management API to run SQL
    const projectRef = 'vxenjlgoatbkfrfrkoeq';
    const allSql = sqlStatements.map(s => s.sql).join('\n');
    
    try {
      const resp = await fetch(`https://${projectRef}.supabase.co/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({ query: allSql }),
      });
      
      if (!resp.ok) {
        const errBody = await resp.text();
        console.log('API failed:', resp.status, errBody);
        console.log('\n⚠ Cannot run DDL via API. Please run the following SQL manually in Supabase SQL Editor:\n');
        console.log('='.repeat(80));
        console.log(allSql);
        console.log('='.repeat(80));
      } else {
        console.log('✓ All SQL executed via API');
      }
    } catch (fetchErr) {
      console.log('Fetch failed:', fetchErr.message);
      console.log('\n⚠ Please run the following SQL manually in Supabase SQL Editor:\n');
      console.log('='.repeat(80));
      console.log(sqlStatements.map(s => `-- ${s.label}\n${s.sql}`).join('\n\n'));
      console.log('='.repeat(80));
    }
  }

  // Verify
  console.log('\nVerification:');
  
  const { data: fbData, error: fbErr } = await supabase.from('Feedback').select('*').limit(1);
  console.log('  Feedback table:', fbErr ? `✗ ${fbErr.message}` : '✓ accessible');

  const { data: postData, error: postErr } = await supabase.from('Post').select('status, scheduledFor, videoUrl').limit(1);
  console.log('  Post status/scheduledFor/videoUrl:', postErr ? `✗ ${postErr.message}` : '✓ accessible');

  console.log('\nDone!');
}

runMigration().catch(console.error);
