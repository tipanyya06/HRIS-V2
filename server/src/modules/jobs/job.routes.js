import express from 'express';
import * as jobController from './job.controller.js';
import { verifyToken, optionalToken, requireRole } from '../../middleware/auth.js';

const router = express.Router();

// GET /api/jobs — Smart endpoint (returns all jobs for authenticated admin/hr, active jobs for public)
router.get(
  '/',
  optionalToken,
  jobController.getSmartJobsController
);

// POST /api/jobs — Create job (admin/hr only)
router.post(
  '/',
  verifyToken,
  requireRole(['admin', 'super-admin', 'hr']),
  jobController.createJobController
);

// GET /api/jobs/admin/all — Get all jobs for admin (admin/hr only)
router.get(
  '/admin/all',
  verifyToken,
  requireRole(['admin', 'super-admin', 'hr']),
  jobController.getAllJobsController
);

// PUBLIC ROUTES
// GET /api/jobs/public/active — Get active jobs for job board (no auth required)
router.get('/public/active', jobController.getPublicJobsController);

// Dynamic ID routes (MUST come AFTER named routes)
// GET /api/jobs/:id — Get single job details (public)
router.get('/:id', jobController.getJobByIdController);

// PATCH /api/jobs/:id — Update job (admin/hr only)
router.patch(
  '/:id',
  verifyToken,
  requireRole(['admin', 'super-admin', 'hr']),
  jobController.updateJobController
);

// DELETE /api/jobs/:id — Delete job (admin/super-admin only)
router.delete(
  '/:id',
  verifyToken,
  requireRole(['admin', 'super-admin']),
  jobController.deleteJobController
);

// PATCH /api/jobs/:id/status — Update job status (admin/hr only)
router.patch(
  '/:id/status',
  verifyToken,
  requireRole(['admin', 'super-admin', 'hr']),
  jobController.updateJobStatusController
);

export default router;
