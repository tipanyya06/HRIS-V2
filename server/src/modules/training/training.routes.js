import express from 'express'
import { verifyToken, requireRole } from '../../middleware/auth.js'
import {
  getMyTrainingController,
  getAllTrainingController,
  getTrainingByIdController,
  createTrainingController,
  updateTrainingController,
  deleteTrainingController,
  markCompleteController,
  getExpiringController,
} from './training.controller.js'

const router = express.Router()

// Employee routes
router.get('/my', verifyToken, getMyTrainingController)

// Admin routes
router.get(
  '/expiring',
  verifyToken,
  requireRole(['admin', 'super-admin', 'hr']),
  getExpiringController
)

router.get(
  '/',
  verifyToken,
  requireRole(['admin', 'super-admin', 'hr']),
  getAllTrainingController
)

router.post(
  '/',
  verifyToken,
  requireRole(['admin', 'super-admin', 'hr']),
  createTrainingController
)

router.get(
  '/:id',
  verifyToken,
  getTrainingByIdController
)

router.patch(
  '/:id',
  verifyToken,
  requireRole(['admin', 'super-admin', 'hr']),
  updateTrainingController
)

router.delete(
  '/:id',
  verifyToken,
  requireRole(['admin', 'super-admin', 'hr']),
  deleteTrainingController
)

router.patch(
  '/:id/complete',
  verifyToken,
  requireRole(['admin', 'super-admin', 'hr']),
  markCompleteController
)

export default router
