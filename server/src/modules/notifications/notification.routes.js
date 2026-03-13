import express from 'express';
import { verifyToken } from '../../middleware/auth.js';
import {
  getNotificationsController,
  getUnreadCountController,
  markReadController,
  markAllReadController,
} from './notification.controller.js';

const router = express.Router();

router.get('/', verifyToken, getNotificationsController);

router.get('/unread-count', verifyToken, getUnreadCountController);

router.patch('/read-all', verifyToken, markAllReadController);

router.patch('/:id/read', verifyToken, markReadController);

export default router;
