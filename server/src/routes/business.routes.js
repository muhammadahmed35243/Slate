import { Router } from 'express';
import { auth } from '../middlewares/auth.js';
import { loadBusiness } from '../middlewares/loadBusiness.js';
import { requireRole } from '../middlewares/requireRole.js';
import { validate } from '../middlewares/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  createBusinessSchema,
  updateBusinessSchema,
  businessIdParams,
} from '../validators/business.validator.js';
import * as business from '../controllers/business.controller.js';

const router = Router();

router.use(auth);

router.post('/', validate({ body: createBusinessSchema }), asyncHandler(business.create));
router.get('/', asyncHandler(business.list));

// Everything under /:businessId: valid id → active member → role check
const member = [validate({ params: businessIdParams }), loadBusiness];

router.get('/:businessId', member, asyncHandler(business.get));
router.patch(
  '/:businessId',
  member,
  requireRole('owner'),
  validate({ body: updateBusinessSchema }),
  asyncHandler(business.update),
);
router.delete('/:businessId', member, requireRole('owner'), asyncHandler(business.remove));

// Module routers nested under a business get mounted here, e.g.:
// router.use('/:businessId/faqs', member, faqRoutes);   (use Router({ mergeParams: true }))

export default router;
