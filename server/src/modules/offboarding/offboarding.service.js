import Offboarding from './offboarding.model.js'
import User from '../auth/user.model.js'
import { logger } from '../../utils/logger.js'
import { paginate } from '../../utils/paginate.js'
import { createNotification } from '../notifications/notification.service.js'

// ── Helper — recompute status ─────────────────────
const computeStatus = (offboarding) => {
  const allAssetsReturned = offboarding.assets.every(a => a.returned)
  const allClearances = offboarding.clearances.every(c => c.cleared)
  const exitDone = offboarding.exitInterview.conducted
  const accessDone =
    offboarding.systemAccess.emailDisabled &&
    offboarding.systemsRevoked

  if (allAssetsReturned && allClearances && exitDone && accessDone) {
    return 'completed'
  }
  const anyDone =
    offboarding.assets.some(a => a.returned) ||
    offboarding.clearances.some(c => c.cleared) ||
    exitDone || accessDone
  return anyDone ? 'in-progress' : 'initiated'
}

// ── Initiate offboarding ──────────────────────────
export const initiateOffboarding = async (
  employeeId, adminId, data = {}
) => {
  try {
    const employee = await User.findById(employeeId)
      .select('personalInfo email role isActive')
      .lean()
    if (!employee)
      throw Object.assign(
        new Error('Employee not found'), { status: 404 }
      )

    // Check not already offboarding
    const existing = await Offboarding.findOne({
      employeeId,
      status: { $ne: 'completed' },
    })
    if (existing)
      throw Object.assign(
        new Error(
          'An active offboarding process already ' +
          'exists for this employee'
        ),
        { status: 400 }
      )

    const offboarding = await Offboarding.create({
      employeeId,
      initiatedBy: adminId,
      exitInterview: {
        reason:  data.reason  ?? null,
        lastDay: data.lastDay
          ? new Date(data.lastDay) : null,
        notes:   data.notes   ?? '',
      },
    })


    // Notify all admins/HR
    User.find({
      role: { $in: ['admin', 'super-admin', 'hr'] }
    }).select('_id').lean()
      .then(admins =>
        Promise.allSettled(
          admins.map(a =>
            createNotification({
              userId: a._id,
              type:   'offboarding',
              title:  'Offboarding Initiated',
              message: `Offboarding initiated for ${
                employee.personalInfo?.fullName ??
                employee.email
              }`,
              link: '/admin/offboarding',
            })
          )
        )
      )
      .catch(err =>
        logger.error(
          `Offboarding notification error: ${err.message}`
        )
      )

    // (Removed) Notify the employee

    logger.info(
      `Offboarding initiated for employee ` +
      `${employeeId} by admin ${adminId}`
    )
    return offboarding
  } catch (error) {
    logger.error(
      `initiateOffboarding error: ${error.message}`
    )
    throw error
  }
}

// ── Get all offboardings (admin) ──────────────────
export const getAllOffboardings = async (
  query = {}
) => {
  try {
    const { status, page, limit } = query
    const filter = {}
    if (status) filter.status = status

    const { skip, limit: lim, page: p } = paginate(page, limit ?? 20)

    const [offboardings, total] = await Promise.all([
      Offboarding.find(filter)
        .populate(
          'employeeId',
          'personalInfo.fullName personalInfo.firstName ' +
          'personalInfo.lastName email department ' +
          'positionTitle'
        )
        .populate('initiatedBy', 'personalInfo.fullName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(lim)
        .lean(),
      Offboarding.countDocuments(filter),
    ])

    return {
      offboardings,
      pagination: {
        total, page: p, limit: lim,
        totalPages: Math.ceil(total / lim),
        hasNextPage: p < Math.ceil(total / lim),
        hasPrevPage: p > 1,
      }
    }
  } catch (error) {
    logger.error(
      `getAllOffboardings error: ${error.message}`
    )
    throw error
  }
}

// ── Get single offboarding ────────────────────────
export const getOffboardingById = async (id) => {
  try {
    const offboarding = await Offboarding.findById(id)
      .populate(
        'employeeId',
        'personalInfo email department positionTitle'
      )
      .populate('initiatedBy', 'personalInfo email')
      .lean()
    if (!offboarding)
      throw Object.assign(
        new Error('Offboarding record not found'),
        { status: 404 }
      )
    return offboarding
  } catch (error) {
    logger.error(
      `getOffboardingById error: ${error.message}`
    )
    throw error
  }
}

// ── Update exit interview ─────────────────────────
export const updateExitInterview = async (
  id, data
) => {
  try {
    const offboarding = await Offboarding.findById(id)
    if (!offboarding)
      throw Object.assign(
        new Error('Offboarding record not found'),
        { status: 404 }
      )

    offboarding.exitInterview = {
      ...offboarding.exitInterview,
      reason:  data.reason  ?? offboarding.exitInterview.reason,
      lastDay: data.lastDay
        ? new Date(data.lastDay)
        : offboarding.exitInterview.lastDay,
      notes:      data.notes ?? offboarding.exitInterview.notes,
      conducted:  data.conducted ?? offboarding.exitInterview.conducted,
      conductedAt: data.conducted && !offboarding.exitInterview.conducted
        ? new Date()
        : offboarding.exitInterview.conductedAt,
    }

    offboarding.status = computeStatus(offboarding)
    await offboarding.save()
    logger.info(`Exit interview updated for offboarding ${id}`)
    return offboarding
  } catch (error) {
    logger.error(
      `updateExitInterview error: ${error.message}`
    )
    throw error
  }
}

// ── Update asset return ───────────────────────────
export const updateAssetReturn = async (
  id, assetId, returned, notes
) => {
  try {
    const offboarding = await Offboarding.findById(id)
    if (!offboarding)
      throw Object.assign(
        new Error('Offboarding record not found'),
        { status: 404 }
      )

    const asset = offboarding.assets.id(assetId)
    if (!asset)
      throw Object.assign(
        new Error('Asset not found'),
        { status: 404 }
      )

    asset.returned   = returned
    asset.returnedAt = returned ? new Date() : null
    asset.notes      = notes ?? asset.notes

    offboarding.status = computeStatus(offboarding)
    await offboarding.save()
    logger.info(
      `Asset ${assetId} updated for offboarding ${id}`
    )
    return offboarding
  } catch (error) {
    logger.error(
      `updateAssetReturn error: ${error.message}`
    )
    throw error
  }
}

// ── Update system access ──────────────────────────
export const updateSystemAccess = async (
  id, data
) => {
  try {
    const offboarding = await Offboarding.findById(id)
    if (!offboarding)
      throw Object.assign(
        new Error('Offboarding record not found'),
        { status: 404 }
      )

    if (data.emailDisabled !== undefined) {
      offboarding.systemAccess.emailDisabled = data.emailDisabled
      if (data.emailDisabled)
        offboarding.systemAccess.emailDisabledAt = new Date()
    }
    if (data.systemsRevoked !== undefined) {
      offboarding.systemAccess.systemsRevoked = data.systemsRevoked
      if (data.systemsRevoked)
        offboarding.systemAccess.systemsRevokedAt = new Date()
    }
    if (data.notes !== undefined)
      offboarding.systemAccess.notes = data.notes

    offboarding.status = computeStatus(offboarding)
    await offboarding.save()
    logger.info(
      `System access updated for offboarding ${id}`
    )
    return offboarding
  } catch (error) {
    logger.error(
      `updateSystemAccess error: ${error.message}`
    )
    throw error
  }
}

// ── Update department clearance ───────────────────
export const updateClearance = async (
  id, clearanceId, cleared, notes, adminId
) => {
  try {
    const offboarding = await Offboarding.findById(id)
    if (!offboarding)
      throw Object.assign(
        new Error('Offboarding record not found'),
        { status: 404 }
      )

    const clearance = offboarding.clearances.id(clearanceId)
    if (!clearance)
      throw Object.assign(
        new Error('Clearance not found'),
        { status: 404 }
      )

    clearance.cleared   = cleared
    clearance.clearedAt = cleared ? new Date() : null
    clearance.clearedBy = cleared ? adminId : null
    clearance.notes     = notes ?? clearance.notes

    offboarding.status = computeStatus(offboarding)
    await offboarding.save()
    logger.info(
      `Clearance ${clearanceId} updated for offboarding ${id}`
    )
    return offboarding
  } catch (error) {
    logger.error(
      `updateClearance error: ${error.message}`
    )
    throw error
  }
}

// ── Delete offboarding ────────────────────────────
export const deleteOffboarding = async (id) => {
  try {
    const offboarding = await Offboarding.findByIdAndDelete(id).lean()
    if (!offboarding)
      throw Object.assign(
        new Error('Offboarding record not found'),
        { status: 404 }
      )
    logger.info(`Offboarding deleted: ${id}`)
    return offboarding
  } catch (error) {
    logger.error(
      `deleteOffboarding error: ${error.message}`
    )
    throw error
  }
}
