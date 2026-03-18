import * as announcementService from './announcements.service.js';
import { createBulkNotifications } from '../notifications/notification.service.js';
import Announcement from './announcement.model.js';
import User from '../auth/user.model.js';
import { logger } from '../../utils/logger.js';
import { logActivity } from '../../middleware/activityLogger.js';

const createError = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

export const getAnnouncementsController = async (req, res, next) => {
  try {
    const { limit = 50, page = 1, targetAudience, priority } = req.query;

    const filters = {};
    if (targetAudience) filters.targetAudience = targetAudience;
    if (priority) filters.priority = priority;

    const result = await announcementService.getAnnouncements(filters, {
      limit,
      page,
    });

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export const getAnnouncementByIdController = async (req, res, next) => {
  try {
    const announcement = await announcementService.getAnnouncementById(req.params.id);

    res.status(200).json({
      success: true,
      data: announcement,
    });
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
};

export const createAnnouncementController = async (req, res, next) => {
  try {
    const { title, body, targetAudience, priority, isActive } = req.body;

    if (!title || !body) {
      return res.status(400).json({
        error: 'Missing required fields: title, body',
      });
    }

    const announcement = await announcementService.createAnnouncement(req.user.id, {
      title,
      body,
      targetAudience,
      priority,
      isActive,
    });

    // Fan-out notification to all employees/hr users (silent fail)
    try {
      const employees = await User.find({
        role: { $in: ['employee', 'hr'] },
      })
        .select('_id')
        .lean();

      const employeeIds = employees.map((u) => u._id);

      if (employeeIds.length > 0) {
        await createBulkNotifications(
          employeeIds,
          'announcement_posted',
          'New Announcement',
          announcement.title,
          '/employee/announcements'
        );
      }
    } catch (notifErr) {
      logger.error('Notification error:', notifErr);
    }

    logActivity(
      req,
      `Announcement created: ${announcement.title ?? 'Untitled'}`,
      'announcement',
      announcement._id
    );

    res.status(201).json({
      success: true,
      data: announcement,
    });
  } catch (error) {
    next(error);
  }
};

export const updateAnnouncementController = async (req, res, next) => {
  try {
    const announcement = await announcementService.updateAnnouncement(
      req.params.id,
      req.body
    );

    logActivity(
      req,
      `Announcement updated: ${announcement.title ?? req.params.id}`,
      'announcement',
      req.params.id
    );

    res.status(200).json({
      success: true,
      message: 'Announcement updated successfully',
      data: announcement,
    });
  } catch (error) {
    if (error.status === 400 || error.status === 404) {
      return res.status(error.status).json({ error: error.message });
    }
    next(error);
  }
};

export const deleteAnnouncementController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const toDelete = await Announcement.findById(id);
    const deletedTitle = toDelete?.title ?? id;
    await announcementService.deleteAnnouncement(id);

    logActivity(
      req,
      `Announcement deleted: ${deletedTitle}`,
      'announcement',
      id
    );

    res.status(200).json({
      success: true,
      message: 'Announcement deleted successfully',
    });
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
};
