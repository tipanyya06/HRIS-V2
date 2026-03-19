import { logActivity } from '../../middleware/activityLogger.js';
import {
  getMyChecklist,
  submitChecklistItem,
  getAllChecklists,
  reviewChecklistItem,
} from './preEmployment.service.js';

export const getMyPreEmploymentController = async (req, res, next) => {
  try {
    const record = await getMyChecklist(req.user.id);
    res.status(200).json({ success: true, data: record });
  } catch (error) {
    next(error);
  }
};

export const submitPreEmploymentItemController = async (req, res, next) => {
  try {
    const { itemKey } = req.params;
    const { documentUrl, originalName } = req.body;
    const record = await submitChecklistItem(req.user.id, itemKey, {
      documentUrl,
      originalName,
    });

    logActivity(req, `Pre-employment document submitted: ${itemKey} - ${originalName}`, 'pre-employment', req.user.id);

    res.status(200).json({ success: true, data: record });
  } catch (error) {
    next(error);
  }
};

export const getAllPreEmploymentController = async (req, res, next) => {
  try {
    const records = await getAllChecklists();
    res.status(200).json({ success: true, data: records });
  } catch (error) {
    next(error);
  }
};

export const reviewPreEmploymentItemController = async (req, res, next) => {
  try {
    const { id, itemKey } = req.params;
    const { status, adminNote } = req.body;
    const record = await reviewChecklistItem(id, itemKey, { status, adminNote });
    logActivity(req, `Pre-employment document reviewed: ${itemKey} - ${status}`, 'pre-employment', id);
    res.status(200).json({ success: true, data: record });
  } catch (error) {
    next(error);
  }
};
