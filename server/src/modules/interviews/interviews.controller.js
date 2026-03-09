import * as interviewService from './interviews.service.js';

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
    const { applicantEmail, scheduledAt, timezone, receiverName, adminId } = req.body;

    const interview = await interviewService.createInterview({
      applicantEmail,
      scheduledAt,
      timezone,
      receiverName,
      adminId,
    });

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
