import express from 'express';
import * as jobController from './job.controller.js';
import { verifyToken, requireRole } from '../../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', jobController.getPublicJobsController); // Get all active jobs

// Admin routes (MUST come before /:id to avoid route conflicts)
router.get(
  '/admin/all',
  verifyToken,
  requireRole(['admin', 'super-admin', 'hr']),
  jobController.getAllJobsController
);

router.post(
  '/',
  verifyToken,
  requireRole(['admin', 'super-admin', 'hr']),
  jobController.createJobController
);

// Dynamic ID routes (MUST come AFTER named routes)
router.get('/:id', jobController.getJobByIdController); // Get single job details (public)

router.put(
  '/:id',
  verifyToken,
  requireRole(['admin', 'super-admin', 'hr']),
  jobController.updateJobController
);

router.delete(
  '/:id',
  verifyToken,
  requireRole(['admin', 'super-admin']),
  jobController.deleteJobController
);

router.patch(
  '/:id/status',
  verifyToken,
  requireRole(['admin', 'super-admin', 'hr']),
  jobController.updateJobStatusController
);

export default router;
