import * as requestService from './requests.service.js';
import { createNotification } from '../notifications/notification.service.js';
import { logger } from '../../utils/logger.js';

export const createRequestController = async (req, res, next) => {
  try {
    const { type, subject, message, date, priority } = req.body;
    const request = await requestService.createRequest(req.user.id, {
      type,
      subject,
      message,
      date,
      priority,
    });

    try {
      await createNotification(
        req.user.id,
        'request_submitted',
        'Request Submitted',
        `Your ${type} request "${subject}" has been submitted`,
        '/employee/requests'
      );
    } catch (notifErr) {
      logger.error('Notification error:', notifErr);
    }

    res.status(201).json({ success: true, data: request });
  } catch (error) {
    next(error);
  }
};

export const getMyRequestsController = async (req, res, next) => {
  try {
    const { type } = req.query;
    const requests = await requestService.getMyRequests(req.user.id, type);
    res.status(200).json({ success: true, data: requests });
  } catch (error) {
    next(error);
  }
};

export const getAllRequestsController = async (req, res, next) => {
  try {
    const { type, status } = req.query;
    const requests = await requestService.getAllRequests({ type, status });
    res.status(200).json({ success: true, data: requests });
  } catch (error) {
    next(error);
  }
};

export const updateRequestStatusController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, adminNote } = req.body;
    const updated = await requestService.updateRequestStatus(id, {
      status,
      adminNote,
    });
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};
