import express from 'express';
import {
  getAdminsController,
  createAdminController,
  updateAdminController,
  setAdminStatusController,
} from './admins.controller.js';
import { verifyToken } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/auth.js';

const router = express.Router();

// All routes require super-admin role
router.use(verifyToken);
router.use(requireRole('super-admin'));

// GET /api/admins
router.get('/', getAdminsController);

// POST /api/admins
router.post('/', createAdminController);

// PATCH /api/admins/:id
router.patch('/:id', updateAdminController);

// PATCH /api/admins/:id/status
router.patch('/:id/status', setAdminStatusController);

export default router;
