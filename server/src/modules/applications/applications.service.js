import Applicant from './applicant.model.js';
import Job from '../jobs/job.model.js';
import User from '../auth/user.model.js';
import { logger } from '../../utils/logger.js';

const createError = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

// Submit application for a job (public)
export const submitApplication = async (jobId, applicantData, resumeUrl = null) => {
  try {
    // Validate job exists and is active
    const job = await Job.findById(jobId);
    if (!job) {
      throw createError(404, 'Job not found');
    }
    if (job.status !== 'active') {
      throw createError(400, 'This job is no longer accepting applications');
    }

    // Check for duplicate application (same email + job)
    const existingApp = await Applicant.findOne({
      email: applicantData.email,
      jobId,
    });
    if (existingApp) {
      throw createError(409, 'You have already applied for this job');
    }

    // Create applicant
    const applicant = new Applicant({
      jobId,
      fullName: applicantData.fullName,
      email: applicantData.email,
      phone: applicantData.phone,
      resumeUrl: resumeUrl || null,
      stage: 'applied',
    });

    // Initialize stage history
    applicant.stageHistory.push({
      stage: 'applied',
      changedAt: new Date(),
      changedBy: 'system',
      notes: 'Initial application submission',
    });

    await applicant.save();
    logger.info(`New application: ${applicantData.email} for job ${jobId}`);

    return applicant;
  } catch (error) {
    logger.error(`Submit application error: ${error.message}`);
    throw error;
  }
};

// Get all applications (admin view) with pagination and filtering
export const getApplications = async (filters = {}, pagination = {}) => {
  try {
    const { jobId, stage, search, email, page = 1, limit = 20 } = {
      ...filters,
      ...pagination,
    };

    const query = {};
    if (jobId) query.jobId = jobId;
    if (stage) query.stage = stage;
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    if (email) {
      query.email = email.toLowerCase();
    }

    const total = await Applicant.countDocuments(query);
    const data = await Applicant.find(query)
      .populate('jobId', 'title department')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    logger.error(`Get applications error: ${error.message}`);
    throw error;
  }
};

export const findCandidateByEmail = async (email) => {
  try {
    if (!email) {
      return null;
    }

    const applicant = await Applicant.findOne({ email: email.toLowerCase() })
      .select('fullName email createdAt')
      .sort({ createdAt: -1 });

    return applicant;
  } catch (error) {
    logger.error(`Find candidate by email error: ${error.message}`);
    throw error;
  }
};

// Get single applicant by ID
export const getApplicationById = async (applicantId) => {
  try {
    const applicant = await Applicant.findById(applicantId).populate(
      'jobId',
      'title department'
    );

    if (!applicant) {
      throw createError(404, 'Application not found');
    }

    return applicant;
  } catch (error) {
    logger.error(`Get application error: ${error.message}`);
    throw error;
  }
};

// Update applicant stage and record history
export const updateStage = async (
  applicantId,
  newStage,
  adminId,
  adminName,
  notes = ''
) => {
  try {
    const validStages = ['applied', 'screening', 'interview', 'offer', 'hired', 'rejected'];
    if (!validStages.includes(newStage)) {
      throw createError(400, `Invalid stage. Must be one of: ${validStages.join(', ')}`);
    }

    const applicant = await Applicant.findById(applicantId);
    if (!applicant) {
      throw createError(404, 'Application not found');
    }

    // Add to stage history
    applicant.stageHistory.push({
      stage: newStage,
      changedAt: new Date(),
      changedBy: adminName || adminId,
      notes: notes || '',
    });

    // Update stage
    applicant.stage = newStage;

    // If hired, mark as employee and remove TTL
    if (newStage === 'hired') {
      applicant.isEmployee = true;
      applicant.deletedAt = undefined; // Removes TTL

      // Try to activate the corresponding user account if it exists
      // Use case-insensitive regex match
      const user = await User.findOne({
        email: { $regex: new RegExp(`^${applicant.email}$`, 'i') },
      });
      if (user) {
        await User.findByIdAndUpdate(user._id, {
          isVerified: true,
          isActive: true,
          role: 'employee',
        });
        logger.info(`User account activated for applicant ${applicant.email}`);
      }
    }

    await applicant.save();
    logger.info(`Applicant ${applicantId} moved to ${newStage} stage`);

    return applicant;
  } catch (error) {
    logger.error(`Update stage error: ${error.message}`);
    throw error;
  }
};

// Add note to application
export const addNote = async (applicantId, text, adminId, adminName) => {
  try {
    const applicant = await Applicant.findById(applicantId);
    if (!applicant) {
      throw createError(404, 'Application not found');
    }

    applicant.notes.push({
      text,
      createdBy: adminName || adminId,
      createdAt: new Date(),
    });

    await applicant.save();
    logger.info(`Note added to applicant ${applicantId}`);

    return applicant;
  } catch (error) {
    logger.error(`Add note error: ${error.message}`);
    throw error;
  }
};

// Delete application (hard delete for GDPR)
export const deleteApplication = async (applicantId) => {
  try {
    const applicant = await Applicant.findByIdAndDelete(applicantId);
    if (!applicant) {
      throw createError(404, 'Application not found');
    }

    logger.info(`Applicant ${applicantId} deleted`);
    return applicant;
  } catch (error) {
    logger.error(`Delete application error: ${error.message}`);
    throw error;
  }
};

// Get applications grouped by stage (for ATS dashboard)
export const getApplicationsByStage = async (jobId = null) => {
  try {
    const query = jobId ? { jobId } : {};

    const pipeline = [
      { $match: query },
      {
        $group: {
          _id: '$stage',
          count: { $sum: 1 },
          applicants: { $push: '$$ROOT' },
        },
      },
      { $sort: { _id: 1 } },
    ];

    const result = await Applicant.aggregate(pipeline);
    return result;
  } catch (error) {
    logger.error(`Get applications by stage error: ${error.message}`);
    throw error;
  }
};
