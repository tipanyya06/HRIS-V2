import PerformanceEvaluation from './performanceEvaluation.model.js'
import User from '../auth/user.model.js'
import { logger } from '../../utils/logger.js'
import { paginate } from '../../utils/paginate.js'
import { sendEmail } from '../../utils/email.js'

const computeGrade = (total) => {
  if (total >= 100) return 'S'
  if (total >= 90)  return 'A'
  if (total >= 80)  return 'B'
  if (total >= 66)  return 'C'
  if (total >= 47)  return 'D'
  return 'E'
}

const meetsStandardPass = (rating, classification) => {
  const cl = (classification ?? '').toLowerCase()
  if (cl.includes('supervisor') || cl.includes('manager')) {
    return ['S', 'A'].includes(rating)
  }
  return ['S', 'A', 'B'].includes(rating)
}

const suggestDisposition = (rating, evalType) => {
  if (rating === 'E') return 'fail'
  if (['C', 'D'].includes(rating)) return 'next-pe'
  if (evalType === '5th-month' && ['S', 'A', 'B'].includes(rating))
    return 'regularize'
  if (evalType === 'annual') return null
  return 'next-pe'
}

export const createPerformanceEvaluation = async (data) => {
  try {
    const {
      employeeId, evaluatorId, evaluationType,
      periodFrom, periodTo, adminId,
    } = data

    const employee = await User.findOne({
      _id: employeeId, role: 'employee'
    }).select('personalInfo email employmentType').lean()

    if (!employee)
      throw Object.assign(
        new Error('Employee not found'), { status: 404 }
      )

    const pe = await PerformanceEvaluation.create({
      employeeId,
      evaluatorId,
      evaluationType,
      periodFrom: new Date(periodFrom),
      periodTo:   new Date(periodTo),
      classification: employee.employmentType ?? 'Rank & File',
      status: 'self-rating',
    })

    const empName =
      employee.personalInfo?.fullName ??
      `${employee.personalInfo?.firstName ?? ''} ${employee.personalInfo?.lastName ?? ''}`.trim() ??
      employee.email

    sendEmail({
      to: employee.email,
      subject: 'Performance Evaluation — Action Required',
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px">
          <h2 style="color:#1a3a5c">Performance Evaluation Created</h2>
          <p style="color:#4b5563;line-height:1.6">Dear ${empName},</p>
          <p style="color:#4b5563;line-height:1.6">A performance evaluation has been created for you for the period <strong>${new Date(periodFrom).toLocaleDateString('en-PH')}</strong> to <strong>${new Date(periodTo).toLocaleDateString('en-PH')}</strong>.</p>
          <p style="color:#4b5563;line-height:1.6">Please log in to complete your self-rating and add your comments.</p>
          <a href="${process.env.FRONTEND_URL}/employee/performance" style="display:inline-block;background:#185FA5;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600">Go to My Performance</a>
          <p style="color:#9ca3af;font-size:12px;margin-top:24px">Madison 88 HR Team</p>
        </div>
      `,
    }).catch(err =>
      logger.error(
        `PE notification email error: ${err.message}`
      )
    )

    logger.info(
      `PE created for employee ${employeeId} by admin ${adminId}`
    )

    return pe
  } catch (error) {
    logger.error(`createPE error: ${error.message}`)
    throw error
  }
}

export const submitSelfRating = async (
  peId, selfScores, employeeComment, factorComments, userId
) => {
  try {
    const pe = await PerformanceEvaluation.findById(peId)
    if (!pe)
      throw Object.assign(
        new Error('PE not found'), { status: 404 }
      )
    if (pe.employeeId.toString() !== userId)
      throw Object.assign(
        new Error('Forbidden'), { status: 403 }
      )
    if (pe.status !== 'self-rating')
      throw Object.assign(
        new Error('Self-rating is not open for this PE'),
        { status: 400 }
      )

    const factors = [
      'productivity', 'quality', 'mvvEmbrace',
      'initiative', 'attendance', 'adherenceCRR',
      'humanRelations'
    ]
    factors.forEach(f => {
      if (selfScores[f] !== undefined) {
        pe.scores[f].self = selfScores[f]
      }
    })

    pe.employeeComment = employeeComment ?? ''
    pe.factorComments = factorComments ?? {}
    pe.status = 'supervisor-rating'
    await pe.save()

    logger.info(`Self-rating submitted for PE ${peId}`)
    return pe
  } catch (error) {
    logger.error(`submitSelfRating error: ${error.message}`)
    throw error
  }
}

export const submitSupervisorRating = async (
  peId, supervisorScores, sections, userId
) => {
  try {
    const pe = await PerformanceEvaluation.findById(peId)
    if (!pe)
      throw Object.assign(
        new Error('PE not found'), { status: 404 }
      )
    if (pe.status !== 'supervisor-rating')
      throw Object.assign(
        new Error('Supervisor rating not open for this PE'),
        { status: 400 }
      )

    const factors = [
      'productivity', 'quality', 'mvvEmbrace',
      'initiative', 'attendance', 'adherenceCRR',
      'humanRelations'
    ]
    factors.forEach(f => {
      if (supervisorScores[f] !== undefined) {
        pe.scores[f].supervisor = supervisorScores[f]
      }
    })

    const total = factors.reduce((sum, f) => {
      return sum + (pe.scores[f].supervisor ?? 0)
    }, 0)

    pe.totalScore    = total
    pe.overallRating = computeGrade(total)
    pe.meetsStandard = meetsStandardPass(
      pe.overallRating, pe.classification
    )
    pe.disposition   = suggestDisposition(
      pe.overallRating, pe.evaluationType
    )

    pe.strengths   = sections.strengths   ?? ''
    pe.progress    = sections.progress    ?? ''
    pe.mistakes    = sections.mistakes    ?? ''
    pe.corrections = sections.corrections ?? ''

    pe.status = 'completed'
    await pe.save()

    logger.info(
      `Supervisor rating submitted for PE ${peId}. Score: ${total} Rating: ${pe.overallRating}`
    )
    return pe
  } catch (error) {
    logger.error(
      `submitSupervisorRating error: ${error.message}`
    )
    throw error
  }
}

export const acknowledgePE = async (peId, userId) => {
  try {
    const pe = await PerformanceEvaluation.findById(peId)
    if (!pe)
      throw Object.assign(
        new Error('PE not found'), { status: 404 }
      )
    if (pe.employeeId.toString() !== userId)
      throw Object.assign(
        new Error('Forbidden'), { status: 403 }
      )
    if (pe.status !== 'completed')
      throw Object.assign(
        new Error('PE must be completed before acknowledging'),
        { status: 400 }
      )

    pe.status         = 'acknowledged'
    pe.acknowledgedAt = new Date()
    pe.acknowledgedBy = userId
    await pe.save()

    logger.info(`PE ${peId} acknowledged by ${userId}`)
    return pe
  } catch (error) {
    logger.error(`acknowledgePE error: ${error.message}`)
    throw error
  }
}

export const updateDisposition = async (
  peId, disposition, adminId
) => {
  try {
    const allowed = ['fail', 'next-pe', 'regularize']
    if (!allowed.includes(disposition))
      throw Object.assign(
        new Error(
          `Invalid disposition. Must be: ${allowed.join(', ')}`
        ), { status: 400 }
      )

    const pe = await PerformanceEvaluation
      .findByIdAndUpdate(
        peId,
        { disposition },
        { new: true }
      )
    if (!pe)
      throw Object.assign(
        new Error('PE not found'), { status: 404 }
      )

    logger.info(
      `Disposition updated to ${disposition} for PE ${peId} by admin ${adminId}`
    )
    return pe
  } catch (error) {
    logger.error(
      `updateDisposition error: ${error.message}`
    )
    throw error
  }
}

export const listPerformanceEvaluations = async (
  query = {}
) => {
  try {
    const {
      employeeId, status, evaluationType,
      disposition, page, limit
    } = query

    const filter = {}
    if (employeeId)     filter.employeeId = employeeId
    if (status)         filter.status = status
    if (evaluationType) filter.evaluationType = evaluationType
    if (disposition)    filter.disposition = disposition

    const { skip, limit: lim, page: p } =
      paginate(page, limit ?? 20)

    const [evaluations, total] = await Promise.all([
      PerformanceEvaluation.find(filter)
        .populate('employeeId',
          'personalInfo.fullName personalInfo.firstName ' +
          'personalInfo.lastName email department ' +
          'positionTitle'
        )
        .populate('evaluatorId',
          'personalInfo.fullName email'
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(lim)
        .lean(),
      PerformanceEvaluation.countDocuments(filter),
    ])

    return {
      evaluations,
      pagination: {
        total, page: p, limit: lim,
        totalPages: Math.ceil(total / lim),
        hasNextPage: p < Math.ceil(total / lim),
        hasPrevPage: p > 1,
      }
    }
  } catch (error) {
    logger.error(`listPE error: ${error.message}`)
    throw error
  }
}

export const getMyPerformanceEvaluations = async (
  userId
) => {
  try {
    const evaluations = await PerformanceEvaluation
      .find({ employeeId: userId })
      .populate('evaluatorId',
        'personalInfo.fullName email'
      )
      .sort({ createdAt: -1 })
      .lean()

    return evaluations
  } catch (error) {
    logger.error(`getMyPE error: ${error.message}`)
    throw error
  }
}

export const getPerformanceEvaluationById = async (
  peId, userId, userRole
) => {
  try {
    const pe = await PerformanceEvaluation.findById(peId)
      .populate('employeeId',
        'personalInfo email department positionTitle ' +
        'employmentType'
      )
      .populate('evaluatorId', 'personalInfo email')
      .lean()

    if (!pe)
      throw Object.assign(
        new Error('PE not found'), { status: 404 }
      )

    const isAdmin = ['admin','super-admin','hr']
      .includes(userRole)
    const isOwner =
      pe.employeeId._id.toString() === userId

    if (!isAdmin && !isOwner)
      throw Object.assign(
        new Error('Forbidden'), { status: 403 }
      )

    return pe
  } catch (error) {
    logger.error(`getPE error: ${error.message}`)
    throw error
  }
}
