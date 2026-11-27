import fs from 'fs';
import path from 'path';

const envPath = 'D:/Postsapp-web/Oh-my-hindustan/.env.admin';
const envFile = fs.readFileSync(envPath, 'utf8');
const env = {};
envFile.split(/\r?\n/).forEach(line => {
  const idx = line.indexOf('=');
  if (idx > 0) {
    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
    if (key) env[key] = val;
  }
});

const baseUrl = env.VITE_SUPABASE_URL;
const serviceKey = env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error('Usage: node run_migrations.mjs <file1.sql> ...');
  process.exit(1);
}

async function execSql(query) {
  const res = await fetch(`${baseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({ query }),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return text;
}

async function run() {
  for (const file of files) {
    const fullPath = path.resolve(file);
    const sql = fs.readFileSync(fullPath, 'utf8');
    console.log(`Applying ${path.basename(fullPath)}...`);
    await execSql(sql);
    console.log(`  ✓ Applied ${path.basename(fullPath)}`);
  }
}

run().catch(err => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
