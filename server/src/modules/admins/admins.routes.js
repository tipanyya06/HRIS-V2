import express from 'express';
import {
  getAdminsController,
  createAdminController,
  updateAdminController,
  setAdminStatusController,
} from './admins.controller.js';
import User from '../auth/user.model.js';
import { verifyToken } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/auth.js';

const router = express.Router();

// All routes require super-admin role
router.use(verifyToken);

// GET /api/admins/evaluators
// Returns list of admin/hr/super-admin users for PE evaluator dropdown
// Accessible by all authenticated users (not super-admin only)
router.get(
  '/evaluators',
  verifyToken,
  async (req, res, next) => {
    try {
      const evaluators = await User.find({
        role: { $in: ['admin', 'super-admin', 'hr'] },
        isActive: { $ne: false },
      })
        .select(
          'personalInfo.fullName personalInfo.firstName ' +
          'personalInfo.lastName email role'
        )
        .lean()

      res.status(200).json({
        success: true,
        data: evaluators,
      })
    } catch (error) {
      next(error)
    }
  }
)

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
