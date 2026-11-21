import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// For routes under /businesses/:businessId — requires an ACTIVE membership.
// Sets req.business and req.role ('owner' | 'manager' | 'staff').
export const loadBusiness = asyncHandler(async (req, _res, next) => {
  const { businessId } = req.params;

  const { data: member, error } = await req.db
    .from('business_members')
    .select('role, business:businesses(*)')
    .eq('business_id', businessId)
    .eq('user_id', req.user.id)
    .eq('status', 'active')
    .maybeSingle();

  if (error) throw error;
  if (!member || !member.business || member.business.archived_at) {
    throw AppError.notFound('Business not found');
  }

  req.business = member.business;
  req.role = member.role;
  next();
});
