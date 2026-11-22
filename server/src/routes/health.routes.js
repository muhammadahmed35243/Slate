import { Router } from 'express';
import { adminClient } from '../config/supabase.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// GET /api/health: API up + database reachable
router.get('/', asyncHandler(async (_req, res) => {
  const { error } = await adminClient.from('businesses').select('id').limit(1);
  res.json({
    status: 'ok',
    database: error ? `error: ${error.message}` : 'connected',
    time: new Date().toISOString(),
  });
}));

export default router;
