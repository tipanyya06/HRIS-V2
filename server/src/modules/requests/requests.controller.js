import {
  createMeetingRequest,
  createTalentRequest,
  getAllRequests,
  getMyRequests,
  approveMeetingRequest,
  approveTalentRequest,
  rejectMeetingRequest,
  rejectTalentRequest,
} from './requests.service.js';
import { logger } from '../../utils/logger.js';

const createError = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

export const createMeetingRequestController = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id;
    const meeting = await createMeetingRequest(userId, req.body);

    res.status(201).json({
      success: true,
      message: 'Meeting request created successfully',
      data: meeting,
    });
  } catch (error) {
    next(error);
  }
};

export const createTalentRequestController = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id;
    const talent = await createTalentRequest(userId, req.body);

    res.status(201).json({
      success: true,
      message: 'Talent request created successfully',
      data: talent,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllRequestsController = async (req, res, next) => {
  try {
    const { status, requestType, page = 1, limit = 20 } = req.query;

    const filters = {};
    if (status) filters.status = status;
    if (requestType) filters.requestType = requestType;

    const result = await getAllRequests(filters, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });

    res.status(200).json({
      success: true,
      data: result.data,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        pages: result.pages,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMyRequestsController = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id;
    const requests = await getMyRequests(userId);

    res.status(200).json({
      success: true,
      data: requests,
      total: requests.length,
    });
  } catch (error) {
    next(error);
  }
};

export const approveMeetingRequestController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const request = await approveMeetingRequest(id);

    res.status(200).json({
      success: true,
      message: 'Meeting request approved',
      data: request,
    });
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
};

export const approveTalentRequestController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const request = await approveTalentRequest(id);

    res.status(200).json({
      success: true,
      message: 'Talent request approved',
      data: request,
    });
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
};

export const rejectMeetingRequestController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      return next(createError(400, 'Rejection reason is required'));
    }

    const request = await rejectMeetingRequest(id, rejectionReason);

    res.status(200).json({
      success: true,
      message: 'Meeting request rejected',
      data: request,
    });
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
};

export const rejectTalentRequestController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      return next(createError(400, 'Rejection reason is required'));
    }

    const request = await rejectTalentRequest(id, rejectionReason);

    res.status(200).json({
      success: true,
      message: 'Talent request rejected',
      data: request,
    });
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
};
