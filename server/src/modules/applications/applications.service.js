import Applicant from './applicant.model.js';
import Job from '../jobs/job.model.js';
import User from '../auth/user.model.js';
import InterviewSchedule from '../interviews/interviewSchedule.model.js';
import { logger } from '../../utils/logger.js';

const createError = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

// Check for duplicate application by jobId and userId
export const getApplicationDuplicate = async ({ jobId, userId }) => {
  try {
    const existing = await Applicant.findOne({
      jobId,
      userId,
    });
    return existing;
  } catch (error) {
    logger.error(`Check duplicate application error: ${error.message}`);
    throw error;
  }
};

// Submit application for a job (public or authenticated)
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

    // Create applicant with all fields
    const applicant = new Applicant({
      jobId,
      fullName: applicantData.fullName,
      email: applicantData.email,
      phone: applicantData.phone || '',
      coverLetter: applicantData.coverLetter || '',
      resumeUrl: resumeUrl || applicantData.resumeUrl || '',
      userId: applicantData.userId,   // required for authenticated submissions
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

    // -- INTERVIEW SCHEDULE LIFECYCLE STANDARD ---------------------------------
    // interviewSchedule records are tied to the applicant's current stage.
    //
    // Stage -> interview:
    //   Check for any ACTIVE record (status: pending/scheduled/rescheduled).
    //   If none exists -> create a new record with status: pending.
    //   If one already exists -> do nothing (preserve existing schedule).
    //   This prevents duplicate records when an applicant is re-staged to interview.
    //
    // Stage -> applied or screening:
    //   Cancel all active interview records for this applicant.
    //   This cleans up stale records from the Interviews tab.
    //
    // Stage -> rejected:
    //   Cancel all active interview records for this applicant.
    //
    // Stage -> offer or hired:
    //   Do NOT touch interview records. They are kept as audit history.
    //
    // Active = status is one of: pending, scheduled, rescheduled
    // Inactive = status is one of: cancelled, completed
    // -------------------------------------------------------------------------

    if (newStage === 'interview') {
      const existingActive = await InterviewSchedule.findOne({
        applicantId: applicant._id,
        status: { $in: ['pending', 'scheduled', 'rescheduled'] },
      }).lean();

      if (!existingActive) {
        await InterviewSchedule.create({
          applicantId: applicant._id,
          jobId: applicant.jobId,
          adminId,
          status: 'pending',
          scheduledAt: null,
          timezone: null,
          meetingLink: null,
          notes: '',
        });
      }
    }

    if (newStage === 'applied' || newStage === 'screening') {
      await InterviewSchedule.updateMany(
        {
          applicantId: applicant._id,
          status: { $in: ['pending', 'scheduled', 'rescheduled'] },
        },
        { $set: { status: 'cancelled' } }
      );
    }

    if (newStage === 'rejected') {
      await InterviewSchedule.updateMany(
        {
          applicantId: applicant._id,
          status: { $in: ['pending', 'scheduled', 'rescheduled'] },
        },
        { $set: { status: 'cancelled' } }
      );
    }

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

      // ════════════════════════════════════════
      // STEP 1 — Copy application data to User profile
      // ════════════════════════════════════════
      try {
        const hiredUser = await User.findById(applicant.userId);
        if (hiredUser) {
          const updates = {};

          // Copy phone if exists on application
          if (applicant.phone) {
            updates['contactInfo.mainContactNo'] = applicant.phone;
          }

          // Copy resume to documents array
          if (applicant.resumeUrl) {
            if (!updates.$push) updates.$push = {};
            updates.$push.documents = {
              url: applicant.resumeUrl,
              originalName: 'Application Resume',
              type: 'resume',
              uploadedAt: new Date(),
            };
          }

          // Set employment info from job
          const job = await Job.findById(applicant.jobId).select('title department');
          if (job) {
            updates['employmentInfo.position'] = job.title;
            updates['employmentInfo.department'] = job.department;
          }

          // Apply all updates
          if (Object.keys(updates).length > 0) {
            await User.findByIdAndUpdate(applicant.userId, updates, { new: true });
            logger.info(`Hire data copied to user profile: ${applicant.userId}`);
          }
        }
      } catch (profileErr) {
        logger.error(`Failed to copy hire data to user profile: ${profileErr.message}`);
        // Don't throw — hire continues even if profile update fails
      }

      // ════════════════════════════════════════
      // STEP 2 — Send Brevo welcome email
      // ════════════════════════════════════════
      try {
        // Try to import sendEmail utility (may not exist)
        let sendEmail;
        try {
          const emailModule = await import('../../utils/email.js');
          sendEmail = emailModule.default || emailModule.sendEmail;
        } catch (importErr) {
          logger.warn(`Email utility not available: ${importErr.message}`);
        }

        if (sendEmail && typeof sendEmail === 'function') {
          const job = await Job.findById(applicant.jobId).select('title');
          const jobTitle = job?.title || 'a team member';

          await sendEmail({
            to: applicant.email,
            subject: 'Welcome to Madison 88 — Your Employee Account is Ready',
            html: `
              <h2>Congratulations!</h2>
              <p>You have been hired as <strong>${jobTitle}</strong> at Madison 88.</p>
              <p>Your employee portal is now active.</p>
              <p>Login at: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/login</p>
              <p>Use your registered email and password to access your employee dashboard.</p>
              <p>Welcome to the team!</p>
            `,
          });
          logger.info(`Welcome email sent to: ${applicant.email}`);
        }
      } catch (emailErr) {
        // Don't fail the hire if email fails — just log it
        logger.error(`Welcome email failed: ${emailErr.message}`);
      }

      // ════════════════════════════════════════
      // STEP 3 — Verify applicant TTL is removed
      // ════════════════════════════════════════
      try {
        await Applicant.findByIdAndUpdate(applicant._id, {
          isEmployee: true,
          $unset: { deletedAt: '' },
        });
        logger.info(`Applicant TTL removed: ${applicant._id}`);
      } catch (ttlErr) {
        logger.error(`Failed to remove applicant TTL: ${ttlErr.message}`);
        // Don't throw — hire continues even if TTL update fails
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

/**
 * Get applicant's own applications (applicant-facing)
 */
export const getMyApplications = async (userId) => {
  try {
    // Filter applications by userId directly
    if (!userId) throw createError(400, 'User ID is required');

    const applications = await Applicant.find({ userId })
      .populate({
        path: 'jobId',
        select: 'title department location employmentType description status',
      })
      .sort({ createdAt: -1 })
      .lean();

    // Filter out applications where the job was deleted (populate sets it to null)
    return applications.filter(a => a.jobId !== null);
  } catch (err) {
    logger.error(`Get my applications error: ${err.message}`);
    throw err;
  }
};
