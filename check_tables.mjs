import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envFile = fs.readFileSync(path.resolve('.env.admin'), 'utf8');
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
  console.log("Checking tables...");
  
  const { data: tables, error } = await supabaseAdmin
    .from('pg_tables')
    .select('tablename')
    .eq('schemaname', 'public');

  if (error) {
    // If pg_tables is not accessible via from(), use RPC
    const rpcRes = await supabaseAdmin.rpc('exec_sql', {
      query: "SELECT tablename FROM pg_tables WHERE schemaname = 'public';"
    });
    console.log("Tables (via RPC):", JSON.stringify(rpcRes, null, 2));
  } else {
    console.log("Tables:", tables.map(t => t.tablename));
  }
}

run();
