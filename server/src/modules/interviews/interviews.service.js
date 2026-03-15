import InterviewSchedule from './interview.model.js';
import Applicant from '../applications/applicant.model.js';
import Job from '../jobs/job.model.js';
import { logger } from '../../utils/logger.js';

const createError = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

const DEFAULT_TIME_SLOTS = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'];

const toSlot = (dateValue) => {
  const date = new Date(dateValue);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

export const getAvailableSlots = async (adminId, month, year) => {
  try {
    const monthNum = Number(month);
    const yearNum = Number(year);

    if (!monthNum || !yearNum || monthNum < 1 || monthNum > 12) {
      throw createError(400, 'Invalid month/year query parameters');
    }

    const startDate = new Date(yearNum, monthNum - 1, 1, 0, 0, 0, 0);
    const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59, 999);

    const query = {
      scheduledAt: { $gte: startDate, $lte: endDate },
      status: { $nin: ['cancelled'] },
    };

    if (adminId) {
      query.adminId = adminId;
    }

    const schedules = await InterviewSchedule.find(query).select('scheduledAt');

    const bookedByDay = {};
    for (const interview of schedules) {
      const date = new Date(interview.scheduledAt);
      const day = date.getDate();
      const slot = toSlot(date);

      if (!bookedByDay[day]) {
        bookedByDay[day] = new Set();
      }
      bookedByDay[day].add(slot);
    }

    const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
    const availableTimeSlots = {};
    const availableDates = [];

    for (let day = 1; day <= daysInMonth; day += 1) {
      const bookedSlots = bookedByDay[day] || new Set();
      const openSlots = DEFAULT_TIME_SLOTS.filter((slot) => !bookedSlots.has(slot));

      if (openSlots.length > 0) {
        availableDates.push(day);
      }

      availableTimeSlots[day] = openSlots;
    }

    return { availableDates, availableTimeSlots };
  } catch (error) {
    logger.error(`Get availability error: ${error.message}`);
    throw error;
  }
};

export const createInterview = async ({
  applicantEmail,
  scheduledAt,
  timezone,
  receiverName,
  adminId,
  jobId,
}) => {
  try {
    if (!applicantEmail || !scheduledAt || !receiverName) {
      throw createError(
        400,
        'Missing required fields: applicantEmail, scheduledAt, receiverName'
      );
    }

    const parsedDate = new Date(scheduledAt);
    if (Number.isNaN(parsedDate.getTime())) {
      throw createError(400, 'Invalid scheduledAt value');
    }

    // Resolve applicantId from email — silent fail if not found
    let applicantId = undefined;
    try {
      const applicant = await Applicant.findOne({
        email: { $regex: new RegExp(`^${applicantEmail}$`, 'i') },
      })
        .select('_id')
        .lean();
      if (applicant) applicantId = applicant._id;
    } catch (e) {
      logger.warn(`Could not resolve applicantId for ${applicantEmail}`);
    }

    const interview = new InterviewSchedule({
      applicantEmail,
      receiverName,
      scheduledAt: parsedDate,
      timezone: timezone || 'Asia/Manila',
      adminId: adminId || undefined,
      jobId: jobId || undefined,
      applicantId: applicantId || undefined,
      status: 'scheduled',
    });

    await interview.save();

    return interview;
  } catch (error) {
    logger.error(`Create interview error: ${error.message}`);
    throw error;
  }
};

export const getInterviews = async (filters = {}) => {
  try {
    const query = {};

    if (filters.status) {
      query.status = filters.status;
    } else {
      query.status = { $in: ['pending', 'scheduled', 'rescheduled'] };
    }

    if (filters.jobId) query.jobId = filters.jobId;
    if (filters.applicantId) query.applicantId = filters.applicantId;

    const interviews = await InterviewSchedule.find(query)
      .populate('applicantId', 'fullName email stage')
      .populate('jobId', 'title department')
      .populate('adminId', 'email personalInfo')
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();

    return interviews;
  } catch (error) {
    logger.error(`Get interviews error: ${error.message}`);
    throw error;
  }
};

export const updateInterviewStatus = async (interviewId, status) => {
  try {
    const validStatuses = ['pending', 'scheduled', 'completed', 'cancelled', 'rescheduled'];
    if (!validStatuses.includes(status)) {
      throw createError(400, `Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const updated = await InterviewSchedule.findByIdAndUpdate(
      interviewId,
      { status },
      { new: true, runValidators: true }
    );

    if (!updated) {
      throw createError(404, 'Interview not found');
    }

    return updated;
  } catch (error) {
    logger.error(`Update interview status error: ${error.message}`);
    throw error;
  }
};

export const scheduleInterview = async (interviewId, { scheduledAt, timezone, meetingLink }) => {
  try {
    if (!scheduledAt) {
      throw createError(400, 'scheduledAt is required');
    }

    const parsedDate = new Date(scheduledAt);
    if (Number.isNaN(parsedDate.getTime())) {
      throw createError(400, 'Invalid scheduledAt value');
    }

    const updated = await InterviewSchedule.findByIdAndUpdate(
      interviewId,
      {
        scheduledAt: parsedDate,
        timezone: timezone || 'Asia/Manila',
        meetingLink: meetingLink || null,
        status: 'scheduled',
      },
      { new: true, runValidators: true }
    )
      .populate('applicantId', 'fullName email stage')
      .populate('jobId', 'title department')
      .populate('adminId', 'email personalInfo')
      .lean();

    if (!updated) {
      throw createError(404, 'Interview not found');
    }

    return updated;
  } catch (error) {
    logger.error(`Schedule interview error: ${error.message}`);
    throw error;
  }
};
