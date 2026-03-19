import express from 'express'
import { verifyToken, requireRole } from '../../middleware/auth.js'
import {
  createPEController,
  selfRatingController,
  supervisorRatingController,
  acknowledgePEController,
  updateDispositionController,
  listPEController,
  myPEController,
  getPEController,
  exportPEPdfController,
} from './performance.controller.js'

const router = express.Router()

router.get(
  '/my',
  verifyToken,
  myPEController
)

router.patch(
  '/:id/self-rating',
  verifyToken,
  selfRatingController
)

router.patch(
  '/:id/acknowledge',
  verifyToken,
  acknowledgePEController
)

router.get(
  '/:id/export',
  verifyToken,
  exportPEPdfController
)

router.get(
  '/',
  verifyToken,
  requireRole(['admin', 'super-admin', 'hr']),
  listPEController
)

router.post(
  '/',
  verifyToken,
  requireRole(['admin', 'super-admin', 'hr']),
  createPEController
)

router.get(
  '/:id',
  verifyToken,
  getPEController
)

router.patch(
  '/:id/supervisor-rating',
  verifyToken,
  requireRole(['admin', 'super-admin', 'hr']),
  supervisorRatingController
)

router.patch(
  '/:id/disposition',
  verifyToken,
  requireRole(['admin', 'super-admin', 'hr']),
  updateDispositionController
)

export default router
