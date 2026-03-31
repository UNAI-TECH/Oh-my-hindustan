import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envFile = fs.readFileSync(path.resolve(__dirname, '.env'), 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...vals] = line.split('=');
  if (key && vals.length) env[key.trim()] = vals.join('=').trim().replace(/['"]/g, '');
});

const supabaseAdmin = createClient(
  env.EXPO_PUBLIC_API_BASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY || env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  const { data, error } = await supabaseAdmin.storage.createBucket('ads', {
    public: true,
    fileSizeLimit: 10485760, // 10MB
  });

  if (error && error.message.includes('already exists')) {
      console.log("Bucket already exists! That's fine.");
  } else if (error) {
      console.log("Fallback: Make sure policies are public.", error);
  } else {
      console.log("Bucket created successfully:", data);
  }
}

run();
