import { Router } from 'express';
import { verifyToken, requireRole } from '../../middleware/auth.js';
import {
  createRequestController,
  getMyRequestsController,
  getAllRequestsController,
  updateRequestStatusController,
} from './requests.controller.js';

const router = Router();

router.post('/', verifyToken, createRequestController);
router.get('/my', verifyToken, getMyRequestsController);
router.get(
  '/',
  verifyToken,
  requireRole('admin', 'super-admin', 'hr'),
  getAllRequestsController
);
router.patch(
  '/:id',
  verifyToken,
  requireRole('admin', 'super-admin', 'hr'),
  updateRequestStatusController
);

export default router;

