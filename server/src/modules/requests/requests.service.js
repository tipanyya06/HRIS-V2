import Request from './request.model.js';
import { logger } from '../../utils/logger.js';

const createError = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

export const createRequest = async (
  userId,
  { type, subject, message, date, priority }
) => {
  try {
    if (!type || !subject || !message)
      throw createError(400, 'type, subject and message are required');
    const request = await Request.create({
      userId,
      type,
      subject: subject.trim(),
      message: message.trim(),
      date: date ? new Date(date) : undefined,
      priority: priority || 'normal',
    });
    return request;
  } catch (error) {
    logger.error(`Create request error: ${error.message}`);
    throw error;
  }
};

export const getMyRequests = async (userId, type) => {
  try {
    const query = { userId };
    if (type) query.type = type;
    return await Request.find(query).sort({ createdAt: -1 });
  } catch (error) {
    logger.error(`Get my requests error: ${error.message}`);
    throw error;
  }
};

export const getAllRequests = async ({ type, status }) => {
  try {
    const query = {};
    if (type) query.type = type;
    if (status) query.status = status;
    return await Request.find(query)
      .populate('userId', 'email personalInfo.givenName personalInfo.surname')
      .sort({ createdAt: -1 });
  } catch (error) {
    logger.error(`Get all requests error: ${error.message}`);
    throw error;
  }
};

export const updateRequestStatus = async (
  requestId,
  { status, adminNote }
) => {
  try {
    const validStatuses = ['pending', 'reviewed', 'approved', 'rejected'];
    if (!validStatuses.includes(status))
      throw createError(400, 'Invalid status');
    const updated = await Request.findByIdAndUpdate(
      requestId,
      { status, ...(adminNote ? { adminNote } : {}) },
      { new: true, runValidators: true }
    );
    if (!updated) throw createError(404, 'Request not found');
    return updated;
  } catch (error) {
    logger.error(`Update request error: ${error.message}`);
    throw error;
  }
};
