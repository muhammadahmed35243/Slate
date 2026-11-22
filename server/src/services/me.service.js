import { adminClient } from '../config/supabase.js';
import { AppError } from '../utils/AppError.js';

// /me only ever touches rows of the user from the verified JWT (user.id),
// so the admin client is safe here, and it is required for invite activation:
// a pending membership has no user_id yet, so RLS could never match it.

const MEMBERSHIP_FIELDS =
  'id, role, status, created_at, business:businesses(id, name, category, logo_url, widget_key, archived_at)';

// Turns pending invites sent to this email into active memberships.
async function activatePendingInvites(user) {
  if (!user.email) return;
  const { error } = await adminClient
    .from('business_members')
    .update({ user_id: user.id, status: 'active' })
    .eq('invited_email', user.email.toLowerCase())
    .eq('status', 'pending')
    .is('user_id', null);
  if (error) throw error;
}

async function getProfile(user) {
  const { data, error } = await adminClient.from('profiles').select('*').eq('id', user.id).maybeSingle();
  if (error) throw error;
  if (data) return data;

  // Users created before the signup trigger existed: create the profile now.
  const { data: created, error: insErr } = await adminClient
    .from('profiles')
    .insert({ id: user.id, email: user.email, full_name: user.user_metadata?.full_name ?? '' })
    .select()
    .single();
  if (insErr) throw insErr;
  return created;
}

export async function listMemberships(userId) {
  const { data, error } = await adminClient
    .from('business_members')
    .select(MEMBERSHIP_FIELDS)
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at');
  if (error) throw error;
  return data
    .filter((m) => m.business && !m.business.archived_at)
    .map(({ business: { archived_at, ...business }, ...m }) => ({ ...m, business }));
}

export async function getMe(user) {
  await activatePendingInvites(user);
  const profile = await getProfile(user);
  if (!profile.is_active) throw new AppError('This account is deactivated', 403, 'ACCOUNT_DEACTIVATED');
  const memberships = await listMemberships(user.id);
  return { ...profile, memberships };
}

export async function updateMe(userId, changes) {
  const { data, error } = await adminClient
    .from('profiles')
    .update(changes)
    .eq('id', userId)
    .eq('is_active', true)
    .select()
    .maybeSingle();
  if (error) throw error;
  if (!data) throw AppError.notFound('Profile not found');
  return data;
}

// Soft delete: the profile is kept (conversations/messages reference it),
// memberships are removed and the auth user is banned so they can't log in.
export async function deactivateMe(userId) {
  const { count, error: ownErr } = await adminClient
    .from('businesses')
    .select('id', { count: 'exact', head: true })
    .eq('owner_id', userId)
    .is('archived_at', null);
  if (ownErr) throw ownErr;
  if (count > 0) {
    throw AppError.conflict('You still own active businesses. Delete them or transfer ownership first.');
  }

  const { error: memErr } = await adminClient.from('business_members').delete().eq('user_id', userId);
  if (memErr) throw memErr;

  const { error: profErr } = await adminClient.from('profiles').update({ is_active: false }).eq('id', userId);
  if (profErr) throw profErr;

  const { error: banErr } = await adminClient.auth.admin.updateUserById(userId, { ban_duration: '876000h' });
  if (banErr) throw banErr;
}
