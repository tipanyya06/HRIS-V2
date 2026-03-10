import express from 'express';
import { verifyToken } from '../../middleware/auth.js';
import { uploadMiddleware } from '../../middleware/multerConfig.js';
import {
  uploadFileController,
  deleteFileController,
  getFileUrlController,
} from './upload.controller.js';

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Upload file - POST /api/upload/:type (resume, photo, document, certificate)
router.post(
  '/:type',
  uploadMiddleware.single('file'),
  uploadFileController
);

// Delete file
router.delete('/', deleteFileController);

// Get file URL
router.get('/url', getFileUrlController);

export default router;
