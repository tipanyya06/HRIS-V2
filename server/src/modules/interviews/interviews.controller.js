import * as interviewService from './interviews.service.js';
import { createNotification } from '../notifications/notification.service.js';
import { logger } from '../../utils/logger.js';
import Applicant from '../applications/applicant.model.js';
import InterviewSchedule from './interview.model.js';

export const getAvailabilityController = async (req, res, next) => {
  try {
    const { adminId, month, year } = req.query;

    const availability = await interviewService.getAvailableSlots(adminId, month, year);

    res.status(200).json({
      success: true,
      data: availability,
    });
  } catch (error) {
    next(error);
  }
};

export const createInterviewController = async (req, res, next) => {
  try {
    const { applicantEmail, scheduledAt, timezone, receiverName, adminId, jobId } = req.body;

    const interview = await interviewService.createInterview({
      applicantEmail,
      scheduledAt,
      timezone,
      receiverName,
      adminId,
      jobId,
    });

    // Notify applicant of interview scheduling (silent fail)
    try {
      if (interview.applicantId?.userId) {
        const interviewDate = new Date(interview.scheduledAt).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
        await createNotification(
          interview.applicantId.userId,
          'interview_scheduled',
          'Interview Scheduled',
          `Your interview for ${interview.jobId?.title || 'a position'} is scheduled for ${interviewDate}`,
          '/applicant/applications'
        );
      }
    } catch (notifErr) {
      logger.error('Notification error:', notifErr);
    }

    res.status(201).json({
      success: true,
      message: 'Interview booked successfully',
      data: interview,
    });
  } catch (error) {
    next(error);
  }
};

export const getInterviewsController = async (req, res, next) => {
  try {
    const { month, year, status } = req.query;

    const interviews = await interviewService.getInterviews({
      month,
      year,
      status,
    });

    res.status(200).json({
      success: true,
      count: interviews.length,
      data: interviews,
    });
  } catch (error) {
    next(error);
  }
};

export const updateInterviewStatusController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'status is required' });
    }

    const interview = await interviewService.updateInterviewStatus(id, status);

    res.status(200).json({
      success: true,
      message: 'Interview status updated successfully',
      data: interview,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyInterviewsController = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find the applicant record for this user
    const applicant = await Applicant.findOne({ userId })
      .select('_id')
      .lean();

    // If no applicant record, return empty array
    if (!applicant) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    const interviews = await InterviewSchedule.find({
      applicantId: applicant._id,
    })
      .populate('jobId', 'title department')
      .sort({ scheduledAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: interviews,
    });
  } catch (err) {
    logger.error('Get my interviews error:', err);
    return res.status(500).json({
      error: 'Failed to fetch interviews',
    });
  }
};
