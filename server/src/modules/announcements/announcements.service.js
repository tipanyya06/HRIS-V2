import Announcement from './announcement.model.js';
import { logger } from '../../utils/logger.js';

const createError = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

export const getAnnouncements = async (filters = {}, pagination = {}) => {
  try {
    const { limit = 50, page = 1 } = pagination;
    const skip = (page - 1) * limit;

    const query = { isActive: true };
    if (filters.targetAudience) query.targetAudience = filters.targetAudience;
    if (filters.priority) query.priority = filters.priority;

    const announcements = await Announcement.find(query)
      .populate('createdBy', 'personalInfo email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Announcement.countDocuments(query);

    return {
      data: announcements,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error(`Get announcements error: ${error.message}`);
    throw error;
  }
};

export const getAnnouncementById = async (id) => {
  try {
    const announcement = await Announcement.findById(id).populate(
      'createdBy',
      'personalInfo email'
    );

    if (!announcement) {
      throw createError(404, 'Announcement not found');
    }

    return announcement;
  } catch (error) {
    if (error.status === 404) throw error;
    logger.error(`Get announcement by id error: ${error.message}`);
    throw error;
  }
};

export const createAnnouncement = async (userId, data) => {
  try {
    const announcement = new Announcement({
      ...data,
      createdBy: userId,
    });
    await announcement.save();
    return await announcement.populate('createdBy', 'personalInfo email');
  } catch (error) {
    if (error.name === 'ValidationError') {
      throw createError(400, 'Invalid announcement data');
    }
    logger.error(`Create announcement error: ${error.message}`);
    throw error;
  }
};

export const updateAnnouncement = async (id, data) => {
  try {
    const allowed = {};
    const allowedFields = ['title', 'body', 'targetAudience', 'priority', 'isActive'];
    allowedFields.forEach((field) => {
      if (field in data) allowed[field] = data[field];
    });

    const announcement = await Announcement.findByIdAndUpdate(id, allowed, {
      new: true,
      runValidators: true,
    }).populate('createdBy', 'personalInfo email');

    if (!announcement) {
      throw createError(404, 'Announcement not found');
    }

    return announcement;
  } catch (error) {
    if (error.status === 404) throw error;
    if (error.name === 'ValidationError') {
      throw createError(400, 'Invalid announcement data');
    }
    logger.error(`Update announcement error: ${error.message}`);
    throw error;
  }
};

export const deleteAnnouncement = async (id) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(id);

    if (!announcement) {
      throw createError(404, 'Announcement not found');
    }

    return announcement;
  } catch (error) {
    if (error.status === 404) throw error;
    logger.error(`Delete announcement error: ${error.message}`);
    throw error;
  }
};
