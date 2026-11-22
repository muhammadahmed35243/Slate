import * as meService from '../services/me.service.js';

// GET /api/me
export const getMe = async (req, res) => {
  res.json(await meService.getMe(req.user));
};

// PATCH /api/me
export const updateMe = async (req, res) => {
  res.json(await meService.updateMe(req.user.id, req.valid.body));
};

// DELETE /api/me (deactivate)
export const deactivateMe = async (req, res) => {
  await meService.deactivateMe(req.user.id);
  res.status(204).end();
};
