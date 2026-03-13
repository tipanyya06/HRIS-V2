import express from 'express';
import {
	getAvailabilityController,
	createInterviewController,
	getInterviewsController,
	updateInterviewStatusController,
	getMyInterviewsController,
} from './interviews.controller.js';
import { verifyToken, requireRole } from '../../middleware/auth.js';

const router = express.Router();

router.get('/availability', getAvailabilityController);
router.post('/', createInterviewController);
router.get(
	'/',
	verifyToken,
	requireRole(['admin', 'super-admin', 'hr']),
	getInterviewsController
);

router.get('/my', verifyToken, getMyInterviewsController);

router.patch(
	'/:id/status',
	verifyToken,
	requireRole(['admin', 'super-admin', 'hr']),
	updateInterviewStatusController
);

export default router;
