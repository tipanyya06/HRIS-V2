import * as requestService from './requests.service.js';
import { createNotification } from '../notifications/notification.service.js';
import { logActivity } from '../../middleware/activityLogger.js';
import { logger } from '../../utils/logger.js';
import User from '../auth/user.model.js';

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

    logActivity(req, `Request submitted: ${request.type ?? request.subject ?? request._id}`, 'request', request._id);

    // Notify all admins and HR when employee submits request
    User.find({
      role: { $in: ['admin', 'super-admin', 'hr'] }
    }).select('_id').lean()
      .then(admins =>
        Promise.allSettled(
          admins.map(admin =>
            createNotification(
              admin._id,
              'request_submitted',
              'New Request Submitted',
              `New ${request.type ?? 'request'} submitted by ${req.user?.email ?? 'employee'}`,
              '/admin/requests'
            )
          )
        )
      )
      .catch(err =>
        logger.error(
          `Request admin notification error: ${err.message}`
        )
      )

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

    try {
      await createNotification(
        updated.userId,
        'request_updated',
        'Request Status Updated',
        `Your request "${updated.subject}" is now ${updated.status}`,
        '/employee/requests'
      );
    } catch (notifErr) {
      logger.error('Notification error:', notifErr);
    }

    logActivity(req, `Request ${status}: ${updated.type ?? updated._id}`, 'request', id);

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};
