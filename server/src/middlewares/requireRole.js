import { AppError } from '../utils/AppError.js';

// Usage: router.delete('/:id', requireRole('owner', 'manager'), handler)
// Must run after loadBusiness (which sets req.role).
export const requireRole = (...roles) => (req, _res, next) => {
  if (!req.role) return next(AppError.forbidden('No business context'));
  if (!roles.includes(req.role)) {
    return next(AppError.forbidden(`Requires role: ${roles.join(' or ')}`));
  }
  next();
};
