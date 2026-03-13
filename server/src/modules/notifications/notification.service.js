import Notification from './notification.model.js';
import { logger } from '../../utils/logger.js';

export const createNotification = async (
  userId,
  type,
  title,
  message,
  link
) => {
  try {
    const notification = await Notification.create({
      userId,
      type,
      title,
      message,
      link,
    });
    return notification;
  } catch (err) {
    logger.error('Create notification error:', err);
    throw err;
  }
};

export const createBulkNotifications = async (
  userIds,
  type,
  title,
  message,
  link
) => {
  try {
    const docs = userIds.map((userId) => ({
      userId,
      type,
      title,
      message,
      link,
      isRead: false,
    }));
    await Notification.insertMany(docs, { ordered: false });
  } catch (err) {
    logger.error('Bulk notification error:', err);
    throw err;
  }
};

export const getNotificationsForUser = async (userId, limit = 10) => {
  try {
    return await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  } catch (err) {
    logger.error('Get notifications error:', err);
    throw err;
  }
};

export const getUnreadCount = async (userId) => {
  try {
    return await Notification.countDocuments({
      userId,
      isRead: false,
    });
  } catch (err) {
    logger.error('Unread count error:', err);
    throw err;
  }
};

export const markAsRead = async (notificationId, userId) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { isRead: true }
    );
  } catch (err) {
    logger.error('Mark read error:', err);
    throw err;
  }
};

export const markAllAsRead = async (userId) => {
  try {
    await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true }
    );
  } catch (err) {
    logger.error('Mark all read error:', err);
    throw err;
  }
};
