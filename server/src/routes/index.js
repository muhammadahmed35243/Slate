import { Router } from 'express';
import healthRoutes from './health.routes.js';
import meRoutes from './me.routes.js';
import businessRoutes from './business.routes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/me', meRoutes);
router.use('/businesses', businessRoutes);
// Mounted as each module lands:
// router.use('/maps', mapsRoutes);
// router.use('/public', publicRoutes);

export default router;
