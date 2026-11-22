import { Router } from 'express';
import { auth } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { updateMeSchema } from '../validators/me.validator.js';
import * as me from '../controllers/me.controller.js';

const router = Router();

router.use(auth);

router.get('/', asyncHandler(me.getMe));
router.patch('/', validate({ body: updateMeSchema }), asyncHandler(me.updateMe));
router.delete('/', asyncHandler(me.deactivateMe));

export default router;
