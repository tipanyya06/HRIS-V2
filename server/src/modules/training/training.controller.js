import {
  getAllTraining,
  getTrainingById,
  createTraining,
  updateTraining,
  deleteTraining,
  markTrainingComplete,
  getExpiringTraining,
} from './training.service.js'
import { logActivity } from '../../middleware/activityLogger.js'
import { logger } from '../../utils/logger.js'

export const getMyTrainingController =
  async (req, res, next) => {
    try {
      const userId = req.user.id
      const records = await (await import('./training.model.js')).default
        .find({ employeeId: userId })
        .sort({ completedAt: -1 })
        .lean()
      res.status(200).json({ success: true, data: records })
    } catch (error) {
      next(error)
    }
  }

export const getAllTrainingController =
  async (req, res, next) => {
    try {
      const result = await getAllTraining(req.query)
      res.status(200).json({ success: true, ...result })
    } catch (error) {
      next(error)
    }
  }

export const getTrainingByIdController =
  async (req, res, next) => {
    try {
      const record = await getTrainingById(req.params.id)
      res.status(200).json({ success: true, data: record })
    } catch (error) {
      next(error)
    }
  }

export const createTrainingController =
  async (req, res, next) => {
    try {
      const record = await createTraining(req.body)
      logActivity(
        req,
        `Training record created: ${record.courseName}`,
        'training',
        record._id
      )
      res.status(201).json({ success: true, data: record })
    } catch (error) {
      next(error)
    }
  }

export const updateTrainingController =
  async (req, res, next) => {
    try {
      const record = await updateTraining(
        req.params.id, req.body
      )
      logActivity(
        req,
        `Training record updated: ${record.courseName}`,
        'training',
        req.params.id
      )
      res.status(200).json({ success: true, data: record })
    } catch (error) {
      next(error)
    }
  }

export const deleteTrainingController =
  async (req, res, next) => {
    try {
      const record = await deleteTraining(req.params.id)
      logActivity(
        req,
        `Training record deleted: ${record.courseName}`,
        'training',
        req.params.id
      )
      res.status(200).json({
        success: true,
        message: 'Training record deleted'
      })
    } catch (error) {
      next(error)
    }
  }

export const markCompleteController =
  async (req, res, next) => {
    try {
      const { certUrl } = req.body
      const record = await markTrainingComplete(
        req.params.id, certUrl
      )
      logActivity(
        req,
        `Training marked complete: ${record.courseName}`,
        'training',
        req.params.id
      )
      res.status(200).json({ success: true, data: record })
    } catch (error) {
      next(error)
    }
  }

export const getExpiringController =
  async (req, res, next) => {
    try {
      const records = await getExpiringTraining()
      res.status(200).json({ success: true, data: records })
    } catch (error) {
      next(error)
    }
  }
