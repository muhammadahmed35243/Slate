import { adminClient, userClient } from '../config/supabase.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Verifies the Supabase JWT from "Authorization: Bearer <token>".
// Sets req.user (auth user) and req.db (RLS-scoped Supabase client).
export const auth = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw AppError.unauthorized('Missing bearer token');

  const { data, error } = await adminClient.auth.getUser(token);
  if (error || !data?.user) throw AppError.unauthorized('Invalid or expired token');

  req.user = data.user;
  req.token = token;
  req.db = userClient(token);
  next();
});
