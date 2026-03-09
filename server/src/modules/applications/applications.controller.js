import * as applicationService from './applications.service.js';
import { logger } from '../../utils/logger.js';

// POST /api/applications — Public submit application (no auth)
export const submitApplicationController = async (req, res, next) => {
  try {
    const { jobId, fullName, email, phone } = req.body;

    // Validation
    if (!jobId || !fullName || !email || !phone) {
      return res.status(400).json({
        error: 'Missing required fields: jobId, fullName, email, phone',
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // TODO: Handle resume file upload to Supabase
    const resumeUrl = null;

    const applicant = await applicationService.submitApplication(
      jobId,
      { fullName, email, phone },
      resumeUrl
    );

    res.status(201).json({
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
