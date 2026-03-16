import express from 'express';
import * as applicationController from './applications.controller.js';
import { verifyToken, optionalToken, requireRole } from '../../middleware/auth.js';
import { formLimiter } from '../../middleware/rateLimiter.js';

const router = express.Router();

// Authenticated applicant routes
router.post(
  '/',
  optionalToken,
  formLimiter,
  applicationController.createApplicationController
);

// Public GET with email query parameter for candidate validation
router.get('/', applicationController.validateCandidateByEmailController);

// Applicant routes (require JWT, no role restriction)
router.get('/my', verifyToken, applicationController.getMyApplicationsController);

// Admin routes (require JWT + role)
router.get(
  '/admin/all',
  verifyToken,
  requireRole(['admin', 'super-admin', 'hr']),
  applicationController.getApplicationsController
);

router.get(
  '/stats/by-stage',
  verifyToken,
  requireRole(['admin', 'super-admin', 'hr']),
  applicationController.getApplicationsByStageController
);

router.get(
  '/:id',
  verifyToken,
  requireRole(['admin', 'super-admin', 'hr']),
  applicationController.getApplicationByIdController
);

router.patch(
  '/:id/stage',
  verifyToken,
  requireRole(['admin', 'super-admin', 'hr']),
  applicationController.updateStageController
);

router.post(
  '/:id/notes',
  verifyToken,
  requireRole(['admin', 'super-admin', 'hr']),
  applicationController.addNoteController
);

router.delete(
  '/:id',
  verifyToken,
  requireRole(['admin', 'super-admin']),
  applicationController.deleteApplicationController
);

export default router;
