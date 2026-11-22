import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

const noSession = { auth: { persistSession: false, autoRefreshToken: false } };

// Service-role client: bypasses RLS. Use ONLY for public widget routes,
// webhooks and invites — and always filter by a resolved business_id.
export const adminClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, noSession);

// Per-request client that carries the user's JWT, so Postgres RLS applies.
export const userClient = (jwt) =>
  createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    ...noSession,
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
