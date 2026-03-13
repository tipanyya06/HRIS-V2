import {
  getNotificationsForUser,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from './notification.service.js';
import { logger } from '../../utils/logger.js';

export const getNotificationsController = async (req, res) => {
  try {
    const userId = req.user.id;
    const notifications = await getNotificationsForUser(userId, 10);
    return res.status(200).json({
      success: true,
      data: notifications,
    });
  } catch (err) {
    logger.error('Get notifications error:', err);
    return res.status(500).json({
      error: 'Failed to fetch notifications',
    });
  }
};

export const getUnreadCountController = async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await getUnreadCount(userId);
    return res.status(200).json({
      success: true,
      data: { count },
    });
  } catch (err) {
    logger.error('Unread count error:', err);
    return res.status(500).json({
      error: 'Failed to fetch unread count',
    });
  }
};

export const markReadController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    await markAsRead(id, userId);
    return res.status(200).json({
      success: true,
    });
  } catch (err) {
    logger.error('Mark read error:', err);
    return res.status(500).json({
      error: 'Failed to mark as read',
    });
  }
};

export const markAllReadController = async (req, res) => {
  try {
    const userId = req.user.id;
    await markAllAsRead(userId);
    return res.status(200).json({
      success: true,
    });
  } catch (err) {
    logger.error('Mark all read error:', err);
    return res.status(500).json({
      error: 'Failed to mark all as read',
    });
  }
};
