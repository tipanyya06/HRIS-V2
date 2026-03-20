import express from 'express'
import { verifyToken, requireRole } from '../../middleware/auth.js'
import {
  initiateOffboardingController,
  getAllOffboardingsController,
  getOffboardingByIdController,
  updateExitInterviewController,
  updateAssetReturnController,
  updateSystemAccessController,
  updateClearanceController,
  deleteOffboardingController,
} from './offboarding.controller.js'

const router = express.Router()

const adminOnly = requireRole([
  'admin', 'super-admin', 'hr'
])

router.get(
  '/', verifyToken, adminOnly,
  getAllOffboardingsController
)

router.post(
  '/', verifyToken, adminOnly,
  initiateOffboardingController
)

router.get(
  '/:id', verifyToken, adminOnly,
  getOffboardingByIdController
)

router.patch(
  '/:id/exit-interview', verifyToken, adminOnly,
  updateExitInterviewController
)

router.patch(
  '/:id/asset', verifyToken, adminOnly,
  updateAssetReturnController
)

router.patch(
  '/:id/system-access', verifyToken, adminOnly,
  updateSystemAccessController
)

router.patch(
  '/:id/clearance', verifyToken, adminOnly,
  updateClearanceController
)

router.delete(
  '/:id', verifyToken,
  requireRole(['admin', 'super-admin']),
  deleteOffboardingController
)

export default router
