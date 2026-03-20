import TrainingRecord from './training.model.js'
import User from '../auth/user.model.js'
import { logger } from '../../utils/logger.js'
import { paginate } from '../../utils/paginate.js'
import { createNotification } from '../notifications/notification.service.js'

// ── Get all training records (admin) ─────────────
export const getAllTraining = async (query = {}) => {
  try {
    const {
      search = '',
      status = '',
      employeeId = '',
      page = 1,
      limit = 20,
    } = query

    const filter = {}
    if (status)     filter.status = status
    if (employeeId) filter.employeeId = employeeId

    if (search.trim()) {
      filter.$or = [
        { courseName: { $regex: search, $options: 'i' } },
        { provider:   { $regex: search, $options: 'i' } },
      ]
    }

    const { skip, limit: lim, page: p } = paginate(page, limit)

    const [records, total] = await Promise.all([
      TrainingRecord.find(filter)
        .populate(
          'employeeId',
          'personalInfo.fullName personalInfo.firstName personalInfo.lastName email department'
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(lim)
        .lean(),
      TrainingRecord.countDocuments(filter),
    ])

    return {
      records,
      pagination: {
        total,
        page: p,
        limit: lim,
        totalPages: Math.ceil(total / lim),
        hasNextPage: p < Math.ceil(total / lim),
        hasPrevPage: p > 1,
      }
    }
  } catch (error) {
    logger.error(`getAllTraining error: ${error.message}`)
    throw error
  }
}

// ── Get single record ─────────────────────────────
export const getTrainingById = async (id) => {
  try {
    const record = await TrainingRecord.findById(id)
      .populate(
        'employeeId',
        'personalInfo.fullName email department'
      )
      .lean()
    if (!record)
      throw Object.assign(
        new Error('Training record not found'),
        { status: 404 }
      )
    return record
  } catch (error) {
    logger.error(`getTrainingById error: ${error.message}`)
    throw error
  }
}

// ── Create training record ────────────────────────
export const createTraining = async (data) => {
  try {
    const {
      employeeId,
      courseName,
      provider,
      completedAt,
      certUrl,
      expiresAt,
      status = 'in-progress',
    } = data

    // Verify employee exists
    const employee = await User.findById(employeeId)
      .select('personalInfo.fullName email role')
      .lean()
    if (!employee)
      throw Object.assign(
        new Error('Employee not found'),
        { status: 404 }
      )

    const record = await TrainingRecord.create({
      employeeId,
      courseName,
      provider,
      completedAt: completedAt
        ? new Date(completedAt) : null,
      certUrl,
      expiresAt: expiresAt
        ? new Date(expiresAt) : null,
      status,
    })

    // Notify employee — fire and forget
    createNotification(
      employeeId,
      'training_assigned',
      'Training Assigned',
      `You have been assigned a training: ${courseName}${
        expiresAt
          ? `. Complete by ${new Date(expiresAt)
              .toLocaleDateString('en-PH')}`
          : ''
      }.`,
      '/employee/training'
    ).catch(err =>
      logger.error(
        `Training notification error: ${err.message}`
      )
    )

    logger.info(
      `Training record created: ${courseName} ` +
      `for employee ${employeeId}`
    )
    return record
  } catch (error) {
    logger.error(`createTraining error: ${error.message}`)
    throw error
  }
}

// ── Update training record ────────────────────────
export const updateTraining = async (id, data) => {
  try {
    const record = await TrainingRecord
      .findByIdAndUpdate(
        id,
        {
          ...data,
          completedAt: data.completedAt
            ? new Date(data.completedAt) : undefined,
          expiresAt: data.expiresAt
            ? new Date(data.expiresAt) : undefined,
        },
        { new: true, runValidators: true }
      )
      .lean()

    if (!record)
      throw Object.assign(
        new Error('Training record not found'),
        { status: 404 }
      )

    logger.info(`Training record updated: ${id}`)
    return record
  } catch (error) {
    logger.error(`updateTraining error: ${error.message}`)
    throw error
  }
}

// ── Delete training record ────────────────────────
export const deleteTraining = async (id) => {
  try {
    const record = await TrainingRecord
      .findByIdAndDelete(id)
      .lean()
    if (!record)
      throw Object.assign(
        new Error('Training record not found'),
        { status: 404 }
      )
    logger.info(`Training record deleted: ${id}`)
    return record
  } catch (error) {
    logger.error(`deleteTraining error: ${error.message}`)
    throw error
  }
}

// ── Mark training complete ────────────────────────
export const markTrainingComplete = async (
  id, certUrl
) => {
  try {
    const record = await TrainingRecord
      .findByIdAndUpdate(
        id,
        {
          status: 'completed',
          completedAt: new Date(),
          ...(certUrl ? { certUrl } : {}),
        },
        { new: true }
      )
      .lean()

    if (!record)
      throw Object.assign(
        new Error('Training record not found'),
        { status: 404 }
      )

    logger.info(`Training marked complete: ${id}`)
    return record
  } catch (error) {
    logger.error(
      `markTrainingComplete error: ${error.message}`
    )
    throw error
  }
}

// ── Check expiring soon (within 30 days) ─────────
export const getExpiringTraining = async () => {
  try {
    const now = new Date()
    const in30 = new Date(
      now.getTime() + 30 * 24 * 60 * 60 * 1000
    )
    return await TrainingRecord.find({
      status: { $ne: 'completed' },
      expiresAt: { $gte: now, $lte: in30 },
    })
      .populate('employeeId', 'personalInfo.fullName email')
      .lean()
  } catch (error) {
    logger.error(
      `getExpiringTraining error: ${error.message}`
    )
    throw error
  }
}
