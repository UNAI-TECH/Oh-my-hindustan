const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:Hindusthan@26@db.vxenjlgoatbkfrfrkoeq.supabase.co:5432/postgres',
});

async function main() {
  await client.connect();
  const sql = `
    CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS TRIGGER AS $$
    BEGIN
      INSERT INTO public."User" (id, email, username, role)
      VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        'CITIZEN'
      )
      ON CONFLICT (id) DO NOTHING;
      RETURN NEW;
    EXCEPTION WHEN OTHERS THEN
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `;
  await client.query(sql);
  console.log('Trigger function updated successfully.');
  await client.end();
}

main().catch(console.error);
