import { adminClient } from '../config/supabase.js';
import { AppError } from '../utils/AppError.js';
import { listMemberships } from './me.service.js';

// Every function below runs AFTER auth + loadBusiness + requireRole have
// confirmed access, and every query is pinned to that businessId.
// (When 002_rls.sql lands these can switch to req.db for a second layer.)

export async function createBusiness(ownerId, data) {
  const { data: business, error } = await adminClient.rpc('create_business', {
    p_owner: ownerId,
    p_data: data,
  });
  if (error) throw error;
  return business;
}

export const listBusinesses = (userId) => listMemberships(userId);

export async function getBusiness(businessId) {
  const { data, error } = await adminClient
    .from('businesses')
    .select('*, subscription:subscriptions(plan_name, status, renewed_at)')
    .eq('id', businessId)
    .is('archived_at', null)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw AppError.notFound('Business not found');
  return data;
}

export async function updateBusiness(businessId, changes, actorId) {
  const { data, error } = await adminClient
    .from('businesses')
    .update(changes)
    .eq('id', businessId)
    .is('archived_at', null)
    .select()
    .maybeSingle();
  if (error) throw error;
  if (!data) throw AppError.notFound('Business not found');

  await adminClient.from('activity_log').insert({
    business_id: businessId,
    actor_id: actorId,
    type: 'business.updated',
    summary: `Business profile updated (${Object.keys(changes).join(', ')})`,
  });
  return data;
}

// Soft delete (archive). Data is kept and the widget stops working.
export async function archiveBusiness(businessId) {
  const { data, error } = await adminClient
    .from('businesses')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', businessId)
    .is('archived_at', null)
    .select('id')
    .maybeSingle();
  if (error) throw error;
  if (!data) throw AppError.notFound('Business not found');
}
