import { createClient } from '@supabase/supabase-js';

// Browser client: uses the PUBLISHABLE (anon) key only. Never the secret key.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);
