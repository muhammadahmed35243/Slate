// npm run db:check -w server: confirms the Supabase keys work.
import { adminClient } from '../src/config/supabase.js';

const { error } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1 });
if (error) {
  console.error('Supabase connection FAILED:', error.message);
  process.exit(1);
}
console.log('Supabase connection OK (auth admin reachable)');

const { error: tblErr } = await adminClient.from('businesses').select('id').limit(1);
console.log(tblErr ? `Schema not applied yet: ${tblErr.message}` : 'Tables reachable (schema applied)');
