import { Router } from 'express';
import { verifyToken, requireRole } from '../../middleware/auth.js';
import {
  getMyPreEmploymentController,
  submitPreEmploymentItemController,
  getAllPreEmploymentController,
  reviewPreEmploymentItemController,
} from './preEmployment.controller.js';

const router = Router();

router.get('/my', verifyToken, requireRole('applicant'), getMyPreEmploymentController);
router.patch(
  '/my/items/:itemKey',
  verifyToken,
  requireRole('applicant'),
  submitPreEmploymentItemController
);
router.get('/', verifyToken, requireRole('admin', 'super-admin', 'hr'), getAllPreEmploymentController);
router.patch(
  '/:id/items/:itemKey/review',
  verifyToken,
  requireRole('admin', 'super-admin', 'hr'),
  reviewPreEmploymentItemController
);

export default router;
