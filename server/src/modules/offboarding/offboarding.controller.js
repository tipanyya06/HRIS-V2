import {
  initiateOffboarding,
  getAllOffboardings,
  getOffboardingById,
  updateExitInterview,
  updateAssetReturn,
  updateSystemAccess,
  updateClearance,
  deleteOffboarding,
} from './offboarding.service.js'
import { logActivity } from '../../middleware/activityLogger.js'
import { logger } from '../../utils/logger.js'

export const initiateOffboardingController =
  async (req, res, next) => {
    try {
      const { employeeId, reason, lastDay, notes } = req.body
      if (!employeeId)
        return res.status(400).json({ error: 'employeeId is required' })
      const offboarding = await initiateOffboarding(
        employeeId, req.user.id, { reason, lastDay, notes }
      )
      logActivity(
        req,
        `Offboarding initiated for employee: ${employeeId}`,
        'offboarding',
        offboarding._id
      )
      res.status(201).json({ success: true, data: offboarding })
    } catch (error) {
      const msg = typeof error === 'object' && error !== null
        ? (error.message || error.status || 'Unknown error')
        : String(error)
      res.status(400).json({ error: msg })
    }
  }

export const getAllOffboardingsController =
  async (req, res, next) => {
    try {
      const result = await getAllOffboardings(req.query)
      res.status(200).json({ success: true, ...result })
    } catch (error) {
      const msg = typeof error === 'object' && error !== null
        ? (error.message || error.status || 'Unknown error')
        : String(error)
      res.status(400).json({ error: msg })
    }
  }

export const getOffboardingByIdController =
  async (req, res, next) => {
    try {
      const offboarding = await getOffboardingById(req.params.id)
      res.status(200).json({ success: true, data: offboarding })
    } catch (error) {
      const msg = typeof error === 'object' && error !== null
        ? (error.message || error.status || 'Unknown error')
        : String(error)
      res.status(400).json({ error: msg })
    }
  }

export const updateExitInterviewController =
  async (req, res, next) => {
    try {
      const offboarding = await updateExitInterview(
        req.params.id, req.body
      )
      logActivity(
        req,
        `Exit interview updated`,
        'offboarding',
        req.params.id
      )
      res.status(200).json({ success: true, data: offboarding })
    } catch (error) {
      const msg = typeof error === 'object' && error !== null
        ? (error.message || error.status || 'Unknown error')
        : String(error)
      res.status(400).json({ error: msg })
    }
  }

export const updateAssetReturnController =
  async (req, res, next) => {
    try {
      const { assetId, returned, notes } = req.body
      if (!assetId)
        return res.status(400).json({ error: 'assetId is required' })
      const offboarding = await updateAssetReturn(
        req.params.id, assetId, returned, notes
      )
      logActivity(
        req,
        `Asset return updated`,
        'offboarding',
        req.params.id
      )
      res.status(200).json({ success: true, data: offboarding })
    } catch (error) {
      const msg = typeof error === 'object' && error !== null
        ? (error.message || error.status || 'Unknown error')
        : String(error)
      res.status(400).json({ error: msg })
    }
  }

export const updateSystemAccessController =
  async (req, res, next) => {
    try {
      const offboarding = await updateSystemAccess(
        req.params.id, req.body
      )
      logActivity(
        req,
        `System access updated`,
        'offboarding',
        req.params.id
      )
      res.status(200).json({ success: true, data: offboarding })
    } catch (error) {
      const msg = typeof error === 'object' && error !== null
        ? (error.message || error.status || 'Unknown error')
        : String(error)
      res.status(400).json({ error: msg })
    }
  }

export const updateClearanceController =
  async (req, res, next) => {
    try {
      const { clearanceId, cleared, notes } = req.body
      if (!clearanceId)
        return res.status(400).json({ error: 'clearanceId is required' })
      const offboarding = await updateClearance(
        req.params.id, clearanceId, cleared, notes, req.user.id
      )
      logActivity(
        req,
        `Department clearance updated`,
        'offboarding',
        req.params.id
      )
      res.status(200).json({ success: true, data: offboarding })
    } catch (error) {
      const msg = typeof error === 'object' && error !== null
        ? (error.message || error.status || 'Unknown error')
        : String(error)
      res.status(400).json({ error: msg })
    }
  }

export const deleteOffboardingController =
  async (req, res, next) => {
    try {
      await deleteOffboarding(req.params.id)
      logActivity(
        req,
        `Offboarding record deleted`,
        'offboarding',
        req.params.id
      )
      res.status(200).json({
        success: true,
        message: 'Offboarding record deleted'
      })
    } catch (error) {
      const msg = typeof error === 'object' && error !== null
        ? (error.message || error.status || 'Unknown error')
        : String(error)
      res.status(400).json({ error: msg })
    }
  }
