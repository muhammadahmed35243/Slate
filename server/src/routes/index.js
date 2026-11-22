import { Router } from 'express';
import healthRoutes from './health.routes.js';

const router = Router();

router.use('/health', healthRoutes);
// Mounted as each module lands:
// router.use('/me', meRoutes);
// router.use('/businesses', businessRoutes);
// router.use('/maps', mapsRoutes);
// router.use('/public', publicRoutes);

export default router;
