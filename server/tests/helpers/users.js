import { randomBytes } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { adminClient } from '../../src/config/supabase.js';
import { env } from '../../src/config/env.js';

// Creates a throwaway confirmed user and returns { user, token }.
// Emails use the reserved .test domain; passwords are random per run.
export async function createTestUser(label = 'user') {
  const email = `slate-${label}-${Date.now()}-${randomBytes(3).toString('hex')}@slate.test`;
  const password = randomBytes(18).toString('base64url');

  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: `Test ${label}` },
  });
  if (error) throw error;

  const anon = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const { data: session, error: signErr } = await anon.auth.signInWithPassword({ email, password });
  if (signErr) throw signErr;

  return { user: data.user, token: session.session.access_token };
}

// Removes a test user and everything they own.
export async function deleteTestUser(user) {
  if (!user) return;
  await adminClient.from('businesses').delete().eq('owner_id', user.id);
  await adminClient.auth.admin.deleteUser(user.id);
}
