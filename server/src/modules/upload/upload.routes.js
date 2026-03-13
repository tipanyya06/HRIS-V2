import express from 'express';
import { verifyToken } from '../../middleware/auth.js';
import { imageUpload, documentUpload, uploadMiddleware, resumeUpload } from '../../middleware/multerConfig.js';
import {
  uploadFileController,
  uploadProfilePicController,
  uploadDocumentController,
  deleteFileController,
  getFileUrlController,
  uploadResumeController,
} from './upload.controller.js';

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Profile picture upload - strict image validation
router.post(
  '/profile-pic',
  imageUpload.single('photo'),
  uploadProfilePicController
);

// Document upload - supports PDF, Word, images, Excel
router.post(
  '/documents',
  documentUpload.single('document'),
  uploadDocumentController
);

// Resume upload - PDF only, 5MB limit
router.post(
  '/resume',
  resumeUpload.single('resume'),
  uploadResumeController
);

// Generic upload file - POST /api/upload/:type (resume, photo, document, certificate)
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

