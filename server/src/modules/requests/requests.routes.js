import express from 'express';
import { verifyToken, requireRole } from '../../middleware/auth.js';
import {
  createMeetingRequestController,
  createTalentRequestController,
  getAllRequestsController,
  getMyRequestsController,
  approveMeetingRequestController,
  approveTalentRequestController,
  rejectMeetingRequestController,
  rejectTalentRequestController,
} from './requests.controller.js';

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Create requests - all authenticated users
router.post('/meeting', createMeetingRequestController);
router.post('/talent', createTalentRequestController);

// Get all requests - admin/super-admin/hr only
router.get('/', requireRole('admin', 'super-admin', 'hr'), getAllRequestsController);

// Get my requests - returns user's own requests
router.get('/my', getMyRequestsController);

// Approve requests - admin/super-admin only
router.patch('/meeting/:id/approve', requireRole('admin', 'super-admin'), approveMeetingRequestController);
router.patch('/talent/:id/approve', requireRole('admin', 'super-admin'), approveTalentRequestController);

// Reject requests - admin/super-admin only
router.patch('/meeting/:id/reject', requireRole('admin', 'super-admin'), rejectMeetingRequestController);
router.patch('/talent/:id/reject', requireRole('admin', 'super-admin'), rejectTalentRequestController);

export default router;
