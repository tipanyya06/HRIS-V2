import { MeetingRequest, TalentRequest } from './request.model.js';
import { logger } from '../../utils/logger.js';

const createError = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

export const createMeetingRequest = async (userId, data) => {
  try {
    const meeting = new MeetingRequest({
      userId,
      ...data,
    });

    await meeting.save();
    logger.info(`Meeting request created by user ${userId}`);
    return meeting;
  } catch (error) {
    logger.error(`Error creating meeting request: ${error.message}`);
    throw error;
  }
};

export const createTalentRequest = async (userId, data) => {
  try {
    const talent = new TalentRequest({
      userId,
      ...data,
    });

    await talent.save();
    logger.info(`Talent request created by user ${userId}`);
    return talent;
  } catch (error) {
    logger.error(`Error creating talent request: ${error.message}`);
    throw error;
  }
};

export const getAllRequests = async (filters = {}, pagination = {}) => {
  try {
    const page = parseInt(pagination.page, 10) || 1;
    const limit = parseInt(pagination.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const query = {};
    if (filters.status) query.status = filters.status;
    if (filters.requestType) query.requestType = filters.requestType;
    if (filters.userId) query.userId = filters.userId;

    // Get meetings and talents separately, then combine
    const [meetingDocs, talentDocs] = await Promise.all([
      MeetingRequest.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }),
      TalentRequest.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }),
    ]);

    const [meetingCount, talentCount] = await Promise.all([
      MeetingRequest.countDocuments(query),
      TalentRequest.countDocuments(query),
    ]);

    // Combine and sort by createdAt
    const allRequests = [...meetingDocs, ...talentDocs].sort(
      (a, b) => b.createdAt - a.createdAt
    );

    const total = meetingCount + talentCount;

    return {
      data: allRequests,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  } catch (error) {
    logger.error(`Error fetching requests: ${error.message}`);
    throw error;
  }
};

export const getMyRequests = async (userId) => {
  try {
    const [meetings, talents] = await Promise.all([
      MeetingRequest.find({ userId }).sort({ createdAt: -1 }),
      TalentRequest.find({ userId }).sort({ createdAt: -1 }),
    ]);

    const allRequests = [...meetings, ...talents].sort(
      (a, b) => b.createdAt - a.createdAt
    );

    return allRequests;
  } catch (error) {
    logger.error(`Error fetching user requests: ${error.message}`);
    throw error;
  }
};

export const approveMeetingRequest = async (requestId) => {
  try {
    const request = await MeetingRequest.findByIdAndUpdate(
      requestId,
      { status: 'approved' },
      { new: true }
    );

    if (!request) {
      throw createError(404, 'Meeting request not found');
    }

    logger.info(`Meeting request ${requestId} approved`);
    return request;
  } catch (error) {
    logger.error(`Error approving meeting request: ${error.message}`);
    throw error;
  }
};

export const approveTalentRequest = async (requestId) => {
  try {
    const request = await TalentRequest.findByIdAndUpdate(
      requestId,
      { status: 'approved' },
      { new: true }
    );

    if (!request) {
      throw createError(404, 'Talent request not found');
    }

    logger.info(`Talent request ${requestId} approved`);
    return request;
  } catch (error) {
    logger.error(`Error approving talent request: ${error.message}`);
    throw error;
  }
};

export const rejectMeetingRequest = async (requestId, rejectionReason) => {
  try {
    const request = await MeetingRequest.findByIdAndUpdate(
      requestId,
      { status: 'rejected', rejectionReason },
      { new: true }
    );

    if (!request) {
      throw createError(404, 'Meeting request not found');
    }

    logger.info(`Meeting request ${requestId} rejected`);
    return request;
  } catch (error) {
    logger.error(`Error rejecting meeting request: ${error.message}`);
    throw error;
  }
};

export const rejectTalentRequest = async (requestId, rejectionReason) => {
  try {
    const request = await TalentRequest.findByIdAndUpdate(
      requestId,
      { status: 'rejected', rejectionReason },
      { new: true }
    );

    if (!request) {
      throw createError(404, 'Talent request not found');
    }

    logger.info(`Talent request ${requestId} rejected`);
    return request;
  } catch (error) {
    logger.error(`Error rejecting talent request: ${error.message}`);
    throw error;
  }
};
