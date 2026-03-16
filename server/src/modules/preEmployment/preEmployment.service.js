import PreEmployment from './preEmployment.model.js';
import Applicant from '../applications/applicant.model.js';
import { logger } from '../../utils/logger.js';

const DEFAULT_ITEMS = [
  { key: 'resume', label: 'Updated Resume', required: true },
  { key: 'government-ids', label: 'Government IDs', required: true },
  { key: 'medical', label: 'Medical Exam', required: true },
  { key: 'nbi-clearance', label: 'NBI Clearance', required: true },
  { key: 'signed-offer', label: 'Signed Offer', required: true },
];

const createError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const buildDefaultItems = () =>
  DEFAULT_ITEMS.map((item) => ({
    ...item,
    status: 'pending',
    documentUrl: '',
    originalName: '',
    adminNote: '',
  }));

const calculateOverallStatus = (items) => {
  const requiredItems = items.filter((item) => item.required);

  if (requiredItems.length === 0) return 'not-started';

  if (requiredItems.some((item) => item.status === 'rejected')) {
    return 'rejected';
  }

  if (requiredItems.every((item) => item.status === 'approved')) {
    return 'approved';
  }

  if (requiredItems.every((item) => item.status === 'submitted' || item.status === 'approved')) {
    return 'submitted';
  }

  if (requiredItems.some((item) => item.status === 'submitted' || item.status === 'approved')) {
    return 'in-progress';
  }

  return 'not-started';
};

export const ensureChecklist = async (userId) => {
  try {
    let record = await PreEmployment.findOne({ userId });

    if (!record) {
      record = await PreEmployment.create({
        userId,
        overallStatus: 'not-started',
        items: buildDefaultItems(),
      });
    }

    return record;
  } catch (error) {
    logger.error(`Ensure pre-employment checklist error: ${error.message}`);
    throw error;
  }
};

export const getMyChecklist = async (userId) => {
  try {
    return await ensureChecklist(userId);
  } catch (error) {
    logger.error(`Get my pre-employment checklist error: ${error.message}`);
    throw error;
  }
};

export const submitChecklistItem = async (userId, itemKey, { documentUrl, originalName }) => {
  try {
    if (!documentUrl) {
      throw createError(400, 'documentUrl is required');
    }

    const record = await ensureChecklist(userId);
    const item = record.items.find((entry) => entry.key === itemKey);

    if (!item) {
      throw createError(404, 'Checklist item not found');
    }

    item.documentUrl = documentUrl;
    item.originalName = originalName || item.originalName || '';
    item.status = 'submitted';
    item.uploadedAt = new Date();
    item.reviewedAt = undefined;
    item.adminNote = '';
    record.overallStatus = calculateOverallStatus(record.items);

    await record.save();
    return record;
  } catch (error) {
    logger.error(`Submit pre-employment item error: ${error.message}`);
    throw error;
  }
};

export const getAllChecklists = async () => {
  try {
    const records = await PreEmployment.find({})
      .populate('userId', 'email personalInfo.givenName personalInfo.lastName role')
      .sort({ updatedAt: -1 });

    const userIds = records
      .map((record) => record.userId?._id)
      .filter(Boolean);

    if (userIds.length === 0) {
      return records;
    }

    const applications = await Applicant.find({ userId: { $in: userIds } })
      .populate('jobId', 'title')
      .select('userId jobId stage createdAt')
      .sort({ createdAt: -1 })
      .lean();

    const latestByUser = new Map();
    applications.forEach((application) => {
      const key = application.userId?.toString();
      if (key && !latestByUser.has(key)) {
        latestByUser.set(key, application);
      }
    });

    return records.map((record) => {
      const userId = record.userId?._id?.toString();
      const application = userId ? latestByUser.get(userId) : null;
      const position = application?.jobId?.title || '';
      return {
        ...record.toObject(),
        position,
      };
    });
  } catch (error) {
    logger.error(`Get all pre-employment checklists error: ${error.message}`);
    throw error;
  }
};

export const reviewChecklistItem = async (recordId, itemKey, { status, adminNote }) => {
  try {
    if (!['approved', 'rejected'].includes(status)) {
      throw createError(400, 'status must be approved or rejected');
    }

    const record = await PreEmployment.findById(recordId)
      .populate('userId', 'email personalInfo.givenName personalInfo.lastName role');

    if (!record) {
      throw createError(404, 'Pre-employment record not found');
    }

    const item = record.items.find((entry) => entry.key === itemKey);

    if (!item) {
      throw createError(404, 'Checklist item not found');
    }

    item.status = status;
    item.adminNote = adminNote?.trim() || '';
    item.reviewedAt = new Date();
    record.overallStatus = calculateOverallStatus(record.items);

    await record.save();
    return record;
  } catch (error) {
    logger.error(`Review pre-employment item error: ${error.message}`);
    throw error;
  }
};
