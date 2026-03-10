import express from 'express';
import * as announcementController from './announcements.controller.js';
import { verifyToken, requireRole } from '../../middleware/auth.js';

const router = express.Router();

// Public endpoints - all authenticated users can view
router.get('/', verifyToken, announcementController.getAnnouncementsController);
router.get('/:id', verifyToken, announcementController.getAnnouncementByIdController);

// Admin-only endpoints
router.use(verifyToken, requireRole(['admin', 'super-admin', 'hr']));

router.post('/', announcementController.createAnnouncementController);
router.patch('/:id', announcementController.updateAnnouncementController);
router.delete('/:id', announcementController.deleteAnnouncementController);

export default router;
