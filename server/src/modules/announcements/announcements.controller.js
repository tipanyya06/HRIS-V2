import * as announcementService from './announcements.service.js';

const createError = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

export const getAnnouncementsController = async (req, res, next) => {
  try {
    const { limit = 10, page = 1, department, priority } = req.query;

    const filters = {};
    if (department) filters.department = department;
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
    const { title, content, department, priority } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        error: 'Missing required fields: title, content',
      });
    }

    const announcement = await announcementService.createAnnouncement({
      title,
      content,
      department,
      priority,
      author: req.user.id,
    });

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
    await announcementService.deleteAnnouncement(req.params.id);

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
