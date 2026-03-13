import express from 'express';
import * as announcementController from './announcements.controller.js';
import { verifyToken, requireRole } from '../../middleware/auth.js';

const router = express.Router();

// Public endpoints - no auth required
router.get('/', announcementController.getAnnouncementsController);
router.get('/:id', announcementController.getAnnouncementByIdController);

// Admin-only endpoints
router.post('/', verifyToken, requireRole(['admin', 'super-admin', 'hr']), announcementController.createAnnouncementController);
router.patch('/:id', verifyToken, requireRole(['admin', 'super-admin', 'hr']), announcementController.updateAnnouncementController);
router.delete('/:id', verifyToken, requireRole(['admin', 'super-admin']), announcementController.deleteAnnouncementController);

export default router;
