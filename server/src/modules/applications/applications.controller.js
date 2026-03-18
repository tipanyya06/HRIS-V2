import * as applicationService from './applications.service.js';
import { logger } from '../../utils/logger.js';
import User from '../auth/user.model.js';
import {
  createNotification,
  createBulkNotifications,
} from '../notifications/notification.service.js';

const createError = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

// POST /api/applications — Submit application (authenticated applicants only)
export const createApplicationController = async (req, res) => {
  try {
    const userId = req.user.id
    const userEmail = req.user.email

    // Block admins, HR, and employees from applying
    const blockedRoles = ['admin', 'super-admin', 'hr', 'employee']
    if (blockedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: req.user.role === 'employee'
          ? 'You are already an employee. Please contact HR for internal transfers.'
          : 'You are not permitted to submit job applications.',
      })
    }

    const { jobId, coverLetter, phone, resumeUrl } = req.body

    // jobId is the only required body field
    if (!jobId)
      return res.status(400).json({
        error: 'Job ID is required',
      })

    // Get user's full name from database
    const user = await User.findById(userId).select('personalInfo email')

    if (!user)
      return res.status(404).json({
        error: 'User not found',
      })

    const fullName =
      user.personalInfo?.givenName && user.personalInfo?.surname
        ? `${user.personalInfo.givenName} ${user.personalInfo.surname}`.trim()
        : userEmail

    // Check for duplicate application
    const existing = await applicationService.getApplicationDuplicate({
      jobId,
      userId,
    })
    if (existing)
      return res.status(409).json({
        error: 'You have already applied for this position',
      })

    const application = await applicationService.submitApplication(jobId, {
      fullName,
      email: userEmail,
      phone: phone || '',
      coverLetter: coverLetter || '',
      resumeUrl: resumeUrl || '',
      userId,
    })

    logger.info(`Application created: ${userId} applied to ${jobId}`)

    // Notify all admin/hr users of new application (silent fail)
    try {
      const adminUsers = await User.find({
        role: { $in: ['admin', 'super-admin', 'hr'] },
      })
        .select('_id')
        .lean();

      const adminIds = adminUsers.map((u) => u._id);

      if (adminIds.length > 0) {
        await createBulkNotifications(
          adminIds,
          'new_application',
          'New Application Received',
          `${application.fullName} applied for ${application.jobId?.title || 'a position'}`,
          '/admin/applicants'
        );
      }
    } catch (notifErr) {
      logger.error('Notification error:', notifErr);
    }

    return res.status(201).json({
      success: true,
      data: application,
    })
  } catch (err) {
    logger.error('Create application error:', err)
    return res.status(500).json({
      error: 'Failed to submit application. Please try again.',
    })
  }
}

// Legacy: POST /api/applications-public — Submit application (public form only)
export const submitApplicationController = async (req, res, next) => {
  try {
    // Input validation
    const { jobId, coverLetter } = req.body;

    if (!jobId) {
      return next(createError(400, 'jobId is required'));
    }

    if (!coverLetter || typeof coverLetter !== 'string' || coverLetter.trim().length < 50) {
      return next(createError(400, 'Cover letter must be at least 50 characters'));
    }

    const {
      // Old public flow fields (ApplyForm)
      fullName,
      email,
      phone,
      // New modal flow fields (ApplyModal — logged-in applicant)
      resumeUrl,
      // userId is NEVER trusted from req.body — always use req.user if present
    } = req.body;

    // jobId is always required regardless of flow
    if (!jobId) {
      return res.status(400).json({ error: 'jobId is required' });
    }

    // Determine which flow this is
    const isModalFlow = !!req.user; // logged-in applicant via ApplyModal

    if (isModalFlow) {
      // Modal flow: user is authenticated, pull identity from their account
      // fullName and email come from req.user — not trusted from req.body
      const resolvedFullName =
        req.user.personalInfo?.givenName
          ? `${req.user.personalInfo.givenName} ${req.user.personalInfo.surname || ''}`.trim()
          : req.user.email;

      const resolvedEmail = req.user.email;

      if (!coverLetter || coverLetter.trim().length < 50) {
        return res.status(400).json({ error: 'Cover letter must be at least 50 characters' });
      }

      const applicant = await applicationService.submitApplication(
        jobId,
        {
          fullName: resolvedFullName,
          email: resolvedEmail,
          phone: phone || '',          // optional for modal flow
          coverLetter: coverLetter.trim(),
          resumeUrl: resumeUrl || '',
          userId: req.user.id,       // link application to User account
        },
        resumeUrl || null
      );

      return res.status(201).json({
        success: true,
        message: 'Application submitted successfully',
        data: applicant,
      });
    }

    // Public flow (ApplyForm): no auth, requires fullName + email + phone
    if (!fullName || !email || !phone) {
      return res.status(400).json({
        error: 'Missing required fields: jobId, fullName, email, phone',
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const applicant = await applicationService.submitApplication(
      jobId,
      { fullName, email, phone },
      null  // resume upload not yet supported in public form
    );

    return res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: applicant,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/applications — Get all applications (admin only)
export const getApplicationsController = async (req, res, next) => {
  try {
    const { jobId, stage, search, email, page = 1, limit = 20 } = req.query;

    const filters = {};
    if (jobId) filters.jobId = jobId;
    if (stage) filters.stage = stage;
    if (search) filters.search = search;
    if (email) filters.email = email;

    const result = await applicationService.getApplications(filters, {
      page: parseInt(page),
      limit: parseInt(limit),
    });

    res.status(200).json({
      success: true,
      count: result.data.length,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/applications?email=example@domain.com — Public candidate validation
export const validateCandidateByEmailController = async (req, res, next) => {
  try {
    const { email } = req.query;

    if (!email) {
      return next();
    }

    const applicant = await applicationService.findCandidateByEmail(email);

    if (!applicant) {
      return res.status(404).json({
        success: false,
        message: 'Email not found. Please check your application email.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Candidate found',
      data: {
        id: applicant._id,
        email: applicant.email,
        fullName: applicant.fullName,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/applications/:id — Get single application (admin only)
export const getApplicationByIdController = async (req, res, next) => {
  try {
    const { id } = req.params;

    const applicant = await applicationService.getApplicationById(id);

    res.status(200).json({
      success: true,
      data: applicant,
    });
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
};

// PATCH /api/applications/:id/stage — Update stage (admin only)
export const updateStageController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { newStage, notes } = req.body;

    if (!newStage) {
      return res.status(400).json({ error: 'newStage is required' });
    }

    const applicant = await applicationService.updateStage(
      id,
      newStage,
      req.user.id,
      `${req.user.email}`,
      notes || ''
    );

    // Notify applicant of stage change (silent fail)
    try {
      if (applicant.userId) {
        await createNotification(
          applicant.userId,
          'stage_changed',
          'Application Update',
          `Your application for ${applicant.jobId?.title || 'a position'} has moved to ${newStage}`,
          '/applicant/applications'
        );
      }
    } catch (notifErr) {
      logger.error('Notification error:', notifErr);
    }

    res.status(200).json({
      success: true,
      message: `Application moved to ${newStage}`,
      data: applicant,
    });
  } catch (error) {
    if (error.status === 404 || error.status === 400) {
      return res.status(error.status).json({ error: error.message });
    }
    next(error);
  }
};

// POST /api/applications/:id/notes — Add note (admin only)
export const addNoteController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Note text is required' });
    }

    const applicant = await applicationService.addNote(
      id,
      text,
      req.user.id,
      req.user.email
    );

    res.status(200).json({
      success: true,
      message: 'Note added successfully',
      data: applicant,
    });
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
};

// DELETE /api/applications/:id — Delete application (admin only)
export const deleteApplicationController = async (req, res, next) => {
  try {
    const { id } = req.params;

    await applicationService.deleteApplication(id);

    res.status(200).json({
      success: true,
      message: 'Application deleted successfully',
    });
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
};

// GET /api/applications/stats/by-stage — Get applications grouped by stage (admin only)
export const getApplicationsByStageController = async (req, res, next) => {
  try {
    const { jobId } = req.query;

    const result = await applicationService.getApplicationsByStage(jobId || null);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/applications/my — Get applicant's own applications (applicant auth required)
export const getMyApplicationsController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const applications = await applicationService.getMyApplications(userId);
    return res.status(200).json({ success: true, data: applications });
  } catch (err) {
    logger.error('Get my applications error:', err);
    next(err);
  }
};

// ---------------------------------------------------------------------------
// HIRE FLOW
// ---------------------------------------------------------------------------
import { hireApplicant } from './applications.service.js';

export const hireApplicantController = async (req, res, next) => {
  try {
    const { id } = req.params;       // applicantId
    const adminId = req.user.id;     // always from JWT, never body
    const result = await hireApplicant(id, adminId);
    res.status(200).json({
      success: true,
      message: 'Applicant successfully hired',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
