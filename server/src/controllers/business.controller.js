import * as businessService from '../services/business.service.js';

// POST /api/businesses
export const create = async (req, res) => {
  res.status(201).json(await businessService.createBusiness(req.user.id, req.valid.body));
};

// GET /api/businesses: the businesses I'm an active member of, with my role
export const list = async (req, res) => {
  res.json(await businessService.listBusinesses(req.user.id));
};

// GET /api/businesses/:businessId
export const get = async (req, res) => {
  const business = await businessService.getBusiness(req.business.id);
  res.json({ ...business, my_role: req.role });
};

// PATCH /api/businesses/:businessId (owner)
export const update = async (req, res) => {
  res.json(await businessService.updateBusiness(req.business.id, req.valid.body, req.user.id));
};

// DELETE /api/businesses/:businessId (owner, soft delete)
export const remove = async (req, res) => {
  await businessService.archiveBusiness(req.business.id);
  res.status(204).end();
};
